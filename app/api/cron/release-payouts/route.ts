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
import { requireCronSecret } from '@/lib/cronAuth'

export const maxDuration = 60

// Payout release cron. Holds funds on the platform until delivery is confirmed,
// then releases the seller's share (from the PaymentIntent metadata) once the
// hold window passes and no return/dispute is open. The rail differs by seller
// (Stripe transfer, or Payoneer payout for Stripe-unsupported countries) but
// the RULES are identical on both rails by explicit decision: same delivery
// confirmation requirement, same 15-day/72-hour holds, same dispute freeze.
export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

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
  let heldUnverified = 0

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
      // A single PaymentIntent can now cover MULTIPLE sellers (a mixed
      // cart -- see lib/orders.ts), each with their own Order and their own
      // share of the payment. sellerBreakdown holds one compact entry per
      // seller (i=sellerId, e=sellerShareGBP -- see app/api/stripe/
      // payment-intent/route.ts for the full key legend); this order's own
      // share is whichever entry matches ITS sellerId, never the whole
      // PaymentIntent's total.
      let sellerBreakdown: Array<{ i: string; e: number }> = []
      try {
        sellerBreakdown = JSON.parse(md.sellerBreakdown || '[]')
      } catch {
        sellerBreakdown = []
      }
      const sellerEntry = sellerBreakdown.find((s) => s && s.i === o.sellerId)
      const sellerShareGBP = Number(sellerEntry?.e) || 0
      const sellerShare = Math.round(sellerShareGBP * 100) // minor units (pence) for Stripe/Payoneer
      if (!sellerShare || sellerShare <= 0) {
        skipped++
        continue
      }
      const chargeId = (pi as unknown as { latest_charge?: string }).latest_charge
      // sellerShareGBP is ALWAYS GBP-denominated, computed server-side in GBP
      // regardless of what currency the buyer actually paid in (payment-intent/
      // route.ts converts everything to GBP before working out each seller's
      // share). pi.currency reflects the buyer's charge currency instead, which
      // can be non-GBP -- pairing that with a GBP-denominated amount would
      // silently send the wrong amount in the wrong currency. Using 'gbp' here
      // is the only pairing that's ever actually correct; if the platform's
      // Stripe balance doesn't hold enough GBP to cover it, the transfer call
      // below throws and is caught by the existing catch-and-retry -- a safe
      // failure (funds stay in escrow, retried next run), never a silently
      // wrong payout.
      const currency = 'gbp'

      // This order's Stripe Connect account, looked up fresh from the
      // database by the order's own sellerId -- not from PaymentIntent
      // metadata (checkout no longer stores sellerAccountId there at all,
      // both because a fresh DB read is always current rather than a
      // checkout-time snapshot, and because dropping it kept sellerBreakdown
      // small enough to fit Stripe's 500-char metadata-value cap for carts
      // with several sellers). Also grabs payoutRail/payoneerPayeeId in the
      // same query, replacing the second lookup that used to happen further
      // down only for the Payoneer branch.
      const sellerRow = await prisma.seller.findUnique({
        where: { id: o.sellerId },
        select: { stripeAccountId: true, payoutRail: true, payoneerPayeeId: true, identityVerified: true },
      })
      const sellerAccountId = sellerRow?.stripeAccountId || ''

      // LAW: never release a payout -- on either rail -- to a seller whose
      // identity is not Stripe-verified. Approval and verification are
      // decoupled (a human can approve before verification finishes, see
      // provisionSeller.ts), so this is the backstop that keeps that gap from
      // ever reaching real money. Funds stay safely in escrow and this order
      // is retried on every run once the seller verifies (see the Stripe
      // Identity webhook, which flips identityVerified to true).
      if (!sellerRow?.identityVerified) {
        heldUnverified++
        continue
      }

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

      // No Stripe account on file: PAYONEER-rail seller (or a seller who
      // has not finished payout onboarding). Same holds and dispute checks
      // already passed above -- only the transfer differs.
      if (sellerRow?.payoutRail === 'PAYONEER' && sellerRow.payoneerPayeeId && isPayoneerConfigured()) {
        // client_reference_id `payout_<orderId>` mirrors the Stripe
        // idempotency convention so a retried run can never double-pay.
        const { payoutId } = await createPayoneerPayout({
          payeeId: sellerRow.payoneerPayeeId,
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
    heldUnverified,
    skipped,
  })
}
