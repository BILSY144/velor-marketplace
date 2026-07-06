import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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
          title: true,
          price: true,
          images: true,
          category: true,
          status: true,
          seller: { select: { id: true, storeName: true, currency: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formatted = items.map(item => {
    const avgRating = 0
    return {
      id: item.id,
      productId: item.productId,
      addedAt: item.createdAt,
      product: {
        id: item.product.id,
        name: item.product.title,
        price: item.product.price,
        images: item.product.images,
        category: item.product.category,
        status: item.product.status,
        sellerName: item.product.seller.storeName,
        sellerId: item.product.seller.id,
        currency: item.product.seller.currency || 'GBP',
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: 0,
      },
    }
  })

  return NextResponse.json({ items: formatted })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { productId } = await request.json()
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const existing = await prisma.wishlistItem.findFirst({
    where: { userId: session.user.id, productId },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already in wishlist' }, { status: 409 })
  }

  const item = await prisma.wishlistItem.create({
    data: { userId: session.user.id, productId },
  })

  return NextResponse.json({ item }, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  })

  return NextResponse.json({ success: true })
}
