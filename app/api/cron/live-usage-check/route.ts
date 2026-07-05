import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const FREE_TIER_MINUTES = 5000
const FREE_TIER_GB = 50
const SHIP_TIER_MINUTES = 150000
const SHIP_TIER_GB = 250
const MB_PER_VIEWER_MINUTE = 11.25

function pct(used: number, limit: number) {
  return limit > 0 ? Math.round((used / limit) * 100) : 0
}

function tierStatus(minutesPct: number, gbPct: number) {
  if (minutesPct >= 100 || gbPct >= 100) return 'upgrade_recommended'
  if (minutesPct >= 70 || gbPct >= 70) return 'approaching'
  return 'ok'
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const streams = await prisma.liveStream.findMany({
    where: { startedAt: { gte: monthStart } },
    select: { id: true, startedAt: true, endedAt: true },
  })

  let broadcastMinutes = 0
  for (const s of streams) {
    if (!s.startedAt) continue
    const end = s.endedAt ?? now
    broadcastMinutes += (end.getTime() - s.startedAt.getTime()) / 60000
  }

  const streamIds = streams.map((s) => s.id)
  const sessions = streamIds.length
    ? await prisma.liveStreamViewerSession.findMany({
        where: { streamId: { in: streamIds }, joinedAt: { gte: monthStart } },
        select: { joinedAt: true, leftAt: true },
      })
    : []

  let viewerMinutes = 0
  for (const sess of sessions) {
    const end = sess.leftAt ?? now
    viewerMinutes += (end.getTime() - sess.joinedAt.getTime()) / 60000
  }

  const totalWebRtcMinutes = broadcastMinutes + viewerMinutes
  const estimatedBandwidthGB = (viewerMinutes * MB_PER_VIEWER_MINUTE) / 1024

  const freeMinutesPct = pct(totalWebRtcMinutes, FREE_TIER_MINUTES)
  const freeGbPct = pct(estimatedBandwidthGB, FREE_TIER_GB)
  const shipMinutesPct = pct(totalWebRtcMinutes, SHIP_TIER_MINUTES)
  const shipGbPct = pct(estimatedBandwidthGB, SHIP_TIER_GB)

  return NextResponse.json({
    month: monthStart.toISOString().slice(0, 7),
    streamCount: streams.length,
    broadcastMinutes: Math.round(broadcastMinutes),
    viewerMinutes: Math.round(viewerMinutes),
    totalWebRtcMinutes: Math.round(totalWebRtcMinutes),
    estimatedBandwidthGB: Math.round(estimatedBandwidthGB * 10) / 10,
    freeTier: { minutesUsedPct: freeMinutesPct, gbUsedPct: freeGbPct, status: tierStatus(freeMinutesPct, freeGbPct) },
    shipTier: { minutesUsedPct: shipMinutesPct, gbUsedPct: shipGbPct, status: tierStatus(shipMinutesPct, shipGbPct) },
  })
}
