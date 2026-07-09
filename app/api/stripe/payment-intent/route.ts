import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'
import { findAutomaticDiscounts, DiscountCartItem } from '@/lib/discount'

export const dynamic = 'force-dynamic'

const PLATFORM_COMMISSION_RATE = 0.12
const TIER_COMMISSION: Record<string, number> = { STARTER: 0.12, PRO: 0.08, ENTERPRISE: 0.05 }

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
        stock: true,
        title: true,
        seller: { select: { id: true, currency: true, stripeAccountId: true, tier: true } },
      },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    let subtotalGBP = 0
    let sellerDbId = ''
    let sellerAccountId = ''
    let commissionRate = PLATFORM_COMMISSION_RATE
    const discountCartItems: DiscountCartItem[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: 'Product not found: ' + item.productId }, { status: 400 })
      }
      const qty = Math.max(1, Number(item.quantity) || 1)
      if (product.stock < qty) {
        return NextResponse.json(
          {
            error: product.stock <= 0
              ? `${product.title} is now sold out.`
              : `Only ${product.stock} left of ${product.title} -- please reduce the quantity.`,
            outOfStock: true,
            productId: item.productId,
            availableStock: product.stock,
          },
          { status: 409 }
        )
      }
      const sellerCurrency = product.seller?.currency ?? 'GBP'
      const unitGBP =
        sellerCurrency === 'GBP' ? product.price : await convert(product.price, sellerCurrency, 'GBP')
      const lineGBP = unitGBP * qty
      subtotalGBP += lineGBP
      discountCartItems.push({ productId: item.productId, quantity: qty, priceGBP: unitGBP })

      if (!sellerDbId && product.seller) {
        sellerDbId = product.seller.id
        sellerAccountId = product.seller.stripeAccountId ?? ''
        commissionRate = TIER_COMMISSION[product.seller.tier as unknown as string] ?? PLATFORM_COMMISSION_RATE
      }
    }

    // Discounts are automatic and buyer-invisible-to-input: there is no
    // discount code for the client to send. The exact same seller discount
    // codes that were shown on the listing/detail pages and at checkout are
    // re-looked-up here from scratch, so the buyer is always charged the
    // number they were shown — never a client-supplied amount.
    const { totalDiscountGBP, applied } = await findAutomaticDiscounts(sellerDbId, discountCartItems)
    const discountAmountGBP = totalDiscountGBP
    const discountIds = applied.map((a) => a.discountId)
    const discountCodesApplied = applied.map((a) => a.code)

    // Discounts only ever reduce the product subtotal — never shipping or
    // duties/taxes. Those are computed independently below and added back
    // in full, untouched by any discount.
    const discountedSubtotalGBP = Math.max(0, subtotalGBP - discountAmountGBP)

    const shippingCurrencyCode = String(shippingCurrency).toUpperCase()
    const shippingGBP = shippingCurrencyCode === 'GBP'
      ? Number(shippingAmount) || 0
      : await convert(Number(shippingAmount) || 0, shippingCurrencyCode, 'GBP')

    const dutiesGBP = Number(dutiesAmountGBP) || 0

    const totalGBP = discountedSubtotalGBP + shippingGBP + dutiesGBP

    let subtotalCharge = discountedSubtotalGBP
    let shippingCharge = shippingGBP
    let dutiesCharge = dutiesGBP
    let totalCharge = totalGBP
    let discountCharge = discountAmountGBP

    if (buyerCurrency !== 'GBP') {
      subtotalCharge = await convert(discountedSubtotalGBP, 'GBP', buyerCurrency)
      shippingCharge = await convert(shippingGBP, 'GBP', buyerCurrency)
      dutiesCharge = await convert(dutiesGBP, 'GBP', buyerCurrency)
      totalCharge = await convert(totalGBP, 'GBP', buyerCurrency)
      if (discountAmountGBP > 0) {
        discountCharge = await convert(discountAmountGBP, 'GBP', buyerCurrency)
      }
    }

    const amountMinorUnits = Math.round(totalCharge * 100)
    if (amountMinorUnits <= 0) {
      return NextResponse.json({ error: 'Total must be greater than zero' }, { status: 400 })
    }

    const applicationFeeAmount = Math.round(discountedSubtotalGBP * commissionRate * 100)
    const sellerShareGBP = totalGBP - discountedSubtotalGBP * commissionRate

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountMinorUnits,
      currency: buyerCurrency.toLowerCase(),
      // Required for the client's <PaymentElement> to actually resolve and render
      // payment-method UI. Without this, Stripe.js has nothing telling it which
      // methods to offer and the Payment Element hangs on its internal loader
      // iframe forever -- the buyer sees a bare 'Pay' button with no card fields
      // and clicking it does nothing (elements never reports ready).
      // Root cause of the earlier "Pay button does nothing" bug was a corrupted
      // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY value in Vercel (fixed 2026-07-07), not
      // the method-type config. automatic_payment_methods is safe and gives buyers
      // card, Link, Klarna, Revolut Pay, and Amazon Pay where eligible.
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify(items ?? []),
        subtotalGBP: subtotalGBP.toFixed(2),
        discountedSubtotalGBP: discountedSubtotalGBP.toFixed(2),
        discountAmountGBP: discountAmountGBP.toFixed(2),
        // Multiple automatic discounts can apply to one order (one per
        // product, each from a different code) — stored comma-joined since
        // Stripe metadata values are flat strings.
        discountIds: discountIds.join(','),
        discountCodes: discountCodesApplied.join(','),
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
        discountAmount: Number(discountCharge.toFixed(2)),
        discountCodes: discountCodesApplied,
        total: Number(totalCharge.toFixed(2)),
      },
    })
  } catch (err) {
    console.error('[payment-intent]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
