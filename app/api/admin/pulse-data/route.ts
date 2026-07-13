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
// Seller table's approved:false count) was once always 0 because Seller rows
// were only ever created at approval time (lib/provisionSeller.ts). That is
// no longer true: app/api/admin/sellers/route.ts's PATCH handler sets
// approved:false for BOTH 'reject' and 'suspend' actions on an existing
// Seller row, so this count (and pendingSignups below) can include sellers
// that were previously approved and later suspended/rejected, not just
// brand-new signups. There is no separate field to tell the two apart --
// only createdAt/updatedAt are available. The real *application* pending
// queue is SellerApplication rows with status 'PENDING', reported separately.

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
    const day14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
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
        pendingSellerRows,
        pendingSellerCountryRows,
        pendingApplicationRows,
        applicationCountryRows,
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
        pageViewTimestamps24h,
        ordersLast14d,
        lowStockCount,
        pendingCertificatesCount,
        liveNowCount,
        overdueApplicationsCount,
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
        prisma.seller.findMany({
                where: { approved: false },
                select: {
                          id: true,
                          storeName: true,
                          country: true,
                          tier: true,
                          createdAt: true,
                          updatedAt: true,
                          user: { select: { name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
        }),
        prisma.seller.groupBy({
                by: ['country'],
                _count: { country: true },
                where: { approved: false },
                orderBy: { _count: { country: 'desc' } },
                take: 20,
        }),
        prisma.sellerApplication.findMany({
                select: {
                          id: true,
                          businessName: true,
                          contactName: true,
                          contactEmail: true,
                          website: true,
                          storeDescription: true,
                          productCategories: true,
                          country: true,
                          status: true,
                          verificationStatus: true,
                          rejectionReason: true,
                          reviewedBy: true,
                          verifiedAt: true,
                          verificationNotes: true,
                          createdAt: true,
                          reviewedAt: true,
                          updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
        }),
        prisma.sellerApplication.groupBy({
                by: ['country'],
                _count: { country: true },
                orderBy: { _count: { country: 'desc' } },
                take: 20,
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
        // -- Additions for the Pulse hub redesign (2026-07-13): sparkline
        // series and cross-cutting "attention needed" signals that were
        // previously invisible from the dashboard (low stock, certificate
        // backlog, whether anyone is live right now, overdue applications).
        prisma.pageView.findMany({
                where: { createdAt: { gte: day1 } },
                select: { createdAt: true },
        }),
        prisma.order.findMany({
                where: { createdAt: { gte: day14 }, status: { not: 'CANCELLED' } },
                select: { subtotal: true, currency: true, createdAt: true },
        }),
        prisma.product.count({ where: { stock: { lt: 5 }, status: 'APPROVED' } }),
        prisma.productCertificate.count({ where: { status: 'PENDING' } }),
        prisma.liveStream.count({ where: { status: 'LIVE' } }),
        prisma.sellerApplication.count({ where: { status: 'PENDING', createdAt: { lt: day1 } } }),
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

  // Hourly traffic sparkline: 24 buckets, oldest -> newest, bucket[23] is the
  // current (partial) hour. Bucketed in JS from raw timestamps rather than a
  // SQL date_trunc groupBy -- traffic volume pre-launch is low enough that
  // this is simpler and avoids a raw query, and stays correct at any scale
  // since it's just a count per bucket.
  const trafficHourly = new Array(24).fill(0)
  for (const row of pageViewTimestamps24h) {
    const hoursAgo = Math.floor((now.getTime() - row.createdAt.getTime()) / (60 * 60 * 1000))
    const idx = 23 - hoursAgo
    if (idx >= 0 && idx < 24) trafficHourly[idx]++
  }

  // Daily GMV sparkline: 14 buckets, oldest -> newest, bucket[13] is today
  // (UTC, partial). Same live-FX-conversion approach as gmv30dGBP above.
  const gmvDaily = new Array(14).fill(0)
  let gmvDailyFxError = false
  for (const row of ordersLast14d) {
    const daysAgo = Math.floor((midnightUTC.getTime() - Date.UTC(row.createdAt.getUTCFullYear(), row.createdAt.getUTCMonth(), row.createdAt.getUTCDate())) / (24 * 60 * 60 * 1000))
    const idx = 13 - daysAgo
    if (idx < 0 || idx >= 14) continue
    try {
      gmvDaily[idx] += await convert(row.subtotal, row.currency, 'GBP')
    } catch {
      gmvDailyFxError = true
    }
  }
  const gmvDailyRounded = gmvDaily.map((v) => Math.round(v * 100) / 100)

  // "Pulse Score" -- a composite 0-100 operational-health readout for the
  // hub's headline gauge. Deliberately simple and fully transparent: it is
  // the unweighted average of four named sub-scores, each a plain penalty
  // formula off real counts already computed above (no hidden inputs, no
  // machine-scored opacity). All four sub-scores are returned alongside the
  // total so the UI can show exactly what it's made of, not just the number.
  const ordersHealth = Math.max(0, Math.min(100, 100 - openDisputes * 15 - pendingReturns * 5))
  const applicationsHealth = Math.max(0, Math.min(100, 100 - overdueApplicationsCount * 10))
  const supportHealth = Math.max(0, Math.min(100, 100 - priorityOpenSupportTickets * 20 - Math.max(0, openSupportTickets - 5) * 3))
  const catalogueHealth = Math.max(0, Math.min(100, 100 - lowStockCount * 4 - pendingCertificatesCount * 5))
  const pulseScore = Math.round((ordersHealth + applicationsHealth + supportHealth + catalogueHealth) / 4)

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

  const applications = pendingApplicationRows.map((a) => ({
        id: a.id,
        businessName: a.businessName,
        contactName: a.contactName,
        contactEmail: a.contactEmail,
        website: a.website || null,
        storeDescription: a.storeDescription || null,
        productCategories: a.productCategories || [],
        country: a.country || 'Not provided',
        status: a.status,
        verificationStatus: a.verificationStatus,
        rejectionReason: a.rejectionReason || null,
        reviewedBy: a.reviewedBy || null,
        verifiedAt: a.verifiedAt ? a.verifiedAt.toISOString() : null,
        verificationNotes: a.verificationNotes || null,
        createdAt: a.createdAt.toISOString(),
        reviewedAt: a.reviewedAt ? a.reviewedAt.toISOString() : null,
        updatedAt: a.updatedAt.toISOString(),
        daysPending: Math.floor((now.getTime() - a.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
  }))
  const applicationsByCountry = applicationCountryRows.map((row) => ({ country: row.country || 'Not provided', count: row._count.country }))

  const pendingSellerSignups = pendingSellerRows.map((s) => ({
    id: s.id,
    storeName: s.storeName,
    contactName: s.user?.name || 'Not provided',
    contactEmail: s.user?.email || 'Not provided',
    country: s.country || 'Not provided',
    tier: s.tier,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))
  const pendingSellerSignupsByCountry = pendingSellerCountryRows.map((row) => ({ country: row.country || 'Not provided', count: row._count.country }))

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
                                                          pendingSignups: pendingSellerSignups,
                                                          pendingSignupsByCountry: pendingSellerSignupsByCountry,
                          applications: applications,
                                                          applicationsByCountry: applicationsByCountry,
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
        // -- Additions for the Pulse hub redesign (2026-07-13) --
        sparklines: {
                trafficHourly24h: trafficHourly,
                gmvDaily14dGBP: gmvDailyRounded,
                gmvDailyFxNote: gmvDailyFxError
                  ? 'Some orders in this window could not be converted to GBP and are excluded.'
                          : null,
        },
        pulseScore: {
                total: pulseScore,
                breakdown: {
                        orders: Math.round(ordersHealth),
                        applications: Math.round(applicationsHealth),
                        support: Math.round(supportHealth),
                        catalogue: Math.round(catalogueHealth),
                },
        },
        attention: {
                overdueApplications: overdueApplicationsCount,
                openDisputes: openDisputes,
                priorityOpenTickets: priorityOpenSupportTickets,
                pendingReturns: pendingReturns,
                lowStockCount: lowStockCount,
                pendingCertificates: pendingCertificatesCount,
        },
        liveNow: {
                streamsLive: liveNowCount,
        },
  }

  return NextResponse.json(body, { headers: cors() })
}
