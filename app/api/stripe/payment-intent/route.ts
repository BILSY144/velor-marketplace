import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'

export const dynamic = 'force-dynamic'

const PLATFORM_COMMISSION_RATE = 0.15
const TIER_COMMISSION: Record<string, number> = { STARTER: 0.15, PRO: 0.08, ENTERPRISE: 0.05 }

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
    items,
    currency = 'GBP',
    shippingAmount = 0,
    shippingCurrency = 'GBP',
    dutiesAmountGBP = 0,
  } = await request.json()

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }

  const buyerCurrency = String(currency).toUpperCase()

  const productIds = items.map((i: { productId: string }) => i.productId).filter(Boolean)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      price: true,
      seller: { select: { id: true, currency: true, stripeAccountId: true, tier: true } },
    },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  let subtotalGBP = 0
  let sellerDbId = ''
  let sellerAccountId = ''
  let commissionRate = PLATFORM_COMMISSION_RATE

  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found: ' + item.productId }, { status: 400 })
    }
    const qty = Math.max(1, Number(item.quantity) || 1)
    const sellerCurrency = product.seller?.currency ?? 'GBP'
    const lineGBP = sellerCurrency === 'GBP'
    ? product.price * qty
      : await convert(product.price * qty, sellerCurrency, 'GBP')
    subtotalGBP += lineGBP

  if (!sellerDbId && product.seller) {
    sellerDbId = product.seller.id
    sellerAccountId = product.seller.stripeAccountId ?? ''
    commissionRate = TIER_COMMISSION[product.seller.tier as unknown as string] ?? PLATFORM_COMMISSION_RATE
  }
  }

  const shippingCurrencyCode = String(shippingCurrency).toUpperCase()
  const shippingGBP = shippingCurrencyCode === 'GBP'
  ? Number(shippingAmount) || 0
    : await convert(Number(shippingAmount) || 0, shippingCurrencyCode, 'GBP')

  const dutiesGBP = Number(dutiesAmountGBP) || 0

  const totalGBP = subtotalGBP + shippingGBP + dutiesGBP

  let subtotalCharge = subtotalGBP
  let shippingCharge = shippingGBP
  let dutiesCharge = dutiesGBP
  let totalCharge = totalGBP

  if (buyerCurrency !== 'GBP') {
    subtotalCharge = await convert(subtotalGBP, 'GBP', buyerCurrency)
    shippingCharge = await convert(shippingGBP, 'GBP', buyerCurrency)
    dutiesCharge = await convert(dutiesGBP, 'GBP', buyerCurrency)
    totalCharge = await convert(totalGBP, 'GBP', buyerCurrency)
  }

  const amountMinorUnits = Math.round(totalCharge * 100)
  if (amountMinorUnits <= 0) {
    return NextResponse.json({ error: 'Total must be greater than zero' }, { status: 400 })
  }

  const applicationFeeAmount = Math.round(subtotalGBP * commissionRate * 100)
  const sellerShareGBP = totalGBP - subtotalGBP * commissionRate

  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: amountMinorUnits,
    currency: buyerCurrency.toLowerCase(),
    metadata: {
      items: JSON.stringify(items ?? []),
      subtotalGBP: subtotalGBP.toFixed(2),
      shippingGBP: shippingGBP.toFixed(2),
      dutiesGBP: dutiesGBP.toFixed(2),
      totalGBP: totalGBP.toFixed(2),
      chargeCurrency: buyerCurrency,
      chargeAmount: totalCharge.toFixed(2),
      applicationFee: String(applicationFeeAmount),
      commissionRate: String(commissionRate),
      sellerShareGBP: sellerShareGBP.toFixed(2),
      sellerDbId,
      sellerAccountId,
    },
      }

  // Funds are HELD on the platform (no transfer_data). The payout-release cron
  // transfers the seller share after delivery plus the hold window.

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    breakdown: {
      currency: buyerCurrency,
      productSubtotal: Number(subtotalCharge.toFixed(2)),
      shippingCost: Number(shippingCharge.toFixed(2)),
      dutiesAmount: Number(dutiesCharge.toFixed(2)),
      total: Number(totalCharge.toFixed(2)),
    },
  })
} catch (err) {
  console.error('[payment-intent]', err)
  const msg = err instanceof Error ? err.message : 'Unknown error'
  return NextResponse.json({ error: msg }, { status: 500 })
}
}
