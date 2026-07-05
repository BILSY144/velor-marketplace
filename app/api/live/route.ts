import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const include = { seller: { select: { id: true, storeName: true, currency: true, sellerScore: true } } } as const

  const live = await prisma.liveStream.findMany({ where: { status: 'LIVE' }, orderBy: { startedAt: 'desc' }, include, take: 40 })
  const scheduled = await prisma.liveStream.findMany({ where: { status: 'SCHEDULED' }, orderBy: { scheduledFor: 'asc' }, include, take: 40 })
  const streamSellerIds = Array.from(new Set([...live, ...scheduled].map((s) => s.sellerId)))
    const volumeRows = streamSellerIds.length
      ? await prisma.order.groupBy({ by: ['sellerId'], where: { sellerId: { in: streamSellerIds }, status: 'DELIVERED' }, _count: { _all: true } })
          : []
    const volumeMap = new Map(volumeRows.map((v) => [v.sellerId, v._count._all]))
    function byVolume(a: typeof live[number], b: typeof live[number]) {
          const va = volumeMap.get(a.sellerId) ?? 0
          const vb = volumeMap.get(b.sellerId) ?? 0
          if (vb !== va) return vb - va
          return (b.seller.sellerScore ?? 0) - (a.seller.sellerScore ?? 0)
    }
    const streams = [...live.sort(byVolume), ...scheduled.sort(byVolume)]

  const allProductIds = Array.from(new Set(streams.flatMap((s) => s.productIds)))
  const products = allProductIds.length
    ? await prisma.product.findMany({ where: { id: { in: allProductIds } }, select: { id: true, title: true, price: true, images: true } })
    : []
  const productMap = new Map(products.map((p) => [p.id, p]))

  const result = streams.map((s, i) => ({
    id: s.id,
    rank: i + 1,
      topTier: i < 12,
      volumeCount: volumeMap.get(s.sellerId) ?? 0,
    title: s.title,
    roomName: s.roomName,
    status: s.status,
    startedAt: s.startedAt,
    scheduledFor: s.scheduledFor,
    sellerName: s.seller.storeName,
    currency: s.seller.currency,
    products: s.productIds.map((pid) => productMap.get(pid)).filter(Boolean),
  }))

  return NextResponse.json({ streams: result })
}
