import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Velor Live streaming activity -- backs /pulse/live.
//
// Live streaming has never had any presence in Pulse before, even though
// sellers have been able to broadcast and sell live on the platform since
// the founding-seller perk shipped (app/live/[room]/page.tsx is the
// buyer-facing viewer). This route gives William the first admin-side view
// into that activity: every stream (scheduled, live, ended, cancelled),
// who's broadcasting, how many viewers, and how many reports it's picked up
// (LiveStreamReport rows drive LiveStream.reportCount -- see that model's
// comment in prisma/schema.prisma for the abuse-prevention story behind it).
//
// Auth follows the same pattern as every other Pulse-backing admin route
// (see app/api/admin/orders/route.ts): isAuthorizedAdmin accepts either a
// NextAuth ADMIN session or the Pulse Bearer ADMIN_SECRET token.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const q = (searchParams.get('q') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20))

  const where: Prisma.LiveStreamWhereInput = {}
  if (status) {
    where.status = status as Prisma.LiveStreamWhereInput['status']
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { seller: { storeName: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [streams, total, liveNow, totalStreams, peakViewersAgg, byStatusRaw, reportsAgg] = await Promise.all([
    prisma.liveStream.findMany({
      where,
      include: {
        seller: { select: { storeName: true, country: true } },
        _count: { select: { viewerSessions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.liveStream.count({ where }),
    prisma.liveStream.count({ where: { status: 'LIVE' } }),
    prisma.liveStream.count(),
    prisma.liveStream.aggregate({ _sum: { peakViewers: true } }),
    prisma.liveStream.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.liveStream.aggregate({ _sum: { reportCount: true } }),
  ])

  const totalPeakViewersSum = peakViewersAgg._sum.peakViewers || 0
  const avgPeakViewers = totalStreams > 0 ? Number((totalPeakViewersSum / totalStreams).toFixed(1)) : 0
  const byStatus = byStatusRaw.map((row) => ({ status: row.status, count: row._count._all }))
  const totalReports = reportsAgg._sum.reportCount || 0

  return NextResponse.json({
    streams: streams.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      roomName: s.roomName,
      status: s.status,
      sellerStoreName: s.seller?.storeName || null,
      sellerCountry: s.seller?.country || null,
      scheduledFor: s.scheduledFor,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      peakViewers: s.peakViewers,
      reportCount: s.reportCount,
      viewerSessionCount: s._count.viewerSessions,
      recordingUrl: s.recordingUrl,
      createdAt: s.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    liveNow,
    totalStreams,
    totalPeakViewersSum,
    avgPeakViewers,
    byStatus,
    totalReports,
  })
}
