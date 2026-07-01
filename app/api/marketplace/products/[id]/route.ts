import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { id, status: 'APPROVED' },
    include: {
      seller: {
        select: {
          id: true,
          storeName: true,
          description: true,
          country: true,
          createdAt: true,
          isApproved: true,
          _count: { select: { products: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { name: true, image: true } },
        },
      },
      _count: { select: { reviews: true, wishlistItems: true } },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0

  await prisma.product.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })

  return NextResponse.json({ ...product, avgRating: Math.round(avgRating * 10) / 10 })
}
