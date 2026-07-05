import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { endLiveKitRoom } from '@/lib/livekit'

const AUTO_END_THRESHOLD = 3

export async function POST(
  req: Request,
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params
  const stream = await prisma.liveStream.findUnique({ where: { roomName: room } })
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

  const updated = await prisma.liveStream.update({
    where: { roomName: room },
    data: { reportCount: { increment: 1 } },
  })

  if (updated.reportCount >= AUTO_END_THRESHOLD && updated.status === 'LIVE') {
    await endLiveKitRoom(room)
    await prisma.liveStream.update({ where: { roomName: room }, data: { status: 'ENDED', endedAt: new Date() } })

    const seller = await prisma.seller.findUnique({ where: { id: stream.sellerId } })
    await prisma.supportTicket.create({
      data: {
        sellerId: stream.sellerId,
        name: seller?.storeName ?? 'Unknown seller',
        email: 'ops@velorcommerce.store',
        subject: `Live stream auto-ended after ${updated.reportCount} reports: ${stream.title}`,
        message: `Stream ${room} was automatically ended after receiving ${updated.reportCount} viewer reports and needs review before the seller's next stream is approved.`,
        priority: 'PRIORITY',
      },
    })

    return NextResponse.json({ ended: true, reportCount: updated.reportCount })
  }

  return NextResponse.json({ ended: false, reportCount: updated.reportCount })
}
