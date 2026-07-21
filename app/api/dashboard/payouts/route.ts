import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isPayoneerConfigured } from '@/lib/payoneer'
import { isSellerTrusted, PROBATION_HOLD_MS } from '@/lib/payouts'
import { getPayoutRail } from '@/lib/payoutRail'

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
    select: { id: true, country: true, payoutRail: true, stripeOnboarded: true, payoneerPayeeId: true },
  })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  // Resolve the rail LIVE from the seller's country (lib/payoutRail.ts is
  // the single source of truth: Stripe Connect where supported, Payoneer
  // everywhere else) and self-heal the stored field when it disagrees --
  // the same pattern app/api/payoneer/onboard already uses. The stored
  // value has a history of being mis-resolved at approval (see
  // app/api/admin/recompute-payout-rails), and a stale PAYONEER value is
  // not merely cosmetic: app/api/cron/release-payouts branches on the
  // STORED field, so a Stripe-country seller stuck on PAYONEER with no
  // payee id would never receive a payout. Found live 2026-07-21 when the
  // GB founding seller's dashboard read "via Payoneer".
  const rail = getPayoutRail(seller.country)
  if (rail !== seller.payoutRail) {
    await prisma.seller.update({ where: { id: seller.id }, data: { payoutRail: rail } })
  }

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
    payoutRail: rail,
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
