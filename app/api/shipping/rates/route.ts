import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createShippoShipment, buildParcelFromItems, sortRatesByDDP,
  ShippoAddress, ShippoCustomsItem,
} from '@/lib/shippo'

export const dynamic = 'force-dynamic'

const DEFAULT_ORIGIN: ShippoAddress = {
  name: 'Velor Marketplace Seller',
  street1: '1 Oxford Street',
  city: 'London',
  zip: 'W1D 1BS',
  country: 'GB',
  phone: '+44 20 7000 0000',
  email: 'noreply@velorcommerce.store',
}

export async function POST(request: NextRequest) {
  try {
    const { cartItems, shippingAddress } = await request.json()

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'cartItems required' }, { status: 400 })
    }
    if (!shippingAddress?.country) {
      return NextResponse.json({ error: 'shippingAddress.country required' }, { status: 400 })
    }

    const isInternational = shippingAddress.country !== 'GB'

    // Fallback when Shippo not configured
    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({
        rates: [
          {
            rateId: 'fallback-standard',
            carrier: isInternational ? 'International Standard' : 'Royal Mail',
            service: isInternational ? 'Standard International' : 'Standard Delivery',
            amount: isInternational ? '7.99' : '0.00',
            currency: 'GBP',
            estimatedDays: isInternational ? 10 : 3,
            isDDP: false,
            isFallback: true,
          },
          {
            rateId: 'fallback-express',
            carrier: isInternational ? 'DHL Express' : 'Royal Mail',
            service: isInternational ? 'Express Worldwide DDP' : 'Express Delivery',
            amount: isInternational ? '18.99' : '4.99',
            currency: 'GBP',
            estimatedDays: isInternational ? 3 : 1,
            isDDP: isInternational,
            isFallback: true,
          },
        ],
      })
    }

    const addressTo: ShippoAddress = {
      name: shippingAddress.name ?? 'Buyer',
      street1: shippingAddress.address ?? shippingAddress.street1 ?? '1 Main St',
      city: shippingAddress.city ?? '',
      state: shippingAddress.state,
      zip: shippingAddress.postcode ?? shippingAddress.zip ?? '',
      country: shippingAddress.country,
      phone: shippingAddress.phone,
      email: shippingAddress.email,
    }

    // Group items by seller stripe account ID
    const sellerGroups = new Map<string, typeof cartItems>()
    for (const item of cartItems) {
      const key = item.sellerId ?? '__default__'
      if (!sellerGroups.has(key)) sellerGroups.set(key, [])
      sellerGroups.get(key)!.push(item)
    }

    // For multi-seller, get rates from each seller and sum shipping costs
    let combinedRates: Array<{
      rateId: string; carrier: string; service: string;
      amount: string; currency: string; estimatedDays: number | null;
      isDDP: boolean; isFallback: boolean;
    }> | null = null

    for (const [stripeAccountId, items] of sellerGroups) {
      let addressFrom = DEFAULT_ORIGIN

      if (stripeAccountId !== '__default__') {
        const seller = await prisma.seller.findFirst({
          where: { stripeAccountId },
          include: { shippingProfile: true },
        })
        if (seller?.shippingProfile) {
          const p = seller.shippingProfile
          addressFrom = {
            name: p.name,
            company: p.company ?? undefined,
            street1: p.street1,
            street2: p.street2 ?? undefined,
            city: p.city,
            state: p.state ?? undefined,
            zip: p.zip,
            country: p.country,
            phone: p.phone ?? undefined,
            email: p.email ?? undefined,
          }
        }
      }

      const productIds = items.map((i: { id: string }) => i.id)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true, name: true, price: true,
          weightGrams: true, lengthCm: true, widthCm: true, heightCm: true,
          hsCode: true, originCountry: true,
        },
      })
      const pmap = new Map(products.map(p => [p.id, p]))

      const parcelItems = items.map((item: { id: string; quantity: number }) => {
        const p = pmap.get(item.id)
        return {
          weightGrams: p?.weightGrams, lengthCm: p?.lengthCm,
          widthCm: p?.widthCm, heightCm: p?.heightCm,
          quantity: item.quantity,
        }
      })

      const customsItems: ShippoCustomsItem[] = items.map((item: {
        id: string; name: string; price: number; quantity: number
      }) => {
        const p = pmap.get(item.id)
        return {
          description: p?.name ?? item.name ?? 'Merchandise',
          quantity: item.quantity,
          net_weight: String(Math.max(0.05, (p?.weightGrams ?? 500) * item.quantity / 1000)),
          mass_unit: 'kg' as const,
          value_amount: (item.price * item.quantity).toFixed(2),
          value_currency: 'GBP',
          tariff_number: p?.hsCode ?? undefined,
          origin_country: p?.originCountry ?? addressFrom.country,
        }
      })

      const parcel = buildParcelFromItems(parcelItems)
      const declaredValue = items.reduce(
        (s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0
      )

      try {
        const shipment = await createShippoShipment({
          addressFrom, addressTo, parcels: [parcel],
          customsItems, declaredValue, currency: 'GBP', isInternational,
        })

        const sorted = sortRatesByDDP(shipment.rates ?? [])
        const mapped = sorted.slice(0, 5).map(r => ({
          rateId: r.object_id,
          carrier: r.provider ?? 'Carrier',
          service: r.servicelevel?.name ?? 'Standard',
          amount: r.amount,
          currency: r.currency,
          estimatedDays: r.estimated_days,
          isDDP: isInternational,
          isFallback: false,
        }))

        if (!combinedRates) {
          combinedRates = mapped
        } else {
          // Sum shipping costs for multi-seller
          const addAmount = parseFloat(mapped[0]?.amount ?? '0')
          combinedRates = combinedRates.map(r => ({
            ...r,
            amount: (parseFloat(r.amount) + addAmount).toFixed(2),
          }))
        }
      } catch (err) {
        console.error('[shipping/rates] Shippo error for seller', stripeAccountId, err)
      }
    }

    if (!combinedRates || combinedRates.length === 0) {
      // Last resort fallback
      combinedRates = [
        {
          rateId: 'fallback-express',
          carrier: 'DHL Express',
          service: 'Express Worldwide DDP',
          amount: isInternational ? '18.99' : '4.99',
          currency: 'GBP',
          estimatedDays: isInternational ? 3 : 1,
          isDDP: isInternational,
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
