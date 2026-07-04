import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sellers = await prisma.seller.findMany({
    where: {
      approved: true,
      products: { some: { status: 'APPROVED' } },
    },
    include: {
      products: {
        where: { status: 'APPROVED' },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          category: true,
        },
      },
      _count: { select: { products: true } },
    },
    take: 6,
    orderBy: [{ tier: 'desc' }, { sellerScore: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ sellers })
}
