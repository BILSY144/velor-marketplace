import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Enterprise tier retired 2026-07-15 (William's decision): Pro inherited
// every Enterprise feature (unlimited listings, Go Live, full AI account
// manager) at Pro's price and commission. Any legacy ENTERPRISE value on a
// Seller row is treated as PRO everywhere.
const TIER_CONFIG = {
  STARTER: { commission: 10, listingLimit: 10, monthlyFee: 0 },
  PRO: { commission: 4, listingLimit: null, monthlyFee: 49 },
} as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { products: true } } },
  })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }

  const rawTier = (seller as any).tier ?? 'STARTER'
  const tier = rawTier === 'ENTERPRISE' ? 'PRO' : rawTier
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.STARTER
  const currentListings = (seller as any)._count?.products ?? 0
  const listingLimit = config.listingLimit as number | null
  const listingsRemaining = listingLimit !== null ? Math.max(0, listingLimit - currentListings) : null

  return NextResponse.json({
    tier,
    commissionRate: config.commission,
    // A founding seller's Pro tier was granted free (lib/founding.ts) and
    // has no Stripe subscription behind it -- monthlyFee must read as 0 for
    // them regardless of what the Pro tier normally costs everyone else.
    monthlyFee: (seller as any).foundingBadge && tier === 'PRO' ? 0 : config.monthlyFee,
    foundingBadge: (seller as any).foundingBadge ?? false,
    listingLimit,
    currentListings,
    listingsRemaining,
    listingLimitReached: listingLimit !== null && currentListings >= listingLimit,
    subscriptionStatus: (seller as any).subscriptionStatus ?? null,
    currentPeriodEnd: (seller as any).subscriptionCurrentPeriodEnd ?? null,
    hasActiveSubscription:
      (seller as any).subscriptionStatus === 'active' ||
      (seller as any).subscriptionStatus === 'trialing',
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }

  const { action } = await req.json()

  // Defense in depth: the dashboard UI already hides the "Upgrade to Pro"
  // button once a founding seller is on the Pro tier (isCurrent === true in
  // TierUpgradeView), but this endpoint must refuse it too -- a founding
  // seller must never be able to create a real, chargeable Stripe
  // subscription for a tier they already have free.
  if (action === 'upgrade_to_pro' && ((seller as any).foundingEligible || (seller as any).foundingBadge)) {
    return NextResponse.json(
      { error: 'Founding sellers never pay for Pro. If your badge has not unlocked yet, list your first product and Pro is yours free, for life.' },
      { status: 400 }
    )
  }

  if (action === 'upgrade_to_enterprise') {
    return NextResponse.json({ error: 'The Enterprise tier has been retired — Pro now includes everything it offered.' }, { status: 400 })
  }

  if (action === 'upgrade_to_pro') {
    const priceId = process.env.STRIPE_PRO_PRICE_ID
    if (!priceId) {
      return NextResponse.json({ error: 'Selected plan not yet configured' }, { status: 503 })
    }

    // Get or create Stripe customer
    let customerId = (seller as any).stripeCustomerId as string | null
    if (!customerId) {
      const user = await prisma.user.findUnique({ where: { id: seller.userId } })
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        name: seller.storeName,
        metadata: { sellerId: seller.id },
      })
      customerId = customer.id
      await prisma.seller.update({
        where: { id: seller.id },
        data: { stripeCustomerId: customerId } as any,
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://velorcommerce.store'
    const session2 = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: baseUrl + '/dashboard/upgrade?success=true&plan=pro',
      cancel_url: baseUrl + '/dashboard/upgrade?cancelled=true',
      metadata: { sellerId: seller.id },
    })

    return NextResponse.json({ checkoutUrl: session2.url })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }

  const subId = (seller as any).stripeSubscriptionId as string | null
  if (!subId) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  await stripe.subscriptions.update(subId, { cancel_at_period_end: true })
  await prisma.seller.update({
    where: { id: seller.id },
    data: { subscriptionStatus: 'cancelling' } as any,
  })

  return NextResponse.json({ success: true, message: 'Subscription will cancel at period end' })
}
