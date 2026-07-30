import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import Link from 'next/link'
import SellerJournalView from '../SellerJournalView'
import { maskPersonalName } from '@/lib/messageIdentity'

// The REAL per-seller journal page in William's journal-page design --
// what the showcase at /community/journals demonstrates, filled with a
// living seller's actual published entries. "View as buyer" on the
// Creator Journals dashboard lands here (William, 2026-07-30: "when i
// click as view as buyer button it doesnt show me a sellers journal page
// like we designed"). Placeholder-free: every figure is real; sections a
// seller hasn't written yet render as honest awaiting-content slots.
//
// 2026-07-30 (later): William supplied the design a second time with
// "exactly the same design, pixel for pixel exact dimentions" -- this
// server component was extended to fetch the additional REAL data the
// full design calls for (seller rating, sales, live comments, a live
// broadcast if one is running, a genuine buyer testimonial, other
// makers' recent entries) so SellerJournalView can render every section
// of the design without inventing a single figure. Anything the design
// shows that has no honest real-data source on Velor today (a
// "Response rate" stat, a seller-curated "Collections" showcase) is
// deliberately reshaped or omitted rather than faked -- see
// SellerJournalView's own comments for exactly where and why.

export const dynamic = 'force-dynamic'

function NoJournalYet({ storeName }: { storeName?: string }) {
  return (
    <main style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg)', color: 'var(--text)', textAlign: 'center', padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 26 }}>{storeName ? `${storeName}'s journal is just beginning` : 'This journal is just beginning'}</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 460, lineHeight: 1.6, margin: 0 }}>
        No entries have been published yet. Follow the maker on their storefront and the first story will find you.
      </p>
      <Link href="/community" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Back to The Makers&rsquo; Circle &rarr;</Link>
    </main>
  )
}

const PAID_ORDER_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default async function SellerJournalPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params
  if (process.env.VELOR_SOCIAL_ENABLED !== 'true') return <NoJournalYet />

  const seller = await prisma.seller.findFirst({
    where: { id: sellerId, approved: true },
    select: {
      id: true, storeName: true, description: true, country: true,
      storeLogo: true, foundingBadge: true, createdAt: true, currency: true,
    },
  })
  if (!seller) return <NoJournalYet />

  const posts = await prisma.journalPost.findMany({
    where: {
      sellerId: seller.id,
      OR: [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
      ],
    },
    select: {
      id: true, title: true, body: true, images: true, videoUrl: true,
      createdAt: true, category: true, viewCount: true,
      makingProcess: true, notesTips: true, behindScenes: true, productIds: true,
      _count: { select: { likes: true, comments: { where: { status: 'PUBLISHED' } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  if (posts.length === 0) return <NoJournalYet storeName={seller.storeName} />

  const postIds = posts.map((p) => p.id)

  const [
    followers,
    listings,
    commentRows,
    sellerReviewAgg,
    totalSalesAgg,
    topReviewRow,
    liveStream,
    otherMakerPosts,
    sellerProductSpecialities,
  ] = await Promise.all([
    prisma.follow.count({ where: { sellerId: seller.id } }),
    prisma.product.count({ where: { sellerId: seller.id, status: 'APPROVED' } }),
    // A handful of real, published comments per entry -- enough for the
    // design's comment list without an unbounded fetch. Entry-switching
    // happens client-side, so every entry's comments are fetched up front.
    prisma.journalComment.findMany({
      where: { postId: { in: postIds }, status: 'PUBLISHED' },
      select: { id: true, postId: true, body: true, createdAt: true, userId: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
      where: { product: { sellerId: seller.id } },
    }),
    prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: { product: { sellerId: seller.id }, order: { status: { in: PAID_ORDER_STATUSES } } },
    }),
    // A genuine 5-star (or best-available) review with real written text,
    // used as the "Buyer Love" testimonial -- never a fabricated quote.
    prisma.review.findFirst({
      where: { product: { sellerId: seller.id }, comment: { not: '' } },
      select: { comment: true, rating: true, user: { select: { name: true } } },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.liveStream.findFirst({
      where: { sellerId: seller.id, status: 'LIVE' },
      select: {
        id: true, title: true, roomName: true, startedAt: true,
        _count: { select: { viewerSessions: { where: { leftAt: null } } } },
      },
      orderBy: { startedAt: 'desc' },
    }),
    // Other makers' recent published entries -- the honest substitute for
    // the design's "People Also Loved" cross-recommendation card, which
    // has no real recommendation engine behind it on Velor today.
    prisma.journalPost.findMany({
      where: {
        sellerId: { not: seller.id },
        seller: { approved: true },
        OR: [
          { status: 'PUBLISHED' },
          { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
        ],
      },
      select: {
        id: true, title: true, body: true, images: true, sellerId: true,
        seller: { select: { storeName: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    // Specialities live on Product, not Seller -- the "craft" subtitle on
    // the maker card is derived from what the seller actually lists,
    // never invented or stored on the seller record itself.
    prisma.product.findMany({
      where: { sellerId: seller.id, status: 'APPROVED' },
      select: { specialities: true },
      take: 50,
    }),
  ])

  const specialityCounts = new Map<string, number>()
  for (const p of sellerProductSpecialities) {
    for (const term of p.specialities) specialityCounts.set(term, (specialityCounts.get(term) ?? 0) + 1)
  }
  const sellerSpecialities = Array.from(specialityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)

  // Every listing tagged across the entries, resolved once.
  const taggedIds = Array.from(new Set(posts.flatMap((p) => p.productIds)))
  const products = taggedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: taggedIds }, sellerId: seller.id, status: 'APPROVED' },
        select: { id: true, title: true, price: true, images: true, _count: { select: { wishlistItems: true } } },
      })
    : []

  // JournalComment has no Prisma relation to User (userId is a bare scalar),
  // so commenter names are resolved with one batched lookup rather than a
  // per-comment join.
  const commenterIds = Array.from(new Set(commentRows.map((c) => c.userId)))
  const commenters = commenterIds.length
    ? await prisma.user.findMany({ where: { id: { in: commenterIds } }, select: { id: true, name: true } })
    : []
  const commenterNames = new Map(commenters.map((u) => [u.id, u.name]))

  const commentsByPost: Record<string, { id: string; body: string; createdAt: string; name: string }[]> = {}
  for (const c of commentRows) {
    const arr = commentsByPost[c.postId] ?? (commentsByPost[c.postId] = [])
    if (arr.length < 5) arr.push({ id: c.id, body: c.body, createdAt: c.createdAt.toISOString(), name: maskPersonalName(commenterNames.get(c.userId) ?? null) })
  }

  return (
    <SellerJournalView
      seller={{
        id: seller.id,
        storeName: seller.storeName,
        description: seller.description,
        country: seller.country,
        storeLogo: seller.storeLogo,
        foundingBadge: seller.foundingBadge ?? false,
        currency: seller.currency || 'GBP',
        memberSince: seller.createdAt.getFullYear(),
        specialities: sellerSpecialities,
        followers,
        listings,
        avgRating: sellerReviewAgg._count._all > 0 ? Math.round((sellerReviewAgg._avg.rating ?? 0) * 10) / 10 : null,
        reviewCount: sellerReviewAgg._count._all,
        totalSales: totalSalesAgg._sum?.quantity ?? 0,
      }}
      posts={posts.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        images: p.images,
        videoUrl: p.videoUrl,
        createdAt: p.createdAt.toISOString(),
        category: p.category,
        viewCount: p.viewCount,
        makingProcess: p.makingProcess,
        notesTips: p.notesTips,
        behindScenes: p.behindScenes,
        productIds: p.productIds,
        likes: p._count.likes,
        comments: p._count.comments,
        commentList: commentsByPost[p.id] ?? [],
      }))}
      products={products.map((pr) => ({ id: pr.id, title: pr.title, price: pr.price, image: pr.images[0] || null, loves: pr._count.wishlistItems }))}
      buyerLove={topReviewRow ? { text: topReviewRow.comment, rating: topReviewRow.rating, name: maskPersonalName(topReviewRow.user.name) } : null}
      live={liveStream ? { title: liveStream.title, roomName: liveStream.roomName, watching: liveStream._count.viewerSessions } : null}
      otherMakerPosts={otherMakerPosts.map((p) => ({
        id: p.id,
        sellerId: p.sellerId,
        storeName: p.seller.storeName,
        title: p.title || p.body.slice(0, 44),
        image: p.images[0] || null,
        likes: p._count.likes,
      }))}
    />
  )
}
