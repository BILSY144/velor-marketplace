import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
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
    prisma.product.count({ where: { approved: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
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
    totalRevenue: revenueAgg._sum.total ?? 0,
    pendingSellers,
    pendingProducts,
    recentOrders,
  })
}
