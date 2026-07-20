import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { isExpoPushToken } from '@/lib/expoPush'

// "Notify me" for a scheduled stream (2026-07-20). Signed-in users (web or
// app) are stored by userId; a signed-out app user can register with just
// their Expo push token. One row per person per stream — repeats are no-ops.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params
  const stream = await prisma.liveStream.findUnique({ where: { roomName: room } })
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
  if (stream.status !== 'SCHEDULED') {
    return NextResponse.json({ error: 'This stream is not scheduled' }, { status: 409 })
  }

  const session = await auth().catch(() => null)
  const body = await req.json().catch(() => ({}))
  const pushToken = typeof body.pushToken === 'string' ? body.pushToken : ''

  if (session?.user?.id) {
    await prisma.liveStreamInterest.upsert({
      where: { streamId_userId: { streamId: stream.id, userId: session.user.id } },
      create: { streamId: stream.id, userId: session.user.id },
      update: {},
    })
    return NextResponse.json({ ok: true })
  }

  if (isExpoPushToken(pushToken)) {
    await prisma.liveStreamInterest.upsert({
      where: { streamId_pushToken: { streamId: stream.id, pushToken } },
      create: { streamId: stream.id, pushToken },
      update: {},
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Sign in to be notified' }, { status: 401 })
}
