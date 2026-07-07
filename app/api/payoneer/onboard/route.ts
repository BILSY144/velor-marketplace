import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getPayoutRail } from '@/lib/payoutRail'
import { isPayoneerConfigured, getRegistrationLink } from '@/lib/payoneer'

export const dynamic = 'force-dynamic'

// Payoneer payout onboarding for sellers in countries where Stripe Connect
// does not support payouts. Payout RULES are identical to the Stripe rail:
// funds held until delivery confirmed, released after the 15-day (new) /
// 72-hour (trusted) hold, frozen while a return or dispute is open. Only the
// final transfer rail differs.

async function getSeller(userId: string) {
  return prisma.seller.findUnique({
    where: { userId },
    select: { id: true, country: true, payoutRail: true, payoneerPayeeId: true, stripeOnboarded: true },
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await getSeller(session.user.id)
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  // Resolve (and persist) the rail from the seller's country so the rest of
  // the platform can branch on Seller.payoutRail without recomputing.
  const rail = getPayoutRail(seller.country)
  if (rail !== seller.payoutRail) {
    await prisma.seller.update({ where: { id: seller.id }, data: { payoutRail: rail } })
  }

  return NextResponse.json({
    rail,
    configured: isPayoneerConfigured(),
    payeeId: seller.payoneerPayeeId,
    onboarded: Boolean(seller.payoneerPayeeId),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await getSeller(session.user.id)
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  const rail = getPayoutRail(seller.country)
  if (rail !== 'PAYONEER') {
    return NextResponse.json({ error: 'Stripe supports payouts in your country -- use the Stripe payout setup instead.' }, { status: 400 })
  }

  if (!isPayoneerConfigured()) {
    // Partner application not approved yet: record the interest so the team
    // can notify this seller the moment the rail goes live. Funds meanwhile
    // accrue safely in the platform escrow (payouts cron skips this seller).
    await prisma.agentLog.create({
      data: {
        agentName: 'payoneer-onboarding',
        action: 'seller-interest',
        status: 'pending',
        details: { sellerId: seller.id, country: seller.country },
      },
    })
    return NextResponse.json({
      pending: true,
      message: 'Payoneer payouts are being set up for your country. Your earnings are held safely and released to you as soon as your Payoneer onboarding opens. We will email you the moment it is ready.',
    })
  }

  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store'
    const { registrationLink } = await getRegistrationLink({
      payeeId: seller.id,
      redirectUrl: base + '/dashboard/payoneer',
    })
    await prisma.seller.update({
      where: { id: seller.id },
      data: { payoneerPayeeId: seller.id, payoutRail: 'PAYONEER' },
    })
    return NextResponse.json({ registrationLink })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Payoneer onboarding failed' }, { status: 502 })
  }
}
