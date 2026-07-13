import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { isPayoneerConfigured, createPayout as createPayoneerPayout } from '@/lib/payoneer'
import {
  PROBATION_HOLD_MS,
  TRUSTED_HOLD_MS,
  isSellerTrusted,
  orderHasOpenIssue,
} from '@/lib/payouts'

export const maxDuration = 60

// Payout release cron. Holds funds on the platform until delivery is confirmed,
// then releases the seller's share (from the PaymentIntent metadata) once the
// hold window passes and no return/dispute is open. The rail differs by seller
// (Stripe transfer, or Payoneer payout for Stripe-unsupported countries) but
// the RULES are identical on both rails by explicit decision: same delivery
// confirmation requirement, same 15-day/72-hour holds, same dispute freeze.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })
  const now = Date.now()

  // Delivered orders that have not been paid out yet (no payout row).
  const candidates = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      deliveredAt: { not: null },
      payout: null,
      stripePaymentId: { not: null },
    },
    select: { id: true, sellerId: true, deliveredAt: true, stripePaymentId: true, currency: true },
    take: 200,
  })

  let released = 0
  let releasedPayoneer = 0
  let heldOpen = 0
  let waiting = 0
  let heldForPayoneer = 0
  let skipped = 0

  for (const o of candidates) {
    try {
      if (!o.deliveredAt) {
        skipped++
        continue
      }
      // Open return/dispute freezes this order regardless of the timer.
      if (await orderHasOpenIssue(o.id)) {
        heldOpen++
        continue
      }
      const trusted = await isSellerTrusted(o.sellerId)
      const hold = trusted ? TRUSTED_HOLD_MS : PROBATION_HOLD_MS
      if (o.deliveredAt.getTime() + hold > now) {
        waiting++
        continue
      }

      const pi = await stripe.paymentIntents.retrieve(o.stripePaymentId as string)
      const md = (pi.metadata || {}) as Record<string, string>
      // app/api/stripe/payment-intent/route.ts has only ever written
      // `sellerShareGBP` (a GBP decimal string, e.g. "45.99") -- `sellerShare`
      // (plain, minor-units) was never a real metadata key, so parseInt on it
      // always silently returned 0 here and every order was skipped forever.
      // No seller payout has actually succeeded via this cron until this fix.
      const sellerShareGBP = parseFloat(md.sellerShareGBP || '0')
      const sellerShare = Math.round(sellerShareGBP * 100) // minor units (pence) for Stripe/Payoneer
      const sellerAccountId = md.sellerAccountId || ''
      if (!sellerShare || sellerShare <= 0) {
        skipped++
        continue
      }
      const chargeId = (pi as unknown as { latest_charge?: string }).latest_charge
      // sellerShareGBP is ALWAYS GBP-denominated, computed server-side in GBP
      // regardless of what currency the buyer actually paid in (payment-intent/
      // route.ts converts everything to GBP before working out the seller's
      // share). pi.currency reflects the buyer's charge currency instead, which
      // can be non-GBP -- pairing that with a GBP-denominated amount would
      // silently send the wrong amount in the wrong currency. Using 'gbp' here
      // is the only pairing that's ever actually correct; if the platform's
      // Stripe balance doesn't hold enough GBP to cover it, the transfer call
      // below throws and is caught by the existing catch-and-retry -- a safe
      // failure (funds stay in escrow, retried next run), never a silently
      // wrong payout.
      const currency = 'gbp'

      if (sellerAccountId) {
        // STRIPE rail. Idempotency key keyed on the order guarantees we never
        // double-transfer, even if a later step fails and the cron retries.
        const transfer = await stripe.transfers.create(
          {
            amount: sellerShare,
            currency,
            destination: sellerAccountId,
            transfer_group: o.id,
            ...(chargeId ? { source_transaction: chargeId } : {}),
            metadata: { orderId: o.id },
          },
          { idempotencyKey: `payout_${o.id}` }
        )

        await prisma.payout.create({
          data: {
            sellerId: o.sellerId,
            orderId: o.id,
            amount: sellerShare / 100,
            currency,
            stripeTransferId: transfer.id,
            status: 'paid',
          },
        })
        released++
        continue
      }

      // No Stripe account on the PaymentIntent: PAYONEER-rail seller (or a
      // seller who has not finished payout onboarding). Same holds and
      // dispute checks already passed above -- only the transfer differs.
      const seller = await prisma.seller.findUnique({
        where: { id: o.sellerId },
        select: { payoutRail: true, payoneerPayeeId: true },
      })
      if (seller?.payoutRail === 'PAYONEER' && seller.payoneerPayeeId && isPayoneerConfigured()) {
        // client_reference_id `payout_<orderId>` mirrors the Stripe
        // idempotency convention so a retried run can never double-pay.
        const { payoutId } = await createPayoneerPayout({
          payeeId: seller.payoneerPayeeId,
          amount: sellerShare / 100,
          currency,
          clientReferenceId: `payout_${o.id}`,
          description: `Velor Marketplace payout for order ${o.id}`,
        })
        await prisma.payout.create({
          data: {
            sellerId: o.sellerId,
            orderId: o.id,
            amount: sellerShare / 100,
            currency,
            payoneerPayoutId: payoutId,
            status: 'paid',
          },
        })
        releasedPayoneer++
      } else {
        // Rail not live or seller not onboarded yet: funds stay safely in
        // the platform escrow and this order is retried on every run.
        heldForPayoneer++
      }
    } catch {
      skipped++
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    released,
    releasedPayoneer,
    heldOpen,
    waiting,
    heldForPayoneer,
    skipped,
  })
}
