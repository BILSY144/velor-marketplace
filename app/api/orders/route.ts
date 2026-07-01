import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST — create order after successful Stripe payment
// Body: { sellerId, buyerEmail, buyerName, address, total, items }
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { sellerId, buyerEmail, buyerName, address, total, items } = body

  if (!sellerId || !buyerEmail || !buyerName || !address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const order = await prisma.order.create({
      data: {
        sellerId,
        buyerEmail: String(buyerEmail).toLowerCase().trim(),
        buyerName: buyerName ?? buyerEmail,
        address: typeof address === 'string' ? address : JSON.stringify(address),
        total: Number(total),
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId ?? item.id,
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        },
      },
    })
    return NextResponse.json({ orderId: order.id }, { status: 201 })
  } catch (err: any) {
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
