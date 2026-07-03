import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  createShippoShipment, purchaseLabel, buildParcelFromItems,
  sortRatesGlobal, ShippoAddress, ShippoCustomsItem,
} from '@/lib/shippo'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const seller = await prisma.seller.findFirst({
      where: { user: { email: session.user.email } },
      include: { shippingProfile: true },
    })
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId: seller.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, title: true, price: true,
                weightGrams: true, lengthCm: true, widthCm: true, heightCm: true,
                hsCode: true, originCountry: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      return NextResponse.json({ error: 'Order already shipped' }, { status: 400 })
    }

    if (!seller.shippingProfile) {
      return NextResponse.json(
        { error: 'Shipping profile not set. Go to Dashboard > Settings > Shipping to add your ship-from address.' },
        { status: 400 }
      )
    }

    const p = seller.shippingProfile
    const addressFrom: ShippoAddress = {
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

    const shippingAddress = order.shippingAddress as {
      name?: string; address?: string; city?: string;
      state?: string; postcode?: string; country?: string;
    } | null

    const addressTo: ShippoAddress = {
      name: order.customerName,
      street1: shippingAddress?.address ?? '1 Main Street',
      city: shippingAddress?.city ?? '',
      state: shippingAddress?.state,
      zip: shippingAddress?.postcode ?? '',
      country: shippingAddress?.country ?? 'GB',
    }

    const isInternational = addressTo.country !== addressFrom.country

    const parcelItems = order.items.map(item => ({
      weightGrams: item.product.weightGrams,
      lengthCm: item.product.lengthCm,
      widthCm: item.product.widthCm,
      heightCm: item.product.heightCm,
      quantity: item.quantity,
    }))

    const customsItems: ShippoCustomsItem[] = isInternational
      ? order.items.map(item => ({
          description: item.product.title,
          quantity: item.quantity,
          net_weight: String(Math.max(0.05, (item.product.weightGrams ?? 500) * item.quantity / 1000)),
          mass_unit: 'kg' as const,
          value_amount: (item.price * item.quantity).toFixed(2),
          value_currency: order.currency ?? 'GBP',
          tariff_number: item.product.hsCode ?? undefined,
          origin_country: item.product.originCountry ?? addressFrom.country,
        }))
      : []

    const parcel = buildParcelFromItems(parcelItems)
    const declaredValue = order.items.reduce(
      (s, i) => s + i.price * i.quantity, 0
    )

    const shipment = await createShippoShipment({
      addressFrom, addressTo,
      parcels: [parcel],
      customsItems, declaredValue,
      currency: order.currency ?? 'GBP',
      isInternational,
    })

    if (!shipment.rates || shipment.rates.length === 0) {
      return NextResponse.json(
        { error: 'No shipping rates returned from Shippo. Check addresses and parcel dimensions.' },
        { status: 400 }
      )
    }

    const sorted = sortRatesGlobal(shipment.rates)
    const bestRate = sorted[0]

    const transaction = await purchaseLabel(bestRate.object_id)

    if (transaction.status !== 'SUCCESS') {
      const msgs = transaction.messages?.map(m => m.text).join('; ') ?? 'Unknown error'
      return NextResponse.json({ error: 'Label purchase failed: ' + msgs }, { status: 400 })
    }

    const dbShipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        sellerId: seller.id,
        shippoShipmentId: shipment.object_id,
        shippoRateId: bestRate.object_id,
        shippoLabelId: transaction.object_id,
        trackingNumber: transaction.tracking_number,
        trackingUrl: transaction.tracking_url_provider,
        labelUrl: transaction.label_url,
        carrier: bestRate.provider,
        service: bestRate.servicelevel?.name,
        shippingAmount: parseFloat(bestRate.amount),
        dutiesAmount: order.dutiesCost ?? 0,
        currency: bestRate.currency ?? 'GBP',
        declaredValue,
        status: 'LABEL_PURCHASED',
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'SHIPPED',
        carrier: bestRate.provider,
        shippingService: bestRate.servicelevel?.name,
      },
    })

    return NextResponse.json({
      shipment: {
        id: dbShipment.id,
        trackingNumber: dbShipment.trackingNumber,
        trackingUrl: dbShipment.trackingUrl,
        labelUrl: dbShipment.labelUrl,
        carrier: dbShipment.carrier,
        service: dbShipment.service,
      },
    })
  } catch (err) {
    console.error('[dashboard/shipping/label]', err)
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
