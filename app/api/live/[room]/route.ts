import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getActiveLiveOffer } from '@/lib/liveOffer'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params
  const stream = await prisma.liveStream.findUnique({
    where: { roomName: room },
    include: { seller: { select: { id: true, storeName: true, currency: true, storeLogo: true } } },
  })
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

  const products = stream.productIds.length
    ? await prisma.product.findMany({ where: { id: { in: stream.productIds } }, select: { id: true, title: true, price: true, images: true, stock: true } })
    : []

  // Live-only offer (2026-07-20): read from the same automatic discount
  // engine that charges the reduced price at checkout — the viewer page only
  // ever displays what will genuinely be charged.
  const liveOffer = stream.status === 'LIVE' ? await getActiveLiveOffer(room) : null

  return NextResponse.json({ stream, products, liveOffer })
}
