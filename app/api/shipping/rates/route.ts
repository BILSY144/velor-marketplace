import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createShippoShipment, buildParcelFromItems, sortRatesGlobal,
  ShippoAddress, ShippoCustomsItem,
} from '@/lib/shippo'
import { convert } from '@/lib/fx'
import { computeZone, weightBandFor } from '@/lib/shipping-zones'
import { isEasyshipEnabled, getEasyshipRates, toEasyshipAddress } from '@/lib/easyship'

// Origins whose buyer-facing quotes include Easyship's live rates. Shares
// the EASYSHIP_ORIGINS env var with lib/orders.ts' label purchase so a lane
// quotes and labels through the same provider set -- flip lanes on without
// a deploy, but only after live verification via /api/admin/easyship-check.
function easyshipRateOrigins(): Set<string> {
  return new Set(
    (process.env.EASYSHIP_ORIGINS || '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c))
  )
}

export const dynamic = 'force-dynamic'

// No DEFAULT_ORIGIN. Every seller must have a ShippingProfile with their real dispatch address.
// A seller without a shipping profile is skipped with a warning -- we never invent an origin.
//

type Rate = {
  rateId: string
  carrier: string
  service: string
  amount: string
  currency: string; amountGBP?: string
  estimatedDays: number | null
  isDDP: boolean
  isFallback: boolean
}

const FALLBACK_QUOTE_RATE: Rate = {
  rateId: 'quote-required',
  carrier: 'Custom Quote',
  service: 'Contact seller for shipping quote',
  amount: '0.00',
  currency: 'GBP',
  estimatedDays: null,
  isDDP: false,
  isFallback: true,
}

// Flat per-item admin fee, replacing the old 8% platform-default-rate-only
// levy (2026-07-27, agreed with William after the DDP rate survey showed
// platform-default rates were unusably high). Applied uniformly across all
// three shipping-rate tiers (seller-flat-rate, live-quote, platform-
// default-rate) via applyAdminFee() below, so buyers see consistent
// pricing behaviour regardless of which tier a seller/destination
// combination resolves to. Quantity-multiplied, not flat-per-order -- e.g.
// 3 items in a seller's cart group = GBP3.60. Never applied to the
// zero-cost FALLBACK_QUOTE_RATE ("Contact seller for shipping quote") --
// isFallback is the signal used to skip it.
//
// SELLER-PROVIDED SHIPPING IS FEE-FREE (William, 2026-07-29: "if they
// provide the shipping, we do not charge the GBP1.20 admin fee"): when a
// seller sets their own flat rate -- including 0.00 free shipping -- the
// buyer pays exactly the seller's price. The fee applies only where VELOR
// arranges the price (live carrier quotes + the platform default tier).
// The payment-intent route mirrors this rule -- keep both in sync.
const ADMIN_FEE_PER_ITEM_GBP = 1.20

async function applyAdminFee(rates: Rate[], itemCount: number): Promise<Rate[]> {
  if (!itemCount) return rates
  const feeGBP = ADMIN_FEE_PER_ITEM_GBP * itemCount
  return Promise.all(rates.map(async (rate) => {
    if (rate.isFallback) return rate
    if (rate.rateId === 'seller-flat-rate') return rate
    const cur = (rate.currency || 'GBP').toUpperCase()
    const fee = cur === 'GBP' ? feeGBP : await convert(feeGBP, 'GBP', cur); const finalAmount = parseFloat(rate.amount) + fee
    return { ...rate, amount: finalAmount.toFixed(2), amountGBP: (cur === 'GBP' ? finalAmount : await convert(finalAmount, cur, 'GBP')).toFixed(2) }
  }))
}

// Velor only has live Shippo carrier accounts connected for a handful of
// origin countries -- every seller dispatching from anywhere else in the
// world used to hit FALLBACK_QUOTE_RATE, which quotes 0.00 and either let
// checkout complete with the buyer paying nothing for shipping, or (after
// the 2026-07-27 fix) blocked checkout outright for that seller. Priority
// order when a real per-order Shippo quote can't be calculated:
//   1. Seller's own flat international rate (SellerShippingProfile.
//      internationalFlatRateGBP) -- most accurate, the seller set it
//      deliberately for their own route.
//   2. Platform-default estimate (PlatformShippingRate, see
//      app/api/admin/shipping-rate-survey) -- a zone x weight-band GBP
//      estimate calibrated from real live Shippo quotes. A flat GBP1.20-
//      per-item admin fee (ADMIN_FEE_PER_ITEM_GBP) is layered on top of
//      this and the other two tiers uniformly -- see applyAdminFee below.
//      This is what makes checkout work for EVERY
//      seller regardless of origin country, with no action required from
//      them -- added 2026-07-27 specifically so buyers never again have to
//      "hope the seller configured shipping."
//   3. FALLBACK_QUOTE_RATE -- only reachable now if the platform table has
//      no data yet for that zone/weight combo (survey still in progress).
async function platformDefaultRateGBP(
  originCountry: string, destinationCountry: string, weightGrams: number
): Promise<number | null> {
  const zone = computeZone(originCountry, destinationCountry)
  const band = weightBandFor(weightGrams)
  const row = await prisma.platformShippingRate.findUnique({
    where: { zone_weightBandMinGrams: { zone, weightBandMinGrams: band.minGrams } },
  })
  if (!row) return null
  // The old flat 8% levy (PlatformShippingConfig.levyPercent) was replaced
  // 2026-07-27 by a flat per-item admin fee applied uniformly across all
  // three shipping tiers -- see ADMIN_FEE_PER_ITEM_GBP / applyAdminFee.
  return row.baseAmountGBP
}

async function flatRateOrFallback(
  profile: { internationalFlatRateGBP?: number | null; country?: string } | null | undefined,
  destinationCountry: string,
  weightGrams: number,
  fallback: Rate = FALLBACK_QUOTE_RATE
): Promise<Rate[]> {
  // TEMPORARY NON-NEGOTIABLE RULE (William, 2026-07-29): a seller
  // dispatching from a country where Velor cannot auto-purchase labels
  // MUST offer free shipping (real postage baked into the product price).
  // Enforced at the point of use so it covers every seller past and
  // future: on out-of-label origins the flat tier is ALWAYS 0 regardless
  // of what is stored, and the platform-default estimate tier (the scary
  // GBP 40+ numbers) can never reach a buyer again. Fee-free per the
  // seller-provided-shipping rule (8060c4f).
  // Universal seller-arranged era (2026-07-29, William: sellers choose
  // FREE shipping or their own price shown in cart -- Velor has ZERO
  // shipping responsibility, we are just the platform). The seller's
  // stored choice applies; a seller who never set one defaults to FREE.
  const flat = (profile?.internationalFlatRateGBP != null && Number.isFinite(profile.internationalFlatRateGBP)) ? profile.internationalFlatRateGBP : 0
  if (flat != null && Number.isFinite(flat)) {
    return [{
      rateId: 'seller-flat-rate',
      carrier: 'Seller Shipping',
      service: 'International (seller-set rate)',
      amount: flat.toFixed(2),
      currency: 'GBP',
      estimatedDays: null,
      isDDP: false,
      isFallback: false,
    }]
  }

  if (profile?.country) {
    try {
      const estimate = await platformDefaultRateGBP(profile.country, destinationCountry, weightGrams)
      if (estimate != null) {
        return [{
          rateId: 'platform-default-rate',
          carrier: 'Velor Estimated Shipping',
          service: 'International (estimated)',
          amount: estimate.toFixed(2),
          currency: 'GBP',
          estimatedDays: null,
          isDDP: false,
          isFallback: false,
        }]
      }
    } catch (err) {
      console.error('[shipping/rates] platformDefaultRateGBP failed', err)
    }
  }

  return [fallback]
}

// A mixed-seller cart ships as one parcel PER SELLER (see lib/orders.ts and
// docs on the Shipment model) -- each seller dispatches their own items from
// their own address, with their own carrier account. The buyer must
// therefore choose (and be charged for) shipping separately for EACH
// seller in the cart, not once for the whole order. This route always
// returns one group per seller present in cartItems, even when a real
// Shippo rate can't be calculated for that seller (missing profile, API
// error, etc.) -- that seller still gets a group with a fallback quote-
// required rate, so no seller silently disappears from the buyer's
// shipping choices and no seller's parcel goes unaccounted-for at checkout.
export async function POST(request: NextRequest) {
  try {
    const { cartItems, shippingAddress } = await request.json()

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'cartItems required' }, { status: 400 })
    }
    if (!shippingAddress?.country) {
      return NextResponse.json({ error: 'shippingAddress.country required' }, { status: 400 })
    }

    // Group cart items by seller (cart items carry sellerId, never
    // sellerStripeAccountId -- grouping on the field that's never actually
    // populated silently dropped every seller's items into one bucket).
    const sellerGroups = new Map<string, typeof cartItems>()
    for (const item of cartItems) {
      const key = item.sellerId || '__unknown__'
      if (!sellerGroups.has(key)) sellerGroups.set(key, [])
      sellerGroups.get(key)!.push(item)
    }

    const knownSellerIds = [...sellerGroups.keys()].filter((id) => id !== '__unknown__')
    const sellers = knownSellerIds.length
      ? await prisma.seller.findMany({
          where: { id: { in: knownSellerIds } },
          include: { shippingProfile: true },
        })
      : []
    const sellerMap = new Map(sellers.map((s) => [s.id, s]))

    const result: Array<{ sellerId: string; sellerName: string; originCountry: string | null; rates: Rate[] }> = []

    for (const [sellerId, items] of sellerGroups) {
      if (sellerId === '__unknown__') {
        console.warn('[shipping/rates] Cart item(s) missing sellerId -- skipping', items.length)
        continue
      }

      const seller = sellerMap.get(sellerId)
      if (!seller) {
        console.warn('[shipping/rates] No seller found for id:', sellerId)
        result.push({ sellerId, sellerName: 'Unknown seller', originCountry: null, rates: [FALLBACK_QUOTE_RATE] })
        continue
      }

      // Total quantity across this seller's cart items -- used below to
      // scale the flat GBP1.20-per-item admin fee (ADMIN_FEE_PER_ITEM_GBP)
      // uniformly across whichever shipping tier this seller resolves to.
      const itemCount = items.reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity || 1), 0)

      // When Shippo is not yet configured globally, every seller gets the
      // same generic placeholder (unless they've set their own flat rate or
      // a platform default estimate applies, both honoured even here).
      // Never show fake carrier names. No per-item weight is available at
      // this point (Shippo is disabled, so we never fetched products) --
      // 500g is the same nominal default used elsewhere in this codebase
      // (see buildParcelFromItems) when a real weight isn't known yet.
      if (!process.env.SHIPPO_API_KEY) {
        result.push({
          sellerId,
          sellerName: seller.storeName,
          originCountry: seller.shippingProfile?.country ?? null,
          rates: await applyAdminFee(await flatRateOrFallback(
            seller.shippingProfile,
            shippingAddress.country,
            450,
            { ...FALLBACK_QUOTE_RATE, rateId: 'pending-standard', carrier: 'Standard Shipping', service: 'Tracked Delivery', estimatedDays: 14 }
          ), itemCount),
        })
        continue
      }

      // Hoisted above the try block so the catch handler below can still use
      // a real (or best-effort default) weight for the platform-default
      // estimate rather than falling straight to the dead-end quote-required
      // placeholder just because the live Shippo call itself threw.
      let totalWeightGrams = 450 * items.reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity || 1), 0)

      try {
        const itemProductIds = items.map((i: { productId: string }) => i.productId).filter(Boolean)
        const productDims = itemProductIds.length
          ? await prisma.product.findMany({
              where: { id: { in: itemProductIds } },
              select: {
                id: true,                 weightGrams: true, lengthCm: true, widthCm: true,
                heightCm: true, price: true, originCountry: true,
              },
            })
          : []
        const productMap = new Map(productDims.map((pr) => [pr.id, pr]))

        // Real Shippo rate from the seller's registered dispatch address.
        if (!seller.shippingProfile) {
          console.warn('[shipping/rates] Seller has no ShippingProfile, cannot calculate rates:', sellerId)
          result.push({ sellerId, sellerName: seller.storeName, originCountry: null, rates: [FALLBACK_QUOTE_RATE] })
          continue
        }

        const p = seller.shippingProfile
        const addressFrom: ShippoAddress = {
          name: p.name,
          company: p.company || undefined,
          street1: p.street1,
          street2: p.street2 || undefined,
          city: p.city,
          state: p.state || undefined,
          zip: p.zip,
          country: p.country,
          phone: p.phone || undefined,
        }

        // isInternational is per-seller: their dispatch country vs the buyer's country.
        // A seller in Japan shipping to France is international.
        // A seller in Germany shipping to Germany is domestic.
        const isInternational = shippingAddress.country !== addressFrom.country

        const itemsWithDimensions = items.map((item: { productId: string; quantity: number }) => {
          const pr = productMap.get(item.productId)
          return {
            weightGrams: pr?.weightGrams,
            lengthCm: pr?.lengthCm,
            widthCm: pr?.widthCm,
            heightCm: pr?.heightCm,
            quantity: item.quantity || 1,
          }
        })

        totalWeightGrams = itemsWithDimensions.reduce(
          (sum: number, i: { weightGrams?: number | null; quantity: number }) =>
            sum + (i.weightGrams ?? 450) * i.quantity,
          0
        )

        const parcel = buildParcelFromItems(itemsWithDimensions)

        const addressTo: ShippoAddress = {
          name: shippingAddress.name || 'Customer',
          street1: shippingAddress.street1 || shippingAddress.line1 || '',
          street2: shippingAddress.street2 || shippingAddress.line2 || undefined,
          city: shippingAddress.city || '',
          state: shippingAddress.state || shippingAddress.county || undefined,
          zip: shippingAddress.zip || shippingAddress.postalCode || '',
          country: shippingAddress.country,
          phone: shippingAddress.phone || undefined,
          email: shippingAddress.email || undefined,
        }

        const customsItems: ShippoCustomsItem[] = items.map((item: {
          productId: string; quantity: number; name?: string; price?: number
        }) => {
          const pr = productMap.get(item.productId)
          return {
            description: item.name || 'Product',
            quantity: item.quantity || 1,
            net_weight: String((pr?.weightGrams || 180) / 1000),
            mass_unit: 'kg',
            value_amount: String(item.price || pr?.price || 0),
            value_currency: 'GBP',
            origin_country: pr?.originCountry || addressFrom.country,
          }
        })

        const declaredValue = items.reduce(
          (sum: number, item: { productId: string; price?: number; quantity: number }) =>
            sum + (item.price || productMap.get(item.productId)?.price || 0) * (item.quantity || 1),
          0
        )

        const shipment = await createShippoShipment({
          addressFrom, addressTo, parcels: [parcel],
          customsItems, declaredValue, currency: 'GBP', isInternational,
        })

        const sorted = sortRatesGlobal(shipment.rates || [])
        let mapped: Rate[] = sorted.slice(0, 6).map(r => ({
          rateId: r.object_id,
          carrier: r.provider || 'Carrier',
          service: r.servicelevel?.name || 'Standard',
          amount: r.amount,
          currency: r.currency,
          estimatedDays: r.estimated_days,
          isDDP: isInternational,
          isFallback: false,
        }))

        // Easyship live rates (2026-07-28): merged as additional options for
        // origins switched on via EASYSHIP_ORIGINS. Pure addition -- with
        // the env vars unset this block is a no-op and the response is
        // exactly the Shippo-only behaviour. rateIds are 'easyship:'-
        // prefixed; nothing downstream dereferences buyer-chosen rateIds
        // against Shippo (label purchase re-quotes independently).
        if (isEasyshipEnabled() && easyshipRateOrigins().has(addressFrom.country.toUpperCase())) {
          try {
            const esRates = await getEasyshipRates({
              originAddress: toEasyshipAddress({
                name: p.name, company: p.company, street1: p.street1, street2: p.street2,
                city: p.city, state: p.state, zip: p.zip, country: p.country, phone: p.phone,
              }),
              destinationAddress: toEasyshipAddress({
                name: shippingAddress.name || 'Customer',
                street1: shippingAddress.street1 || shippingAddress.line1 || '',
                street2: shippingAddress.street2 || shippingAddress.line2 || null,
                city: shippingAddress.city || '',
                state: shippingAddress.state || shippingAddress.county || null,
                zip: shippingAddress.zip || shippingAddress.postalCode || shippingAddress.postcode || null,
                country: shippingAddress.country,
                phone: shippingAddress.phone || null,
                email: shippingAddress.email || null,
              }),
              totalWeightKg: totalWeightGrams / 1000,
              boxCm: {
                length: parseFloat(parcel.length) || 20,
                width: parseFloat(parcel.width) || 15,
                height: parseFloat(parcel.height) || 10,
              },
              items: items.map((item: { productId: string; quantity: number; price?: number }) => ({
                quantity: item.quantity || 1,
                description: 'Handmade cultural goods',
                declared_currency: 'GBP',
                declared_customs_value: item.price || productMap.get(item.productId)?.price || 1,
                origin_country_alpha2: productMap.get(item.productId)?.originCountry || addressFrom.country,
              })),
            })
            const esMapped: Rate[] = esRates
              .filter((r) => r.courier_service?.id && Number(r.total_charge) > 0)
              .slice(0, 6)
              .map((r) => ({
                rateId: 'easyship:' + r.courier_service.id,
                carrier: r.courier_service.umbrella_name || r.courier_service.name || 'Courier',
                service: r.courier_service.name || 'Standard',
                amount: Number(r.total_charge).toFixed(2),
                currency: (r.currency || 'GBP').toUpperCase(),
                estimatedDays: typeof r.max_delivery_time === 'number' ? r.max_delivery_time : null,
                isDDP: false,
                isFallback: false,
              }))
            if (esMapped.length) {
              mapped = [...mapped, ...esMapped]
                .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
                .slice(0, 8)
            }
          } catch (esErr) {
            console.error('[shipping/rates] Easyship rates failed for seller', sellerId, esErr)
          }
        }

        if (!mapped.length) {
          console.warn(
            '[shipping/rates] Shippo returned zero rates for seller', sellerId,
            'from', addressFrom.country, 'to', addressTo.country,
            'rawRateCount:', (shipment.rates || []).length,
            'messages:', JSON.stringify(shipment.messages || [])
          )
        }

        // Seller's optional shipping buffer (packaging + rate-drift cover,
        // set in Settings -> Shipping, clamped 0-25 at write time and again
        // here). Added to every real quote so the amount the buyer pays is
        // the amount the seller actually receives for shipping -- shipping
        // passes through to the seller commission-free (see payment-intent).
        // Never added to fallback quote-required placeholders.
        const bufferGBP = Math.min(Math.max(Number(p.handlingFeeGBP) || 0, 0), 25)
        if (bufferGBP > 0 && mapped.length) {
          mapped = await Promise.all(mapped.map(async (rate) => {
            const cur = (rate.currency || 'GBP').toUpperCase()
            const fee = cur === 'GBP' ? bufferGBP : await convert(bufferGBP, 'GBP', cur)
            return { ...rate, amount: (parseFloat(rate.amount) + fee).toFixed(2) }
          }))
        }

        // SELLER'S OWN RATE WINS on self-ship lanes (William, 2026-07-29,
        // found live at checkout: Shippo's CN express quote (~GBP 24) was
        // beating The Eastern Wisdom's FREE seller rate because live quotes
        // always outranked the flat tier -- the PDP said FREE while checkout
        // charged GBP 24.31). Rule: on an INTERNATIONAL lane where Velor
        // does NOT auto-purchase the label (origin outside the Shippo
        // GB/DE/CA + Easyship auto-label set -- the seller ships it
        // themselves either way), a seller who set their own flat rate has
        // CHOSEN their shipping, so their price replaces the live quote.
        // Auto-label origins keep live quotes first: there Velor genuinely
        // buys the label at carrier price, and undercutting it would leave
        // the label unfunded.
        const originCode = (addressFrom.country || '').toUpperCase()
        const autoLabelOrigin = ['GB', 'DE', 'CA'].includes(originCode) || easyshipRateOrigins().has(originCode)
        // 2026-07-29 (William): a seller-set flat rate (including FREE 0)
        // now replaces live quotes on EVERY international lane -- auto-label
        // origins included, so label-area sellers get a real free-shipping
        // option too. On auto-label origins Velor still buys the label and
        // its cost is deducted from the seller share at purchase time
        // (lib/orders.ts) -- the seller bakes it into the item price.
        // 2026-07-29 (William: "free shipping available to every single
        // seller on the planet"): the seller-set rate now applies on EVERY
        // lane, domestic included -- not just international. A seller who
        // chose FREE ships free to their neighbours too; the label-cost
        // deduction in lib/orders.ts keeps auto-label lanes funded.
        // 2026-07-29 FINAL (William: 'the seller arranges shipping, thats
        // for everyone'): EVERY seller on EVERY lane self-arranges shipping
        // while Velor is young -- Velor buys no labels and quotes no
        // carrier prices. When Velor does shipping deals later, this flips
        // back per-origin. Live-quote plumbing below is retained dormant.
        const sellerProvidesShipping = true

        result.push({
          sellerId,
          sellerName: seller.storeName,
          originCountry: addressFrom.country,
          rates: await applyAdminFee(
            sellerProvidesShipping
              ? await flatRateOrFallback(p, addressTo.country, totalWeightGrams)
              : mapped.length ? mapped : await flatRateOrFallback(p, addressTo.country, totalWeightGrams),
            itemCount
          ),
        })
      } catch (err) {
        console.error('[shipping/rates] Rate lookup failed for seller', sellerId, err)
        result.push({
          sellerId,
          sellerName: seller.storeName,
          originCountry: seller.shippingProfile?.country ?? null,
          rates: await applyAdminFee(
            await flatRateOrFallback(seller.shippingProfile, shippingAddress.country, totalWeightGrams),
            itemCount
          ),
        })
      }
    }

    return NextResponse.json({ sellerGroups: result })
  } catch (err) {
    console.error('[shipping/rates]', err)
    return NextResponse.json({ error: 'Failed to calculate shipping rates' }, { status: 500 })
  }
}
