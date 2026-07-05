import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params
  const stream = await prisma.liveStream.findUnique({
    where: { roomName: room },
    include: { seller: { select: { id: true, storeName: true, currency: true } } },
  })
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

  const products = stream.productIds.length
    ? await prisma.product.findMany({ where: { id: { in: stream.productIds } }, select: { id: true, title: true, price: true, images: true, stock: true } })
    : []

  return NextResponse.json({ stream, products })
}
