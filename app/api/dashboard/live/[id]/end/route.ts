import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { endLiveKitRoom } from '@/lib/livekit'
import { deactivateLiveOffer } from '@/lib/liveOffer'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const stream = await prisma.liveStream.findUnique({ where: { id } })
  if (!stream || stream.sellerId !== seller.id) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

  if (stream.status === 'ENDED' || stream.status === 'CANCELLED') {
    return NextResponse.json({ stream })
  }

  await endLiveKitRoom(stream.roomName)

  // The live-only offer dies with the stream — the whole point is that the
  // price is only available while the seller is actually live.
  try {
    await deactivateLiveOffer(stream.roomName)
  } catch (err) {
    console.warn('[live/end] offer deactivation failed (non-blocking):', err)
  }

  const updated = await prisma.liveStream.update({
    where: { id },
    data: { status: 'ENDED', endedAt: new Date() },
  })

  return NextResponse.json({ stream: updated })
}
