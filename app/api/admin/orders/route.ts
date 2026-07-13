import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Admin order lookup -- the gap William surfaced: Pulse only ever showed
// aggregate stats (counts, total GMV), and there was no page anywhere in
// the app to look up a single order and see who bought what, from which
// seller. This is the read side of that. Same admin-role gate as every
// other /api/admin/* route (session-based, not the separate token-gated
// Pulse endpoint).
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = searchParams.get('status') || 'ALL'

  const where: Prisma.OrderWhereInput = {}
  if (status !== 'ALL') {
    where.status = status as Prisma.OrderWhereInput['status']
  }
  if (q) {
    where.OR = [
      { customerEmail: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { id: { equals: q } },
      { stripePaymentId: { contains: q, mode: 'insensitive' } },
      { seller: { storeName: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      seller: { select: { id: true, storeName: true } },
      items: {
        include: { product: { select: { id: true, title: true, images: true } } },
      },
      shipment: { select: { status: true, trackingNumber: true, trackingUrl: true, carrier: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ orders })
}
