import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/wishlist — return current user's wishlist with product details
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          category: true,
          status: true,
          seller: { select: { storeName: true } },
          reviews: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formatted = items.map(item => {
    const ratings = item.product.reviews.map(r => r.rating)
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    return {
      wishlistItemId: item.id,
      addedAt: item.createdAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        images: item.product.images,
        category: item.product.category,
        sellerName: item.product.seller?.storeName ?? 'Unknown',
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
      },
    }
  })

  return NextResponse.json({ items: formatted })
}

// POST /api/wishlist — add a product to wishlist
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { productId } = await req.json()
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  // Ensure product exists and is approved
  const product = await prisma.product.findUnique({
    where: { id: productId, status: 'APPROVED' },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Upsert — safe if already in wishlist
  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId },
    update: {},
  })

  return NextResponse.json({ wishlistItemId: item.id })
}

// DELETE /api/wishlist — remove a product from wishlist
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { productId } = await req.json()
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  })

  return NextResponse.json({ ok: true })
}
