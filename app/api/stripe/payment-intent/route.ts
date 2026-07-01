import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'

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
    const applicationFeeAmount = Math.round(productSubtotal * PLATFORM_COMMISSION_RATE)

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(totalAmount),
      currency: currency.toLowerCase(),
      metadata: {
        items: JSON.stringify(items ?? []),
        productSubtotal: String(productSubtotal),
        shippingCost: String(shippingCost ?? 0),
        dutiesAmount: String(dutiesAmount ?? 0),
        applicationFee: String(applicationFeeAmount),
      },
    }

    if (sellerId) {
      paymentIntentParams.transfer_data = { destination: sellerId }
      paymentIntentParams.application_fee_amount = applicationFeeAmount
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('[payment-intent]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
