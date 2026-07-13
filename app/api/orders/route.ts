import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

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
              commission: Number(item.price) * Number(item.quantity) * 0.1, // NOTE: flat Starter-equivalent rate, not tier-aware -- see CLAUDE.md 2026-07-13 checkpoint
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
