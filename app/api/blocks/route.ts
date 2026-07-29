import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Block / mute between members (2026-07-29), per the signed online safety
// policy's build list. Blocking is mutual-silence: neither party can start
// or continue a message thread with the other, and the blocker no longer
// sees the blocked member's messages in their inbox (enforced in
// /api/messages). Accepts either a userId or a sellerId (resolved to the
// seller's user) so the buyer-facing UI can block from a conversation OR a
// storefront context without knowing the underlying user id.

async function resolveTargetUserId(body: { userId?: string; sellerId?: string }): Promise<string | null> {
  if (typeof body.userId === 'string' && body.userId) return body.userId
  if (typeof body.sellerId === 'string' && body.sellerId) {
    const seller = await prisma.seller.findUnique({ where: { id: body.sellerId }, select: { userId: true } })
    return seller?.userId ?? null
  }
  return null
}

export async function GET() {
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: userId },
    select: { blockedId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ blocks })
}

export async function POST(request: Request) {
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const targetId = await resolveTargetUserId(body)
  if (!targetId) return NextResponse.json({ error: 'userId or sellerId required' }, { status: 400 })
  if (targetId === userId) return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 })
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
    create: { blockerId: userId, blockedId: targetId },
    update: {},
  })
  return NextResponse.json({ ok: true, blocked: true })
}

export async function DELETE(request: Request) {
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const targetId = await resolveTargetUserId(body)
  if (!targetId) return NextResponse.json({ error: 'userId or sellerId required' }, { status: 400 })
  await prisma.userBlock.deleteMany({ where: { blockerId: userId, blockedId: targetId } })
  return NextResponse.json({ ok: true, blocked: false })
}
