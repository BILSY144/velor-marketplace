import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

export const dynamic = 'force-dynamic'

type ShippoWebhookEvent = {
  event: string
  data: {
    tracking_number?: string
    tracking_status?: {
      status: string
      status_details: string
      location?: { city?: string; state?: string; country?: string }
      status_date: string
    }
  }
}

const SHIPPO_STATUS_MAP: Record<string, string> = {
  PRE_TRANSIT: 'LABEL_PURCHASED',
  TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  RETURNED: 'EXCEPTION',
  FAILURE: 'EXCEPTION',
  UNKNOWN: 'IN_TRANSIT',
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-shippo-signature') ?? ''
  const webhookSecret = process.env.SHIPPO_WEBHOOK_SECRET

  if (webhookSecret) {
    const expected = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')
    if (signature !== expected) {
      console.warn('[shippo webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: ShippoWebhookEvent
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const { event, data } = payload
    if (event !== 'track_updated' || !data.tracking_number) {
      return NextResponse.json({ received: true })
    }

    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber: data.tracking_number },
    })

    if (!shipment) {
      return NextResponse.json({ received: true })
    }

    const ts = data.tracking_status
    if (!ts) return NextResponse.json({ received: true })

    const newStatus = SHIPPO_STATUS_MAP[ts.status] ?? 'IN_TRANSIT'
    const locationParts = [ts.location?.city, ts.location?.state, ts.location?.country].filter(Boolean)
    const location = locationParts.join(', ') || null

    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: ts.status,
        description: ts.status_details,
        location,
        occurredAt: new Date(ts.status_date),
      },
    })

    if (newStatus !== shipment.status) {
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: newStatus as 'PENDING' | 'LABEL_PURCHASED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' },
      })

      if (newStatus === 'DELIVERED') {
        await prisma.order.update({
          where: { id: shipment.orderId },
          data: { status: 'DELIVERED', deliveredAt: new Date(), deliveryConfirmedBy: 'WEBHOOK' },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[shippo webhook]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
