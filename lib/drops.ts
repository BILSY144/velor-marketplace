import { prisma } from '@/lib/prisma'

// Weekly Drop ("Fresh from the Workshop") -- Velor Social stage 6.
// Drop day is THURSDAY 18:00 UTC (UK/EU evening, US morning) and each
// drop stays live for 48 hours. William can change these three
// constants; nothing else hardcodes the schedule.
export const DROP_WEEKDAY_UTC = 4 // 0=Sun ... 4=Thu
export const DROP_HOUR_UTC = 18
export const DROP_LIVE_HOURS = 48

export function nextDropDate(from: Date = new Date()): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), DROP_HOUR_UTC, 0, 0))
  while (d.getUTCDay() !== DROP_WEEKDAY_UTC || d.getTime() <= from.getTime()) {
    d.setUTCDate(d.getUTCDate() + 1)
    d.setUTCHours(DROP_HOUR_UTC, 0, 0, 0)
  }
  return d
}

export function isDropLive(scheduledAt: Date, now: Date = new Date()): boolean {
  const t = now.getTime() - scheduledAt.getTime()
  return t >= 0 && t < DROP_LIVE_HOURS * 3600 * 1000
}

// Returns the drop that is currently live or next upcoming, creating it
// if none exists. Items added while a drop is live simply appear in it
// (deliberate v1 simplicity).
export async function getOrCreateNextDrop() {
  const now = new Date()
  const existing = await prisma.drop.findFirst({
    where: { scheduledAt: { gte: new Date(now.getTime() - DROP_LIVE_HOURS * 3600 * 1000) } },
    orderBy: { scheduledAt: 'asc' },
  })
  if (existing) return existing
  return prisma.drop.create({ data: { scheduledAt: nextDropDate(now) } })
}
