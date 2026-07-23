import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getPayoutRail, countryToCode } from '@/lib/payoutRail'
import { isTrolleyConfigured, createRecipient, getOnboardingWidgetUrl, getRecipientStatus } from '@/lib/trolley'
import { payoutGateSatisfied, setPayoutGateCookie } from '@/lib/payoutGate'

export const dynamic = 'force-dynamic'

// Trolley payout onboarding -- the default rail (lib/payoutRail.ts) for
// sellers in countries where Stripe Connect does not support payouts,
// replacing Dots (a confirmed dead end, see lib/payoutRail.ts's header) as
// of 2026-07-23 evening. Payout RULES are identical to the Stripe rail:
// funds held until delivery confirmed, released after the 15-day (new) /
// 72-hour (trusted) hold, frozen while a return or dispute is open. Only the
// final transfer rail differs.

async function getSeller(userId: string) {
  return prisma.seller.findUnique({
    where: { userId },
    select: {
      id: true,
      country: true,
      payoutRail: true,
      trolleyRecipientId: true,
      trolleyOnboarded: true,
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

  // If Trolley itself already reports this recipient as onboarded but our
  // own flag hasn't self-healed yet, check live rather than trusting a
  // stale row -- same "always confirm live before trusting a stored flag"
  // pattern the Stripe branch (/api/stripe/connect/account) already uses.
  let trolleyOnboarded = seller.trolleyOnboarded
  if (seller.trolleyRecipientId && !trolleyOnboarded && isTrolleyConfigured()) {
    try {
      const live = await getRecipientStatus(seller.trolleyRecipientId)
      if (live.onboarded !== trolleyOnboarded) {
        trolleyOnboarded = live.onboarded
        await prisma.seller.update({ where: { id: seller.id }, data: { trolleyOnboarded } }).catch(() => {})
      }
    } catch {
      // Leave the stored value alone on a transient Trolley API failure --
      // never downgrade an already-onboarded seller from a flaky request.
    }
  }

  const res = NextResponse.json({
    rail,
    configured: isTrolleyConfigured(),
    recipientId: seller.trolleyRecipientId,
    onboarded: trolleyOnboarded,
  })
  // Keeps the payout-verification dashboard gate cookie (middleware.ts) in
  // sync -- this is the one place a Trolley-rail seller's
  // velor_payout_setup cookie ever gets set, mirroring /api/payoneer/onboard
  // and /api/stripe/connect/account. This route is called on every
  // /dashboard/stripe-connect and /dashboard/trolley page load, which is
  // exactly where middleware.ts sends a not-yet-satisfied seller. Passes
  // isTrolleyConfigured() through so the gate exempts sellers while Trolley
  // itself isn't live yet (Trolley's KYC review of Velor's own Bank
  // Transfer Activation submission is still pending -- see
  // lib/payoutGateCookie.ts) instead of locking every non-Stripe-country
  // seller out of the dashboard until William adds the Trolley API keys.
  setPayoutGateCookie(res, payoutGateSatisfied(rail, seller.stripeOnboarded, trolleyOnboarded, isTrolleyConfigured()))
  return res
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await getSeller(session.user.id)
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  const rail = getPayoutRail(seller.country)
  if (rail !== 'TROLLEY') {
    return NextResponse.json({ error: 'Your country uses a different payout rail -- use the matching setup page instead.' }, { status: 400 })
  }

  if (!isTrolleyConfigured()) {
    // Trolley has not yet approved Velor's own Bank Transfer Activation
    // submission (William, 2026-07-23) / William has not yet added
    // TROLLEY_ACCESS_KEY/TROLLEY_SECRET_KEY to Vercel. Record the interest
    // so the team can notify this seller the moment the rail is live.
    // Funds meanwhile accrue safely in the platform escrow
    // (release-payouts skips this seller).
    await prisma.agentLog.create({
      data: {
        agentName: 'trolley-onboarding',
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
    let recipientId = seller.trolleyRecipientId

    if (!recipientId) {
      const email = seller.user?.email
      if (!email) throw new Error('No contact email on file for this seller')
      const countryCode = countryToCode(seller.country) || 'GB'
      // Best-effort name split -- Trolley requires first/last name
      // separately; the store name is used as a fallback only if no real
      // name exists, which should not normally happen (User.name is set
      // at signup).
      const fullName = (seller.user?.name || seller.storeName || 'Velor Seller').trim()
      const [firstName, ...rest] = fullName.split(/\s+/)
      const lastName = rest.join(' ') || firstName

      const created = await createRecipient({
        referenceId: seller.id,
        firstName: firstName || 'Velor',
        lastName,
        email,
        country: countryCode,
      })
      recipientId = created.recipientId
      await prisma.seller.update({
        where: { id: seller.id },
        data: { trolleyRecipientId: recipientId, payoutRail: 'TROLLEY' },
      })
    }

    // Computed fresh on every request -- the signed widget URL expires in
    // 30 seconds (see lib/trolley.ts's header), so it must never be cached
    // or reused across requests.
    const onboardingLink = getOnboardingWidgetUrl({ recipientReferenceId: seller.id })
    return NextResponse.json({ onboardingLink })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Trolley onboarding failed' }, { status: 502 })
  }
}
