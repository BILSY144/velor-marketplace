import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkMessageContent } from '@/lib/messageFilter'

// Velor Social: Collections (LAW #4 stage 3 foundations, built 2026-07-29).
//
// DORMANT BY DESIGN: 403 unless VELOR_SOCIAL_ENABLED === 'true' -- set by
// William only after the OSA pack (docs/osa/) is signed (it now is, see
// docs/osa/dpia-velor-social.md's sign-off block). Collections are PRIVATE
// BY DEFAULT; isPublic is an explicit per-collection opt-in via PATCH below.
// William approved a public browsing surface 2026-07-30 (see the DPIA's
// addendum of the same date) -- app/community/CommunityPageClient.tsx's "Buyer's
// Collections" box now lists real isPublic collections. Collection names
// are user-generated text, so they pass the same shared content filter as
// every other UGC string on Velor.

const MAX_COLLECTIONS_PER_USER = 50
const MAX_ITEMS_PER_COLLECTION = 200
const MAX_NAME_LEN = 60

function socialDisabled(): NextResponse | null {
  if (process.env.VELOR_SOCIAL_ENABLED === 'true') return null
  return NextResponse.json({ error: 'Velor Social is not yet enabled' }, { status: 403 })
}

export async function GET() {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true, name: true, isPublic: true, createdAt: true,
      items: {
        select: {
          productId: true,
          // seller.currency: prices are stored in the SELLER'S currency --
          // every price consumer must convert via lib/useCurrencyDisplay,
          // never print the raw number with a hardcoded symbol (caught live
          // by William 2026-07-29: a $9 USD listing rendered as "£9.00").
          product: { select: { title: true, images: true, price: true, status: true, seller: { select: { currency: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ collections })
}

export async function POST(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))

  // Add-item form: { collectionId, productId }
  if (typeof body.collectionId === 'string' && typeof body.productId === 'string') {
    const collection = await prisma.collection.findFirst({
      where: { id: body.collectionId, userId: session.user.id },
      select: { id: true, _count: { select: { items: true } } },
    })
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    if (collection._count.items >= MAX_ITEMS_PER_COLLECTION) {
      return NextResponse.json({ error: `A collection holds up to ${MAX_ITEMS_PER_COLLECTION} items` }, { status: 400 })
    }
    const product = await prisma.product.findFirst({ where: { id: body.productId, status: 'APPROVED' }, select: { id: true } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    await prisma.collectionItem.upsert({
      where: { collectionId_productId: { collectionId: collection.id, productId: product.id } },
      create: { collectionId: collection.id, productId: product.id },
      update: {},
    })
    await prisma.collection.update({ where: { id: collection.id }, data: { updatedAt: new Date() } })
    return NextResponse.json({ ok: true })
  }

  // Create-collection form: { name }
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME_LEN) : ''
  if (!name) return NextResponse.json({ error: 'Collection name required' }, { status: 400 })
  const filtered = checkMessageContent(name)
  if (filtered.blocked) {
    return NextResponse.json({ error: 'That name is not allowed' }, { status: 400 })
  }
  const count = await prisma.collection.count({ where: { userId: session.user.id } })
  if (count >= MAX_COLLECTIONS_PER_USER) {
    return NextResponse.json({ error: `You can have up to ${MAX_COLLECTIONS_PER_USER} collections` }, { status: 400 })
  }
  const collection = await prisma.collection.create({
    data: { userId: session.user.id, name },
    select: { id: true, name: true, isPublic: true },
  })
  return NextResponse.json({ ok: true, collection })
}

// Toggle a collection's visibility: { collectionId, isPublic }. This is the
// ONLY way isPublic ever changes -- always an explicit, one-collection-at-a-
// time buyer action, never a bulk or default flip. The client shows plain
// copy before this fires ("may appear on the Makers' Circle homepage").
export async function PATCH(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (typeof body.collectionId !== 'string' || !body.collectionId || typeof body.isPublic !== 'boolean') {
    return NextResponse.json({ error: 'collectionId and isPublic required' }, { status: 400 })
  }
  const collection = await prisma.collection.findFirst({
    where: { id: body.collectionId, userId: session.user.id },
    select: { id: true },
  })
  if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  await prisma.collection.update({ where: { id: collection.id }, data: { isPublic: body.isPublic } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))

  // Remove one item: { collectionId, productId }; delete collection: { collectionId }
  if (typeof body.collectionId !== 'string' || !body.collectionId) {
    return NextResponse.json({ error: 'collectionId required' }, { status: 400 })
  }
  const collection = await prisma.collection.findFirst({
    where: { id: body.collectionId, userId: session.user.id },
    select: { id: true },
  })
  if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  if (typeof body.productId === 'string' && body.productId) {
    await prisma.collectionItem.deleteMany({ where: { collectionId: collection.id, productId: body.productId } })
    return NextResponse.json({ ok: true })
  }
  await prisma.collection.delete({ where: { id: collection.id } })
  return NextResponse.json({ ok: true })
}
