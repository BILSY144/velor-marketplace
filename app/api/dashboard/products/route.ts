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
        },
      },
    },
  })

  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  const productIds = seller.products.map((p) => p.id)

  // Count order items per product (OrderItem has no relation back to Product — use groupBy)
  const salesCounts = productIds.length > 0
    ? await prisma.orderItem.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _count: { productId: true },
      })
    : []

  const salesMap = new Map(salesCounts.map((s) => [s.productId, s._count.productId]))

  const products = seller.products.map((p) => ({ ...p, sales: salesMap.get(p.id) ?? 0 }))
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  const body = await req.json()
  const { name, description, price, stock, category, images } = body

  if (!name || !price || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description ?? '',
      price: parseFloat(price),
      stock: parseInt(stock) ?? 0,
      category,
      images: images ?? [],
      sellerId: seller.id,
      isApproved: false,
      isActive: false,
    },
  })

  return NextResponse.json({ product }, { status: 201 })
}
