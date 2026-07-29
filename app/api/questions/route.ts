import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkMessageContent } from '@/lib/messageFilter'
import { maskPersonalName } from '@/lib/messageIdentity'

// Public Q&A on listings (2026-07-29, from William's Amazon PDP comparison).
//
// - Anyone can READ answered questions on a listing (GET ?productId=...);
//   a signed-in asker also sees their own still-unanswered questions.
// - Only signed-in buyers can ASK (POST); questions run the shared
//   no-contact-details filter and are capped per day.
// - Only the listing's OWN seller can ANSWER (PATCH); answers run the same
//   filter. Only answered questions are public -- an unanswered question is
//   never shown to other buyers.
// - Asker names are masked "First L." like reviews; every Q&A pair is
//   reportable (contentType QUESTION via /api/reports).

const MAX_Q_LEN = 500
const MAX_A_LEN = 2000
const MAX_QUESTIONS_PER_DAY = 10
const NEW_ACCOUNT_DAYS = 7
const NEW_ACCOUNT_QUESTIONS_PER_DAY = 5

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const scope = searchParams.get('scope')

  // Seller inbox: unanswered (and recent answered) questions across the
  // seller's own products, for /dashboard/questions.
  if (scope === 'seller') {
    const session = await auth()
    const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
    if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const questions = await prisma.productQuestion.findMany({
      where: { product: { sellerId } },
      select: {
        id: true, question: true, answer: true, answeredAt: true, createdAt: true,
        user: { select: { name: true } },
        product: { select: { id: true, title: true, images: true } },
      },
      orderBy: [{ answeredAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
      take: 100,
    })
    return NextResponse.json({
      questions: questions.map(q => ({ ...q, user: { name: maskPersonalName(q.user.name) } })),
    })
  }

  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null

  const questions = await prisma.productQuestion.findMany({
    where: {
      productId,
      // Public sees answered only; the asker also sees their own pending.
      OR: [
        { answeredAt: { not: null } },
        ...(userId ? [{ userId }] : []),
      ],
    },
    select: {
      id: true, userId: true, question: true, answer: true, answeredAt: true, createdAt: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({
    questions: questions.map(q => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      answeredAt: q.answeredAt,
      createdAt: q.createdAt,
      askerName: maskPersonalName(q.user.name),
      isMine: userId != null && q.userId === userId,
    })),
  })
}

export async function POST(request: Request) {
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Sign in to ask a question' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const productId = typeof body.productId === 'string' ? body.productId : ''
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, MAX_Q_LEN) : ''
  if (!productId || !question) {
    return NextResponse.json({ error: 'Write your question first' }, { status: 400 })
  }

  // Same no-contact-details rule as messages/reviews (the platform is the
  // channel -- William, 2026-07-21).
  const check = checkMessageContent(question)
  if (check.blocked) {
    return NextResponse.json({ error: "Questions can't include email addresses, phone numbers, website links, or social/messaging handles." }, { status: 400 })
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'APPROVED' },
    select: { id: true, seller: { select: { userId: true } } },
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  if (product.seller.userId === userId) {
    return NextResponse.json({ error: 'You cannot ask a question on your own listing' }, { status: 400 })
  }

  // Daily caps (OSA posture): 10/day for everyone, 5/day for accounts in
  // their first week.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const askedToday = await prisma.productQuestion.count({ where: { userId, createdAt: { gte: dayAgo } } })
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } })
  const isNew = account ? Date.now() - account.createdAt.getTime() < NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000 : false
  const cap = isNew ? NEW_ACCOUNT_QUESTIONS_PER_DAY : MAX_QUESTIONS_PER_DAY
  if (askedToday >= cap) {
    return NextResponse.json({ error: `You can ask up to ${cap} questions a day. Please try again tomorrow.` }, { status: 429 })
  }

  const created = await prisma.productQuestion.create({
    data: { productId, userId, question },
    select: { id: true, createdAt: true },
  })
  return NextResponse.json({ ok: true, question: created }, { status: 201 })
}

export async function PATCH(request: Request) {
  const session = await auth()
  const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!sellerId) return NextResponse.json({ error: 'Only the seller can answer questions' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const questionId = typeof body.questionId === 'string' ? body.questionId : ''
  const answer = typeof body.answer === 'string' ? body.answer.trim().slice(0, MAX_A_LEN) : ''
  if (!questionId || !answer) {
    return NextResponse.json({ error: 'Write an answer first' }, { status: 400 })
  }

  const check = checkMessageContent(answer)
  if (check.blocked) {
    return NextResponse.json({ error: "Answers can't include email addresses, phone numbers, website links, or social/messaging handles." }, { status: 400 })
  }

  // Ownership: the question must belong to one of THIS seller's products.
  const updated = await prisma.productQuestion.updateMany({
    where: { id: questionId, product: { sellerId } },
    data: { answer, answeredAt: new Date() },
  })
  if (updated.count === 0) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
