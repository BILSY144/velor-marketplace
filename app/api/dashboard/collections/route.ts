import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkMessageContent } from '@/lib/messageFilter'

// Seller-curated public Collections (William, 2026-07-30: "wired up
// exactly like Maria's page" -- Maria's design shows named product
// groupings like "Sacred Valley Collection, 12 items" in the journal
// sidebar; Velor had no feature behind that until now). Managed from the
// "Manage Collections" panel on the Creator Journals dashboard
// (/dashboard/journal), rendered on the seller's journal/storefront page
// (app/seller/[sellerId]/page.tsx -> SellerJournalView). This is NOT the
// buyer-private Collection model elsewhere in the schema -- that one is a
// personal saved-items folder under its own DPIA; this one is pure seller
// merchandising, no personal data involved, so it carries none of that
// model's privacy constraints.

const MAX_NAME_LEN = 60
const MAX_COLLECTIONS = 20
const MAX_PRODUCTS_PER_COLLECTION = 24

async function getSellerId(): Promise<string | null> {
  const session = await auth()
  return (session?.user as { sellerId?: string } | undefined)?.sellerId ?? null
}

function parseName(raw: unknown): { name: string } | { error: string } {
  const name = typeof raw === 'string' ? raw.trim().slice(0, MAX_NAME_LEN) : ''
  if (!name) return { error: 'Give the collection a name.' }
  const check = checkMessageContent(name)
  if (check.blocked) return { error: 'That collection name is not allowed.' }
  return { name }
}

async function parseProductIds(raw: unknown, sellerId: string): Promise<string[] | { error: string }> {
  if (!Array.isArray(raw)) return []
  const wanted = (raw as unknown[]).filter((x): x is string => typeof x === 'string' && !!x).slice(0, MAX_PRODUCTS_PER_COLLECTION)
  if (wanted.length === 0) return []
  const owned = await prisma.product.findMany({ where: { id: { in: wanted }, sellerId }, select: { id: true } })
  const ownedSet = new Set(owned.map((o) => o.id))
  if (wanted.some((w) => !ownedSet.has(w))) return { error: 'You can only add your own listings to a collection.' }
  return wanted
}

// GET -- the signed-in seller's own collections, for the dashboard manager.
export async function GET() {
  const sellerId = await getSellerId()
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collections = await prisma.sellerCollection.findMany({
    where: { sellerId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      productIds: c.productIds,
      createdAt: c.createdAt.toISOString(),
    })),
  })
}

// POST -- create a new collection {name, productIds?}
export async function POST(request: NextRequest) {
  const sellerId = await getSellerId()
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existingCount = await prisma.sellerCollection.count({ where: { sellerId } })
  if (existingCount >= MAX_COLLECTIONS) {
    return NextResponse.json({ error: `You can have up to ${MAX_COLLECTIONS} collections.` }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const parsedName = parseName(body.name)
  if ('error' in parsedName) return NextResponse.json({ error: parsedName.error }, { status: 400 })

  const productIds = await parseProductIds(body.productIds, sellerId)
  if (!Array.isArray(productIds)) return NextResponse.json({ error: productIds.error }, { status: 400 })

  const created = await prisma.sellerCollection.create({
    data: { sellerId, name: parsedName.name, productIds },
  })
  return NextResponse.json({ ok: true, id: created.id })
}

// PATCH -- rename and/or replace the product list {id, name?, productIds?}
export async function PATCH(request: NextRequest) {
  const sellerId = await getSellerId()
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const id = typeof body?.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'Missing collection id' }, { status: 400 })

  const existing = await prisma.sellerCollection.findFirst({ where: { id, sellerId }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  const data: { name?: string; productIds?: string[] } = {}

  if (body && 'name' in body) {
    const parsedName = parseName(body.name)
    if ('error' in parsedName) return NextResponse.json({ error: parsedName.error }, { status: 400 })
    data.name = parsedName.name
  }

  if (body && 'productIds' in body) {
    const productIds = await parseProductIds(body.productIds, sellerId)
    if (!Array.isArray(productIds)) return NextResponse.json({ error: productIds.error }, { status: 400 })
    data.productIds = productIds
  }

  const updated = await prisma.sellerCollection.update({ where: { id }, data })
  return NextResponse.json({ ok: true, id: updated.id })
}

// DELETE -- {id}
export async function DELETE(request: NextRequest) {
  const sellerId = await getSellerId()
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null
  const id = typeof body?.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'Missing collection id' }, { status: 400 })

  const result = await prisma.sellerCollection.deleteMany({ where: { id, sellerId } })
  if (result.count === 0) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
