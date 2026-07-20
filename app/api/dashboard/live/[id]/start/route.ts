import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createBroadcasterToken, getWsUrl, liveKitConfigured } from '@/lib/livekit'
import { activateLiveOffer } from '@/lib/liveOffer'
import { sendExpoPush } from '@/lib/expoPush'

// Start a previously SCHEDULED stream (2026-07-20): flips it LIVE, switches
// on any dormant live offer, returns the broadcaster token, and — best
// effort, never blocking the seller — pushes a "we're live" notification to
// everyone who tapped Notify me on this stream.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  if (!liveKitConfigured()) {
    return NextResponse.json({ error: 'Live Shopping infrastructure is being finalised - check back shortly.' }, { status: 503 })
  }

  const stream = await prisma.liveStream.findUnique({ where: { id } })
  if (!stream || stream.sellerId !== seller.id) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
  if (stream.status === 'LIVE') {
    // Already live (e.g. a reconnect after a dropped browser) — just issue a
    // fresh broadcaster token.
    const token = await createBroadcasterToken(stream.roomName, `seller-${seller.id}`, seller.storeName)
    return NextResponse.json({ stream, token, wsUrl: getWsUrl() })
  }
  if (stream.status !== 'SCHEDULED') {
    return NextResponse.json({ error: 'This stream has already ended' }, { status: 409 })
  }

  const updated = await prisma.liveStream.update({
    where: { id },
    data: { status: 'LIVE', startedAt: new Date() },
  })

  try {
    await activateLiveOffer(stream.roomName)
  } catch (err) {
    console.warn('[live/start] offer activation failed (non-blocking):', err)
  }

  // Notify everyone who asked. Interests store either a userId (look up
  // their registered device tokens) or a raw Expo push token.
  try {
    const interests = await prisma.liveStreamInterest.findMany({ where: { streamId: stream.id } })
    const userIds = interests.map((i) => i.userId).filter((u): u is string => !!u)
    const directTokens = interests.map((i) => i.pushToken).filter((t): t is string => !!t)
    const userTokens = userIds.length
      ? (await prisma.pushToken.findMany({ where: { userId: { in: userIds } }, select: { token: true } })).map((t) => t.token)
      : []
    const tokens = Array.from(new Set([...directTokens, ...userTokens]))
    if (tokens.length) {
      await sendExpoPush(tokens.map((to) => ({
        to,
        title: `${seller.storeName} is live on Velor`,
        body: stream.title,
        data: { url: `https://velorcommerce.store/live/${stream.roomName}` },
      })))
    }
  } catch (err) {
    console.warn('[live/start] notify failed (non-blocking):', err)
  }

  const token = await createBroadcasterToken(stream.roomName, `seller-${seller.id}`, seller.storeName)
  return NextResponse.json({ stream: updated, token, wsUrl: getWsUrl() })
}
