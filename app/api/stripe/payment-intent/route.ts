import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Platform commission: 15% on product subtotal ONLY
// Shipping and duties are pass-through — sellers receive full shipping amount
const PLATFORM_COMMISSION_RATE = 0.15

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    })

    const {
      productSubtotal,  // in pence/cents — the product cost only
      shippingCost,     // in pence/cents — shipping pass-through
      dutiesAmount,     // in pence/cents — duties/VAT pass-through
      currency = 'gbp',
      sellerId,
      items,
    } = await request.json()

    if (!productSubtotal || productSubtotal <= 0) {
      return NextResponse.json({ error: 'productSubtotal required and must be > 0' }, { status: 400 })
    }

    const totalAmount = (productSubtotal ?? 0) + (shippingCost ?? 0) + (dutiesAmount ?? 0)
    // 15% commission on product subtotal ONLY — not shipping, not duties
    const TIER_COMMISSION: Record<string, number> = { STARTER: 0.15, PRO: 0.08, ENTERPRISE: 0.05 }
    let commissionRate = PLATFORM_COMMISSION_RATE
    let sellerAccountId = ''
    let sellerDbId = ''
    if (sellerId) {
      const seller = await prisma.seller.findFirst({
        where: { OR: [{ id: String(sellerId) }, { stripeAccountId: String(sellerId) }] },
        select: { id: true, stripeAccountId: true, tier: true },
      })
      if (seller) {
        sellerDbId = seller.id
        sellerAccountId = seller.stripeAccountId ?? ''
        commissionRate = TIER_COMMISSION[seller.tier as unknown as string] ?? PLATFORM_COMMISSION_RATE
      }
    }
    const applicationFeeAmount = Math.round(productSubtotal * commissionRate)
    const sellerShare = Math.round(totalAmount) - applicationFeeAmount

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(totalAmount),
      currency: currency.toLowerCase(),
      metadata: {
        items: JSON.stringify(items ?? []),
        productSubtotal: String(productSubtotal),
        shippingCost: String(shippingCost ?? 0),
        dutiesAmount: String(dutiesAmount ?? 0),
        applicationFee: String(applicationFeeAmount),
        commissionRate: String(commissionRate),
        sellerShare: String(sellerShare),
        sellerDbId,
        sellerAccountId,
      },
    }

    // Funds are HELD on the platform (no transfer_data). The payout-release cron
    // transfers the seller share after delivery plus the hold window.

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('[payment-intent]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
