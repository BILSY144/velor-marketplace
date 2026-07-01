import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params

  const product = await prisma.product.findFirst({
    where: { id: productId, isApproved: true },
    include: {
      seller: { select: { storeName: true, id: true } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const avgRating = product.reviews.length > 0
    ? Math.round((product.reviews.reduce((a: number, r: { rating: number }) => a + r.rating, 0) / product.reviews.length) * 10) / 10
    : null

  return NextResponse.json({ ...product, avgRating })
}
