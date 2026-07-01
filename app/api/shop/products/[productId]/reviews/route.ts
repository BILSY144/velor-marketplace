import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const product = await prisma.product.findUnique({ where: { id: productId, status: 'APPROVED' } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  })

  const avg = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return NextResponse.json({ reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'You must be signed in to leave a review' }, { status: 401 })
  }

  const { productId } = await params

  const product = await prisma.product.findUnique({ where: { id: productId, status: 'APPROVED' } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  let body: { rating?: number; comment?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { rating, comment } = body
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: session.user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
  }

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (seller && seller.id === product.sellerId) {
    return NextResponse.json({ error: 'You cannot review your own product' }, { status: 403 })
  }

  const review = await prisma.review.create({
    data: {
      productId,
      userId: session.user.id,
      rating: Math.round(rating),
      comment: comment ? String(comment).trim().slice(0, 2000) : null,
    },
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json({ review }, { status: 201 })
}
