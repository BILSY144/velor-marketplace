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
    const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000)

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
        prospectTotal,
        prospectByStatus,
        prospectQualified,
        prospectUnqualified,
        prospectUnscreened,
        outreachSent7d,
        outreachSent30d,
        sellersByCountryRows,
        sellersByTierRows,
        agentLogRecent,
        agentLogByStatus24h,
        openSupportTickets,
        priorityOpenSupportTickets,
        openDisputes,
        pendingReturns,
        reviewAgg,
        reviews7d,
        pendingPayoutRows,
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
        prisma.sellerProspect.count(),
        prisma.sellerProspect.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.sellerProspect.count({ where: { qualified: true } }),
        prisma.sellerProspect.count({ where: { qualified: false } }),
        prisma.sellerProspect.count({ where: { qualified: null } }),
        prisma.outreachLog.count({ where: { sentAt: { gte: day7 } } }),
        prisma.outreachLog.count({ where: { sentAt: { gte: day30 } } }),
        prisma.seller.groupBy({
                by: ['country'],
                _count: { country: true },
                orderBy: { _count: { country: 'desc' } },
                take: 10,
        }),
        prisma.seller.groupBy({ by: ['tier'], _count: { tier: true } }),
        prisma.agentLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 15,
                select: { agentName: true, action: true, status: true, createdAt: true },
        }),
        prisma.agentLog.groupBy({
                by: ['status'],
                _count: { status: true },
                where: { createdAt: { gte: day1 } },
        }),
        prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        prisma.supportTicket.count({ where: { status: 'OPEN', priority: 'PRIORITY' } }),
        prisma.dispute.count({ where: { status: 'OPEN' } }),
        prisma.returnRequest.count({ where: { status: 'PENDING' } }),
        prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
        prisma.review.count({ where: { createdAt: { gte: day7 } } }),
        prisma.payout.findMany({
                where: { status: 'pending' },
                select: { amount: true, currency: true },
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

  let pendingPayoutsGBP = 0
    let payoutFxError = false
    for (const row of pendingPayoutRows) {
          try {
                  pendingPayoutsGBP += await convert(row.amount, row.currency, 'GBP')
          } catch {
                  payoutFxError = true
          }
    }

  const prospectStatusBreakdown = prospectByStatus.map((row) => ({ status: row.status, count: row._count.status }))
  const sellersByCountry = sellersByCountryRows.map((row) => ({ country: row.country || 'Not provided', count: row._count.country }))
  const sellersByTier = sellersByTierRows.map((row) => ({ tier: row.tier, count: row._count.tier }))
  const agentActivity = agentLogRecent.map((row) => ({
    agentName: row.agentName,
    action: row.action,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }))
  const agentStatusBreakdown24h = agentLogByStatus24h.map((row) => ({ status: row.status, count: row._count.status }))

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
        pipeline: {
                prospectsTotal: prospectTotal,
                byStatus: prospectStatusBreakdown,
                qualified: prospectQualified,
                disqualified: prospectUnqualified,
                unscreened: prospectUnscreened,
                outreachSent7d: outreachSent7d,
                outreachSent30d: outreachSent30d,
        },
        sellerBreakdown: {
                byCountry: sellersByCountry,
                byTier: sellersByTier,
        },
        agents: {
                recent: agentActivity,
                last24hByStatus: agentStatusBreakdown24h,
        },
        support: {
                openTickets: openSupportTickets,
                openPriorityTickets: priorityOpenSupportTickets,
                openDisputes: openDisputes,
                pendingReturns: pendingReturns,
        },
        reviews: {
                averageRating: reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 100) / 100 : null,
                totalReviews: reviewAgg._count,
                last7d: reviews7d,
        },
        payouts: {
                pendingCount: pendingPayoutRows.length,
                pendingGBP: Math.round(pendingPayoutsGBP * 100) / 100,
                fxNote: payoutFxError
                  ? 'Some payouts could not be converted to GBP and are excluded from this total.'
                          : 'Converted to GBP at live exchange rates.',
        },
  }

  return NextResponse.json(body, { headers: cors() })
}
