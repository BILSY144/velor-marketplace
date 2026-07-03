import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  if (authHeader === `Bearer ${secret}`) return true
  const tokenParam = request.nextUrl.searchParams.get('token')
  if (tokenParam === secret) return true
  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors() })
  }

  const now = new Date()
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  try {
    const [
      prospectsByStatus,
      prospectsByPlatform,
      totalProspects,
      outreach7d,
      outreach30d,
      recentOutreach,
      pageViews7d,
      pageViews30d,
      topPaths,
      totalSellers,
      pendingSellers,
      totalOrders,
    ] = await Promise.all([
      prisma.sellerProspect.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.sellerProspect.groupBy({
        by: ['platform'],
        _count: { platform: true },
        orderBy: { _count: { platform: 'desc' } },
        take: 10,
      }),
      prisma.sellerProspect.count(),
      prisma.outreachLog.count({ where: { sentAt: { gte: day7 } } }),
      prisma.outreachLog.count({ where: { sentAt: { gte: day30 } } }),
      prisma.outreachLog.findMany({
        take: 10,
        orderBy: { sentAt: 'desc' },
        include: {
          prospect: { select: { name: true, platform: true, storeUrl: true, status: true } },
        },
      }),
      prisma.pageView.count({ where: { createdAt: { gte: day7 } } }),
      prisma.pageView.count({ where: { createdAt: { gte: day30 } } }),
      prisma.pageView.groupBy({
        by: ['path'],
        _count: { path: true },
        where: { createdAt: { gte: day30 } },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      }),
      prisma.seller.count(),
      prisma.seller.count({ where: { approved: false } }),
      prisma.order.count(),
    ])

    const rawDailyPV = await prisma.pageView.findMany({
      where: { createdAt: { gte: day7 } },
      select: { createdAt: true },
    })
    const rawDailyOut = await prisma.outreachLog.findMany({
      where: { sentAt: { gte: day7 } },
      select: { sentAt: true },
    })

    const dailyViews: Record<string, number> = {}
    const dailyOutreach: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dailyViews[key] = 0
      dailyOutreach[key] = 0
    }
    for (const v of rawDailyPV) {
      const key = v.createdAt.toISOString().slice(0, 10)
      if (key in dailyViews) dailyViews[key]++
    }
    for (const o of rawDailyOut) {
      const key = o.sentAt.toISOString().slice(0, 10)
      if (key in dailyOutreach) dailyOutreach[key]++
    }

    const statusMap: Record<string, number> = {}
    for (const p of prospectsByStatus) {
      statusMap[p.status] = p._count.status
    }

    return NextResponse.json({
      prospects: {
        total: totalProspects,
        byStatus: statusMap,
        byPlatform: prospectsByPlatform.map(p => ({
          platform: p.platform,
          count: p._count.platform,
        })),
      },
      outreach: {
        last7d: outreach7d,
        last30d: outreach30d,
        recent: recentOutreach,
        dailyLast7d: dailyOutreach,
      },
      traffic: {
        last7d: pageViews7d,
        last30d: pageViews30d,
        topPaths: topPaths.map(p => ({ path: p.path, views: p._count.path })),
        dailyLast7d: dailyViews,
      },
      platform: {
        totalSellers,
        pendingSellers,
        totalOrders,
      },
      generatedAt: now.toISOString(),
    }, { headers: cors() })
  } catch (err) {
    console.error('[dashboard-data]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: cors() })
  }
}
