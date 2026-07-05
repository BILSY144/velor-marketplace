import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const include = { seller: { select: { storeName: true, currency: true } } } as const

  const live = await prisma.liveStream.findMany({ where: { status: 'LIVE' }, orderBy: { startedAt: 'desc' }, include, take: 40 })
  const scheduled = await prisma.liveStream.findMany({ where: { status: 'SCHEDULED' }, orderBy: { scheduledFor: 'asc' }, include, take: 40 })
  const streams = [...live, ...scheduled]

  const allProductIds = Array.from(new Set(streams.flatMap((s) => s.productIds)))
  const products = allProductIds.length
    ? await prisma.product.findMany({ where: { id: { in: allProductIds } }, select: { id: true, title: true, price: true, images: true } })
    : []
  const productMap = new Map(products.map((p) => [p.id, p]))

  const result = streams.map((s) => ({
    id: s.id,
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
