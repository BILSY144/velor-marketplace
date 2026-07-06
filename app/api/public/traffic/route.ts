import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public, unauthenticated endpoint -- intentionally exposes only aggregate
// counts (no paths, no referrers, no per-visit detail) for the homepage
// traffic pulse widget. Real numbers only, no fabrication: these are raw
// PageView row counts, not deduplicated unique visitors, because the
// PageView table does not track a visitor identifier.
export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const [lastHour, today] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: hourAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: midnightUTC } } }),
  ])

  return NextResponse.json({ lastHour, today })
}
