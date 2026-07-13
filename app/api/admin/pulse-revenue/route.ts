import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { convert } from '@/lib/fx'

// Revenue detail for /pulse/revenue -- everything the GMV figure on the hub
// summarises in one number: a 30-day daily trend, which sellers and products
// are actually driving it, the platform's real take rate, and the
// cancel/refund rate. Every currency figure is converted to GBP at live
// rates via lib/fx.ts (same convention as /api/admin/pulse-data), since
// orders are stored in whatever currency the buyer actually paid in.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [orders30d, orderItems30d] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: day30 } },
      select: {
        id: true,
        sellerId: true,
        subtotal: true,
        platformFee: true,
        sellerEarnings: true,
        currency: true,
        status: true,
        createdAt: true,
        seller: { select: { storeName: true, country: true, tier: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: day30 }, status: { not: 'CANCELLED' } } },
      select: {
        quantity: true,
        price: true,
        productId: true,
        product: { select: { title: true, images: true, category: true } },
        order: { select: { currency: true } },
      },
    }),
  ])

  const total30d = orders30d.length
  const cancelledOrRefunded = orders30d.filter((o) => o.status === 'CANCELLED' || o.status === 'REFUNDED').length
  const disputed = orders30d.filter((o) => o.status === 'DISPUTED').length
  const counted = orders30d.filter((o) => o.status !== 'CANCELLED')

  const dailyGmv = new Array(30).fill(0)
  let gmvGBP = 0
  let feeGBP = 0
  let fxError = false
  const sellerMap = new Map<string, { storeName: string; country: string | null; tier: string; revenueGBP: number; orders: number }>()

  for (const o of counted) {
    let subtotalGBP = 0
    let feeGBPRow = 0
    try {
      subtotalGBP = await convert(o.subtotal, o.currency, 'GBP')
      feeGBPRow = await convert(o.platformFee, o.currency, 'GBP')
    } catch {
      fxError = true
      continue
    }
    gmvGBP += subtotalGBP
    feeGBP += feeGBPRow

    const daysAgo = Math.floor((midnightUTC.getTime() - Date.UTC(o.createdAt.getUTCFullYear(), o.createdAt.getUTCMonth(), o.createdAt.getUTCDate())) / (24 * 60 * 60 * 1000))
    const idx = 29 - daysAgo
    if (idx >= 0 && idx < 30) dailyGmv[idx] += subtotalGBP

    const existing = sellerMap.get(o.sellerId)
    if (existing) {
      existing.revenueGBP += subtotalGBP
      existing.orders += 1
    } else {
      sellerMap.set(o.sellerId, {
        storeName: o.seller.storeName,
        country: o.seller.country,
        tier: o.seller.tier,
        revenueGBP: subtotalGBP,
        orders: 1,
      })
    }
  }

  const topSellers = Array.from(sellerMap.entries())
    .map(([sellerId, v]) => ({ sellerId, ...v, revenueGBP: Math.round(v.revenueGBP * 100) / 100 }))
    .sort((a, b) => b.revenueGBP - a.revenueGBP)
    .slice(0, 10)

  const productMap = new Map<string, { title: string; image: string | null; category: string; revenueGBP: number; units: number }>()
  let productFxError = false
  for (const item of orderItems30d) {
    let lineGBP = 0
    try {
      lineGBP = await convert(item.price * item.quantity, item.order.currency, 'GBP')
    } catch {
      productFxError = true
      continue
    }
    const existing = productMap.get(item.productId)
    if (existing) {
      existing.revenueGBP += lineGBP
      existing.units += item.quantity
    } else {
      productMap.set(item.productId, {
        title: item.product?.title || 'Deleted product',
        image: item.product?.images?.[0] || null,
        category: item.product?.category || 'Uncategorised',
        revenueGBP: lineGBP,
        units: item.quantity,
      })
    }
  }

  const topProducts = Array.from(productMap.entries())
    .map(([productId, v]) => ({ productId, ...v, revenueGBP: Math.round(v.revenueGBP * 100) / 100 }))
    .sort((a, b) => b.revenueGBP - a.revenueGBP)
    .slice(0, 10)

  const takeRatePct = gmvGBP > 0 ? (feeGBP / gmvGBP) * 100 : 0
  const aovGBP = counted.length > 0 ? gmvGBP / counted.length : 0
  const cancelRefundRatePct = total30d > 0 ? (cancelledOrRefunded / total30d) * 100 : 0
  const disputeRatePct = total30d > 0 ? (disputed / total30d) * 100 : 0

  return NextResponse.json({
    generatedAt: now.toISOString(),
    windowDays: 30,
    gmvGBP: Math.round(gmvGBP * 100) / 100,
    feeGBP: Math.round(feeGBP * 100) / 100,
    sellerEarningsGBP: Math.round((gmvGBP - feeGBP) * 100) / 100,
    takeRatePct: Math.round(takeRatePct * 100) / 100,
    aovGBP: Math.round(aovGBP * 100) / 100,
    cancelRefundRatePct: Math.round(cancelRefundRatePct * 100) / 100,
    disputeRatePct: Math.round(disputeRatePct * 100) / 100,
    ordersCounted: counted.length,
    ordersTotal: total30d,
    dailyGmvGBP: dailyGmv.map((v) => Math.round(v * 100) / 100),
    topSellers,
    topProducts,
    fxNote: fxError || productFxError
      ? 'Some orders could not be converted to GBP and are excluded from these totals.'
      : 'All figures converted to GBP at live exchange rates.',
  })
}
