import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Traffic detail for /pulse/traffic -- everything the site's raw pageview
// stream can tell us beyond the single hourly sparkline shown on the Pulse
// hub: rolling totals (last hour / today / 7d / 30d), an hour-by-hour and
// day-by-day trend, and the top pages/countries/referrers driving it. The
// PageView model has no device/UA/session data, only path/referrer/country/
// createdAt, so this route sticks to what's actually recorded rather than
// inventing fields.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const hour1 = new Date(now.getTime() - 60 * 60 * 1000)
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const hours24 = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    lastHour,
    today,
    last7d,
    last30d,
    pageViews24h,
    pageViews30d,
    topPaths,
    countryRows30d,
    referrerRows30d,
  ] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: hour1 } } }),
    prisma.pageView.count({ where: { createdAt: { gte: midnightUTC } } }),
    prisma.pageView.count({ where: { createdAt: { gte: day7 } } }),
    prisma.pageView.count({ where: { createdAt: { gte: day30 } } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: hours24 } }, select: { createdAt: true } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: day30 } }, select: { createdAt: true } }),
    prisma.pageView.groupBy({
      by: ['path'],
      _count: { path: true },
      where: { createdAt: { gte: day7 } },
      orderBy: { _count: { path: 'desc' } },
      take: 20,
    }),
    prisma.pageView.groupBy({
      by: ['country'],
      _count: { country: true },
      where: { createdAt: { gte: day30 } },
      orderBy: { _count: { country: 'desc' } },
      take: 25,
    }),
    prisma.pageView.groupBy({
      by: ['referrer'],
      _count: { referrer: true },
      where: { createdAt: { gte: day30 } },
      orderBy: { _count: { referrer: 'desc' } },
      take: 15,
    }),
  ])

  // Hourly traffic: 24 buckets, oldest -> newest, bucket[23] is the current
  // (partial) hour. Same JS-bucketing technique as trafficHourly in
  // /api/admin/pulse-data.
  const hourly24h = new Array(24).fill(0)
  for (const row of pageViews24h) {
    const hoursAgo = Math.floor((now.getTime() - row.createdAt.getTime()) / (60 * 60 * 1000))
    const idx = 23 - hoursAgo
    if (idx >= 0 && idx < 24) hourly24h[idx]++
  }

  // Daily traffic: 30 buckets, oldest -> newest, bucket[29] is today (UTC,
  // partial).
  const dailyCounts = new Array(30).fill(0)
  for (const row of pageViews30d) {
    const daysAgo = Math.floor(
      (midnightUTC.getTime() - Date.UTC(row.createdAt.getUTCFullYear(), row.createdAt.getUTCMonth(), row.createdAt.getUTCDate())) /
        (24 * 60 * 60 * 1000)
    )
    const idx = 29 - daysAgo
    if (idx >= 0 && idx < 30) dailyCounts[idx]++
  }
  const daily30d = dailyCounts.map((views, i) => {
    const d = new Date(midnightUTC.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
    return { date: d.toISOString().slice(0, 10), views }
  })

  // groupBy treats null and '' as distinct buckets, but both should read as
  // one "Unknown"/"Direct / none" row -- merge them after labelling.
  const mergeByLabel = (rows: { label: string; views: number }[]) => {
    const merged = new Map<string, number>()
    for (const r of rows) merged.set(r.label, (merged.get(r.label) || 0) + r.views)
    return Array.from(merged.entries())
      .map(([label, views]) => ({ label, views }))
      .sort((a, b) => b.views - a.views)
  }

  const topCountries = mergeByLabel(
    countryRows30d.map((r) => ({ label: r.country || 'Unknown', views: r._count.country }))
  ).map((r) => ({ country: r.label, views: r.views }))

  const topReferrers = mergeByLabel(
    referrerRows30d.map((r) => ({ label: r.referrer || 'Direct / none', views: r._count.referrer }))
  ).map((r) => ({ referrer: r.label, views: r.views }))

  return NextResponse.json({
    generatedAt: now.toISOString(),
    totals: { lastHour, today, last7d, last30d },
    hourly24h,
    daily30d,
    topPaths: topPaths.map((r) => ({ path: r.path, views: r._count.path })),
    topCountries,
    topReferrers,
  })
}
