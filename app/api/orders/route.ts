import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { createOrder, getOrderDetail, findCommonLogistic, countryNameFromCode } from '@/lib/cj'
import { sendEmail } from '@/lib/email'

// Places and pays (via CJ account balance) a CJ order for every item in a
// velor-marketplace order placed against the internal CJ-sourced catalogue.
// Runs after the Order + OrderItems are already committed, so a CJ failure
// here can never lose or corrupt the buyer's paid order -- it only affects
// whether fulfillment was automated vs. needs manual placement. Never
// throws: any failure is caught, logged, and alerted to
// customerservice@velorcommerce.co.uk per the standing alert-routing rule,
// so a failure is always visible and never silently drops an order.
async function fulfillViaCjIfInternal(orderId: string, sellerId: string, rawAddress: unknown) {
  const seller = await prisma.seller.findUnique({ where: { id: sellerId }, select: { isInternal: true } })
  if (!seller?.isInternal) return

  try {
    const address = (typeof rawAddress === 'string' ? JSON.parse(rawAddress) : rawAddress) as {
      name?: string
      line1?: string
      city?: string
      state?: string
      postcode?: string
      country?: string
    }
    if (!address?.country || !address?.state || !address?.city || !address?.line1) {
      throw new Error(`Shipping address missing required fields for CJ order (have: ${JSON.stringify(address)})`)
    }

    const orderWithItems = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!orderWithItems) throw new Error('Order vanished before CJ fulfillment could run')

    const productIds = orderWithItems.items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, cjVid: true, cjSourced: true, title: true },
    })
    const productById = new Map(products.map((p) => [p.id, p]))

    const cjItems: { vid: string; quantity: number }[] = []
    for (const item of orderWithItems.items) {
      const product = productById.get(item.productId)
      if (!product?.cjSourced || !product.cjVid) {
        throw new Error(
          `Order ${orderId} is on the internal CJ seller but item ${item.productId} (${product?.title ?? 'unknown'}) has no cjVid -- cannot place CJ order, needs manual review`
        )
      }
      cjItems.push({ vid: product.cjVid, quantity: item.quantity })
    }

    const logisticName = await findCommonLogistic(cjItems, address.country)
    if (!logisticName) {
      throw new Error(`No shared CJ logistics option found for order ${orderId} to ${address.country} -- cannot place automatically`)
    }

    const result = await createOrder({
      orderNumber: orderId,
      shippingAddress: {
        customerName: address.name || orderWithItems.customerName || orderWithItems.customerEmail,
        phone: '',
        email: orderWithItems.customerEmail,
        country: countryNameFromCode(address.country),
        countryCode: address.country,
        province: address.state,
        city: address.city,
        address: address.line1,
        zip: address.postcode,
      },
      logisticName,
      products: cjItems,
    })

    // Best-effort single lookup for the real CJ order id/code -- createOrderV2
    // itself doesn't return them. Not fatal if this doesn't resolve yet; the
    // Shipment record still gets CJ's own orderId so it can be looked up
    // manually or backfilled later.
    let cjOrderId: string | undefined
    let cjOrderCode: string | undefined
    try {
      const detail = await getOrderDetail(result.orderId)
      cjOrderId = detail?.cjOrderId
      cjOrderCode = detail?.cjOrderCode
    } catch (e) {
      console.error('[fulfillViaCjIfInternal] getOrderDetail lookup failed (non-fatal)', e)
    }

    await prisma.shipment.upsert({
      where: { orderId },
      create: {
        orderId,
        sellerId,
        cjOrderId: cjOrderId || cjOrderCode || result.orderId,
      },
      update: {
        cjOrderId: cjOrderId || cjOrderCode || result.orderId,
      },
    })
  } catch (err) {
    console.error(`[fulfillViaCjIfInternal] CJ fulfillment failed for order ${orderId}`, err)
    try {
      await sendEmail({
        to: 'customerservice@velorcommerce.co.uk',
        subject: `CJ order fulfillment FAILED for order ${orderId} -- manual placement needed`,
        html: `<p>Automated CJ order placement failed for Velor order <strong>${orderId}</strong>.</p><p>Error: ${err instanceof Error ? err.message : String(err)}</p><p>This order is already paid. Please place the matching order on CJ Dropshipping manually.</p>`,
      })
    } catch (emailErr) {
      console.error('[fulfillViaCjIfInternal] alert email also failed', emailErr)
    }
  }
}

// POST - create order after successful Stripe payment
// Body: { sellerId, buyerEmail, buyerName, address, total, productSubtotal, shippingCost, items, paymentIntentId }
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    sellerId,
    buyerEmail,
    buyerName,
    address,
    total,
    productSubtotal,
    shippingCost,
    items,
    paymentIntentId,
  } = body as {
    sellerId?: string
    buyerEmail?: string
    buyerName?: string
    address?: unknown
    total?: number
    productSubtotal?: number
    shippingCost?: number
    paymentIntentId?: string
    items?: Array<{
      productId?: string
      id?: string
      quantity?: number
      price?: number
    }>
  }

  if (!sellerId || !buyerEmail || !buyerName || !address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Idempotency: if order already exists for this PaymentIntent, return it
  if (paymentIntentId) {
    const existing = await prisma.order.findUnique({ where: { stripePaymentId: paymentIntentId } })
    if (existing) {
      return NextResponse.json({ orderId: existing.id }, { status: 200 })
    }
  }

  try {
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          sellerId,
          customerEmail: String(buyerEmail).toLowerCase().trim(),
          customerName: buyerName ?? String(buyerEmail),
          shippingAddress: typeof address === 'string' ? address : JSON.stringify(address),
          subtotal: Number(total),
          status: 'PAID',
          stripePaymentId: paymentIntentId ?? null,
          items: {
            create: items.map((item) => ({
              productId: item.productId ?? item.id ?? '',
              quantity: Number(item.quantity),
              price: Number(item.price),
              commission: Number(item.price) * Number(item.quantity) * 0.15,
            })),
          },
        },
      }),
      // Decrement stock atomically with order creation. The payment-intent
      // route already blocked the charge if quantity exceeded stock, so this
      // should always have enough -- the stock:{gte} guard here is just
      // defense against a race between two near-simultaneous checkouts, so
      // stock can never go negative even in that edge case.
      ...items.map((item) =>
        prisma.product.updateMany({
          where: { id: item.productId ?? item.id ?? '', stock: { gte: Number(item.quantity) || 0 } },
          data: { stock: { decrement: Number(item.quantity) || 0 } },
        })
      ),
    ])

    // Fire this before responding (not fire-and-forget) so a CJ failure is
    // guaranteed to be caught and alerted within this request, never lost to
    // a serverless function terminating early after the response is sent.
    await fulfillViaCjIfInternal(order.id, sellerId, address)

    return NextResponse.json({ orderId: order.id }, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// GET /api/orders?email=... - list buyer orders (requires auth)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 })

  const orders = await prisma.order.findMany({
    where: { customerEmail: email.toLowerCase().trim() },
    include: { items: true, shipment: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ orders })
}
