import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Buyer-side delivery confirmation (William, 2026-07-21). Tracking webhooks
// are the primary way an order reaches DELIVERED, but they are not
// guaranteed (unsupported carrier, mistyped tracking number, registration
// failure) -- without a backstop the seller would never be paid. This lets
// the buyer confirm receipt themselves; the 30-day auto-confirm cron
// (app/api/cron/confirm-deliveries) is the final backstop. Confirming
// delivery starts the normal escrow hold window -- it does NOT release money
// immediately, and an open return or dispute still freezes the payout.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { orderId } = await params

  try {
    // The order must belong to the signed-in buyer -- matched on
    // customerEmail exactly like GET /api/orders (buyer accounts are keyed
    // by email; see that route).
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerEmail: session.user.email.toLowerCase().trim() },
      select: { id: true, status: true },
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.status === 'DELIVERED') {
      return NextResponse.json({ ok: true, alreadyDelivered: true })
    }
    // Only a shipped/in-transit order can be confirmed received -- an order
    // the seller has not even marked shipped cannot be delivered, and
    // cancelled/refunded orders have nothing to confirm.
    if (order.status !== 'SHIPPED') {
      return NextResponse.json(
        { error: 'This order cannot be confirmed as delivered yet -- it has not been marked as shipped.' },
        { status: 400 }
      )
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'DELIVERED', deliveredAt: new Date(), deliveryConfirmedBy: 'BUYER' },
    })
    await prisma.shipment.updateMany({
      where: { orderId: order.id },
      data: { status: 'DELIVERED' },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[orders/confirm-delivery]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
