import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkMessageContent } from '@/lib/messageFilter'
import { maskPersonalName } from '@/lib/messageIdentity'

// "Ask the Maker" -- a general public Q&A board on the seller's journal
// page (2026-08-01, William: real interaction "that draws in new buyers"),
// separate from per-entry comments (see the journal comments route) since
// it isn't tied to any one story. Any signed-in buyer can ask; the seller
// AND other buyers can answer (see the nested answers route). Public GET,
// content-filtered POST, seller-only hide via PATCH. Gated by
// VELOR_SOCIAL_ENABLED like every /api/social route.

const MAX_LEN = 500
const MAX_PER_DAY = 10

function socialDisabled(): NextResponse | null {
  if (process.env.VELOR_SOCIAL_ENABLED === 'true') return null
  return NextResponse.json({ error: 'Velor Social is not yet enabled' }, { status: 403 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const gate = socialDisabled()
  if (gate) return gate
  const { sellerId } = await params

  const seller = await prisma.seller.findFirst({ where: { id: sellerId, approved: true }, select: { id: true, userId: true } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const session = await auth()
  const isPageOwner = (session?.user as { sellerId?: string } | undefined)?.sellerId === sellerId

  const questions = await prisma.sellerQuestion.findMany({
    where: { sellerId, ...(isPageOwner ? {} : { status: 'PUBLISHED' }) },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      answers: {
        where: isPageOwner ? {} : { status: 'PUBLISHED' },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const peopleIds = Array.from(new Set([
    ...questions.map((q) => q.askerId),
    ...questions.flatMap((q) => q.answers.map((a) => a.authorId)),
  ]))
  const people = peopleIds.length ? await prisma.user.findMany({ where: { id: { in: peopleIds } }, select: { id: true, name: true } }) : []
  const nameById = new Map(people.map((p) => [p.id, p.name]))

  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      body: q.body,
      createdAt: q.createdAt.toISOString(),
      name: maskPersonalName(nameById.get(q.askerId) ?? null),
      hidden: q.status === 'HIDDEN',
      answers: q.answers.map((a) => ({
        id: a.id,
        body: a.body,
        createdAt: a.createdAt.toISOString(),
        name: maskPersonalName(nameById.get(a.authorId) ?? null),
        isSeller: a.authorId === seller.userId,
        hidden: a.status === 'HIDDEN',
      })),
    })),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const gate = socialDisabled()
  if (gate) return gate
  const { sellerId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Sign in to ask a question' }, { status: 401 })

  const seller = await prisma.seller.findFirst({ where: { id: sellerId, approved: true }, select: { id: true, userId: true, storeName: true } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  if (seller.userId === userId) {
    return NextResponse.json({ error: 'You cannot ask a question on your own store' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, MAX_LEN) : ''
  if (!text) return NextResponse.json({ error: 'Write your question first' }, { status: 400 })
  const check = checkMessageContent(text)
  if (check.blocked) {
    return NextResponse.json({ error: "Questions can't include email addresses, phone numbers, website links, or social/messaging handles." }, { status: 400 })
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const askedToday = await prisma.sellerQuestion.count({ where: { askerId: userId, createdAt: { gte: dayAgo } } })
  if (askedToday >= MAX_PER_DAY) {
    return NextResponse.json({ error: `You can ask up to ${MAX_PER_DAY} questions a day` }, { status: 429 })
  }

  const created = await prisma.sellerQuestion.create({
    data: { sellerId, askerId: userId, body: text },
    select: { id: true, createdAt: true },
  })

  try {
    await prisma.notification.create({
      data: {
        userId: seller.userId,
        type: 'NEW_SELLER_QUESTION',
        title: `New question on ${seller.storeName}'s journal`,
        body: text.slice(0, 120),
        href: `/community/journals/${sellerId}`,
      },
    })
  } catch (err) {
    console.error('[seller questions] bell fan-out failed', err)
  }

  return NextResponse.json({ ok: true, question: created }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const gate = socialDisabled()
  if (gate) return gate
  const { sellerId } = await params
  const session = await auth()
  const viewerSellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!viewerSellerId || viewerSellerId !== sellerId) {
    return NextResponse.json({ error: 'Only the seller can moderate questions' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const questionId = typeof body.questionId === 'string' ? body.questionId : ''
  const hidden = Boolean(body.hidden)
  if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 })

  const updated = await prisma.sellerQuestion.updateMany({
    where: { id: questionId, sellerId },
    data: { status: hidden ? 'HIDDEN' : 'PUBLISHED' },
  })
  if (updated.count === 0) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
