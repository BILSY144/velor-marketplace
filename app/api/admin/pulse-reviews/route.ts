import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Admin product/buyer review lookup -- backs the mobile /pulse/reviews page.
// Pulse previously had no page for reading what buyers actually say about
// products (star ratings, comments); this is the read side of that. Auth
// accepts either a NextAuth ADMIN session or the Pulse Bearer ADMIN_SECRET
// token, same convention as every other /api/admin/pulse-* route.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const minRatingRaw = searchParams.get('minRating')
  const minRating = minRatingRaw ? parseInt(minRatingRaw, 10) : null
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25))

  const where: Prisma.ReviewWhereInput = {}
  if (minRating && Number.isFinite(minRating)) {
    where.rating = { gte: minRating }
  }
  if (q) {
    where.OR = [
      { comment: { contains: q, mode: 'insensitive' } },
      { product: { title: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [reviews, total, distributionCounts, aggregate, totalReviews, last7d, last30d] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        product: { select: { title: true, images: true, category: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.count({ where }),
    Promise.all([1, 2, 3, 4, 5].map((rating) => prisma.review.count({ where: { rating } }))),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.review.count(),
    prisma.review.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.review.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ])

  const distribution = [1, 2, 3, 4, 5].map((rating, i) => ({ rating, count: distributionCounts[i] }))

  return NextResponse.json({
    reviews,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    distribution,
    averageRating: aggregate._avg.rating,
    totalReviews,
    last7d,
    last30d,
  })
}
