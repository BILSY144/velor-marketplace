import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// "Helpful" votes on reviews (2026-07-29, Amazon-comparison item). POST
// toggles the caller's vote: one per person per review (DB unique), never
// on your own review, sign-in required. Returns the live count so the UI
// never has to guess.

export async function POST(request: Request) {
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Sign in to mark reviews helpful' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const reviewId = typeof body.reviewId === 'string' ? body.reviewId : ''
  if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })

  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { userId: true } })
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  if (review.userId === userId) {
    return NextResponse.json({ error: 'You cannot mark your own review helpful' }, { status: 400 })
  }

  const existing = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
    select: { id: true },
  })
  if (existing) {
    await prisma.reviewVote.delete({ where: { id: existing.id } })
  } else {
    await prisma.reviewVote.create({ data: { reviewId, userId } })
  }
  const helpfulCount = await prisma.reviewVote.count({ where: { reviewId } })
  return NextResponse.json({ ok: true, voted: !existing, helpfulCount })
}
