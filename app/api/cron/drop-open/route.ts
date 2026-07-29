import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronSecret } from '@/lib/cronAuth'

// Drop-open bell fan-out (vercel.json: Thu 18:05 UTC, five minutes after
// the weekly drop opens). Notifies every user who follows at least one
// maker with a piece in the live drop -- follows-based, never a blast to
// everyone (healthy by design). Latched by Drop.bellNotifiedAt.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError
  if (process.env.VELOR_SOCIAL_ENABLED === 'false') return NextResponse.json({ ok: true, skipped: 'social disabled' })

  const now = new Date()
  const drop = await prisma.drop.findFirst({
    where: {
      bellNotifiedAt: null,
      scheduledAt: { lte: now, gte: new Date(now.getTime() - 2 * 3600 * 1000) },
    },
    orderBy: { scheduledAt: 'desc' },
  })
  if (!drop) return NextResponse.json({ ok: true, skipped: 'no freshly opened drop' })

  const items = await prisma.dropItem.findMany({
    where: { dropId: drop.id, product: { status: 'APPROVED' } },
    select: { sellerId: true },
  })
  const sellerIds = [...new Set(items.map(i => i.sellerId))]
  let notified = 0
  if (sellerIds.length) {
    const follows = await prisma.follow.findMany({
      where: { sellerId: { in: sellerIds } },
      select: { userId: true },
      take: 20000,
    })
    const userIds = [...new Set(follows.map(f => f.userId))]
    if (userIds.length) {
      await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          type: 'DROP_OPEN',
          title: 'The weekly drop is open -- makers you follow are in it',
          body: 'Fresh from the Workshop is live for 48 hours.',
          href: '/drops',
        })),
      })
      notified = userIds.length
    }
  }
  await prisma.drop.update({ where: { id: drop.id }, data: { bellNotifiedAt: new Date() } })
  return NextResponse.json({ ok: true, dropId: drop.id, sellersInDrop: sellerIds.length, notified })
}
