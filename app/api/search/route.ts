import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], sellers: [] })
  }

  const [products, sellers] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        category: true,
        seller: { select: { id: true, storeName: true, currency: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.seller.findMany({
      where: {
        approved: true,
        OR: [
          { storeName: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        storeName: true,
        country: true,
        _count: { select: { products: true } },
      },
      take: 4,
    }),
  ])

  // Flatten to the shape the search page actually renders: each result
  // carries its own seller's real currency so price conversion is never
  // silently assumed to be GBP (that was the bug -- this endpoint used to
  // return { products, sellers } while the page read data.results, so
  // search silently always showed zero results).
  const results = products.map((p) => ({
    id: p.id,
    name: p.title,
    price: p.price,
    currency: p.seller?.currency || 'GBP',
    image: p.images?.[0] || null,
    category: p.category,
    sellerId: p.seller?.id || '',
    sellerName: p.seller?.storeName || '',
  }))

  return NextResponse.json({ results, sellers })
}
