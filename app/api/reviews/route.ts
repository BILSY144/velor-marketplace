import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  })
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  return NextResponse.json({ reviews, avgRating, count: reviews.length })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.email) return NextResponse.json({ error: 'No email on account' }, { status: 400 })
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  const { productId, rating, comment } = body
  if (!productId || !rating) return NextResponse.json({ error: 'productId and rating are required' }, { status: 400 })
  if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  const hasPurchased = await prisma.orderItem.findFirst({
    where: { productId, order: { buyerEmail: session.user.email, status: { in: ['PAID', 'FULFILLED'] } } }
  })
  if (!hasPurchased) return NextResponse.json({ error: 'You can only review products you have purchased' }, { status: 403 })
  try {
    const review = await prisma.review.create({
      data: { productId, userId: session.user.id, rating: parseInt(String(rating)), comment: comment ? String(comment) : null },
      include: { user: { select: { name: true } } }
    })
    return NextResponse.json({ review }, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
    throw err
  }
}