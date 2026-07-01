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
          isApproved: true,
          isActive: true,
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
  if (!seller.isApproved || seller.isSuspended) {
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
    return NextResponse.json({ error: 'Missing required fields: name, price, category' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description || '',
      price: price as number,
      stock: stock || 0,
      category,
      images: images || [],
      tags: tags || [],
      sellerId: seller.id,
    },
  })

  return NextResponse.json({ product }, { status: 201 })
}
