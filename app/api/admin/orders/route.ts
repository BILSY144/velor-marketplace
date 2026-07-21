import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Admin order lookup -- the gap William surfaced: Pulse only ever showed
// aggregate stats (counts, total GMV), and there was no page anywhere in
// the app to look up a single order and see who bought what, from which
// seller. This is the read side of that.
//
// Auth accepts EITHER a NextAuth session with role ADMIN (the desktop
// /admin/orders page) OR the Bearer ADMIN_SECRET token (the mobile /pulse
// dashboard -- a separate, token-gated PWA, see lib/adminAuth.ts). One
// route now backs both surfaces instead of duplicating this query.
//
// page/pageSize are optional and default to page 1 / pageSize 100, which
// matches this route's original take:100 behaviour exactly -- the existing
// desktop page (app/admin/orders/page.tsx) never sends these params and is
// unaffected. /pulse/orders sends them for real pagination.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = searchParams.get('status') || 'ALL'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '100', 10) || 100))

  const where: Prisma.OrderWhereInput = {}
  if (status !== 'ALL') {
    where.status = status as Prisma.OrderWhereInput['status']
  }
  if (q) {
    where.OR = [
      { customerEmail: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { id: { equals: q } },
      { stripePaymentId: { contains: q, mode: 'insensitive' } },
      { seller: { storeName: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        seller: { select: { id: true, storeName: true } },
        items: {
          include: { product: { select: { id: true, title: true, images: true } } },
        },
        shipment: { select: { status: true, trackingNumber: true, trackingUrl: true, carrier: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}

// Admin manual delivery override (William, 2026-07-21) -- the human backstop
// for orders stuck short of DELIVERED (unsupported carrier, dead tracking)
// when neither the webhook, the buyer confirm button, nor the 30-day
// auto-confirm has resolved them. Logged to AgentLog every time; the payout
// cron's own open-issue and identity checks still apply downstream, so this
// can never bypass a dispute freeze.
export async function PATCH(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { orderId, action } = await request.json()
    if (!orderId || action !== 'mark-delivered') {
      return NextResponse.json({ error: 'orderId and action "mark-delivered" required' }, { status: 400 })
    }
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, status: true } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'DELIVERED') return NextResponse.json({ ok: true, alreadyDelivered: true })
    if (order.status !== 'SHIPPED') {
      return NextResponse.json({ error: `Order is ${order.status} -- only a SHIPPED order can be marked delivered` }, { status: 400 })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'DELIVERED', deliveredAt: new Date(), deliveryConfirmedBy: 'ADMIN' },
    })
    await prisma.shipment.updateMany({ where: { orderId: order.id }, data: { status: 'DELIVERED' } })
    await prisma.agentLog.create({
      data: {
        agentName: 'admin-orders',
        action: 'manual-mark-delivered',
        status: 'success',
        details: { orderId: order.id },
      },
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/orders PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
