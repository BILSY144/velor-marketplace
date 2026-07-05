import { NextRequest, NextResponse } from 'next/server'
import { WebhookReceiver } from 'livekit-server-sdk'
import { prisma } from '@/lib/prisma'

const apiKey = process.env.LIVEKIT_API_KEY
const apiSecret = process.env.LIVEKIT_API_SECRET

export async function POST(req: NextRequest) {
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit is not configured' }, { status: 503 })
  }

  const body = await req.text()
  const authHeader = req.headers.get('authorization') || ''

  const receiver = new WebhookReceiver(apiKey, apiSecret)
  let event
  try {
    event = await receiver.receive(body, authHeader)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  const roomName = event.room?.name
  if (!roomName) return NextResponse.json({ ok: true })

  const identity = event.participant?.identity || ''
  const isViewer = identity.startsWith('buyer-') || identity.startsWith('guest-')

  try {
    if (event.event === 'participant_joined' && isViewer) {
      const stream = await prisma.liveStream.findUnique({ where: { roomName } })
      if (stream) {
        await prisma.liveStreamViewerSession.create({ data: { streamId: stream.id, identity } })
        const activeCount = await prisma.liveStreamViewerSession.count({ where: { streamId: stream.id, leftAt: null } })
        if (activeCount > stream.peakViewers) {
          await prisma.liveStream.update({ where: { id: stream.id }, data: { peakViewers: activeCount } })
        }
      }
    }

    if (event.event === 'participant_left' && isViewer) {
      const stream = await prisma.liveStream.findUnique({ where: { roomName } })
      if (stream) {
        const openSession = await prisma.liveStreamViewerSession.findFirst({
          where: { streamId: stream.id, identity, leftAt: null },
          orderBy: { joinedAt: 'desc' },
        })
        if (openSession) {
          await prisma.liveStreamViewerSession.update({ where: { id: openSession.id }, data: { leftAt: new Date() } })
        }
      }
    }

    if (event.event === 'room_finished') {
      const stream = await prisma.liveStream.findUnique({ where: { roomName } })
      if (stream) {
        await prisma.liveStreamViewerSession.updateMany({
          where: { streamId: stream.id, leftAt: null },
          data: { leftAt: new Date() },
        })
        if (stream.status === 'LIVE') {
          await prisma.liveStream.update({ where: { id: stream.id }, data: { status: 'ENDED', endedAt: new Date() } })
        }
      }
    }
  } catch (err) {
    console.error('livekit webhook handling error', err)
  }

  return NextResponse.json({ ok: true })
}
