import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { computeListingDiscount } from '@/lib/discount'

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

  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [
    // Merit-first ranking with a bounded tier boost baked into rankingScore
    // (score + tier bonus, see lib/seller-ranking.ts). Replaces a hard
    // tier-first sort that let any paid seller outrank all free sellers
    // regardless of performance - authorised change by William 2026-07-06.
    { seller: { rankingScore: 'desc' } },
    { createdAt: 'desc' },
  ]
  if (sort === 'price_asc') orderBy = { price: 'asc' }
  else if (sort === 'price_desc') orderBy = { price: 'desc' }
  else if (sort === 'popular') orderBy = { wishlistItems: { _count: 'desc' } }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        seller: { select: { id: true, storeName: true, country: true, currency: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true, wishlistItems: true } },
      },
    }),
  ])

  // Automatic discounts, computed in bulk for every seller on this page —
  // buyers see the exact same discounted price here that checkout charges.
  const sellerIds = Array.from(new Set(products.map((p) => p.seller.id)))
  const codes = sellerIds.length
    ? await prisma.discountCode.findMany({
        where: { sellerId: { in: sellerIds }, isActive: true },
      })
    : []
  const codesBySeller = new Map<string, typeof codes>()
  for (const c of codes) {
    const list = codesBySeller.get(c.sellerId) ?? []
    list.push(c)
    codesBySeller.set(c.sellerId, list)
  }

  const productsWithExtras = products.map((p) => {
    const sellerCodes = codesBySeller.get(p.seller.id) ?? []
    const discount = computeListingDiscount(sellerCodes, p.id, p.price)
    return {
      ...p,
      discountedPrice: discount?.discountedPriceGBP ?? null,
      percentOff: discount?.percentOff ?? null,
    }
  })

  return NextResponse.json({
    products: productsWithExtras,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
