import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { endLiveKitRoom } from '@/lib/livekit'
import { auth } from '@/auth'
import { LIVE_REPORT_REASONS } from '@/lib/liveReportReasons'

// William's rules (2026-07-21): one report can never end a stream -- FIVE
// separate, filled-in reports from five different accounts do. Every report
// comes through the report form with a reason (details optional, required
// for "other"), so the ops review ticket says WHY a stream was ended, not
// just that it was.
const AUTO_END_THRESHOLD = 5

// This used to take a fully unauthenticated POST and blindly increment
// reportCount on every call -- no session required, no de-duplication. That
// meant anyone who found the endpoint could script enough requests against
// ANY seller's roomName to force their live stream to auto-end, a real
// denial-of-service vector against sellers with zero accountability for who
// filed the reports. Now requires a signed-in session, and reports are
// deduplicated per (stream, reporter) via LiveStreamReport's compound
// unique constraint -- a single account can never count more than once
// against the same stream.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ room: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const reporterEmail = session.user.email.toLowerCase().trim()

  const body = await req.json().catch(() => ({}))
  const reason = typeof body.reason === 'string' ? body.reason : ''
  const details = typeof body.details === 'string' ? body.details.trim().slice(0, 1000) : ''
  if (!LIVE_REPORT_REASONS[reason]) {
    return NextResponse.json({ error: 'Pick a reason for the report.' }, { status: 400 })
  }
  if (reason === 'other' && !details) {
    return NextResponse.json({ error: 'Tell us what happened -- "Something else" needs a few words.' }, { status: 400 })
  }

  const { room } = await params
  const stream = await prisma.liveStream.findUnique({ where: { roomName: room } })
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

  try {
    await prisma.liveStreamReport.create({
      data: { streamId: stream.id, reporterEmail, reason, details: details || null },
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

    // The review ticket carries the reason breakdown so ops sees WHY.
    const allReports = await prisma.liveStreamReport.findMany({
      where: { streamId: stream.id },
      select: { reason: true, details: true },
    })
    const counts = new Map<string, number>()
    for (const r of allReports) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1)
    const breakdown = [...counts.entries()]
      .map(([k, n]) => `${LIVE_REPORT_REASONS[k] ?? k}: ${n}`)
      .join('; ')
    const detailLines = allReports
      .filter((r) => r.details)
      .map((r) => `- ${r.details}`)
      .join('\n')

    const seller = await prisma.seller.findUnique({ where: { id: stream.sellerId } })
    await prisma.supportTicket.create({
      data: {
        sellerId: stream.sellerId,
        name: seller?.storeName ?? 'Unknown seller',
        email: 'ops@velorcommerce.store',
        subject: `Live stream auto-ended after ${updated.reportCount} reports: ${stream.title}`,
        message: `Stream ${room} was automatically ended after receiving ${updated.reportCount} separate viewer reports and needs review before the seller's next stream is approved.\n\nReason breakdown: ${breakdown}${detailLines ? `\n\nReporter details:\n${detailLines}` : ''}`,
        priority: 'PRIORITY',
      },
    })

    return NextResponse.json({ ended: true, reportCount: updated.reportCount })
  }

  return NextResponse.json({ ended: false, reportCount: updated.reportCount })
}
