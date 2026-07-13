import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isPayoneerConfigured } from '@/lib/payoneer'
import { isSellerTrusted, PROBATION_HOLD_MS } from '@/lib/payouts'

export const dynamic = 'force-dynamic'

// Real data backing /dashboard/payouts. Replaces what used to be an
// all-zero, all-Stripe mockup: "Available Balance" + a "Withdraw Funds"
// button that only ever called setTimeout(), never an API -- there is no
// seller-initiated withdrawal in this platform's real design.
// app/api/cron/release-payouts/route.ts pays sellers automatically (Stripe
// transfer or Payoneer payout) the moment a DELIVERED order clears its hold
// window, so the only two honest numbers to show a seller are: what's still
// held in escrow (DELIVERED orders with no Payout row yet), and what has
// actually been paid out to date (real Payout rows). Order.sellerEarnings
// is the authoritative per-order seller share, written once at order
// creation by lib/orders.ts from the same trusted PaymentIntent metadata
// release-payouts itself reads -- safe to read directly here for display.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    select: { id: true, payoutRail: true, stripeOnboarded: true, payoneerPayeeId: true },
  })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const [pendingAgg, payouts, trusted] = await Promise.all([
    // Same definition of "still held" as release-payouts' own candidate
    // query: DELIVERED with no Payout row yet. Covers orders still inside
    // their hold window, held on an open return/dispute, or waiting on
    // Payoneer onboarding to complete -- this endpoint does not need to
    // distinguish which, the seller-facing number is just "not paid yet".
    prisma.order.aggregate({
      where: { sellerId: seller.id, status: 'DELIVERED', payout: null },
      _sum: { sellerEarnings: true },
      _count: true,
    }),
    prisma.payout.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        stripeTransferId: true,
        payoneerPayoutId: true,
        createdAt: true,
      },
    }),
    isSellerTrusted(seller.id),
  ])

  const lifetimePaidOut = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  return NextResponse.json({
    payoutRail: seller.payoutRail,
    stripeOnboarded: seller.stripeOnboarded,
    payoneerConfigured: isPayoneerConfigured(),
    payoneerLinked: Boolean(seller.payoneerPayeeId),
    pendingEscrow: pendingAgg._sum.sellerEarnings || 0,
    pendingOrderCount: pendingAgg._count,
    lifetimePaidOut,
    isTrusted: trusted,
    // Human-readable hold window for the seller's current standing -- avoids
    // the frontend needing to do its own ms-to-days/hours conversion, and
    // sidesteps "3 days" reading oddly for what's actually a 72-hour clock.
    holdLabel: trusted ? '72 hours' : `${Math.round(PROBATION_HOLD_MS / (24 * 60 * 60 * 1000))} days`,
    history: payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: p.stripeTransferId ? 'Stripe' : p.payoneerPayoutId ? 'Payoneer' : '—',
      date: p.createdAt.toISOString(),
    })),
  })
}
