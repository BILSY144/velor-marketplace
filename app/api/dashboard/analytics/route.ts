import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const COMMISSION_RATE: Record<string, number> = {
    STARTER: 0.1,
    PRO: 0.04,
    ENTERPRISE: 0,
}

function netEarnings(items: { price: number; quantity: number }[], rate: number): number {
    return items.reduce((sum, item) => {
          const gross = item.price * item.quantity
          return sum + gross - gross * rate
    }, 0)
}

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const commissionRate = COMMISSION_RATE[seller.tier] ?? COMMISSION_RATE.STARTER

  const sellerProducts = await prisma.product.findMany({
        where: { sellerId: seller.id },
        select: { id: true, title: true, status: true },
  })
    const sellerProductIds = sellerProducts.map((p) => p.id)

  const orderItems = await prisma.orderItem.findMany({
        where: { productId: { in: sellerProductIds } },
        include: {
                order: { select: { id: true, createdAt: true, status: true } },
                product: { select: { title: true, images: true } },
        },
  })

  const totalRevenue = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalEarnings = netEarnings(orderItems, commissionRate)
    const orderIds = new Set(orderItems.map((i) => i.order.id))
    const totalOrders = orderIds.size
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const dailyRevenueMap: Record<string, number> = {}
      for (const item of orderItems) {
            const day = item.order.createdAt.toISOString().slice(0, 10)
            dailyRevenueMap[day] = (dailyRevenueMap[day] || 0) + item.price * item.quantity
      }
    const dailyRevenue: { date: string; revenue: number }[] = []
        for (let i = 29; i >= 0; i--) {
              const d = new Date()
              d.setDate(d.getDate() - i)
              const day = d.toISOString().slice(0, 10)
              dailyRevenue.push({ date: day, revenue: dailyRevenueMap[day] || 0 })
        }

  const productMap: Record<string, { name: string; image: string | null; revenue: number; units: number }> = {}
      for (const item of orderItems) {
            const pid = item.productId
            if (!productMap[pid]) {
                    productMap[pid] = { name: item.product.title, image: item.product.images?.[0] ?? null, revenue: 0, units: 0 }
            }
            productMap[pid].revenue += item.price * item.quantity
            productMap[pid].units += item.quantity
      }
    const topProducts = Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

  const productsByStatus = {
        APPROVED: sellerProducts.filter((p) => p.status === 'APPROVED').length,
        PENDING_REVIEW: sellerProducts.filter((p) => p.status === 'PENDING_REVIEW').length,
        REJECTED: sellerProducts.filter((p) => p.status === 'REJECTED').length,
        DELISTED: sellerProducts.filter((p) => p.status === 'DELISTED').length,
  }

  const pendingPayout = netEarnings(
        orderItems.filter((i) => i.order.status !== 'REFUNDED' && i.order.status !== 'CANCELLED'),
        commissionRate
      )

  const responseBody: Record<string, unknown> = {
        tier: seller.tier,
        commissionRate,
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
  }

  if (seller.tier === 'PRO' || seller.tier === 'ENTERPRISE') {
        const now = new Date()
        const fifteenDaysAgo = new Date(now)
        fifteenDaysAgo.setDate(now.getDate() - 15)
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(now.getDate() - 30)

      const recentItems = orderItems.filter((i) => i.order.createdAt >= fifteenDaysAgo)
        const priorItems = orderItems.filter(
                (i) => i.order.createdAt >= thirtyDaysAgo && i.order.createdAt < fifteenDaysAgo
                      )

      const recentRevenue = recentItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
        const priorRevenue = priorItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
        const recentOrders = new Set(recentItems.map((i) => i.order.id)).size
        const priorOrders = new Set(priorItems.map((i) => i.order.id)).size

      const pctChange = (current: number, previous: number): number | null => {
              if (previous === 0) return current > 0 ? 100 : null
              return ((current - previous) / previous) * 100
      }

      responseBody.trend = {
              windowDays: 15,
              revenueChangePct: pctChange(recentRevenue, priorRevenue),
              ordersChangePct: pctChange(recentOrders, priorOrders),
      }

      const soldProductIds = new Set(
              orderItems.filter((i) => i.order.createdAt >= thirtyDaysAgo).map((i) => i.productId)
            )
        const stagnantProduct = sellerProducts.find((p) => p.status === 'APPROVED' && !soldProductIds.has(p.id))
        responseBody.topOpportunity = stagnantProduct
          ? {
                      productId: stagnantProduct.id,
                      name: stagnantProduct.title,
                      message: `"${stagnantProduct.title}" has had no sales in the last 30 days. Consider refreshing its photos, description, or price.`,
          }
                : null
  }

  if (seller.tier === 'ENTERPRISE') {
        const now = new Date()
        const sixtyDaysAgo = new Date(now)
        sixtyDaysAgo.setDate(now.getDate() - 60)
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(now.getDate() - 30)

      const previousPeriodItems = orderItems.filter(
              (i) => i.order.createdAt >= sixtyDaysAgo && i.order.createdAt < thirtyDaysAgo
                    )
        const previousPeriodRevenue = previousPeriodItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
        const previousPeriodOrders = new Set(previousPeriodItems.map((i) => i.order.id)).size
        const previousPeriodEarnings = netEarnings(previousPeriodItems, commissionRate)

      responseBody.previousPeriod = {
              label: 'Days 31-60 ago',
              revenue: previousPeriodRevenue,
              orders: previousPeriodOrders,
              earnings: previousPeriodEarnings,
      }
        responseBody.canExport = true
  }

  return NextResponse.json(responseBody)
}
