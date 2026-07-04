import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const TIER_CONFIG = {
  STARTER: { commission: 15, listingLimit: 20, monthlyFee: 0 },
  PRO: { commission: 8, listingLimit: 200, monthlyFee: 49 },
  ENTERPRISE: { commission: 5, listingLimit: null, monthlyFee: 199 },
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

  const tier = (seller as any).tier ?? 'STARTER'
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.STARTER
  const currentListings = (seller as any)._count?.products ?? 0
  const listingLimit = config.listingLimit as number | null
  const listingsRemaining = listingLimit !== null ? Math.max(0, listingLimit - currentListings) : null

  return NextResponse.json({
    tier,
    commissionRate: config.commission,
    monthlyFee: config.monthlyFee,
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

  if (action === 'upgrade_to_pro' || action === 'upgrade_to_enterprise') {
    const priceId = action === 'upgrade_to_enterprise' ? process.env.STRIPE_ENTERPRISE_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID
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
      success_url: baseUrl + '/dashboard/upgrade?success=true&plan=' + (action === 'upgrade_to_enterprise' ? 'enterprise' : 'pro'),
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
