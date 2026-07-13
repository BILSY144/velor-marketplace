import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { endLiveKitRoom } from '@/lib/livekit'
import { auth } from '@/auth'

const AUTO_END_THRESHOLD = 3

// This used to take a fully unauthenticated POST and blindly increment
// reportCount on every call -- no session required, no de-duplication. That
// meant anyone who found the endpoint could script 3 requests against ANY
// seller's roomName and force their live stream to auto-end (see
// AUTO_END_THRESHOLD below), a real denial-of-service vector against
// sellers with zero accountability for who filed the reports. Now requires
// a signed-in session, and reports are deduplicated per (stream, reporter)
// via LiveStreamReport's compound unique constraint -- a single account can
// never count more than once against the same stream.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ room: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const reporterEmail = session.user.email.toLowerCase().trim()

  const { room } = await params
  const stream = await prisma.liveStream.findUnique({ where: { roomName: room } })
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

  try {
    await prisma.liveStreamReport.create({
      data: { streamId: stream.id, reporterEmail },
    })
  } catch (err: unknown) {
    // P2002 = this account already reported this stream. Not an error --
    // just don't count it again. Return the current state as-is.
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      const current = await prisma.liveStream.findUnique({ where: { roomName: room } })
      return NextResponse.json({ ended: current?.status === 'ENDED', reportCount: current?.reportCount ?? stream.reportCount })
    }
    throw err
  }

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
