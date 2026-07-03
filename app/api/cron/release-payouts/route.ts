import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import {
  PROBATION_HOLD_MS,
  TRUSTED_HOLD_MS,
  isSellerTrusted,
  orderHasOpenIssue,
} from '@/lib/payouts'

export const maxDuration = 60

// Payout release cron. Holds funds on the platform until delivery is confirmed,
// then releases the seller's share (from the PaymentIntent metadata) via a Stripe
// transfer once the hold window passes and no return/dispute is open.
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
  let heldOpen = 0
  let waiting = 0
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
      const sellerShare = parseInt(md.sellerShare || '0', 10)
      const sellerAccountId = md.sellerAccountId || ''
      if (!sellerShare || sellerShare <= 0 || !sellerAccountId) {
        skipped++
        continue
      }
      const chargeId = (pi as unknown as { latest_charge?: string }).latest_charge
      const currency = (pi.currency || o.currency || 'gbp').toLowerCase()

      // Idempotency key keyed on the order guarantees we never double-transfer,
      // even if a later step fails and the cron retries.
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
    } catch {
      skipped++
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    released,
    heldOpen,
    waiting,
    skipped,
  })
}
