import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '24')), 48)

  const where: Record<string, unknown> = { status: 'APPROVED' }
  if (category) where.category = category
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        seller: { select: { businessName: true, id: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  const enriched = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    images: p.images,
    category: p.category,
    stock: p.stock,
    avgRating: p.avgRating,
    soldCount: p.soldCount,
    sellerName: p.seller.businessName,
    sellerId: p.seller.id,
    reviewCount: p.reviews.length,
    tags: p.tags,
  }))

  return NextResponse.json({
    products: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
