import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Workshop Feed (Velor Social stage 5, 2026-07-29). THE FEED IS A VIEW
// OVER MAKER JOURNALS -- it has no posting surface of its own, and per
// LAW #4 item 3 it is STRICTLY CHRONOLOGICAL: no engagement ranking, no
// recommendation model, no personalisation beyond the explicit
// "Following" scope the user chose. Pull-model on Postgres with keyset
// pagination (plan section 7: zero new infrastructure).
//
// Gated by VELOR_SOCIAL_ENABLED like every /api/social route. Only
// PUBLISHED posts from APPROVED sellers are ever served.

const PAGE_SIZE = 10

function socialDisabled(): NextResponse | null {
  if (process.env.VELOR_SOCIAL_ENABLED === 'true') return null
  return NextResponse.json({ error: 'Velor Social is not yet enabled' }, { status: 403 })
}

export async function GET(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') === 'following' ? 'following' : 'all'
  const cursor = searchParams.get('cursor')

  let sellerFilter: { sellerId: { in: string[] } } | Record<string, never> = {}
  if (scope === 'following') {
    const session = await auth()
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) return NextResponse.json({ error: 'Sign in to see makers you follow' }, { status: 401 })
    const follows = await prisma.follow.findMany({ where: { userId }, select: { sellerId: true } })
    if (follows.length === 0) return NextResponse.json({ posts: [], nextCursor: null, followingCount: 0 })
    sellerFilter = { sellerId: { in: follows.map(f => f.sellerId) } }
  }

  const posts = await prisma.journalPost.findMany({
    where: {
      status: 'PUBLISHED',
      seller: { approved: true },
      ...sellerFilter,
    },
    select: {
      id: true,
      title: true,
      body: true,
      images: true,
      videoUrl: true,
      createdAt: true,
      seller: { select: { id: true, storeName: true, storeLogo: true, country: true, foundingBadge: true } },
      product: { select: { id: true, title: true, images: true, status: true } },
    },
    // Chronological, full stop (LAW #4 item 3).
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = posts.length > PAGE_SIZE
  return NextResponse.json({
    posts: posts.slice(0, PAGE_SIZE),
    nextCursor: hasMore ? posts[PAGE_SIZE - 1].id : null,
  })
}
