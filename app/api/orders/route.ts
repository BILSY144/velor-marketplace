import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST — create order after successful Stripe payment
// Body: { paymentIntentId, buyerEmail, buyerName, total, shippingAddress, items }
// Idempotent: returns existing order if stripePaymentId already exists
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { paymentIntentId, buyerEmail, buyerName, total, shippingAddress, items } = body

  if (!paymentIntentId || !buyerEmail || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Idempotent check — return existing record without error
  const existing = await prisma.order.findFirst({ where: { stripePaymentId: paymentIntentId } })
  if (existing) return NextResponse.json({ orderId: existing.id })

  try {
    const order = await prisma.order.create({
      data: {
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerName: buyerName ?? buyerEmail,
        stripePaymentId: paymentIntentId,
        total,
        status: 'PENDING',
        shippingAddress: shippingAddress ?? {},
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        },
      },
    })
    return NextResponse.json({ orderId: order.id }, { status: 201 })
  } catch (err: any) {
    // Race condition: unique constraint on stripePaymentId
    if (err?.code === 'P2002') {
      const existing2 = await prisma.order.findFirst({ where: { stripePaymentId: paymentIntentId } })
      if (existing2) return NextResponse.json({ orderId: existing2.id })
    }
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// GET /api/orders?email=... — list buyer orders
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 })

  const orders = await prisma.order.findMany({
    where: { buyerEmail: email.toLowerCase().trim() },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, category: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}
