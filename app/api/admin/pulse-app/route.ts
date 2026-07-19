import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// App analytics detail for /pulse/app -- everything the AppInstall telemetry
// stream can tell us: activated installs (first opens) over time, active
// devices (DAU/WAU/MAU from lastSeenAt), and breakdowns by country,
// platform, OS version, app version, language and currency. The model holds
// no personal data and no age -- Play Console's aggregate demographics are
// the only possible source for age, once download volume is high enough.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const group = (field: 'country' | 'platform' | 'osVersion' | 'appVersion' | 'language' | 'currency') =>
    prisma.appInstall.groupBy({
      by: [field],
      _count: { [field]: true },
      orderBy: { _count: { [field]: 'desc' } },
      take: 30,
    } as never) as Promise<Array<Record<string, unknown> & { _count: Record<string, number> }>>

  const [
    total,
    today,
    last7d,
    last30d,
    activeToday,
    active7d,
    active30d,
    installRows30d,
    countryRows,
    platformRows,
    osRows,
    versionRows,
    languageRows,
    currencyRows,
  ] = await Promise.all([
    prisma.appInstall.count(),
    prisma.appInstall.count({ where: { createdAt: { gte: midnightUTC } } }),
    prisma.appInstall.count({ where: { createdAt: { gte: day7 } } }),
    prisma.appInstall.count({ where: { createdAt: { gte: day30 } } }),
    prisma.appInstall.count({ where: { lastSeenAt: { gte: day1 } } }),
    prisma.appInstall.count({ where: { lastSeenAt: { gte: day7 } } }),
    prisma.appInstall.count({ where: { lastSeenAt: { gte: day30 } } }),
    prisma.appInstall.findMany({ where: { createdAt: { gte: day30 } }, select: { createdAt: true } }),
    group('country'),
    group('platform'),
    group('osVersion'),
    group('appVersion'),
    group('language'),
    group('currency'),
  ])

  // Daily installs sparkline: 30 buckets, oldest -> newest, [29] is today
  // (UTC, partial). Bucketed in JS from raw timestamps, same rationale as
  // the pulse-data traffic sparkline.
  const daily30 = new Array(30).fill(0)
  for (const row of installRows30d) {
    const daysAgo = Math.floor(
      (midnightUTC.getTime() -
        Date.UTC(row.createdAt.getUTCFullYear(), row.createdAt.getUTCMonth(), row.createdAt.getUTCDate())) /
        (24 * 60 * 60 * 1000)
    )
    const idx = 29 - daysAgo
    if (idx >= 0 && idx < 30) daily30[idx]++
  }

  const breakdown = (rows: Array<Record<string, unknown> & { _count: Record<string, number> }>, field: string) =>
    rows.map((row) => ({
      label: (row[field] as string) || 'Unknown',
      count: Object.values(row._count)[0] ?? 0,
    }))

  return NextResponse.json({
    generatedAt: now.toISOString(),
    installs: { total, today, last7d, last30d },
    active: { today: activeToday, last7d: active7d, last30d: active30d },
    installsDaily30: daily30,
    byCountry: breakdown(countryRows, 'country'),
    byPlatform: breakdown(platformRows, 'platform'),
    byOsVersion: breakdown(osRows, 'osVersion'),
    byAppVersion: breakdown(versionRows, 'appVersion'),
    byLanguage: breakdown(languageRows, 'language'),
    byCurrency: breakdown(currencyRows, 'currency'),
    note:
      'Installs are activated installs (first app opens), reported by the app itself. Store download counts and aggregate age demographics live in Play Console > Statistics.',
  })
}
