import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const PLATFORM_FEE_RATE = 0.15

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  // Fetch seller products first — used for both orderItem filtering and status counts
  const sellerProducts = await prisma.product.findMany({
    where: { sellerId: seller.id },
    select: { id: true, isApproved: true, isActive: true },
  })
  const sellerProductIds = sellerProducts.map((p) => p.id)

  // OrderItem has no product relation — filter by productId
  const orderItems = await prisma.orderItem.findMany({
    where: { productId: { in: sellerProductIds } },
    include: {
      order: { select: { id: true, createdAt: true, status: true } },
    },
  })

  const totalRevenue = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalEarnings = orderItems.reduce((sum, item) => {
    const gross = item.price * item.quantity
    return sum + gross - gross * PLATFORM_FEE_RATE
  }, 0)
  const orderIds = new Set(orderItems.map((i) => i.order.id))
  const totalOrders = orderIds.size
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Revenue by day for last 30 days
  const dailyRevenue: Record<string, number> = {}
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  for (const item of orderItems) {
    const date = item.order.createdAt
    if (date >= thirtyDaysAgo) {
      const day = date.toISOString().slice(0, 10)
      dailyRevenue[day] = (dailyRevenue[day] || 0) + item.price * item.quantity
    }
  }

  // Top products — use item.name and item.image (stored fields on OrderItem, no relation needed)
  const productMap: Record<string, { name: string; image: string | null; revenue: number; units: number }> = {}
  for (const item of orderItems) {
    const pid = item.productId
    if (!productMap[pid]) {
      productMap[pid] = { name: item.name, image: item.image ?? null, revenue: 0, units: 0 }
    }
    productMap[pid].revenue += item.price * item.quantity
    productMap[pid].units += item.quantity
  }
  const topProducts = Object.entries(productMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Product counts by status using boolean fields (no status string field on Product)
  const productsByStatus = {
    APPROVED: sellerProducts.filter((p) => p.isApproved && p.isActive).length,
    PENDING: sellerProducts.filter((p) => !p.isApproved && p.isActive).length,
    REJECTED: sellerProducts.filter((p) => !p.isApproved && !p.isActive).length,
  }

  // Pending payout — exclude refunded and cancelled orders
  const pendingPayout = orderItems
    .filter((i) => i.order.status !== 'REFUNDED' && i.order.status !== 'CANCELLED')
    .reduce((sum, item) => {
      const gross = item.price * item.quantity
      return sum + gross - gross * PLATFORM_FEE_RATE
    }, 0)

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalEarnings,
      totalOrders,
      avgOrderValue,
      pendingPayout,
      totalProducts: sellerProducts.length,
    },
    dailyRevenue,
    topProducts,
    productsByStatus,
  })
}
