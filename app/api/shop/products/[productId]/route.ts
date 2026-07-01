import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params

  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'APPROVED' },
    include: {
      seller: {
        select: {
          id: true,
          storeName: true,
          description: true,
          country: true,
          createdAt: true,
          _count: { select: { products: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { name: true, image: true } },
        },
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0

  return NextResponse.json({
    ...product,
    avgRating: Math.round(avgRating * 10) / 10,
  })
}
