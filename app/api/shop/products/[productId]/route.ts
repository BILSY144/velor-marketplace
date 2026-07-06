import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeListingDiscount } from '@/lib/discount'

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
          currency: true,
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

  // Automatic discount preview — same rules and same numbers checkout will
  // actually charge, so what the buyer sees here is what they pay.
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
