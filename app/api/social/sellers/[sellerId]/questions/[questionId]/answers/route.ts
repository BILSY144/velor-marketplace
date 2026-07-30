import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkMessageContent } from '@/lib/messageFilter'

// Answers on an "Ask the Maker" question (2026-08-01). The seller AND
// other buyers can both answer -- same open, community-style posture as
// journal comment replies. isSeller is never stored on the row; it's
// computed at read time in the parent GET (answer.authorId === seller's
// User.id), so it can never go stale. Seller-only hide via PATCH.

const MAX_LEN = 2000
const MAX_PER_DAY = 30

function socialDisabled(): NextResponse | null {
  if (process.env.VELOR_SOCIAL_ENABLED === 'true') return null
  return NextResponse.json({ error: 'Velor Social is not yet enabled' }, { status: 403 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sellerId: string; questionId: string }> }) {
  const gate = socialDisabled()
  if (gate) return gate
  const { sellerId, questionId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Sign in to answer' }, { status: 401 })

  const question = await prisma.sellerQuestion.findFirst({
    where: { id: questionId, sellerId },
    select: { id: true, askerId: true, sellerId: true, seller: { select: { userId: true, storeName: true } } },
  })
  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, MAX_LEN) : ''
  if (!text) return NextResponse.json({ error: 'Write an answer first' }, { status: 400 })
  const check = checkMessageContent(text)
  if (check.blocked) {
    return NextResponse.json({ error: "Answers can't include email addresses, phone numbers, website links, or social/messaging handles." }, { status: 400 })
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const today = await prisma.sellerAnswer.count({ where: { authorId: userId, createdAt: { gte: dayAgo } } })
  if (today >= MAX_PER_DAY) {
    return NextResponse.json({ error: `You can post up to ${MAX_PER_DAY} answers a day` }, { status: 429 })
  }

  const created = await prisma.sellerAnswer.create({
    data: { questionId, authorId: userId, body: text },
    select: { id: true, createdAt: true },
  })

  // Bell fan-out, best-effort: tell the asker (if someone else answered)
  // and the seller (if someone other than the seller answered).
  try {
    if (question.askerId !== userId) {
      await prisma.notification.create({
        data: {
          userId: question.askerId,
          type: 'NEW_ANSWER',
          title: `${question.seller.storeName} answered your question`,
          body: text.slice(0, 120),
          href: `/community/journals/${sellerId}`,
        },
      })
    }
    if (question.seller.userId !== userId && question.seller.userId !== question.askerId) {
      await prisma.notification.create({
        data: {
          userId: question.seller.userId,
          type: 'NEW_ANSWER',
          title: 'New answer on your journal Q&A',
          body: text.slice(0, 120),
          href: `/community/journals/${sellerId}`,
        },
      })
    }
  } catch (err) {
    console.error('[seller answers] bell fan-out failed', err)
  }

  return NextResponse.json({ ok: true, answer: created }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sellerId: string; questionId: string }> }) {
  const gate = socialDisabled()
  if (gate) return gate
  const { sellerId, questionId } = await params
  const session = await auth()
  const viewerSellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!viewerSellerId || viewerSellerId !== sellerId) {
    return NextResponse.json({ error: 'Only the seller can moderate answers' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const answerId = typeof body.answerId === 'string' ? body.answerId : ''
  const hidden = Boolean(body.hidden)
  if (!answerId) return NextResponse.json({ error: 'answerId required' }, { status: 400 })

  const updated = await prisma.sellerAnswer.updateMany({
    where: { id: answerId, questionId, question: { sellerId } },
    data: { status: hidden ? 'HIDDEN' : 'PUBLISHED' },
  })
  if (updated.count === 0) return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
