import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const sellerId = searchParams.get('sellerId')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const sort = searchParams.get('sort') ?? 'newest'
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')

  const where: Record<string, unknown> = { status: 'APPROVED' }
  if (category) where.category = category
  if (sellerId) where.sellerId = sellerId
  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice)
    if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice)
  }

  let orderBy: Record<string, string> = { createdAt: 'desc' }
  if (sort === 'price_asc') orderBy = { price: 'asc' }
  else if (sort === 'price_desc') orderBy = { price: 'desc' }
  else if (sort === 'popular') orderBy = { viewCount: 'desc' }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        seller: { select: { id: true, storeName: true, country: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true, wishlistItems: true } },
      },
    }),
  ])

  return NextResponse.json({
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
