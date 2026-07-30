import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkMessageContent } from '@/lib/messageFilter'
import { maskPersonalName } from '@/lib/messageIdentity'

// Real per-entry Q&A (2026-08-01, William: "everythink can be shown on
// there journal pages like q&a thats real interaction ... that draws in
// new buyers"). The journal page already showed a static, read-only
// comment list with a "Write a comment..." box that just linked to
// /auth/join for everyone, signed in or not -- this route is what makes
// that box (and replies underneath each comment) real.
//
// A top-level comment is the "question"; a reply (parentId set) from the
// SELLER or another buyer is the "answer" -- one level deep only, same
// open-to-everyone posture the "Ask the Maker" seller board uses. Public
// GET, content-filtered POST, seller-only hide via PATCH. Gated by
// VELOR_SOCIAL_ENABLED like every /api/social route.

const MAX_LEN = 1000
const MAX_PER_DAY = 30

function socialDisabled(): NextResponse | null {
  if (process.env.VELOR_SOCIAL_ENABLED === 'true') return null
  return NextResponse.json({ error: 'Velor Social is not yet enabled' }, { status: 403 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const gate = socialDisabled()
  if (gate) return gate
  const { postId } = await params

  const post = await prisma.journalPost.findUnique({ where: { id: postId }, select: { id: true, sellerId: true, seller: { select: { userId: true } } } })
  if (!post) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })

  const session = await auth()
  const viewerSellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId ?? null
  const isPageOwner = viewerSellerId != null && viewerSellerId === post.sellerId

  const rows = await prisma.journalComment.findMany({
    where: { postId, ...(isPageOwner ? {} : { status: 'PUBLISHED' }) },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  const userIds = Array.from(new Set(rows.map((r) => r.userId)))
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }) : []
  const nameById = new Map(users.map((u) => [u.id, u.name]))

  const shape = (r: (typeof rows)[number]) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    name: maskPersonalName(nameById.get(r.userId) ?? null),
    isSeller: post.seller?.userId === r.userId,
    hidden: r.status === 'HIDDEN',
  })

  const topLevel = rows.filter((r) => !r.parentId).map(shape)
  const repliesByParent = new Map<string, ReturnType<typeof shape>[]>()
  for (const r of rows.filter((r) => r.parentId)) {
    const arr = repliesByParent.get(r.parentId as string) ?? []
    arr.push(shape(r))
    repliesByParent.set(r.parentId as string, arr)
  }
  const comments = topLevel.map((c) => ({
    ...c,
    replies: (repliesByParent.get(c.id) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }))

  return NextResponse.json({ comments, count: comments.filter((c) => !c.hidden).length })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const gate = socialDisabled()
  if (gate) return gate
  const { postId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Sign in to join the conversation' }, { status: 401 })

  const post = await prisma.journalPost.findFirst({
    where: { id: postId, OR: [{ status: 'PUBLISHED' }, { status: 'SCHEDULED', scheduledAt: { lte: new Date() } }] },
    select: { id: true, sellerId: true, title: true, seller: { select: { userId: true, storeName: true } } },
  })
  if (!post) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, MAX_LEN) : ''
  if (!text) return NextResponse.json({ error: 'Write something first' }, { status: 400 })
  const check = checkMessageContent(text)
  if (check.blocked) {
    return NextResponse.json({ error: "Comments can't include email addresses, phone numbers, website links, or social/messaging handles." }, { status: 400 })
  }

  let parentId: string | null = null
  if (typeof body.parentId === 'string' && body.parentId) {
    const parent = await prisma.journalComment.findFirst({ where: { id: body.parentId, postId }, select: { id: true, parentId: true, userId: true } })
    if (!parent) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    if (parent.parentId) return NextResponse.json({ error: 'Replies are only one level deep' }, { status: 400 })
    parentId = parent.id
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const today = await prisma.journalComment.count({ where: { userId, createdAt: { gte: dayAgo } } })
  if (today >= MAX_PER_DAY) {
    return NextResponse.json({ error: `You can post up to ${MAX_PER_DAY} comments a day` }, { status: 429 })
  }

  const created = await prisma.journalComment.create({
    data: { postId, userId, body: text, parentId },
    select: { id: true, createdAt: true },
  })

  // Bell fan-out, best-effort. A reply notifies the comment it answers;
  // a fresh top-level comment notifies the maker whose entry it's on.
  try {
    if (parentId) {
      const parent = await prisma.journalComment.findUnique({ where: { id: parentId }, select: { userId: true } })
      if (parent && parent.userId !== userId) {
        await prisma.notification.create({
          data: {
            userId: parent.userId,
            type: 'NEW_COMMENT_REPLY',
            title: 'Someone replied to your comment',
            body: text.slice(0, 120),
            href: `/community/journals/${post.sellerId}`,
          },
        })
      }
    }
    if (post.seller && post.seller.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.seller.userId,
          type: 'NEW_JOURNAL_COMMENT',
          title: `New comment on "${post.title || 'your journal entry'}"`,
          body: text.slice(0, 120),
          href: `/community/journals/${post.sellerId}`,
        },
      })
    }
  } catch (err) {
    console.error('[journal comments] bell fan-out failed', err)
  }

  return NextResponse.json({ ok: true, comment: created }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const gate = socialDisabled()
  if (gate) return gate
  const { postId } = await params
  const session = await auth()
  const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!sellerId) return NextResponse.json({ error: 'Only the seller can moderate comments' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const commentId = typeof body.commentId === 'string' ? body.commentId : ''
  const hidden = Boolean(body.hidden)
  if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 })

  const updated = await prisma.journalComment.updateMany({
    where: { id: commentId, postId, post: { sellerId } },
    data: { status: hidden ? 'HIDDEN' : 'PUBLISHED' },
  })
  if (updated.count === 0) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
