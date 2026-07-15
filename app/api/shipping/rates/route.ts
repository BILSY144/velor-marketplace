import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createShippoShipment, buildParcelFromItems, sortRatesGlobal,
  ShippoAddress, ShippoCustomsItem,
} from '@/lib/shippo'
import { convert } from '@/lib/fx'

export const dynamic = 'force-dynamic'

// No DEFAULT_ORIGIN. Every seller must have a ShippingProfile with their real dispatch address.
// A seller without a shipping profile is skipped with a warning -- we never invent an origin.
//

type Rate = {
  rateId: string
  carrier: string
  service: string
  amount: string
  currency: string
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

      // When Shippo is not yet configured globally, every seller gets the
      // same generic placeholder. Never show fake carrier names.
      if (!process.env.SHIPPO_API_KEY) {
        result.push({
          sellerId,
          sellerName: seller.storeName,
          originCountry: seller.shippingProfile?.country ?? null,
          rates: [{ ...FALLBACK_QUOTE_RATE, rateId: 'pending-standard', carrier: 'Standard Shipping', service: 'Tracked Delivery', estimatedDays: 14 }],
        })
        continue
      }

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
            net_weight: String((pr?.weightGrams || 200) / 1000),
            mass_unit: 'kg',
            value_amount: String(item.price || pr?.price || 0),
            value_currency: 'GBP',
            origin_country: pr?.originCountry || addressFrom.country,
          }
        })

        const declaredValue = items.reduce(
          (sum: number, item: { price?: number; quantity: number }) =>
            sum + (item.price || 0) * (item.quantity || 1),
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

        result.push({
          sellerId,
          sellerName: seller.storeName,
          originCountry: addressFrom.country,
          rates: mapped.length ? mapped : [FALLBACK_QUOTE_RATE],
        })
      } catch (err) {
        console.error('[shipping/rates] Rate lookup failed for seller', sellerId, err)
        result.push({
          sellerId,
          sellerName: seller.storeName,
          originCountry: seller.shippingProfile?.country ?? null,
          rates: [FALLBACK_QUOTE_RATE],
        })
      }
    }

    return NextResponse.json({ sellerGroups: result })
  } catch (err) {
    console.error('[shipping/rates]', err)
    return NextResponse.json({ error: 'Failed to calculate shipping rates' }, { status: 500 })
  }
}
