import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Support & Trust -- a combined queue of support tickets, disputes, and
// return requests, previously scattered across three separate tables with
// no single mobile view. Backs the /pulse/support page (Velor Pulse, the
// private token-gated mobile ops dashboard). Auth accepts EITHER a NextAuth
// admin session OR the Pulse Bearer ADMIN_SECRET token, via the shared
// isAuthorizedAdmin() helper (see lib/adminAuth.ts).
//
// Summary counts (openTickets, priorityOpenTickets, openDisputes,
// pendingReturns) are always computed regardless of the active tab, so the
// page's KPI row stays live even while the user is looking at a different
// tab. Only the active tab's rows are actually paginated/queried in full.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tab = (searchParams.get('tab') || 'tickets') as 'tickets' | 'disputes' | 'returns'
  const status = (searchParams.get('status') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20))

  const [openTickets, priorityOpenTickets, openDisputes, pendingReturns] = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { status: 'OPEN', priority: 'PRIORITY' } }),
    prisma.dispute.count({ where: { status: 'OPEN' } }),
    prisma.returnRequest.count({ where: { status: 'PENDING' } }),
  ])

  const counts = { openTickets, priorityOpenTickets, openDisputes, pendingReturns }

  let items: unknown[] = []
  let total = 0

  if (tab === 'disputes') {
    const where = status ? { status } : {}
    const [rows, count] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: { order: { select: { id: true, customerEmail: true, seller: { select: { storeName: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dispute.count({ where }),
    ])
    total = count
    items = rows.map((d) => ({
      id: d.id,
      orderId: d.orderId,
      raisedBy: d.raisedBy,
      reason: d.reason,
      evidence: d.evidence,
      status: d.status,
      resolution: d.resolution,
      customerEmail: d.order?.customerEmail ?? null,
      sellerStoreName: d.order?.seller?.storeName ?? null,
      createdAt: d.createdAt,
    }))
  } else if (tab === 'returns') {
    const where = status ? { status } : {}
    const [rows, count] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        include: { order: { select: { id: true, seller: { select: { storeName: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.returnRequest.count({ where }),
    ])
    total = count
    items = rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      customerEmail: r.customerEmail,
      reason: r.reason,
      status: r.status,
      sellerStoreName: r.order?.seller?.storeName ?? null,
      createdAt: r.createdAt,
    }))
  } else {
    const where = status ? { status: status as 'OPEN' | 'RESOLVED' } : {}
    const [rows, count] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: { seller: { select: { storeName: true } } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.supportTicket.count({ where }),
    ])
    total = count
    items = rows.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      subject: t.subject,
      message: t.message,
      priority: t.priority,
      status: t.status,
      sellerStoreName: t.seller?.storeName ?? null,
      createdAt: t.createdAt,
    }))
  }

  return NextResponse.json({
    tab,
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  })
}
