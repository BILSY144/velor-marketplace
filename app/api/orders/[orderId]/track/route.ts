import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'email query param required' }, { status: 400 })
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerEmail: email },
      include: {
        shipments: {
          orderBy: { createdAt: 'asc' },
          include: {
            events: { orderBy: { occurredAt: 'asc' } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      carrier: order.carrier,
      shippingService: order.shippingService,
      shipments: order.shipments.map(s => ({
        id: s.id,
        status: s.status,
        carrier: s.carrier,
        service: s.service,
        trackingNumber: s.trackingNumber,
        trackingUrl: s.trackingUrl,
        labelUrl: s.labelUrl,
        events: s.events.map(e => ({
          id: e.id,
          status: e.status,
          description: e.description,
          location: e.location,
          occurredAt: e.occurredAt,
        })),
      })),
    })
  } catch (err) {
    console.error('[orders/track]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
