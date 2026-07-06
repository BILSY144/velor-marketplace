import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeListingDiscount } from '@/lib/discount'

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
          approved: true,
          currency: true,
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

  const now = new Date()
  const codes = await prisma.discountCode.findMany({
    where: { sellerId: product.seller.id, isActive: true },
  })
  const discount = computeListingDiscount(codes, product.id, product.price, now)

  return NextResponse.json({
    ...product,
    avgRating: Math.round(avgRating * 10) / 10,
    discountedPrice: discount?.discountedPriceGBP ?? null,
    percentOff: discount?.percentOff ?? null,
  })
}
