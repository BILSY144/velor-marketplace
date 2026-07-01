import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sellers = await prisma.seller.findMany({
      where: {
        isApproved: true,
        products: { some: { isApproved: true } },
      },
      select: {
        id: true,
        storeName: true,
        user: { select: { image: true } },
        products: {
          where: { isApproved: true },
          select: {
            id: true,
            reviews: { select: { rating: true } },
          },
        },
      },
      take: 12,
    })
    const enriched = sellers
      .map((s) => {
        const allReviews = s.products.flatMap((p) => p.reviews)
        const avgRating =
          allReviews.length > 0
            ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length
            : null
        return {
          id: s.id,
          name: s.storeName,
          image: s.user.image,
          productCount: s.products.length,
          avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          reviewCount: allReviews.length,
        }
      })
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 6)
    return NextResponse.json({ sellers: enriched })
  } catch {
    return NextResponse.json({ sellers: [] })
  }
}
