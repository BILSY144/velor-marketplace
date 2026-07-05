import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createBroadcasterToken, getWsUrl, liveKitConfigured, makeRoomName } from '@/lib/livekit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const streams = await prisma.liveStream.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ tier: seller.tier, liveKitReady: liveKitConfigured(), streams })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  if (seller.tier !== 'ENTERPRISE') {
    return NextResponse.json({ error: 'Live Shopping is an Enterprise-tier feature. Upgrade to Enterprise to go live.' }, { status: 403 })
  }

  if (!liveKitConfigured()) {
    return NextResponse.json({ error: 'Live Shopping infrastructure is being finalised - check back shortly.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : ''
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : null
  const productIds = Array.isArray(body.productIds) ? body.productIds.filter((x: unknown) => typeof x === 'string').slice(0, 12) : []

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  if (productIds.length > 0) {
    const owned = await prisma.product.count({ where: { id: { in: productIds }, sellerId: seller.id } })
    if (owned !== productIds.length) return NextResponse.json({ error: 'One or more products do not belong to your store' }, { status: 400 })
  }

  const activeCount = await prisma.liveStream.count({ where: { sellerId: seller.id, status: { in: ['LIVE', 'SCHEDULED'] } } })
  if (activeCount > 0) {
    return NextResponse.json({ error: 'You already have a live or scheduled stream. End it before starting a new one.' }, { status: 409 })
  }

  const roomName = makeRoomName(seller.id)

  const stream = await prisma.liveStream.create({
    data: {
      sellerId: seller.id,
      title,
      description,
      roomName,
      productIds,
      status: 'LIVE',
      startedAt: new Date(),
    },
  })

  const identity = `seller-${seller.id}`
  const token = await createBroadcasterToken(roomName, identity, seller.storeName)

  return NextResponse.json({ stream, token, wsUrl: getWsUrl() })
}
