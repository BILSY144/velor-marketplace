import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getPayoutRail } from '@/lib/payoutRail'
import { isDotsConfigured, createDotsUser, getOnboardingLink, getUserStatus } from '@/lib/dots'
import { payoutGateSatisfied, setPayoutGateCookie } from '@/lib/payoutGate'

export const dynamic = 'force-dynamic'

// Dots.dev payout onboarding -- the default rail (lib/payoutRail.ts) for
// sellers in countries where Stripe Connect does not support payouts, added
// 2026-07-23 to replace Payoneer while its partner application sits
// unanswered (see lib/dots.ts's header). Payout RULES are identical to the
// Stripe rail: funds held until delivery confirmed, released after the
// 15-day (new) / 72-hour (trusted) hold, frozen while a return or dispute
// is open. Only the final transfer rail differs.

async function getSeller(userId: string) {
  return prisma.seller.findUnique({
    where: { userId },
    select: {
      id: true,
      country: true,
      payoutRail: true,
      dotsUserId: true,
      dotsOnboarded: true,
      stripeOnboarded: true,
      storeName: true,
      user: { select: { email: true, name: true } },
    },
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

  // If Dots itself already reports this user as onboarded but our own flag
  // hasn't self-healed yet, check live rather than trusting a stale row --
  // same "always confirm live before trusting a stored flag" pattern the
  // Stripe branch (/api/stripe/connect/account) already uses.
  let dotsOnboarded = seller.dotsOnboarded
  if (seller.dotsUserId && !dotsOnboarded && isDotsConfigured()) {
    try {
      const live = await getUserStatus(seller.dotsUserId)
      if (live.onboarded !== dotsOnboarded) {
        dotsOnboarded = live.onboarded
        await prisma.seller.update({ where: { id: seller.id }, data: { dotsOnboarded } }).catch(() => {})
      }
    } catch {
      // Leave the stored value alone on a transient Dots API failure --
      // never downgrade an already-onboarded seller from a flaky request.
    }
  }

  const res = NextResponse.json({
    rail,
    configured: isDotsConfigured(),
    userId: seller.dotsUserId,
    onboarded: dotsOnboarded,
  })
  // Keeps the payout-verification dashboard gate cookie (middleware.ts) in
  // sync -- this is the one place a Dots-rail seller's velor_payout_setup
  // cookie ever gets set, mirroring /api/payoneer/onboard and /api/stripe/
  // connect/account. This route is called on every /dashboard/stripe-connect
  // and /dashboard/dots page load, which is exactly where middleware.ts
  // sends a not-yet-satisfied seller. Passes isDotsConfigured() through so
  // the gate exempts sellers while Dots itself isn't live yet (see
  // lib/payoutGateCookie.ts) instead of locking every non-Stripe-country
  // seller out of the dashboard until William adds DOTS_API_KEY.
  setPayoutGateCookie(res, payoutGateSatisfied(rail, seller.stripeOnboarded, dotsOnboarded, isDotsConfigured()))
  return res
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await getSeller(session.user.id)
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  const rail = getPayoutRail(seller.country)
  if (rail !== 'DOTS') {
    return NextResponse.json({ error: 'Your country uses a different payout rail -- use the matching setup page instead.' }, { status: 400 })
  }

  if (!isDotsConfigured()) {
    // No Dots account exists yet (William has not signed up / added
    // DOTS_API_KEY to Vercel). Record the interest so the team can notify
    // this seller the moment the rail is live. Funds meanwhile accrue
    // safely in the platform escrow (release-payouts skips this seller).
    await prisma.agentLog.create({
      data: {
        agentName: 'dots-onboarding',
        action: 'seller-interest',
        status: 'pending',
        details: { sellerId: seller.id, country: seller.country },
      },
    })
    return NextResponse.json({
      pending: true,
      message: 'Payout setup for your country is being finalised. Your earnings are held safely and released to you as soon as it opens. We will email you the moment it is ready.',
    })
  }

  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store'
    let userId = seller.dotsUserId

    if (!userId) {
      const email = seller.user?.email
      if (!email) throw new Error('No contact email on file for this seller')
      // Best-effort name split -- Dots requires first/last name separately;
      // the store name is used as a fallback only if no real name exists,
      // which should not normally happen (User.name is set at signup).
      const fullName = (seller.user?.name || seller.storeName || 'Velor Seller').trim()
      const [firstName, ...rest] = fullName.split(/\s+/)
      const lastName = rest.join(' ') || firstName

      const created = await createDotsUser({
        firstName: firstName || 'Velor',
        lastName,
        email,
      })
      userId = created.userId
      await prisma.seller.update({
        where: { id: seller.id },
        data: { dotsUserId: userId, payoutRail: 'DOTS' },
      })
    }

    const { link } = await getOnboardingLink({
      userId,
      redirectUrl: base + '/dashboard/dots',
    })
    return NextResponse.json({ onboardingLink: link })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Dots onboarding failed' }, { status: 502 })
  }
}
