import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const now = new Date()

  const orderItems = await prisma.orderItem.findMany({
    where: { product: { sellerId: seller.id } },
    include: {
      order: { select: { id: true, createdAt: true, status: true } },
      product: { select: { id: true, name: true, images: true } },
    },
  })

  const totalRevenue = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalEarnings = orderItems.reduce((sum, item) => sum + (item.price * item.quantity - item.commission), 0)
  const orderIds = new Set(orderItems.map((i) => i.order.id))
  const totalOrders = orderIds.size
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Revenue by day for last 30 days
  const revenueByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    revenueByDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const item of orderItems) {
    const day = item.order.createdAt.toISOString().slice(0, 10)
    if (day in revenueByDay) {
      revenueByDay[day] += item.price * item.quantity
    }
  }
  const dailyRevenue = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }))

  // Top products by revenue
  const productMap: Record<string, { name: string; image: string | null; revenue: number; units: number }> = {}
  for (const item of orderItems) {
    const pid = item.productId
    if (!productMap[pid]) {
      productMap[pid] = { name: item.product.name, image: item.product.images[0] ?? null, revenue: 0, units: 0 }
    }
    productMap[pid].revenue += item.price * item.quantity
    productMap[pid].units += item.quantity
  }
  const topProducts = Object.entries(productMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Products by status
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    select: { status: true },
  })
  const productsByStatus = {
    APPROVED: products.filter((p) => p.status === 'APPROVED').length,
    PENDING_REVIEW: products.filter((p) => p.status === 'PENDING_REVIEW').length,
    REJECTED: products.filter((p) => p.status === 'REJECTED').length,
    DELISTED: products.filter((p) => p.status === 'DELISTED').length,
  }

  // Pending payout (non-refunded items)
  const pendingPayout = orderItems
    .filter((i) => i.order.status !== 'REFUNDED' && i.order.status !== 'CANCELLED')
    .reduce((sum, item) => sum + (item.price * item.quantity - item.commission), 0)

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalEarnings,
      totalOrders,
      avgOrderValue,
      pendingPayout,
      totalProducts: products.length,
    },
    dailyRevenue,
    topProducts,
    productsByStatus,
  })
}
