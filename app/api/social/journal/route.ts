import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkMessageContent } from '@/lib/messageFilter'
import { imagesToR2 } from '@/lib/r2'

// Maker Journal (Velor Social stage 4, 2026-07-29, plan: "the studio
// journal that sells"). Sellers document their process -- photos, text, a
// video link, optionally tied to one of their own listings. The future
// Workshop Feed is a VIEW over these journals; this route is the only
// posting surface.
//
// Gated by VELOR_SOCIAL_ENABLED like every /api/social route. UGC safety
// per the signed OSA pack (docs/osa/): title+body through the shared
// content filter, images through R2 (never base64 in Postgres), video
// links restricted to YouTube/Vimeo exactly like listings, daily posting
// cap, and every post is reportable (contentType JOURNAL, buttons on the
// public storefront).

const MAX_TITLE_LEN = 120
const MAX_BODY_LEN = 4000
const MAX_IMAGES = 6
const MAX_POSTS_PER_DAY = 10
const MAX_LINKED_PRODUCTS = 4
const MAX_CATEGORY_LEN = 40

// Creator Journals studio statuses (2026-07-30). HIDDEN stays a
// moderation-only state -- sellers can never set or clear it themselves.
const SELLER_STATUSES = ['PUBLISHED', 'DRAFT', 'SCHEDULED', 'ARCHIVED'] as const
type SellerStatus = (typeof SELLER_STATUSES)[number]

// A SCHEDULED entry is publicly live once its moment passes -- read-time
// check, no cron needed.
function publiclyVisibleWhere() {
  return {
    OR: [
      { status: 'PUBLISHED' },
      { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
    ],
  }
}

function parseStatusAndSchedule(body: Record<string, unknown>, opts: { allowArchived: boolean }): { status: SellerStatus; scheduledAt: Date | null } | { error: string } {
  const raw = typeof body.status === 'string' ? body.status.toUpperCase() : 'PUBLISHED'
  if (!SELLER_STATUSES.includes(raw as SellerStatus)) return { error: 'Invalid status' }
  const status = raw as SellerStatus
  if (status === 'ARCHIVED' && !opts.allowArchived) return { error: 'A new entry cannot start archived' }
  if (status === 'SCHEDULED') {
    const when = typeof body.scheduledAt === 'string' ? new Date(body.scheduledAt) : null
    if (!when || Number.isNaN(when.getTime())) return { error: 'Pick a date and time to schedule this entry' }
    if (when.getTime() <= Date.now()) return { error: 'Schedule time must be in the future' }
    return { status, scheduledAt: when }
  }
  return { status, scheduledAt: null }
}

function parseCategory(body: Record<string, unknown>): { category: string | null } | { error: string } {
  const raw = body.category
  const v = typeof raw === 'string' ? raw.trim().slice(0, MAX_CATEGORY_LEN) : ''
  if (!v) return { category: null }
  const check = checkMessageContent(v)
  if (check.blocked) return { error: 'That category name is not allowed' }
  return { category: v }
}
const PUBLIC_PAGE_SIZE = 12

function socialDisabled(): NextResponse | null {
  if (process.env.VELOR_SOCIAL_ENABLED === 'true') return null
  return NextResponse.json({ error: 'Velor Social is not yet enabled' }, { status: 403 })
}

// Same rule as listings (app/api/dashboard/products/route.ts): link-only
// video, YouTube/Vimeo only, so the render side can embed a known-safe
// player.
function normalizeVideoUrl(raw: unknown): { videoUrl: string | null } | { error: string } {
  if (raw === null || raw === undefined || String(raw).trim() === '') return { videoUrl: null }
  const url = String(raw).trim().slice(0, 300)
  const ok = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+|youtube\.com\/shorts\/[\w-]+|vimeo\.com\/\d+)/.test(url)
  if (!ok) return { error: 'Video must be a YouTube or Vimeo link.' }
  return { videoUrl: url }
}

// Optional story sections matching the public journal page's tabs
// (Making process / Notes & tips / Behind the scenes). Same length cap and
// contact-details filter as the main body.
function parseSections(body: Record<string, unknown>): { sections: { makingProcess: string | null; notesTips: string | null; behindScenes: string | null } } | { error: string } {
  const out = { makingProcess: null as string | null, notesTips: null as string | null, behindScenes: null as string | null }
  for (const key of ['makingProcess', 'notesTips', 'behindScenes'] as const) {
    const raw = body[key]
    const v = typeof raw === 'string' ? raw.trim().slice(0, MAX_BODY_LEN) : ''
    if (v) {
      const check = checkMessageContent(v)
      if (check.blocked) {
        return { error: "Journal posts can't include email addresses, phone numbers, website links, or social/messaging handles." }
      }
      out[key] = v
    }
  }
  return { sections: out }
}

// Up to four shoppable listings per entry -- every one must be the
// seller's OWN listing ("Shop products from this journal").
async function parseProductIds(body: Record<string, unknown>, sellerId: string): Promise<string[] | { error: string }> {
  if (!Array.isArray(body.productIds)) return []
  const wanted = (body.productIds as unknown[]).filter((x): x is string => typeof x === 'string' && !!x).slice(0, MAX_LINKED_PRODUCTS)
  if (wanted.length === 0) return []
  const owned = await prisma.product.findMany({ where: { id: { in: wanted }, sellerId }, select: { id: true } })
  const ownedSet = new Set(owned.map((o) => o.id))
  if (wanted.some((w) => !ownedSet.has(w))) return { error: 'You can only link your own listings' }
  return wanted
}

// GET ?sellerId=...&cursor=... -- the public view of one maker's journal
// (their storefront renders this). Only PUBLISHED posts of APPROVED sellers.
// GET with no sellerId (signed-in seller) -- their own posts for the
// dashboard composer page.
export async function GET(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const { searchParams } = new URL(req.url)
  const sellerId = searchParams.get('sellerId')
  const cursor = searchParams.get('cursor')

  if (sellerId) {
    const seller = await prisma.seller.findFirst({ where: { id: sellerId, approved: true }, select: { id: true } })
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    const posts = await prisma.journalPost.findMany({
      where: { sellerId, ...publiclyVisibleWhere() },
      select: {
        id: true, title: true, body: true, images: true, videoUrl: true, createdAt: true,
        makingProcess: true, notesTips: true, behindScenes: true, productIds: true,
        category: true, viewCount: true,
        _count: { select: { likes: true, comments: { where: { status: 'PUBLISHED' } } } },
        product: { select: { id: true, title: true, images: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: PUBLIC_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    const hasMore = posts.length > PUBLIC_PAGE_SIZE
    return NextResponse.json({
      posts: posts.slice(0, PUBLIC_PAGE_SIZE),
      nextCursor: hasMore ? posts[PUBLIC_PAGE_SIZE - 1].id : null,
    })
  }

  // Own posts (dashboard)
  const session = await auth()
  const ownSellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!ownSellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const posts = await prisma.journalPost.findMany({
    where: { sellerId: ownSellerId },
    select: {
      id: true, title: true, body: true, images: true, videoUrl: true, status: true, createdAt: true,
      updatedAt: true, scheduledAt: true, category: true, featured: true,
      viewCount: true, productClicks: true,
      makingProcess: true, notesTips: true, behindScenes: true, productIds: true,
      _count: { select: { likes: true, comments: { where: { status: 'PUBLISHED' } } } },
      product: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Real sales counter: units of each entry's TAGGED listings sold since
  // the entry was created (honest, clearly-defined attribution -- a tagged
  // piece bought after the entry went up). Zero until buyers buy.
  const allTagged = Array.from(new Set(posts.flatMap((p) => p.productIds)))
  const salesByProduct = new Map<string, number>()
  if (allTagged.length > 0) {
    const sold = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { productId: { in: allTagged } },
      _sum: { quantity: true },
    })
    for (const row of sold) salesByProduct.set(row.productId, row._sum.quantity ?? 0)
  }
  const withSales = posts.map((p) => ({
    ...p,
    salesCount: p.productIds.reduce((sum, id) => sum + (salesByProduct.get(id) ?? 0), 0),
  }))
  return NextResponse.json({ posts: withSales })
}

export async function POST(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!sellerId) return NextResponse.json({ error: 'Only sellers can post to a journal' }, { status: 401 })
  const seller = await prisma.seller.findFirst({ where: { id: sellerId, approved: true }, select: { id: true } })
  if (!seller) return NextResponse.json({ error: 'Seller not found or not approved' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  const title = typeof body.title === 'string' ? body.title.trim().slice(0, MAX_TITLE_LEN) : ''
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, MAX_BODY_LEN) : ''
  if (!text) return NextResponse.json({ error: 'Write something about your work first' }, { status: 400 })

  // Same no-contact-details rule as every public UGC surface (William,
  // 2026-07-21: the platform is the channel).
  for (const piece of [title, text]) {
    if (piece) {
      const check = checkMessageContent(piece)
      if (check.blocked) {
        return NextResponse.json({ error: "Journal posts can't include email addresses, phone numbers, website links, or social/messaging handles." }, { status: 400 })
      }
    }
  }

  const vid = normalizeVideoUrl(body.videoUrl)
  if ('error' in vid) return NextResponse.json({ error: vid.error }, { status: 400 })

  const parsedSections = parseSections(body)
  if ('error' in parsedSections) return NextResponse.json({ error: parsedSections.error }, { status: 400 })

  const tagged = await parseProductIds(body, sellerId)
  if (!Array.isArray(tagged)) return NextResponse.json({ error: tagged.error }, { status: 400 })

  const statusParsed = parseStatusAndSchedule(body, { allowArchived: false })
  if ('error' in statusParsed) return NextResponse.json({ error: statusParsed.error }, { status: 400 })

  const catParsed = parseCategory(body)
  if ('error' in catParsed) return NextResponse.json({ error: catParsed.error }, { status: 400 })

  // Optional product tie-in: must be the seller's OWN listing. The primary
  // link stays productId (back-compat); tagged listings ride productIds.
  let productId: string | null = null
  if (typeof body.productId === 'string' && body.productId) {
    const p = await prisma.product.findFirst({ where: { id: body.productId, sellerId }, select: { id: true } })
    if (!p) return NextResponse.json({ error: 'You can only link your own listings' }, { status: 400 })
    productId = p.id
  }
  if (!productId && tagged.length > 0) productId = tagged[0]

  // Posting cap (OSA posture: rate limits on new UGC surfaces from day one).
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const today = await prisma.journalPost.count({ where: { sellerId, createdAt: { gte: dayAgo } } })
  if (today >= MAX_POSTS_PER_DAY) {
    return NextResponse.json({ error: `You can post up to ${MAX_POSTS_PER_DAY} journal entries a day` }, { status: 429 })
  }

  // Images: data URLs from the composer go to R2 (never base64 into
  // Postgres -- the R2 migration rule); already-hosted URLs pass through.
  const rawImages = Array.isArray(body.images)
    ? (body.images as unknown[]).filter((u): u is string => typeof u === 'string' && !!u).slice(0, MAX_IMAGES)
    : []
  const storedImages = await imagesToR2(rawImages, `journal/${sellerId}`)

  const post = await prisma.journalPost.create({
    data: {
      sellerId,
      title: title || null,
      body: text,
      images: storedImages,
      videoUrl: vid.videoUrl,
      productId,
      makingProcess: parsedSections.sections.makingProcess,
      notesTips: parsedSections.sections.notesTips,
      behindScenes: parsedSections.sections.behindScenes,
      productIds: tagged,
      status: statusParsed.status,
      scheduledAt: statusParsed.scheduledAt,
      category: catParsed.category,
    },
    select: { id: true, createdAt: true, status: true },
  })

  // Web bell fan-out (Velor Social plan section 7): every follower of this
  // maker gets the new post in their notification bell. Best-effort -- a
  // fan-out failure never fails the post itself.
  try {
    if (post.status !== 'PUBLISHED') throw new Error('skip-fanout')
    const [follows, sellerRow] = await Promise.all([
      prisma.follow.findMany({ where: { sellerId }, select: { userId: true }, take: 5000 }),
      prisma.seller.findUnique({ where: { id: sellerId }, select: { storeName: true } }),
    ])
    if (follows.length) {
      await prisma.notification.createMany({
        data: follows.map(f => ({
          userId: f.userId,
          type: 'NEW_JOURNAL_POST',
          title: (sellerRow?.storeName || 'A maker you follow') + ' posted from the workshop',
          body: title || text.slice(0, 120),
          href: '/workshop',
        })),
      })
    }
  } catch (err) {
    if (!(err instanceof Error && err.message === 'skip-fanout')) console.error('[journal] bell fan-out failed', err)
  }

  return NextResponse.json({ ok: true, post }, { status: 201 })
}

// PATCH -- edit your own entry (William, 2026-07-30: every seller "can
// edit inside it for their journal"). Same validation as POST; images sent
// as the final array (existing URLs pass through R2 untouched, new photos
// upload). Moderation-hidden posts stay hidden -- editing never republishes.
export async function PATCH(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (typeof body.postId !== 'string' || !body.postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }
  const existing = await prisma.journalPost.findFirst({ where: { id: body.postId, sellerId }, select: { id: true, status: true } })
  if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const title = typeof body.title === 'string' ? body.title.trim().slice(0, MAX_TITLE_LEN) : ''
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, MAX_BODY_LEN) : ''
  if (!text) return NextResponse.json({ error: 'Write something about your work first' }, { status: 400 })
  for (const piece of [title, text]) {
    if (piece) {
      const check = checkMessageContent(piece)
      if (check.blocked) {
        return NextResponse.json({ error: "Journal posts can't include email addresses, phone numbers, website links, or social/messaging handles." }, { status: 400 })
      }
    }
  }

  const vid = normalizeVideoUrl(body.videoUrl)
  if ('error' in vid) return NextResponse.json({ error: vid.error }, { status: 400 })

  const parsedSections = parseSections(body)
  if ('error' in parsedSections) return NextResponse.json({ error: parsedSections.error }, { status: 400 })

  const tagged = await parseProductIds(body, sellerId)
  if (!Array.isArray(tagged)) return NextResponse.json({ error: tagged.error }, { status: 400 })

  const statusParsed = parseStatusAndSchedule(body, { allowArchived: true })
  if ('error' in statusParsed) return NextResponse.json({ error: statusParsed.error }, { status: 400 })

  const catParsed = parseCategory(body)
  if ('error' in catParsed) return NextResponse.json({ error: catParsed.error }, { status: 400 })

  let productId: string | null = null
  if (typeof body.productId === 'string' && body.productId) {
    const p = await prisma.product.findFirst({ where: { id: body.productId, sellerId }, select: { id: true } })
    if (!p) return NextResponse.json({ error: 'You can only link your own listings' }, { status: 400 })
    productId = p.id
  }
  if (!productId && tagged.length > 0) productId = tagged[0]

  const rawImages = Array.isArray(body.images)
    ? (body.images as unknown[]).filter((u): u is string => typeof u === 'string' && !!u).slice(0, MAX_IMAGES)
    : []
  const storedImages = await imagesToR2(rawImages, `journal/${sellerId}`)

  await prisma.journalPost.update({
    where: { id: existing.id },
    data: {
      title: title || null,
      body: text,
      images: storedImages,
      videoUrl: vid.videoUrl,
      productId,
      makingProcess: parsedSections.sections.makingProcess,
      notesTips: parsedSections.sections.notesTips,
      behindScenes: parsedSections.sections.behindScenes,
      productIds: tagged,
      // Moderation always wins: a HIDDEN post stays HIDDEN whatever the
      // seller sends -- editing never resurrects it.
      ...(existing.status === 'HIDDEN'
        ? {}
        : { status: statusParsed.status, scheduledAt: statusParsed.scheduledAt }),
      category: catParsed.category,
    },
  })
  return NextResponse.json({ ok: true })
}

// PUT -- Manage Categories: rename (or clear) one of the seller's journal
// categories across all their entries.
export async function PUT(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const from = typeof body.from === 'string' ? body.from.trim() : ''
  const toRaw = typeof body.to === 'string' ? body.to.trim().slice(0, MAX_CATEGORY_LEN) : ''
  if (!from) return NextResponse.json({ error: 'Category to rename is required' }, { status: 400 })
  if (toRaw) {
    const check = checkMessageContent(toRaw)
    if (check.blocked) return NextResponse.json({ error: 'That category name is not allowed' }, { status: 400 })
  }
  const result = await prisma.journalPost.updateMany({
    where: { sellerId, category: from },
    data: { category: toRaw || null },
  })
  return NextResponse.json({ ok: true, updated: result.count })
}

export async function DELETE(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (typeof body.postId !== 'string' || !body.postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }
  const result = await prisma.journalPost.deleteMany({ where: { id: body.postId, sellerId } })
  if (result.count === 0) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
