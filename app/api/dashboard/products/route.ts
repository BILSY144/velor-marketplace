import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const seller = await prisma.seller.findFirst({
      where: { user: { email: session.user.email } },
    })
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }
    const products = await prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ products })
  } catch (err) {
    console.error('[dashboard/products GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const seller = await prisma.seller.findFirst({
      where: { user: { email: session.user.email } },
    })
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const {
      name, description, price, stock, category, images, tags,
      weightGrams, lengthCm, widthCm, heightCm, hsCode, originCountry,
    } = await request.json()

    if (!name || !description || !price || !category) {
      return NextResponse.json({ error: 'name, description, price, category required' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        name, description,
        price: parseFloat(price),
        stock: parseInt(stock ?? '0', 10),
        category,
        images: Array.isArray(images) ? images : [],
        tags: Array.isArray(tags) ? tags : [],
        status: 'PENDING_REVIEW',
        weightGrams: weightGrams ? parseInt(weightGrams, 10) : null,
        lengthCm: lengthCm ? parseFloat(lengthCm) : null,
        widthCm: widthCm ? parseFloat(widthCm) : null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        hsCode: hsCode || null,
        originCountry: originCountry || null,
      },
    })

    return NextResponse.json({ product })
  } catch (err) {
    console.error('[dashboard/products POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const seller = await prisma.seller.findFirst({
      where: { user: { email: session.user.email } },
    })
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const {
      id, name, description, price, stock, category, images, tags,
      weightGrams, lengthCm, widthCm, heightCm, hsCode, originCountry,
    } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Product id required' }, { status: 400 })
    }

    const existing = await prisma.product.findFirst({
      where: { id, sellerId: seller.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        price: price != null ? parseFloat(price) : existing.price,
        stock: stock != null ? parseInt(stock, 10) : existing.stock,
        category: category ?? existing.category,
        images: images ?? existing.images,
        tags: tags ?? existing.tags,
        weightGrams: weightGrams != null ? parseInt(weightGrams, 10) : existing.weightGrams,
        lengthCm: lengthCm != null ? parseFloat(lengthCm) : existing.lengthCm,
        widthCm: widthCm != null ? parseFloat(widthCm) : existing.widthCm,
        heightCm: heightCm != null ? parseFloat(heightCm) : existing.heightCm,
        hsCode: hsCode !== undefined ? (hsCode || null) : existing.hsCode,
        originCountry: originCountry !== undefined ? (originCountry || null) : existing.originCountry,
      },
    })

    return NextResponse.json({ product })
  } catch (err) {
    console.error('[dashboard/products PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
