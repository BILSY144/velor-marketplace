import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: {
      products: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          status: true,
          category: true,
          images: true,
          createdAt: true,
          _count: { select: { orderItems: true } },
        },
      },
    },
  })

  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  const products = seller.products.map((p) => ({ ...p, sales: p._count.orderItems }))
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })
  if (seller.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Seller account pending approval' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, description, price, stock, category, images, tags } = body as {
    name?: string
    description?: string
    price?: number
    stock?: number
    category?: string
    images?: string[]
    tags?: string[]
  }

  if (!name || !category || price == null) {
    return NextResponse.json({ error: 'name, category, and price are required' }, { status: 400 })
  }

  const parsedPrice = parseFloat(String(price))
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      name: String(name).trim(),
      description: String(description || '').trim(),
      price: parsedPrice,
      stock: Math.max(0, parseInt(String(stock || 0))),
      category: String(category).trim(),
      images: Array.isArray(images)
        ? images.filter((u: unknown) => typeof u === 'string' && u.startsWith('http'))
        : [],
      tags: Array.isArray(tags)
        ? tags.filter((t: unknown) => typeof t === 'string')
        : [],
      status: 'PENDING_REVIEW',
    },
  })

  return NextResponse.json({ product }, { status: 201 })
}
