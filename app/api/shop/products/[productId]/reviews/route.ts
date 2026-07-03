import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  })
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0
  return NextResponse.json({ reviews, avgRating, count: reviews.length })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!session.user.email) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 })
  }

  const { productId } = await params
  const body = await request.json()
  const { rating, comment } = body

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        customerEmail: session.user.email,
        status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] }
      }
    }
  })
  if (!purchased) {
    return NextResponse.json(
      { error: 'You can only review products you have purchased' },
      { status: 403 }
    )
  }

  const existing = await prisma.review.findFirst({
    where: { productId, userId: session.user.id }
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
  }

  const review = await prisma.review.create({
    data: {
      productId,
      userId: session.user.id,
      rating: Number(rating),
      comment: comment || ''
    }
  })

  const allReviews = await prisma.review.findMany({ where: { productId }, select: { rating: true } })
  const newAvg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
return NextResponse.json({ review }, { status: 201 })
}
