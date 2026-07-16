import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'
import { findAutomaticDiscounts, DiscountCartItem } from '@/lib/discount'
import { getRate } from '@/lib/shippo'
import { calculateLandedCost } from '@/lib/duty-rates'

export const dynamic = 'force-dynamic'

const PLATFORM_COMMISSION_RATE = 0.1
const TIER_COMMISSION: Record<string, number> = { STARTER: 0.1, PRO: 0.04, ENTERPRISE: 0.04 } // ENTERPRISE retired 2026-07-15: legacy rows read as Pro

// Stripe metadata values are capped at 500 chars each. These caps keep the
// JSON-encoded shippingAddress well under that limit even with every field
// filled in, so a long address can never silently break checkout.
function sanitizeAddress(input: unknown) {
  const a = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const pick = (k: string, max: number) => String(a[k] ?? '').slice(0, max).trim()
  return {
    name: pick('name', 80),
    phone: pick('phone', 30),
    line1: pick('line1', 90),
    line2: pick('line2', 60),
    city: pick('city', 50),
    state: pick('state', 40),
    postcode: pick('postcode', 15),
    country: pick('country', 40),
  }
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

interface SellerShippingInput {
  sellerId: string
  rateId: string
  // shippingAmount/shippingCurrency/dutiesAmountGBP are still accepted from
  // the client but are NO LONGER TRUSTED as of the 2026-07-16 readiness
  // audit -- see the re-verification block below. Kept in the type only
  // because older cached client bundles may still send them.
  shippingAmount?: number
  shippingCurrency?: string
  dutiesAmountGBP?: number
}

// Known non-Shippo rate ids -- see app/api/shipping/rates/route.ts's
// FALLBACK_QUOTE_RATE ('quote-required') and the SHIPPO_API_KEY-not-set
// placeholder ('pending-standard'). Both are always quoted at a fixed
// 0.00 GBP ("contact seller for a quote" / "pending"), so there is nothing
// for Shippo to re-verify -- the fix is to force the server-side amount to
// 0 for these instead of trusting whatever the client claims.
const FALLBACK_RATE_IDS = new Set(['quote-required', 'pending-standard'])

interface SellerGroup {
  sellerId: string
  tier: string | null
  shippingProfileCountry: string | null
  handlingFeeGBP: number
  items: { productId: string; quantity: number; priceGBP: number; hsCode: string | null; originCountry: string | null }[]
  subtotalGBP: number
}

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
      sellerShipping,
      buyerName,
      shippingAddress,
    } = await request.json()

    // The buyer's account email is the one and only trusted identity tied to
    // this order -- never whatever a client form field says. This is what
    // later lets /api/orders scope "my orders" safely without an IDOR.
    const buyerEmail = session.user.email.toLowerCase().trim()

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
        hsCode: true,
        originCountry: true,
        seller: {
          select: {
            id: true,
            currency: true,
            tier: true,
            // Needed to recompute duties AND re-verify shipping server-side
            // (see calculateLandedCost / getRate below) -- a seller's
            // dispatch country is the "originCountry" for customs purposes,
            // and handlingFeeGBP is the same packaging/rate-drift buffer
            // app/api/shipping/rates/route.ts adds on top of every live
            // carrier quote, needed here to reconstruct the exact amount the
            // buyer was quoted.
            shippingProfile: { select: { country: true, handlingFeeGBP: true } },
          },
        },
      },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    // A cart can hold items from MULTIPLE sellers. Each seller ships their
    // own parcel from their own address with their own carrier account (see
    // app/api/shipping/rates/route.ts), gets their own commission rate
    // (their own tier, not whichever seller happened to be first in the
    // cart), and -- critically -- must end up with their own Order and their
    // own payout. Everything below groups by the item's REAL seller,
    // resolved server-side from the product, never trusted from the client.
    const groups = new Map<string, SellerGroup>()

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: 'Product not found: ' + item.productId }, { status: 400 })
      }
      if (!product.seller) {
        return NextResponse.json({ error: 'Product has no seller: ' + item.productId }, { status: 400 })
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
      const sellerCurrency = product.seller.currency ?? 'GBP'
      const unitGBP =
        sellerCurrency === 'GBP' ? product.price : await convert(product.price, sellerCurrency, 'GBP')
      const lineGBP = unitGBP * qty

      let group = groups.get(product.seller.id)
      if (!group) {
        group = {
          sellerId: product.seller.id,
          tier: (product.seller.tier as unknown as string) ?? null,
          shippingProfileCountry: product.seller.shippingProfile?.country ?? null,
          handlingFeeGBP: Math.min(Math.max(Number(product.seller.shippingProfile?.handlingFeeGBP) || 0, 0), 25),
          items: [],
          subtotalGBP: 0,
        }
        groups.set(product.seller.id, group)
      }
      group.items.push({
        productId: item.productId,
        quantity: qty,
        priceGBP: unitGBP,
        hsCode: product.hsCode ?? null,
        originCountry: product.originCountry ?? null,
      })
      group.subtotalGBP += lineGBP
    }

    // Every seller present in the cart must have a chosen shipping option --
    // see app/checkout/page.tsx, which requires one selected rate per seller
    // group before "Continue to Payment" is even enabled.
    const shippingBySeller = new Map<string, SellerShippingInput>(
      (Array.isArray(sellerShipping) ? sellerShipping : []).map((s: SellerShippingInput) => [s.sellerId, s])
    )
    const missingShipping = [...groups.keys()].filter((id) => !shippingBySeller.has(id) || !shippingBySeller.get(id)!.rateId)
    if (missingShipping.length > 0) {
      return NextResponse.json(
        { error: 'Shipping has not been selected for every seller in this cart. Please reselect shipping and try again.' },
        { status: 400 }
      )
    }

    let grandSubtotalGBP = 0
    let grandDiscountedSubtotalGBP = 0
    let grandDiscountGBP = 0
    let grandShippingGBP = 0
    let grandDutiesGBP = 0
    let grandTotalGBP = 0
    let grandApplicationFee = 0
    const discountIds: string[] = []
    const discountCodesApplied: string[] = []
    // Compact per-seller breakdown -- short keys since this whole array is
    // one Stripe metadata value, capped at 500 chars. i=sellerId,
    // c=commissionRate, s=subtotalGBP (pre-discount), d=discountGBP,
    // h=shippingGBP, u=dutiesGBP, o=thisSeller'sTotalGBP,
    // e=sellerShareGBP (what this seller is ultimately owed). sellerAccountId
    // is deliberately NOT stored here -- the payout cron now looks it up
    // fresh from the database by the Order's own sellerId instead, which is
    // both smaller and always current rather than a checkout-time snapshot.
    const sellerBreakdown: Array<{ i: string; c: number; s: number; d: number; h: number; u: number; o: number; e: number }> = []

    for (const group of groups.values()) {
      const discountCartItems: DiscountCartItem[] = group.items
      const { totalDiscountGBP, applied } = await findAutomaticDiscounts(group.sellerId, discountCartItems)
      const discountedSubtotalGBP = Math.max(0, group.subtotalGBP - totalDiscountGBP)

      const shipEntry = shippingBySeller.get(group.sellerId)!

      // Re-verify shipping server-side instead of trusting the client's
      // shippingAmount (2026-07-16 readiness audit finding: a tampered
      // request could previously set shippingAmount to anything, including
      // 0, for a real rateId -- shorting the seller on shipping
      // reimbursement and letting the buyer dodge DDP duties). The two
      // known fallback rate ids ('quote-required' / 'pending-standard')
      // are always quoted at a fixed 0.00 by app/api/shipping/rates, so
      // there's nothing to verify against Shippo -- force them to 0 rather
      // than trusting the client either way.
      let shippingGBP = 0
      if (!FALLBACK_RATE_IDS.has(shipEntry.rateId)) {
        let verifiedRate
        try {
          verifiedRate = await getRate(shipEntry.rateId)
        } catch (err) {
          console.error('[payment-intent] shipping rate verification failed for seller', group.sellerId, shipEntry.rateId, err)
          return NextResponse.json(
            { error: 'Your shipping rate has expired. Please reselect shipping and try again.' },
            { status: 409 }
          )
        }
        const rateCurrency = String(verifiedRate.currency || 'GBP').toUpperCase()
        const rateAmountGBP = rateCurrency === 'GBP'
          ? parseFloat(verifiedRate.amount) || 0
          : await convert(parseFloat(verifiedRate.amount) || 0, rateCurrency, 'GBP')
        // Add back the seller's same packaging/rate-drift buffer that
        // app/api/shipping/rates/route.ts adds on top of every raw Shippo
        // quote before showing it to the buyer -- so this matches exactly
        // what the buyer was actually quoted, not the bare carrier rate.
        shippingGBP = rateAmountGBP + group.handlingFeeGBP
      }

      // Duties/VAT recomputed entirely server-side via the same pure,
      // deterministic calculateLandedCost() that app/api/shipping/landed-cost
      // uses to quote the buyer -- never trusted from the client. Uses the
      // pre-discount subtotal (matching that route's own declaredValueGBP)
      // and a representative HS code (first item that has one), the same
      // "one customs declaration per parcel" approach used at quote time.
      const destinationCountry = String(shippingAddress?.country || '').toUpperCase()
      const representativeHsCode = group.items.find((i) => i.hsCode)?.hsCode ?? null
      const landedCost = calculateLandedCost({
        hsCode: representativeHsCode,
        originCountry: group.shippingProfileCountry || 'GB',
        destinationCountry,
        declaredValueGBP: group.subtotalGBP,
        shippingCostGBP: shippingGBP,
      })
      const dutiesGBP = landedCost.totalTaxGBP

      const commissionRate = TIER_COMMISSION[group.tier as unknown as string] ?? PLATFORM_COMMISSION_RATE
      const sellerTotalGBP = discountedSubtotalGBP + shippingGBP + dutiesGBP
      const applicationFeeAmount = Math.round(discountedSubtotalGBP * commissionRate * 100)
      const sellerShareGBP = sellerTotalGBP - discountedSubtotalGBP * commissionRate

      grandSubtotalGBP += group.subtotalGBP
      grandDiscountedSubtotalGBP += discountedSubtotalGBP
      grandDiscountGBP += totalDiscountGBP
      grandShippingGBP += shippingGBP
      grandDutiesGBP += dutiesGBP
      grandTotalGBP += sellerTotalGBP
      grandApplicationFee += applicationFeeAmount
      discountIds.push(...applied.map((a) => a.discountId))
      discountCodesApplied.push(...applied.map((a) => a.code))

      sellerBreakdown.push({
        i: group.sellerId,
        c: commissionRate,
        s: round2(group.subtotalGBP),
        d: round2(totalDiscountGBP),
        h: round2(shippingGBP),
        u: round2(dutiesGBP),
        o: round2(sellerTotalGBP),
        e: round2(sellerShareGBP),
      })
    }

    const totalGBP = grandTotalGBP

    let subtotalCharge = grandDiscountedSubtotalGBP
    let shippingCharge = grandShippingGBP
    let dutiesCharge = grandDutiesGBP
    let totalCharge = totalGBP
    let discountCharge = grandDiscountGBP

    if (buyerCurrency !== 'GBP') {
      subtotalCharge = await convert(grandDiscountedSubtotalGBP, 'GBP', buyerCurrency)
      shippingCharge = await convert(grandShippingGBP, 'GBP', buyerCurrency)
      dutiesCharge = await convert(grandDutiesGBP, 'GBP', buyerCurrency)
      totalCharge = await convert(totalGBP, 'GBP', buyerCurrency)
      if (grandDiscountGBP > 0) {
        discountCharge = await convert(grandDiscountGBP, 'GBP', buyerCurrency)
      }
    }

    const amountMinorUnits = Math.round(totalCharge * 100)
    if (amountMinorUnits <= 0) {
      return NextResponse.json({ error: 'Total must be greater than zero' }, { status: 400 })
    }

    const sellerBreakdownJson = JSON.stringify(sellerBreakdown)
    // Stripe metadata values are capped at 500 chars. sellerBreakdown holds
    // one compact entry per seller in the cart (comfortably fits 4 sellers
    // in testing) -- fail loudly here with a clear error rather than let
    // Stripe reject PaymentIntent creation with an opaque one, if a cart
    // somehow has enough distinct sellers to overflow it.
    if (sellerBreakdownJson.length > 500) {
      return NextResponse.json(
        { error: 'This cart has too many different sellers to check out in one payment. Please split it into smaller orders.' },
        { status: 400 }
      )
    }

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
        // Server-computed {productId, quantity, priceGBP} per line item --
        // NOT the raw client body. Built from `groups` (the server-resolved,
        // server-priced item list), never the client's raw items. lib/orders.ts
        // re-resolves each item's REAL seller fresh from the database (never
        // from this JSON) and cross-references sellerBreakdown below to build
        // one Order per seller.
        items: JSON.stringify([...groups.values()].flatMap((g) => g.items)),
        buyerEmail,
        buyerName: String(buyerName ?? '').slice(0, 150).trim(),
        shippingAddress: JSON.stringify(sanitizeAddress(shippingAddress)),
        subtotalGBP: grandSubtotalGBP.toFixed(2),
        discountedSubtotalGBP: grandDiscountedSubtotalGBP.toFixed(2),
        discountAmountGBP: grandDiscountGBP.toFixed(2),
        // Multiple automatic discounts can apply to one order (one per
        // product, each from a different code) — stored comma-joined since
        // Stripe metadata values are flat strings.
        discountIds: discountIds.join(','),
        discountCodes: discountCodesApplied.join(','),
        shippingGBP: grandShippingGBP.toFixed(2),
        dutiesGBP: grandDutiesGBP.toFixed(2),
        totalGBP: totalGBP.toFixed(2),
        chargeCurrency: buyerCurrency,
        chargeAmount: totalCharge.toFixed(2),
        applicationFee: String(grandApplicationFee),
        // One entry per seller in the cart -- see SellerGroup/sellerBreakdown
        // above for the compact field-name key.
        sellerBreakdown: sellerBreakdownJson,
      },
    }

    // Funds are HELD on the platform (no transfer_data). The payout-release cron
    // transfers each seller's own share after delivery plus the hold window.

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
