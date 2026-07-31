import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'
import { findAutomaticDiscounts, DiscountCartItem } from '@/lib/discount'
import { getRate } from '@/lib/shippo'
import { calculateLandedCost } from '@/lib/duty-rates'
import { computeZone, weightBandFor } from '@/lib/shipping-zones'

export const dynamic = 'force-dynamic'

const PLATFORM_COMMISSION_RATE = 0.1
const TIER_COMMISSION: Record<string, number> = { STARTER: 0.1, PRO: 0.04, ENTERPRISE: 0.04 } // ENTERPRISE retired 2026-07-15: legacy rows read as Pro

// Velor Roots Foundation checkout micro-donation (William, 2026-07-31).
// HELD DARK: CHARITY_DONATIONS_ENABLED must stay unset/false in every
// environment until Velor Roots Foundation is actually a legally registered
// UK charity -- soliciting donations in the name of an unregistered charity
// is a real misrepresentation problem, not a formality. When the flag is
// off, any donationGBP the client sends is silently zeroed below rather than
// erroring, so old cached client bundles (or a stray request) can never
// sneak a charge through. Do not flip this on without confirming
// registration with William first -- this is not a routine feature flag.
const CHARITY_DONATIONS_ENABLED = process.env.CHARITY_DONATIONS_ENABLED === 'true'
// Fixed allowlist, matching the three amounts offered in the checkout UI
// (app/checkout/page.tsx) -- 20p / 50p / £1. Anything else (including
// negative numbers, huge numbers, or a value with more than 2dp of drift)
// is rejected back to 0 rather than trusted, same "never trust a
// client-supplied amount" principle as every other price on this route.
const ALLOWED_DONATION_AMOUNTS_GBP = new Set([0.2, 0.5, 1])

// Preview-only listing (William, 2026-07-27, same brief as
// app/shop/[productId]/ProductPageClient.tsx's PREVIEW_ONLY_PRODUCT_ID):
// the UI already disables Add to Cart/Buy Now for this product, but this
// server-side check is the real backstop -- it's what actually stops a
// checkout, whether the item reached the cart from before this change or
// via a direct API call.
const PREVIEW_ONLY_PRODUCT_ID = 'cms260kvd0003epq3lnituxvw'

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
  internationalFlatRateGBP: number | null
  items: { productId: string; quantity: number; priceGBP: number; hsCode: string | null; originCountry: string | null; weightGrams: number | null }[]
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
      donationGBP,
    } = await request.json()

    // Silently clamp to 0 rather than error -- an invalid or disabled
    // donation must never block an otherwise-valid checkout. See the
    // CHARITY_DONATIONS_ENABLED comment above.
    const donationAmountGBP =
      CHARITY_DONATIONS_ENABLED && ALLOWED_DONATION_AMOUNTS_GBP.has(round2(Number(donationGBP) || 0))
        ? round2(Number(donationGBP) || 0)
        : 0

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
        weightGrams: true,
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
            // buyer was quoted. internationalFlatRateGBP is re-read fresh
            // here too, for the same reason -- see the 'seller-flat-rate'
            // handling below, never trust the client's shippingAmount.
            shippingProfile: { select: { country: true, handlingFeeGBP: true, internationalFlatRateGBP: true } },
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
      if (product.id === PREVIEW_ONLY_PRODUCT_ID) {
        return NextResponse.json(
          { error: 'This is a preview listing shown to demonstrate Velor and is not available for purchase.' },
          { status: 400 }
        )
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
          internationalFlatRateGBP:
            product.seller.shippingProfile?.internationalFlatRateGBP != null
              ? Math.min(Math.max(Number(product.seller.shippingProfile.internationalFlatRateGBP) || 0, 0), 500)
              : null,
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
        weightGrams: product.weightGrams ?? null,
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
    const sellerBreakdown: Array<{ i: string; c: number; s: number; d: number; h: number; u: number; o: number; e: number; v: number }> = []

    for (const group of groups.values()) {
      const discountCartItems: DiscountCartItem[] = group.items
      const { totalDiscountGBP, applied } = await findAutomaticDiscounts(group.sellerId, discountCartItems)
      const discountedSubtotalGBP = Math.max(0, group.subtotalGBP - totalDiscountGBP)

      const shipEntry = shippingBySeller.get(group.sellerId)!
      // Hoisted above the shipping-verification block so the platform-
      // default-rate branch below can use it too (originally computed
      // further down, only for duties).
      const destinationCountry = String(shippingAddress?.country || '').toUpperCase()

      // Re-verify shipping server-side instead of trusting the client's
      // shippingAmount (2026-07-16 readiness audit finding: a tampered
      // request could previously set shippingAmount to anything, including
      // 0, for a real rateId -- shorting the seller on shipping
      // reimbursement and letting the buyer dodge DDP duties).
      let shippingGBP = 0
      if (shipEntry.rateId === 'seller-flat-rate') {
        // Seller-set flat international rate (2026-07-27, see
        // app/api/shipping/rates -- this is what lets Velor operate for
        // sellers dispatching from any of the ~190 origin countries, not
        // just the handful with a live carrier account). Never trust the
        // client's shippingAmount -- re-read fresh from the DB (fetched
        // into group.internationalFlatRateGBP above). If it's since changed
        // or been unset, treat it like an expired rate rather than silently
        // charging whatever the client claims or falling back to 0.
        if (group.internationalFlatRateGBP == null) {
          return NextResponse.json(
            { error: "This seller's shipping rate has changed. Please reselect shipping and try again." },
            { status: 409 }
          )
        }
        shippingGBP = group.internationalFlatRateGBP
      } else if (shipEntry.rateId === 'platform-default-rate') {
        // Platform-default zone/weight estimate (2026-07-27, see
        // app/api/shipping/rates's flatRateOrFallback and
        // app/api/admin/shipping-rate-survey) -- used when the seller has
        // NOT set their own flat rate but a calibrated platform estimate
        // exists for their zone/weight combo. Recomputed entirely
        // server-side, including the levy, from the same tables the quote
        // came from -- never trusted from the client, same principle as
        // every other shipping amount here.
        if (!group.shippingProfileCountry) {
          return NextResponse.json(
            { error: "This seller's shipping rate has changed. Please reselect shipping and try again." },
            { status: 409 }
          )
        }
        const totalWeightGrams = group.items.reduce(
          (sum: number, i: SellerGroup['items'][number]) => sum + (i.weightGrams ?? 450) * i.quantity, 0
        )
        const zone = computeZone(group.shippingProfileCountry, destinationCountry)
        const band = weightBandFor(totalWeightGrams)
        const platformRate = await prisma.platformShippingRate.findUnique({
          where: { zone_weightBandMinGrams: { zone, weightBandMinGrams: band.minGrams } },
        })
        if (!platformRate) {
          return NextResponse.json(
            { error: 'Your shipping estimate has expired. Please reselect shipping and try again.' },
            { status: 409 }
          )
        }
        // The old flat 8% levy (PlatformShippingConfig.levyPercent) was
        // replaced 2026-07-27 by a flat per-item admin fee applied
        // uniformly across all three shipping tiers below (search
        // ADMIN_FEE_PER_ITEM_GBP in this file).
        shippingGBP = platformRate.baseAmountGBP
      } else if (FALLBACK_RATE_IDS.has(shipEntry.rateId)) {
        // No live carrier rate AND no seller-set flat rate -- there is no
        // real price to charge. Block checkout instead of letting the order
        // through with the buyer paying 0.00 for shipping and the seller
        // getting nothing for it (2026-07-27 finding: this used to happen
        // silently for every seller outside our connected carrier
        // countries). The seller needs to add a flat international rate in
        // Settings -> Shipping before this route can sell to this buyer.
        return NextResponse.json(
          {
            error: "Shipping isn't available for this seller yet -- they haven't set an international shipping rate. Please contact the seller, or check back once they've configured shipping.",
            shippingUnavailable: true,
            sellerId: group.sellerId,
          },
          { status: 409 }
        )
      } else {
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

      // Flat per-item admin fee, replacing the old 8% platform-default-rate-
      // only levy (2026-07-27, agreed with William after the DDP rate
      // survey). Quantity-multiplied, not flat-per-order.
      //
      // SELLER-PROVIDED SHIPPING IS FEE-FREE (William, 2026-07-29: "if they
      // provide the shipping, we do not charge the GBP1.20 admin fee") --
      // when the seller set their own flat rate (including 0.00 free
      // shipping) the buyer pays exactly the seller's price. The fee
      // applies only where Velor arranges the price: live carrier quotes
      // and the platform-default tier. app/api/shipping/rates's
      // applyAdminFee skips the same tier -- keep both in sync.
      if (shipEntry.rateId !== 'seller-flat-rate') {
        const ADMIN_FEE_PER_ITEM_GBP = 1.20
        const itemCount = group.items.reduce((sum, i) => sum + (i.quantity || 1), 0)
        shippingGBP += ADMIN_FEE_PER_ITEM_GBP * itemCount
      }

      // Duties/VAT recomputed entirely server-side via the same pure,
      // deterministic calculateLandedCost() that app/api/shipping/landed-cost
      // uses to quote the buyer -- never trusted from the client. Uses the
      // pre-discount subtotal (matching that route's own declaredValueGBP)
      // and a representative HS code (first item that has one), the same
      // "one customs declaration per parcel" approach used at quote time.
      const representativeHsCode = group.items.find((i) => i.hsCode)?.hsCode ?? null
      const landedCost = calculateLandedCost({
        hsCode: representativeHsCode,
        originCountry: group.shippingProfileCountry || 'GB',
        destinationCountry,
        declaredValueGBP: group.subtotalGBP,
        shippingCostGBP: shippingGBP,
        // EU low-value flat duty (since 2026-07-01) is charged PER ITEM.
        itemCount: group.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
      })
      const dutiesGBP = landedCost.totalTaxGBP

      // VAT ROUTE (William, 2026-07-29: "we need to set up the vat route and
      // it goes to a seperate pot"). Where UK law makes the MARKETPLACE the
      // deemed supplier -- goods imported into the UK with an intrinsic
      // consignment value of GBP 135 or less, sold via an OMP -- the tax the
      // buyer pays belongs to VELOR (for remittance to HMRC), never to the
      // seller. Held per order in Order.vatCollected, excluded from
      // sellerEarnings AND from commission (commission was always on the
      // discounted goods subtotal only). Lanes outside the deemed-supplier
      // rule (> GBP 135, or non-UK destinations) keep the pass-through
      // model: the estimate goes to the seller to cover a duties-paid
      // shipment. See docs/VAT-OMP-POSITION.md.
      const originCode = (group.shippingProfileCountry || 'GB').toUpperCase()
      const vatHeldByVelor =
        destinationCountry.toUpperCase() === 'GB' &&
        originCode !== 'GB' &&
        discountedSubtotalGBP <= 135 &&
        dutiesGBP > 0
      const vatGBP = vatHeldByVelor ? dutiesGBP : 0

      const commissionRate = TIER_COMMISSION[group.tier as unknown as string] ?? PLATFORM_COMMISSION_RATE
      const sellerTotalGBP = discountedSubtotalGBP + shippingGBP + dutiesGBP
      const applicationFeeAmount = Math.round(discountedSubtotalGBP * commissionRate * 100)
      const sellerShareGBP = sellerTotalGBP - discountedSubtotalGBP * commissionRate - vatGBP

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
        v: round2(vatGBP),
      })
    }

    const totalGBP = grandTotalGBP

    let subtotalCharge = grandDiscountedSubtotalGBP
    let shippingCharge = grandShippingGBP
    let dutiesCharge = grandDutiesGBP
    // Donation is added to what's actually charged but deliberately kept OUT
    // of totalGBP/sellerBreakdown below -- it belongs to no seller and isn't
    // platform revenue, so lib/orders.ts's per-seller Order totals never see
    // it. It's charged, then reconciled separately into CharityDonation (see
    // prisma schema) by createOrderFromPaymentIntent.
    let totalCharge = totalGBP + donationAmountGBP
    let discountCharge = grandDiscountGBP
    let donationCharge = donationAmountGBP

    if (buyerCurrency !== 'GBP') {
      subtotalCharge = await convert(grandDiscountedSubtotalGBP, 'GBP', buyerCurrency)
      shippingCharge = await convert(grandShippingGBP, 'GBP', buyerCurrency)
      dutiesCharge = await convert(grandDutiesGBP, 'GBP', buyerCurrency)
      totalCharge = await convert(totalGBP + donationAmountGBP, 'GBP', buyerCurrency)
      if (grandDiscountGBP > 0) {
        discountCharge = await convert(grandDiscountGBP, 'GBP', buyerCurrency)
      }
      if (donationAmountGBP > 0) {
        donationCharge = await convert(donationAmountGBP, 'GBP', buyerCurrency)
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
        // Velor Roots Foundation checkout donation, GBP, always 0.00 while
        // CHARITY_DONATIONS_ENABLED is off. Read by
        // lib/orders.ts::createOrderFromPaymentIntent to write ONE
        // CharityDonation row per payment (never per seller) -- kept
        // deliberately separate from totalGBP/sellerBreakdown above.
        donationGBP: donationAmountGBP.toFixed(2),
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
        donationAmount: Number(donationCharge.toFixed(2)),
        total: Number(totalCharge.toFixed(2)),
      },
    })
  } catch (err) {
    console.error('[payment-intent]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
