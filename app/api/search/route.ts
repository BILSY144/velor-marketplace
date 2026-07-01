import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], sellers: [] })
  }

  const [products, sellers] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        category: true,
        seller: { select: { storeName: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.seller.findMany({
      where: {
        isApproved: true,
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

  return NextResponse.json({ products, sellers })
}
