import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateNextDrop, isDropLive } from '@/lib/drops'

// Seller side of the weekly drop: put up to MAX_ITEMS_PER_SELLER of your
// own APPROVED listings into the next "Fresh from the Workshop" drop.

const MAX_ITEMS_PER_SELLER = 3

async function sellerIdFromSession(): Promise<string | null> {
  const session = await auth()
  const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  return sellerId || null
}

export async function GET() {
  const sellerId = await sellerIdFromSession()
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const drop = await getOrCreateNextDrop()
  const mine = await prisma.dropItem.findMany({
    where: { dropId: drop.id, sellerId },
    select: { id: true, productId: true, product: { select: { title: true, images: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const products = await prisma.product.findMany({
    where: { sellerId, status: 'APPROVED' },
    select: { id: true, title: true, images: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({
    drop: { id: drop.id, title: drop.title, scheduledAt: drop.scheduledAt, live: isDropLive(drop.scheduledAt) },
    maxItems: MAX_ITEMS_PER_SELLER,
    mine: mine.map(m => ({ id: m.id, productId: m.productId, title: m.product.title, image: m.product.images[0] || null })),
    products: products.map(p => ({ id: p.id, title: p.title, image: p.images[0] || null })),
  })
}

export async function POST(req: NextRequest) {
  const sellerId = await sellerIdFromSession()
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let productId: string
  try {
    const body = await req.json()
    productId = String(body.productId || '')
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const product = await prisma.product.findFirst({ where: { id: productId, sellerId }, select: { id: true, status: true } })
  if (!product) return NextResponse.json({ error: 'Not your listing' }, { status: 403 })
  if (product.status !== 'APPROVED') return NextResponse.json({ error: 'Only live (approved) listings can join a drop' }, { status: 400 })
  const drop = await getOrCreateNextDrop()
  const count = await prisma.dropItem.count({ where: { dropId: drop.id, sellerId } })
  if (count >= MAX_ITEMS_PER_SELLER) {
    return NextResponse.json({ error: 'You already have ' + MAX_ITEMS_PER_SELLER + ' pieces in this drop' }, { status: 400 })
  }
  try {
    await prisma.dropItem.create({ data: { dropId: drop.id, productId, sellerId } })
  } catch {
    // unique(dropId, productId) -- already in the drop, treat as success
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const sellerId = await sellerIdFromSession()
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let productId: string
  try {
    const body = await req.json()
    productId = String(body.productId || '')
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const drop = await getOrCreateNextDrop()
  await prisma.dropItem.deleteMany({ where: { dropId: drop.id, sellerId, productId } })
  return NextResponse.json({ ok: true })
}
