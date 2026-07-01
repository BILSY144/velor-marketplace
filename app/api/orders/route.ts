import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - create order after successful Stripe payment
// Body: { sellerId, buyerEmail, buyerName, address, total, items }
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sellerId, buyerEmail, buyerName, address, total, items } = body as {
    sellerId?: string
    buyerEmail?: string
    buyerName?: string
    address?: unknown
    total?: number
    items?: Array<{
      productId?: string
      id?: string
      name?: string
      quantity?: number
      price?: number
      image?: string
    }>
  }

  if (!sellerId || !buyerEmail || !buyerName || !address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const order = await prisma.order.create({
      data: {
        sellerId,
        buyerEmail: String(buyerEmail).toLowerCase().trim(),
        buyerName: buyerName ?? String(buyerEmail),
        shippingAddress: typeof address === 'string' ? address : JSON.stringify(address),
        total: Number(total),
        status: 'pending',
        items: {
          create: items.map((item) => ({
            productId: item.productId ?? item.id ?? '',
            name: item.name ?? String(item.productId ?? item.id ?? ''),
            quantity: Number(item.quantity),
            price: Number(item.price),
            image: item.image ?? null,
          })),
        },
      },
    })
    return NextResponse.json({ orderId: order.id }, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// GET /api/orders?email=... - list buyer orders
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 })

  const orders = await prisma.order.findMany({
    where: { buyerEmail: email.toLowerCase().trim() },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}
