import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOrder, getOrderDetail, findCommonLogistic, countryNameFromCode } from '@/lib/cj'

// One-off / manual admin utility to retry CJ order placement for an order
// whose automatic fulfillment failed (e.g. because a required field like
// phone was missing at the time it was originally placed). Requires
// ADMIN_SECRET. Does not touch Stripe or re-charge the buyer -- purely
// places the matching order on CJ and records the resulting Shipment.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true
  const tokenParam = request.nextUrl.searchParams.get('token')
  if (tokenParam === secret) return true
  return false
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { orderId, phone } = body as { orderId?: string; phone?: string }
  if (!orderId || !phone) {
    return NextResponse.json({ error: 'orderId and phone are required' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const existingShipment = await prisma.shipment.findUnique({ where: { orderId } })
  if (existingShipment?.cjOrderId) {
    return NextResponse.json({ ok: true, alreadyPlaced: true, cjOrderId: existingShipment.cjOrderId })
  }

  const address =
    typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress as Record<string, string>)

  const productIds = order.items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, cjVid: true, cjSourced: true, title: true },
  })
  const productById = new Map(products.map((p) => [p.id, p]))

  const cjItems: { vid: string; quantity: number }[] = []
  for (const item of order.items) {
    const product = productById.get(item.productId)
    if (!product?.cjSourced || !product.cjVid) {
      return NextResponse.json(
        { error: `Item ${item.productId} (${product?.title ?? 'unknown'}) has no cjVid -- cannot place CJ order` },
        { status: 400 }
      )
    }
    cjItems.push({ vid: product.cjVid, quantity: item.quantity })
  }

  try {
    const logisticName = await findCommonLogistic(cjItems, address.country)
    if (!logisticName) {
      throw new Error(`No shared CJ logistics option found for order ${orderId}`)
    }

    const result = await createOrder({
      orderNumber: order.id,
      shippingAddress: {
        customerName: address.name || order.customerName || order.customerEmail,
        phone,
        email: order.customerEmail,
        country: countryNameFromCode(address.country),
        countryCode: address.country,
        province: address.state,
        city: address.city,
        address: address.line1,
        zip: address.postcode || '',
      },
      logisticName,
      products: cjItems,
    })

    let cjOrderId: string | undefined
    let cjOrderCode: string | undefined
    try {
      const detail = await getOrderDetail(result.orderId)
      if (detail) {
        cjOrderId = detail.cjOrderId
        cjOrderCode = detail.cjOrderCode
      }
    } catch (e) {
      console.error('[cj-retry-order] getOrderDetail lookup failed (non-fatal)', e)
    }

    await prisma.shipment.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, sellerId: order.sellerId, cjOrderId: cjOrderId || cjOrderCode || result.orderId },
      update: { cjOrderId: cjOrderId || cjOrderCode || result.orderId },
    })

    return NextResponse.json({ ok: true, cjOrderId: cjOrderId || cjOrderCode || result.orderId, rawResult: result })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
