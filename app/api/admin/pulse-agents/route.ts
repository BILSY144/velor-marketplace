import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Admin automation/agent activity log -- backs the mobile Pulse detail page
// at /pulse/agents. Every automated background agent (seller scouting,
// outreach, qualification, ranking recompute, payout release, application
// review, traffic checks, etc) writes a row to the shared AgentLog table on
// every run; this route is the read side of that, paginated/filterable, plus
// a couple of small rollups (distinct agent names + last-24h breakdowns) so
// the frontend can build a real filter dropdown and an at-a-glance summary
// instead of a hardcoded guess at what agents exist.
//
// Auth accepts EITHER a NextAuth session with role ADMIN OR the Pulse
// 'Authorization: Bearer <ADMIN_SECRET>' token -- see lib/adminAuth.ts,
// same convention as app/api/admin/orders/route.ts.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentName = searchParams.get('agentName') || ''
  const status = searchParams.get('status') || ''
  const q = (searchParams.get('q') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '30', 10) || 30))

  const where: Prisma.AgentLogWhereInput = {}
  if (agentName) where.agentName = agentName
  if (status) where.status = status
  if (q) where.action = { contains: q, mode: 'insensitive' }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [logs, total, agentNameGroups, last24hByStatusGroups, last24hByAgentGroups] = await Promise.all([
    prisma.agentLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.agentLog.count({ where }),
    prisma.agentLog.groupBy({
      by: ['agentName'],
      _count: { agentName: true },
    }),
    prisma.agentLog.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { createdAt: { gte: since24h } },
    }),
    prisma.agentLog.groupBy({
      by: ['agentName'],
      _count: { agentName: true },
      where: { createdAt: { gte: since24h } },
    }),
  ])

  const agentNames = agentNameGroups
    .map((g) => ({ agentName: g.agentName, count: g._count.agentName }))
    .sort((a, b) => b.count - a.count)

  const last24hByStatus = last24hByStatusGroups
    .map((g) => ({ status: g.status, count: g._count.status }))
    .sort((a, b) => b.count - a.count)

  const last24hByAgent = last24hByAgentGroups
    .map((g) => ({ agentName: g.agentName, count: g._count.agentName }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    agentNames,
    last24hByStatus,
    last24hByAgent,
  })
}
