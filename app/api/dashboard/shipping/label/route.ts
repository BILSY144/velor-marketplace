import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createTrack, normalizeCarrierToken } from '@/lib/shippo'

export const dynamic = 'force-dynamic'

// Velor never buys shipping labels and never fronts any shipping cost —
// the platform holds no carrier balance and spends none of its own money.
// (William's decision, 2026-07-06: see docs/PAYOUTS.md.) Sellers ship every
// order themselves, with their own carrier account and their own money, and
// report the tracking details back here. Buyer funds (product + shipping +
// duties) are still charged in full at checkout and held on the platform
// exactly as before — that part is unchanged. Registering the tracking
// number with Shippo's free /tracks/ endpoint (best-effort, non-blocking)
// keeps the existing delivery webhook working automatically, so deliveredAt
// still gets stamped and the normal payout-escrow hold/release timeline
// still applies without any manual step.
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { orderId, carrier, trackingNumber, trackingUrl } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }
    if (!carrier || !String(carrier).trim()) {
      return NextResponse.json({ error: 'Carrier is required' }, { status: 400 })
    }
    if (!trackingNumber || !String(trackingNumber).trim()) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 })
    }

    const seller = await prisma.seller.findFirst({
      where: { user: { email: session.user.email } },
    })
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId: seller.id },
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
    }
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      return NextResponse.json({ error: 'Order already shipped' }, { status: 400 })
    }

    const cleanCarrier = String(carrier).trim()
    const cleanTracking = String(trackingNumber).trim()
    const cleanTrackingUrl = trackingUrl && String(trackingUrl).trim() ? String(trackingUrl).trim() : null

    const dbShipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        sellerId: seller.id,
        trackingNumber: cleanTracking,
        trackingUrl: cleanTrackingUrl,
        carrier: cleanCarrier,
        status: 'LABEL_PURCHASED',
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'SHIPPED' },
    })

    // Best-effort tracking registration — never blocks marking the order
    // shipped. Costs nothing: this is Shippo's free tracking endpoint, not
    // a label purchase.
    if (process.env.SHIPPO_API_KEY) {
      try {
        await createTrack(normalizeCarrierToken(cleanCarrier), cleanTracking)
      } catch (err) {
        console.warn('[dashboard/shipping/label] Shippo tracking registration failed (non-blocking):', err)
      }
    }

    return NextResponse.json({
      shipment: {
        id: dbShipment.id,
        trackingNumber: dbShipment.trackingNumber,
        trackingUrl: dbShipment.trackingUrl,
        carrier: dbShipment.carrier,
      },
    })
  } catch (err) {
    console.error('[dashboard/shipping/label]', err)
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
