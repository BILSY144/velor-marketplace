import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { attemptAutoLabelPurchase } from '@/lib/orders'
import { createTrack, normalizeCarrierToken } from '@/lib/shippo'

// Admin repair endpoint (added 2026-07-28): re-run the Tier A auto-label
// purchase for an order whose original attempt failed. The attempt normally
// runs exactly once, synchronously at order creation, and a silent failure
// there (e.g. the postcode-key bug found on the first live Tier A order)
// leaves the order permanently label-less -- Stripe webhook retries skip
// already-created orders by design. This route makes that state repairable
// without touching the order itself.
//
// Safe to call repeatedly: attemptAutoLabelPurchase upserts the Shipment
// row by orderId, and this route refuses to run when a label has already
// been purchased (so a double call can never buy two labels for one order).
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const orderId = typeof body?.orderId === 'string' ? body.orderId : null
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipment: { select: { status: true, shippoLabelId: true } } },
  })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.shipment?.shippoLabelId) {
    // Label already bought -- never buy a second one. But if the best-effort
    // tracking registration failed at purchase time (e.g. the 'Hermes UK'
    // display-name-vs-token 400 on the first live Tier A order), repair just
    // that piece here so the delivery webhook (and therefore escrow release)
    // works for this shipment.
    const existing = await prisma.shipment.findUnique({
      where: { orderId },
      select: { trackRegistered: true, carrier: true, trackingNumber: true, status: true },
    })
    if (existing && !existing.trackRegistered && existing.trackingNumber) {
      try {
        await createTrack(normalizeCarrierToken(existing.carrier || ''), existing.trackingNumber)
        await prisma.shipment.update({ where: { orderId }, data: { trackRegistered: true } })
        return NextResponse.json({ ok: true, repaired: 'trackRegistered', shipmentStatus: existing.status })
      } catch (trackErr) {
        return NextResponse.json(
          { ok: false, error: 'label exists; tracking registration retry failed: ' + (trackErr instanceof Error ? trackErr.message : 'unknown') },
          { status: 502 }
        )
      }
    }
    return NextResponse.json(
      { error: 'A label has already been purchased for this order', shipmentStatus: order.shipment.status },
      { status: 409 }
    )
  }

  const sellerItems = order.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    priceGBP: item.price,
  }))

  try {
    await attemptAutoLabelPurchase(
      order,
      order.sellerId,
      sellerItems,
      (order.shippingAddress ?? {}) as import('@prisma/client').Prisma.InputJsonValue
    )
  } catch (err) {
    console.error('[retry-label] attempt failed for order', orderId, err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'label attempt threw' }, { status: 502 })
  }

  const shipment = await prisma.shipment.findUnique({
    where: { orderId },
    select: {
      status: true, carrier: true, trackingNumber: true, trackingUrl: true,
      labelUrl: true, shippoLabelId: true, trackRegistered: true,
    },
  })

  // attemptAutoLabelPurchase is a silent no-op for Tier B / unquotable
  // orders -- a null shipment here means it declined to buy, not that it
  // crashed. Report exactly what happened, per LAW #1.
  return NextResponse.json({ ok: !!shipment?.shippoLabelId, shipment })
}
