import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createViewerToken, getWsUrl, liveKitConfigured } from '@/lib/livekit'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params
  if (!liveKitConfigured()) return NextResponse.json({ error: 'Live Shopping is not yet available' }, { status: 503 })

  const stream = await prisma.liveStream.findUnique({ where: { roomName: room } })
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
  if (stream.status !== 'LIVE') return NextResponse.json({ error: 'This stream is not live right now' }, { status: 409 })

  const session = await auth()
  const identity = session?.user?.id ? `buyer-${session.user.id}` : `guest-${Math.random().toString(36).slice(2, 10)}`
  const name = session?.user?.name || 'Guest'

  const token = await createViewerToken(room, identity, name)
  return NextResponse.json({ token, wsUrl: getWsUrl() })
}
