import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Backs /pulse/pipeline -- the seller-scouting pipeline detail page in the
// Velor Pulse mobile ops dashboard. Combines an aggregate view of the
// prospecting -> qualification -> outreach -> application funnel with a
// filterable, paginated list of individual SellerProspect rows and a feed of
// the most recent outreach sends, the same "part aggregate, part list"
// pattern used by /api/admin/pulse-revenue and /api/admin/orders.
//
// Auth accepts EITHER a NextAuth admin session OR the Pulse
// 'Authorization: Bearer <ADMIN_SECRET>' token, via the shared
// isAuthorizedAdmin() helper (lib/adminAuth.ts).
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const qualifiedParam = searchParams.get('qualified') || '' // 'true' | 'false' | 'unscreened'
  const country = searchParams.get('country') || ''
  const q = (searchParams.get('q') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25))

  const where: Prisma.SellerProspectWhereInput = {}
  if (status) where.status = status
  if (qualifiedParam === 'true') where.qualified = true
  else if (qualifiedParam === 'false') where.qualified = false
  else if (qualifiedParam === 'unscreened') where.qualified = null
  if (country) where.country = { contains: country, mode: 'insensitive' }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { storeUrl: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }

  const now = Date.now()
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const [
    prospectedCount,
    qualifiedCount,
    disqualifiedCount,
    unscreenedCount,
    distinctOutreachProspects,
    // "Applied" is approximated as the count of SellerApplication rows that
    // carry a prospectId -- this counts applications, not distinct
    // prospects, so a prospect who somehow generated more than one
    // application would be double-counted. Close enough as a funnel proxy
    // since applications are not expected to repeat per prospect in
    // practice, but it is not an exact prospect-level count.
    appliedCount,
    approvedCount,
    byStatusRaw,
    outreachSent7d,
    outreachSent30d,
    recentOutreach,
    prospects,
    total,
  ] = await Promise.all([
    prisma.sellerProspect.count(),
    prisma.sellerProspect.count({ where: { qualified: true } }),
    prisma.sellerProspect.count({ where: { qualified: false } }),
    prisma.sellerProspect.count({ where: { qualified: null } }),
    prisma.outreachLog.findMany({ select: { prospectId: true }, distinct: ['prospectId'] }),
    prisma.sellerApplication.count({ where: { prospectId: { not: null } } }),
    prisma.sellerApplication.count({ where: { prospectId: { not: null }, status: 'APPROVED' } }),
    prisma.sellerProspect.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.outreachLog.count({ where: { sentAt: { gte: sevenDaysAgo } } }),
    prisma.outreachLog.count({ where: { sentAt: { gte: thirtyDaysAgo } } }),
    prisma.outreachLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 20,
      include: { prospect: { select: { name: true, country: true, sellerType: true } } },
    }),
    prisma.sellerProspect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sellerProspect.count({ where }),
  ])

  const funnel = [
    { label: 'Prospected', value: prospectedCount },
    { label: 'Qualified', value: qualifiedCount },
    { label: 'Outreach sent', value: distinctOutreachProspects.length },
    { label: 'Applied', value: appliedCount },
    { label: 'Approved', value: approvedCount },
  ]

  const byStatus = byStatusRaw.map((row) => ({ status: row.status, count: row._count.status }))

  return NextResponse.json({
    funnel,
    byStatus,
    qualified: qualifiedCount,
    disqualified: disqualifiedCount,
    unscreened: unscreenedCount,
    outreachSent7d,
    outreachSent30d,
    recentOutreach,
    prospects,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}
