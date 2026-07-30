import { prisma } from '@/lib/prisma'
import { getTheme } from '@/lib/store-themes'
import { auth } from '@/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { countryFlagUrl } from '@/lib/countryFlag'
import { FounderMedal } from '@/components/FounderMedal'
import { SellerWishlistHeart } from '@/components/SellerWishlistHeart'
import FollowSellerButton from '@/components/FollowSellerButton'
import SellerJournalView from '@/app/community/journals/SellerJournalView'
import { OrderStatus } from '@prisma/client'
import { maskPersonalName } from '@/lib/messageIdentity'

const PAID_ORDER_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']

// Shown instead of a bare 404 when a store link points to a seller who
// hasn't finished setup or isn't approved yet — friendlier than a generic
// "page not found" and keeps people inside the Velor experience.
function StoreNotReady() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '18px',
          color: 'var(--accent)',
          letterSpacing: '0.1em',
          marginBottom: '28px',
        }}
      >
        VELOR
      </div>

      <h1
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: '26px',
          margin: '0 0 12px',
        }}
      >
        This store isn&apos;t set up yet
      </h1>

      <p
        style={{
          color: 'var(--muted)',
          fontSize: '15px',
          lineHeight: 1.6,
          maxWidth: '440px',
          margin: '0 0 32px',
        }}
      >
        This seller hasn&apos;t finished setting up their storefront, or it&apos;s still
        awaiting approval. Check back soon, or explore other sellers on Velor.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
        <Link
          href="/shop"
          style={{
            background: 'var(--accent)',
            color: '#000',
            fontWeight: 800,
            fontSize: '15px',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 999,
          }}
        >
          Browse the marketplace
        </Link>
        <Link
          href="/"
          style={{
            background: 'transparent',
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 999,
            border: '1px solid var(--border)',
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'var(--accent)', fontSize: '16px' }}>
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'★'.repeat(5 - full - (half ? 1 : 0))}
      </span>
      <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
        {rating.toFixed(1)} ({count})
      </span>
    </span>
  )
}

// Share cards (Velor Social stage 3, 2026-07-29): storefront links shared
// out render a real preview -- the store's logo or its latest listing photo,
// never an invented image. The seller profile is a followable channel; make
// its link worth sharing.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ sellerId: string }>
}) {
  const { sellerId } = await params
  const s = await prisma.seller.findFirst({
    where: { id: sellerId, approved: true },
    select: {
      storeName: true,
      description: true,
      country: true,
      storeLogo: true,
      products: { where: { status: 'APPROVED' }, select: { images: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!s) return { title: 'Velor — Global Marketplace' }
  const title = `${s.storeName} | Velor`
  const description = (s.description || `${s.storeName}${s.country ? ` — authentic goods from ${s.country}` : ''} on Velor, the global marketplace for culture and heritage.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
  const candidate = [s.storeLogo, ...(s.products[0]?.images || [])].find(u => typeof u === 'string' && u.startsWith('http'))
  const url = `https://velorcommerce.store/seller/${sellerId}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Velor', type: 'website', ...(candidate ? { images: [{ url: candidate, alt: s.storeName }] } : {}) },
    twitter: { card: candidate ? 'summary_large_image' : 'summary', title, description, ...(candidate ? { images: [candidate] } : {}) },
  }
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ sellerId: string }>
}) {
  const { sellerId } = await params

  const seller = await prisma.seller.findFirst({
    where: { id: sellerId, approved: true },
    include: {
      user: { select: { name: true } },
      countryFounded: { select: { countryName: true } },
      products: {
        where: { status: 'APPROVED' },
        include: {
          reviews: { select: { rating: true } },
          _count: { select: { wishlistItems: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!seller) {
    // Public storefronts only render once a seller is approved. If the person
    // hitting this URL is the seller themselves (e.g. clicked "My Store" from
    // the header before approval finished), send them to their dashboard.
    // Anyone else gets a friendly "not set up yet" page instead of a bare 404.
    const session = await auth()
    if (session?.user?.sellerId === sellerId) {
      redirect('/dashboard')
    }
    return <StoreNotReady />
  }

  // Velor Social stage 4 (2026-07-30, William: "get rid of the storefront
  // and have the journal replace it" -- "the whole idea of the buyer
  // interacting with the seller's journal" -- "everything can be accessed
  // through their journal"): once a seller has published a journal entry,
  // THIS page becomes that journal -- the same rich per-entry design the
  // Workshop Feed and Makers' Circle link to, with a genuine Shop section
  // added so buyers never have to leave it to browse or buy. A seller who
  // hasn't written an entry yet keeps the classic storefront below --
  // starting Journal is optional, so nobody is ever left with a dead page
  // just because they haven't tried it.
  if (process.env.VELOR_SOCIAL_ENABLED === 'true') {
    const journalPosts = await prisma.journalPost.findMany({
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

    if (journalPosts.length > 0) {
      const postIds = journalPosts.map((p) => p.id)

      // Whether the signed-in buyer has already liked each entry (William,
      // 2026-07-30: "the heart button at the bottom of my journal page does
      // not work" -- it had no click handler at all; this is the real state
      // now behind it). Empty set for a signed-out visitor -- every entry
      // just renders unliked, same honest pattern as everywhere else here.
      const viewerSession = await auth()
      const likedPostIds = viewerSession?.user?.id
        ? new Set(
            (
              await prisma.journalLike.findMany({
                where: { postId: { in: postIds }, userId: viewerSession.user.id },
                select: { postId: true },
              })
            ).map((l) => l.postId)
          )
        : new Set<string>()

      // Whether the signed-in buyer already likes THIS SELLER (the "Never
      // Miss A Story" card's heart icon, William 2026-08-01 -- previously a
      // dead link to this same page; now a real SellerLike toggle, separate
      // from Follow). False for a signed-out visitor.
      const sellerLikedByMe = viewerSession?.user?.id
        ? Boolean(
            await prisma.sellerLike.findFirst({
              where: { sellerId: seller.id, userId: viewerSession.user.id },
              select: { id: true },
            })
          )
        : false

      const [followers, commentRows, sellerReviewAgg, totalSalesAgg, topReviewRow, liveStream, inboundMessages] = await Promise.all([
        prisma.follow.count({ where: { sellerId: seller.id } }),
        // A handful of real, published comments per entry -- enough for the
        // design's comment list without an unbounded fetch.
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
        // A genuine 5-star (or best-available) review with real written
        // text, used as the "Buyer Love" testimonial -- never fabricated.
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
        // Every buyer message this seller has ever received -- the raw
        // material for a genuine Response rate stat (William, 2026-07-30:
        // "wired up exactly like Maria's page"). Oldest first so the FIRST
        // message from each buyer is easy to find below.
        prisma.message.findMany({
          where: { receiverId: seller.userId },
          select: { senderId: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
      ])

      // Response rate: the real % of buyers this seller has replied to at
      // least once, not a fabricated figure. For every distinct buyer who
      // ever messaged this seller, check whether the seller sent ANY
      // message back to that same buyer after that buyer's first message.
      // No messages ever received -> null ("New"), same honest-empty
      // pattern as avgRating below.
      let responseRate: number | null = null
      if (inboundMessages.length > 0) {
        const firstInboundAt = new Map<string, Date>()
        for (const m of inboundMessages) {
          if (!firstInboundAt.has(m.senderId)) firstInboundAt.set(m.senderId, m.createdAt)
        }
        const buyerIds = Array.from(firstInboundAt.keys())
        const outboundReplies = await prisma.message.findMany({
          where: { senderId: seller.userId, receiverId: { in: buyerIds } },
          select: { receiverId: true, createdAt: true },
        })
        const repliedTo = new Set<string>()
        for (const m of outboundReplies) {
          const firstIn = firstInboundAt.get(m.receiverId)
          if (firstIn && m.createdAt > firstIn) repliedTo.add(m.receiverId)
        }
        responseRate = Math.round((repliedTo.size / buyerIds.length) * 100)
      }

      // "People Also Loved" (Maria's design): the SAME maker's entries
      // surfaced by real engagement rather than recency -- not a
      // cross-seller recommendation engine, which Velor doesn't have. The
      // buyer can switch which entry they're reading client-side without a
      // page reload (SellerJournalView's own currentId state), so this
      // list is a fixed "most-liked from this maker" widget rather than
      // scoped to "other than whichever entry happens to be open" -- there
      // is no single server-known "current entry" to exclude. Derived from
      // journalPosts already fetched above, no extra query.
      const peopleAlsoLoved = journalPosts
        .slice()
        .sort((a, b) => b._count.likes - a._count.likes)
        .slice(0, 3)

      // Specialities live on Product, not Seller -- the "craft" subtitle is
      // derived from what the seller actually lists, never invented.
      const specialityCounts = new Map<string, number>()
      for (const p of seller.products) {
        for (const term of p.specialities) specialityCounts.set(term, (specialityCounts.get(term) ?? 0) + 1)
      }
      const sellerSpecialities = Array.from(specialityCounts.entries()).sort((a, b) => b[1] - a[1]).map(([term]) => term)

      // Every listing tagged across the entries, resolved from the products
      // already fetched above -- no extra query needed.
      const taggedIds = new Set(journalPosts.flatMap((p) => p.productIds))
      const taggedProducts = seller.products.filter((p) => taggedIds.has(p.id))

      // Collections (Maria's design's "Maria's Collections" card, William
      // 2026-07-30: "wired up exactly like Maria's page"): real
      // SellerCollection rows the seller made from the Creator Journals
      // dashboard. Cover image and item count are resolved against the
      // seller's own APPROVED products already fetched above, so a product
      // that's since been removed or unapproved quietly drops out of both
      // the count and the cover -- never an inflated or dead figure.
      const sellerCollectionRows = await prisma.sellerCollection.findMany({
        where: { sellerId: seller.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, productIds: true },
      })
      const productImageById = new Map(seller.products.map((p) => [p.id, p.images[0] || null]))
      const collectionSummaries = sellerCollectionRows.map((c) => {
        const liveProductIds = c.productIds.filter((id) => productImageById.has(id))
        return {
          id: c.id,
          name: c.name,
          itemCount: liveProductIds.length,
          coverImage: liveProductIds.map((id) => productImageById.get(id)).find((img): img is string => Boolean(img)) ?? null,
        }
      })

      // JournalComment has no Prisma relation to User (userId is a bare
      // scalar), so commenter names are resolved with one batched lookup.
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

      const sellerLogo = (seller as unknown as { storeLogo?: string }).storeLogo || null

      return (
        <SellerJournalView
          seller={{
            id: seller.id,
            storeName: seller.storeName,
            description: seller.description,
            country: seller.country,
            storeLogo: sellerLogo,
            foundingBadge: seller.foundingBadge ?? false,
            currency: seller.currency || 'GBP',
            memberSince: seller.createdAt.getFullYear(),
            specialities: sellerSpecialities,
            followers,
            listings: seller.products.length,
            avgRating: sellerReviewAgg._count._all > 0 ? Math.round((sellerReviewAgg._avg.rating ?? 0) * 10) / 10 : null,
            reviewCount: sellerReviewAgg._count._all,
            totalSales: totalSalesAgg._sum?.quantity ?? 0,
            responseRate,
            likedByMe: sellerLikedByMe,
          }}
          posts={journalPosts.map((p) => ({
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
            likedByMe: likedPostIds.has(p.id),
            comments: p._count.comments,
            commentList: commentsByPost[p.id] ?? [],
          }))}
          products={taggedProducts.map((pr) => ({ id: pr.id, title: pr.title, price: pr.price, image: pr.images[0] || null, loves: pr._count.wishlistItems }))}
          allProducts={seller.products.map((pr) => ({ id: pr.id, title: pr.title, price: pr.price, image: pr.images[0] || null, loves: pr._count.wishlistItems }))}
          buyerLove={topReviewRow ? { text: topReviewRow.comment, rating: topReviewRow.rating, name: maskPersonalName(topReviewRow.user.name) } : null}
          live={liveStream ? { title: liveStream.title, roomName: liveStream.roomName, watching: liveStream._count.viewerSessions } : null}
          peopleAlsoLoved={peopleAlsoLoved.map((p) => ({
            id: p.id,
            title: p.title || p.body.slice(0, 44),
            image: p.images[0] || null,
            likes: p._count.likes,
          }))}
          collections={collectionSummaries}
        />
      )
    }
  }

  const theme = getTheme((seller as unknown as { storeTheme?: string }).storeTheme)
  const tk = theme.tokens
  const sellerLogo = (seller as unknown as { storeLogo?: string }).storeLogo || null

  const allReviews = seller.products.flatMap((p) => p.reviews)
  const totalReviews = allReviews.length
  const avgRating =
    totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

  const memberSince = new Date(seller.createdAt).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: tk.bg,
        color: tk.text,
        fontFamily: tk.fontBody,
        ['--bg' as string]: tk.bg,
        ['--surface' as string]: tk.surface,
        ['--border' as string]: tk.border,
        ['--accent' as string]: tk.accent,
        ['--text' as string]: tk.text,
        ['--muted' as string]: tk.muted,
        ['--font-display' as string]: tk.fontDisplay,
        ['--font-body' as string]: tk.fontBody,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '48px 0',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px' }}>
            {/* Avatar */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                color: '#000',
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {sellerLogo ? <img src={sellerLogo} alt={seller.storeName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials(seller.storeName)}

              {/* Founding-seller badge (William, 2026-07-26, "the round
                  founders badge needs to be in the id card or on the
                  listing image small enough to see but not big enough to
                  limit the sellers listing visibility"): placed here on
                  the ID card avatar rather than on listing-tile images --
                  a corner badge on the avatar is always small and never
                  overlaps a product photo, so it can't ever crowd out a
                  listing's own visibility, which the listing-image option
                  risked by nature. Driven purely by Seller.foundingBadge
                  (lib/founding.ts) -- true only for the seller who was
                  first to get an APPROVED listing from their country. */}
              {seller.foundingBadge && (
                <div
                  title="Founding seller -- first to list from their country of origin"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#FFD54A',
                    border: '2px solid var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#000" aria-hidden="true">
                    <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.56 5.82 21 7 14.14l-5-4.87 7.1-1.01L12 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--text)',
                  margin: '0 0 8px 0',
                }}
              >
                {sellerLogo ? '' : seller.storeName}
              </h1>

              {seller.sellerBadge && seller.sellerBadge !== 'NEW' && (() => {
                const b = ({ TOP_RATED: ['Top Rated Seller', '#FFD54A', 'rgba(255,213,74,0.12)'], TRUSTED: ['Trusted Seller', '#C7CDD6', 'rgba(199,205,214,0.12)'], ESTABLISHED: ['Established Seller', '#CD8B5A', 'rgba(205,139,90,0.12)'] } as Record<string, string[]>)[seller.sellerBadge as string]
                if (!b) return null
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '10px', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: b[1], background: b[2], border: '1px solid ' + b[1] + '55' }}>{b[0]}</div>
                )
              })()}

              {totalReviews > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <StarRating rating={avgRating} count={totalReviews} />
                </div>
              )}

              {/* Velor Social (2026-07-29, OSA pack signed + flag flipped):
                  follow this maker. Client component; renders nothing while
                  the feature flag is off, so this page is safe either way. */}
              <div style={{ marginBottom: '12px' }}>
                <FollowSellerButton sellerId={sellerId} />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  flexWrap: 'wrap',
                  fontSize: '13px',
                  color: 'var(--muted)',
                  marginBottom: '14px',
                }}
              >
                {countryFlagUrl(seller.country) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <img
                      src={countryFlagUrl(seller.country)!}
                      alt={seller.country || ''}
                      style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2, display: 'inline-block' }}
                    />
                  </span>
                )}
                <span>{seller.products.length} goods</span>
                <span>Member since {memberSince}</span>
              </div>

              {seller.description && (
                <p
                  style={{
                    color: '#aaa',
                    fontSize: '15px',
                    maxWidth: '560px',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {seller.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 28px 0',
          }}
        >
          Products ({seller.products.length})
        </h2>

        {seller.products.length === 0 ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '15px',
            }}
          >
            No products listed yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {seller.products.map((product) => {
              return (
                <div key={product.id} style={{ position: 'relative' }}>
                <Link
                  href={`/shop/${product.id}`}
                  style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}
                >
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        aspectRatio: '1',
                        background: '#111',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#333',
                            fontSize: '13px',
                          }}
                        >
                          No image
                        </div>
                      )}
                    </div>

                    {/* Info -- brought down to the homepage reel card's
                        compact size (William, 2026-07-26, "homepage size is
                        correct, please replicate to all other pages"):
                        tighter padding, tighter title spacing, and the
                        rating dropped entirely since the homepage card never
                        showed one either. */}
                    <div style={{ padding: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {product.category}
                        </span>
                        {/* Founding-seller medal (William, 2026-07-26, "on
                            the homepage in the id card section ... make it
                            small so it does not take up too much room in the
                            id card"): moved off the listing image into the
                            id card/caption, small -- every product here
                            belongs to this one seller, so the flag is just
                            the seller's own foundingBadge. Same shared
                            medallion as every other listing surface; only
                            the wishlist heart sits on the photo. */}
                        {seller.foundingBadge && (
                          <FounderMedal countryName={seller.countryFounded?.countryName} size={28} />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: '8px',
                          lineHeight: 1.3,
                        }}
                      >
                        {product.title}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: 800,
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {/* Prices are stored in the SELLER'S currency
                              (CLAUDE.md price-display rule, 2026-07-29) --
                              this previously hardcoded GBP and showed a
                              USD listing as pounds. Server components can't
                              read the visitor's display currency, so show
                              the honest listed price in its real currency;
                              the PDP converts per-visitor. */}
                          {new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: (seller.currency || 'GBP').toUpperCase(),
                          }).format(product.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <SellerWishlistHeart productId={product.id} />
                </div>
              )
            })}
          </div>
        )}

        {/* No Maker Journal widget here: this classic layout only ever
            renders when the seller has zero published journal entries (see
            the branch above) -- so a journal section here would always be
            empty. The moment they publish their first entry, this whole
            page becomes the rich journal view instead. */}
      </div>
    </div>
  )
}
