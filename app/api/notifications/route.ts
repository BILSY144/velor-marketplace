import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// The web notification bell (Velor Social plan section 7). GET returns the
// latest notifications + unread count; POST marks everything read.

export const dynamic = 'force-dynamic'

async function userIdFromSession(): Promise<string | null> {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return null
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  return user?.id || null
}

export async function GET() {
  if (process.env.VELOR_SOCIAL_ENABLED === 'false') return NextResponse.json({ enabled: false, items: [], unread: 0 })
  const userId = await userIdFromSession()
  if (!userId) return NextResponse.json({ items: [], unread: 0 })
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, type: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ])
  return NextResponse.json({ items, unread })
}

export async function POST() {
  const userId = await userIdFromSession()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })
  return NextResponse.json({ ok: true })
}
