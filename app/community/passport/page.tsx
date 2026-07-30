// Maker Passport directory -- the real, live list of every maker who has
// earned a passport (2026-07-30, William: "make a real passport directory
// page. i dont want it to be seen as favouritism. once we have more
// sellers then the ranking system would kick in and favour the sellers
// most active").
//
// Previously the hub's Maker Passport box spotlighted exactly one seller
// (the most-followed real maker) and had no page behind "View all" -- it
// just routed to that one seller's own page, which meant every other
// qualifying maker was invisible and the single spotlighted seller could
// look like a permanent favourite. This is a real directory instead: every
// approved seller who has actually listed a product (the same
// real-activity gate used on the hub) gets their own passport card here,
// ranked by follower count -- the exact same, fully automatic criterion
// the hub spotlight already uses. No manual curation, no fixed "featured
// seller" list. As the community grows and more sellers earn followers
// and post activity, this ranking reorders itself on every page load.
//
// Reuses the journals directory's jpCss design tokens (dark/gold Makers'
// Circle palette) so the passport/journals/hub surfaces read as one
// continuous system.

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { jpCss } from '../journals/jpStyles'
import { countryToCode } from '@/lib/payoutRail'
import FollowSellerButton from '@/components/FollowSellerButton'
import { FounderMedal } from '@/components/FounderMedal'

function flagFor(code: string | null): string {
  if (!code || code.length !== 2) return ''
  const base = 0x1f1e6
  const a = 'A'.charCodeAt(0)
  return String.fromCodePoint(base + code.toUpperCase().charCodeAt(0) - a, base + code.toUpperCase().charCodeAt(1) - a)
}

function publiclyVisibleWhere() {
  return {
    OR: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: new Date() } },
    ],
  }
}

const BADGE_LABEL: Record<string, string> = {
  NEW: 'New Seller',
  ESTABLISHED: 'Established',
  TRUSTED: 'Trusted',
  TOP_RATED: 'Top Rated',
}

export const dynamic = 'force-dynamic'

export default async function MakerPassportDirectory() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Maker Passport</h1>
          <p className="jp-note" style={{ marginTop: 10 }}>The Makers&rsquo; Circle isn&rsquo;t switched on yet &mdash; check back soon.</p>
        </div>
      </main>
    )
  }

  // Same real-activity gate as the hub: admin approval alone isn't enough
  // to earn a passport -- a seller needs to have actually listed something.
  // Ranked purely by follower count, most-followed first -- an automatic,
  // recomputed-every-load ranking, not a fixed or editorial list.
  const sellers = await prisma.seller.findMany({
    where: { approved: true, products: { some: { status: 'APPROVED' } } },
    select: {
      id: true,
      storeName: true,
      storeLogo: true,
      country: true,
      foundingBadge: true,
      sellerBadge: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          journalPosts: { where: publiclyVisibleWhere() },
          orders: { where: { status: 'DELIVERED' } },
        },
      },
    },
    orderBy: { followers: { _count: 'desc' } },
    take: 200,
  })

  // Real video count per seller, merged from both places a seller can
  // attach a video: a journal post, or Product.videoUrl on a listing.
  // Two groupBy queries instead of N+1 per-seller counts.
  const sellerIds = sellers.map((s) => s.id)
  const videoCountBySeller = new Map<string, number>()
  if (sellerIds.length > 0) {
    const [journalVideoCounts, productVideoCounts] = await Promise.all([
      prisma.journalPost.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: sellerIds }, videoUrl: { not: null } },
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: sellerIds }, videoUrl: { not: null }, status: 'APPROVED' },
        _count: { _all: true },
      }),
    ])
    for (const row of journalVideoCounts) {
      videoCountBySeller.set(row.sellerId, (videoCountBySeller.get(row.sellerId) ?? 0) + row._count._all)
    }
    for (const row of productVideoCounts) {
      videoCountBySeller.set(row.sellerId, (videoCountBySeller.get(row.sellerId) ?? 0) + row._count._all)
    }
  }

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Maker Passport</span>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ padding: '10px 4px 28px' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>Maker Passport</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            Every verified maker who has listed at least one product earns a passport: orders completed, followers,
            videos, journal entries, years preserving their craft. Ranked by community following alone &mdash;
            entirely automatic, recalculated on every visit, not chosen by Velor. As more makers join and grow
            their following, this order shifts to favour whoever&rsquo;s most active right now.
          </p>
        </div>

        {sellers.length === 0 ? (
          <div className="jp-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="jp-note" style={{ margin: 0 }}>No maker has earned a passport yet &mdash; the first approved seller to list a product will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {sellers.map((s, i) => {
              const code = countryToCode(s.country)
              const flag = flagFor(code)
              const badge = s.sellerBadge || 'NEW'
              const videos = videoCountBySeller.get(s.id) ?? 0
              return (
                <div key={s.id} className="jp-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--mc-muted)', width: 20, flexShrink: 0 }}>
                      #{i + 1}
                    </span>
                    <Link href={`/seller/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
                      {s.storeLogo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={s.storeLogo} alt={s.storeName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mc-gold)', flexShrink: 0 }} />
                      ) : (
                        <span
                          style={{
                            width: 44, height: 44, borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', background: 'var(--mc-card2)', border: '1.5px solid var(--mc-goldline)',
                            color: 'var(--mc-gold)', fontFamily: 'var(--font-serif)', fontSize: 18, flexShrink: 0,
                          }}
                        >
                          {s.storeName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15.5, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.storeName}
                          {s.foundingBadge && <FounderMedal countryName={s.country} size={15} />}
                        </div>
                        <div className="jp-note" style={{ margin: 0 }}>
                          {flag && <span aria-hidden="true">{flag} </span>}{s.country || 'Velor maker'}
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="jp-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="jp-stat">
                      <span className="jp-stat-num">{s._count.orders}</span>
                      <span className="jp-stat-label">Orders</span>
                    </div>
                    <div className="jp-stat">
                      <span className="jp-stat-num">{s._count.followers}</span>
                      <span className="jp-stat-label">Followers</span>
                    </div>
                    <div className="jp-stat">
                      <span className="jp-stat-num">{videos}</span>
                      <span className="jp-stat-label">Videos</span>
                    </div>
                    <div className="jp-stat">
                      <span className="jp-stat-num">{s._count.journalPosts}</span>
                      <span className="jp-stat-label">Journal</span>
                    </div>
                    <div className="jp-stat">
                      <span className="jp-stat-num">{s.createdAt.getFullYear()}</span>
                      <span className="jp-stat-label">Member Since</span>
                    </div>
                    <div className="jp-stat">
                      <span className="jp-stat-num" style={{ fontSize: 12.5 }}>{BADGE_LABEL[badge] || badge}</span>
                      <span className="jp-stat-label">Badge</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                    <Link href={`/seller/${s.id}`} className="jp-note" style={{ margin: 0 }}>View full passport &rsaquo;</Link>
                    <FollowSellerButton sellerId={s.id} compact />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
