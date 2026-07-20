import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { maskPersonalName } from '@/lib/messageIdentity'

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
  // Buyer privacy (2026-07-20): reviews are public, so show the reviewer as
  // "First L." rather than their full sign-up name.
  const masked = reviews.map((r) => ({ ...r, user: { name: maskPersonalName(r.user.name) } }))
  return NextResponse.json({ reviews: masked, avgRating, count: reviews.length })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.email) return NextResponse.json({ error: 'No email on account' }, { status: 400 })
  const body = await request.json()
  const { productId, rating, comment } = body
  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      // 'PAID' is what createOrderFromPaymentIntent actually writes -- without it
      // in this list, NO real buyer could ever review anything (found live in
      // William's first end-to-end test purchase, 2026-07-17)
      order: { customerEmail: session.user.email, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } }
    }
  })
  if (!purchased) {
    return NextResponse.json({ error: 'You can only review products you have purchased' }, { status: 403 })
  }
  const existing = await prisma.review.findFirst({
    where: { productId, userId: session.user.id }
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
  }
  const review = await prisma.review.create({
    data: { productId, userId: session.user.id, rating: Number(rating), comment: comment || '' }
  })
  try {
    const p = await prisma.product.findUnique({ where: { id: productId }, select: { sellerId: true } })
    if (p) {
      const { computeSellerScore } = await import('@/lib/seller-ranking')
      await computeSellerScore(p.sellerId)
    }
  } catch {
    // ranking refresh is best-effort; never block the review response
  }
  return NextResponse.json({ review }, { status: 201 })
}
