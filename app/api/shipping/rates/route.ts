import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createShippoShipment, buildParcelFromItems, sortRatesGlobal,
  ShippoAddress, ShippoCustomsItem,
} from '@/lib/shippo'
import { checkFreight } from '@/lib/cj'

export const dynamic = 'force-dynamic'

// No DEFAULT_ORIGIN. Every seller must have a ShippingProfile with their real dispatch address.
// A seller without a shipping profile is skipped with a warning -- we never invent an origin.
//
// CJ-sourced items are a separate case: CJ dropships directly from China (or
// their nearest warehouse) to the buyer, so there is no Velor/seller
// ShippingProfile involved at all. Real cost and delivery time for those
// items come from CJ's own freightCalculate API (checkFreight in lib/cj.ts),
// keyed by the buyer's real destination country and the specific variant
// (vid) they picked -- never hardcoded.

export async function POST(request: NextRequest) {
  try {
    const { cartItems, shippingAddress } = await request.json()

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'cartItems required' }, { status: 400 })
    }
    if (!shippingAddress?.country) {
      return NextResponse.json({ error: 'shippingAddress.country required' }, { status: 400 })
    }

    // When Shippo is not yet configured, return a generic placeholder.
    // Never show fake carrier names.
    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({
        rates: [
          {
            rateId: 'pending-standard',
            carrier: 'Standard Shipping',
            service: 'Tracked Delivery',
            amount: '0.00',
            currency: 'GBP',
            estimatedDays: 14,
            isDDP: false,
            isFallback: true,
          },
        ],
      })
    }

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
    // Group cart items by seller (cart items carry sellerId, never
    // sellerStripeAccountId -- grouping on the field that's never actually
    // populated silently dropped every seller's items into one bucket).
    const sellerGroups = new Map<string, typeof cartItems>()
    for (const item of cartItems) {
      const key = item.sellerId || '__unknown__'
      if (!sellerGroups.has(key)) sellerGroups.set(key, [])
      sellerGroups.get(key)!.push(item)
    }

    let combinedRates: Array<{
      rateId: string
      carrier: string
      service: string
      amount: string
      currency: string
      estimatedDays: number | null
      isDDP: boolean
      isFallback: boolean
    }> | null = null

    // Parses CJ's 'logisticAging' string (e.g. '7-12 days', '10 days') into
    // a single worst-case day count. Never guess a number if CJ gave us a
    // real range -- take the upper bound so we never under-promise.
    function parseAgingDays(aging: string | undefined): number {
      if (!aging) return 15
      const nums = aging.match(/\d+/g)
      if (!nums || nums.length === 0) return 15
      return Math.max(...nums.map(Number))
    }

    for (const [sellerId, items] of sellerGroups) {
      try {
        if (sellerId === '__unknown__') {
          console.warn('[shipping/rates] Cart item missing sellerId -- skipping')
          continue
        }

        const seller = await prisma.seller.findUnique({
          where: { id: sellerId },
          include: { shippingProfile: true },
        })
        if (!seller) {
          console.warn('[shipping/rates] No seller found for id:', sellerId)
          continue
        }

        const itemProductIds = items.map((i: { productId: string }) => i.productId).filter(Boolean)
        const cjProducts = itemProductIds.length
          ? await prisma.product.findMany({
              where: { id: { in: itemProductIds } },
              select: {
                id: true, cjSourced: true, cjVid: true,
                weightGrams: true, lengthCm: true, widthCm: true,
                heightCm: true, price: true, originCountry: true,
              },
            })
          : []
        const productMap = new Map(cjProducts.map((pr) => [pr.id, pr]))
        const allCjSourced = cjProducts.length > 0 && cjProducts.every((pr) => pr.cjSourced)

        // -------------------------------------------------------------
        // CJ-sourced items: real per-destination freight from CJ's own
        // freightCalculate API. Cost and delivery time genuinely differ
        // by destination country and by which variant (vid) was chosen --
        // never a flat 'free' or a flat day count.
        // -------------------------------------------------------------
        if (allCjSourced) {
          const lines: Array<{ amount: number; days: number; carrier: string }> = []
          const missingFor: string[] = []

          for (const item of items as Array<{ productId: string; quantity?: number; vid?: string }>) {
            const pr = productMap.get(item.productId)
            const vid = item.vid || pr?.cjVid
            if (!vid) { missingFor.push(item.productId); continue }
            try {
              const options = await checkFreight(vid, item.quantity || 1, shippingAddress.country, 'CN')
              if (!options || options.length === 0) { missingFor.push(item.productId); continue }
              // CJ returns several logistics channels per variant -- take
              // the cheapest real option, not just the first in the array.
              const cheapest = [...options].sort((a, b) => a.logisticPrice - b.logisticPrice)[0]
              lines.push({
                amount: cheapest.logisticPrice,
                days: parseAgingDays(cheapest.logisticAging),
                carrier: cheapest.logisticName || 'CJ Logistics',
              })
            } catch (freightErr) {
              console.warn('[shipping/rates] checkFreight failed for vid', vid, freightErr)
              missingFor.push(item.productId)
            }
          }

          if (lines.length > 0 && missingFor.length === 0) {
            const totalAmount = lines.reduce((s, l) => s + l.amount, 0)
            const maxDays = Math.max(...lines.map((l) => l.days))
            const carrierNames = Array.from(new Set(lines.map((l) => l.carrier)))
            const cjRate = {
              rateId: 'cj-real-' + sellerId,
              carrier: carrierNames.length === 1 ? carrierNames[0] : 'CJ Dropshipping',
              service: 'International Delivery',
              amount: totalAmount.toFixed(2),
              currency: 'USD',
              estimatedDays: maxDays,
              isDDP: true,
              isFallback: false,
            }
            combinedRates = combinedRates ? [...combinedRates, cjRate] : [cjRate]
          } else {
            // CJ's freight API didn't have a rate for this destination/
            // variant combination. Be honest about it rather than
            // guessing -- this should be rare once real vids are wired
            // through, but destinations CJ genuinely doesn't serve exist.
            console.warn('[shipping/rates] No CJ freight rate available for seller', sellerId, 'to', shippingAddress.country, 'missing:', missingFor)
          }
          continue
        }
        // -------------------------------------------------------------
        // Non-CJ sellers: real Shippo rate from their registered dispatch
        // address. Unchanged from before, other than the sellerId-based
        // lookup above.
        // -------------------------------------------------------------
        if (!seller.shippingProfile) {
          console.warn('[shipping/rates] Seller has no ShippingProfile, cannot calculate rates:', sellerId)
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

        const customsItems: ShippoCustomsItem[] = items.map((item: {
          productId: string; quantity: number; name?: string; price?: number
        }) => {
          const pr = productMap.get(item.productId)
          return {
            description: item.name || 'Product',
            quantity: item.quantity || 1,
            netWeight: String((pr?.weightGrams || 200) / 1000),
            massUnit: 'kg',
            valueAmount: String(item.price || pr?.price || 0),
            valueCurrency: 'GBP',
            originCountry: pr?.originCountry || addressFrom.country,
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
        const mapped = sorted.slice(0, 6).map(r => ({
          rateId: r.object_id,
          carrier: r.provider || 'Carrier',
          service: r.servicelevel?.name || 'Standard',
          amount: r.amount,
          currency: r.currency,
          estimatedDays: r.estimated_days,
          isDDP: isInternational,
          isFallback: false,
        }))

        if (!combinedRates) {
          combinedRates = mapped
        } else {
          combinedRates = [...combinedRates, ...mapped]
        }
      } catch (err) {
        console.error('[shipping/rates] Rate lookup failed for seller', sellerId, err)
      }
    }

    if (!combinedRates || combinedRates.length === 0) {
      // No rates could be calculated for this route -- show a single contact-us option
      combinedRates = [
        {
          rateId: 'quote-required',
          carrier: 'Custom Quote',
          service: 'Contact seller for shipping quote',
          amount: '0.00',
          currency: 'GBP',
          estimatedDays: null,
          isDDP: false,
          isFallback: true,
        },
      ]
    }

    return NextResponse.json({ rates: combinedRates })
  } catch (err) {
    console.error('[shipping/rates]', err)
    return NextResponse.json({ error: 'Failed to calculate shipping rates' }, { status: 500 })
  }
}
