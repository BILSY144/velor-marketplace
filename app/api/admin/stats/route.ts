import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [
    totalUsers,
    totalSellers,
    totalApprovedProducts,
    totalOrders,
    revenueAgg,
    pendingSellers,
    pendingProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.seller.count({ where: { approved: true } }),
    prisma.product.count({ where: { status: 'APPROVED' } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { subtotal: true } }),
    prisma.seller.count({ where: { approved: false } }),
    prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          take: 1,
        },
      },
    }),
  ])

  return NextResponse.json({
    totalUsers,
    totalSellers,
    totalApprovedProducts,
    totalOrders,
    totalRevenue: revenueAgg._sum.subtotal ?? 0,
    pendingSellers,
    pendingProducts,
    recentOrders,
  })
}
