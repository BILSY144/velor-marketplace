import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'

// Private, token-gated endpoint for William's live mobile pulse dashboard.
// Every figure below is a direct, real-time database read -- no estimates,
// no placeholders, no fabricated numbers. Revenue is converted to GBP via
// lib/fx.ts (live ECB-based rates, cached) since orders are stored in the
// currency the buyer actually paid in.
//
// NOTE (added when applications were added below): "pendingApproval" (the
// Seller table's approved:false count) is structurally always 0 -- Seller
// rows are only ever created at approval time (lib/provisionSeller.ts), never
// before. The real pending queue is SellerApplication rows with status
// 'PENDING'. Both are reported below; do not delete pendingApproval, it is
// still a valid (if permanently zero) sanity check.

function cors() {
    return {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: cors() })
}

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.ADMIN_SECRET
    if (!secret) return false
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.trim() === 'Bearer ' + secret.trim()) return true
    const tokenParam = request.nextUrl.searchParams.get('token')
    if (tokenParam && tokenParam.trim() === secret.trim()) return true
    return false
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors() })
    }

  const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
        viewsLastHour,
        viewsToday,
        views7d,
        views30d,
        countryRows,
        topPaths,
        newUsersToday,
        newUsers7d,
        newUsers30d,
        newSellersToday,
        newSellers7d,
        newSellers30d,
        totalSellers,
        pendingSellers,
        pendingApplicationRows,
        newProductsToday,
        newProducts7d,
        newProducts30d,
        totalApprovedProducts,
        pendingReviewProducts,
        ordersToday,
        orders7d,
      orders30d,
          totalOrders,
          ordersByStatus,
                revenueRows30d,
  ] = await Promise.all([
          prisma.pageView.count({ where: { createdAt: { gte: hourAgo } } }),
      prisma.pageView.count({ where: { createdAt: { gte: midnightUTC } } }),
        prisma.pageView.count({ where: { createdAt: { gte: day7 } } }),
        prisma.pageView.count({ where: { createdAt: { gte: day30 } } }),
        prisma.pageView.groupBy({
                by: ['country'],
                _count: { country: true },
                where: { createdAt: { gte: day30 } },
                orderBy: { _count: { country: 'desc' } },
                take: 15,
        }),
        prisma.pageView.groupBy({
                by: ['path'],
                _count: { path: true },
                where: { createdAt: { gte: day7 } },
                orderBy: { _count: { path: 'desc' } },
                take: 8,
        }),
        prisma.user.count({ where: { createdAt: { gte: midnightUTC } } }),
        prisma.user.count({ where: { createdAt: { gte: day7 } } }),
        prisma.user.count({ where: { createdAt: { gte: day30 } } }),
        prisma.seller.count({ where: { createdAt: { gte: midnightUTC } } }),
        prisma.seller.count({ where: { createdAt: { gte: day7 } } }),
        prisma.seller.count({ where: { createdAt: { gte: day30 } } }),
        prisma.seller.count(),
        prisma.seller.count({ where: { approved: false } }),
        prisma.sellerApplication.findMany({
                where: { status: 'PENDING' },
                select: {
                          id: true,
                          businessName: true,
                          contactName: true,
                          contactEmail: true,
                          country: true,
                          verificationStatus: true,
                          createdAt: true,
                },
                orderBy: { createdAt: 'asc' },
        }),
        prisma.product.count({ where: { createdAt: { gte: midnightUTC } } }),
        prisma.product.count({ where: { createdAt: { gte: day7 } } }),
        prisma.product.count({ where: { createdAt: { gte: day30 } } }),
        prisma.product.count({ where: { status: 'APPROVED' } }),
        prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
        prisma.order.count({ where: { createdAt: { gte: midnightUTC } } }),
        prisma.order.count({ where: { createdAt: { gte: day7 } } }),
        prisma.order.count({ where: { createdAt: { gte: day30 } } }),
        prisma.order.count(),
        prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.order.findMany({
                where: { createdAt: { gte: day30 }, status: { not: 'CANCELLED' } },
                select: { subtotal: true, currency: true },
        }),
      ])

  let gmv30dGBP = 0
    let fxError = false
    for (const row of revenueRows30d) {
          try {
                  gmv30dGBP += await convert(row.subtotal, row.currency, 'GBP')
          } catch {
                  fxError = true
          }
    }

  const pendingApplications = pendingApplicationRows.map((a) => ({
        id: a.id,
        businessName: a.businessName,
        contactName: a.contactName,
        contactEmail: a.contactEmail,
        country: a.country || 'Not provided',
        verificationStatus: a.verificationStatus,
        createdAt: a.createdAt.toISOString(),
        daysPending: Math.floor((now.getTime() - a.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
  }))

  const body = {
        generatedAt: now.toISOString(),
        traffic: {
                lastHour: viewsLastHour,
                today: viewsToday,
                last7d: views7d,
                last30d: views30d,
                topPaths: topPaths.map((row) => ({ path: row.path, views: row._count.path })),
                byCountry: countryRows.map((row) => ({ country: row.country || 'Unknown', views: row._count.country })),
        },
        signups: {
                buyers: { today: newUsersToday, last7d: newUsers7d, last30d: newUsers30d },
                sellers: {
                          today: newSellersToday,
                          last7d: newSellers7d,
                          last30d: newSellers30d,
                          totalSellers: totalSellers,
                                                          pendingApproval: pendingSellers,
                          applications: pendingApplications,
                },
        },
        listings: {
                today: newProductsToday,
                last7d: newProducts7d,
                last30d: newProducts30d,
                totalApproved: totalApprovedProducts,
                pendingReview: pendingReviewProducts,
        },
        orders: {
                today: ordersToday,
                last7d: orders7d,
                last30d: orders30d,
                total: totalOrders,
                byStatus: ordersByStatus.map((row) => ({ status: row.status, count: row._count.status })),
                gmv30dGBP: Math.round(gmv30dGBP * 100) / 100,
                gmvNote: fxError
                  ? 'Some orders could not be converted to GBP and are excluded from this total.'
                          : 'Converted to GBP at live exchange rates; excludes cancelled orders.',
        },
  }

  return NextResponse.json(body, { headers: cors() })
}
