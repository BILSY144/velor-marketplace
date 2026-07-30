import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Real journal-entry likes (William, 2026-07-30: "the heart button at the
// bottom of my journal page does not work" -- the engagement bar's heart
// count was display-only with no click handler behind it; this is the API
// that now backs it). One like per signed-in buyer per entry, via the
// JournalLike model (unique on postId+userId) that already existed in the
// schema for this exact purpose. Same VELOR_SOCIAL_ENABLED gate and
// visible-post check as every other /api/social/journal route.
const visible = {
  OR: [
    { status: 'PUBLISHED' },
    { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
  ],
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  if (process.env.VELOR_SOCIAL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { postId } = await params

  const post = await prisma.journalPost.findFirst({ where: { id: postId, ...visible }, select: { id: true } })
  if (!post) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })

  try {
    await prisma.journalLike.create({ data: { postId, userId: session.user.id } })
  } catch (err: unknown) {
    // Unique constraint -- already liked, treat as success (idempotent).
    const code = (err as { code?: string } | null)?.code
    if (code !== 'P2002') throw err
  }

  const likes = await prisma.journalLike.count({ where: { postId } })
  return NextResponse.json({ ok: true, liked: true, likes })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  if (process.env.VELOR_SOCIAL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { postId } = await params

  await prisma.journalLike.deleteMany({ where: { postId, userId: session.user.id } })

  const likes = await prisma.journalLike.count({ where: { postId } })
  return NextResponse.json({ ok: true, liked: false, likes })
}
