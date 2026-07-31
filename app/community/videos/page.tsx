// Workshop Videos -- the real video library (2026-07-31, William: "a lot of
// the clickable links/buttons go nowhere" -- Workshop Videos' "View all"
// routed to the generic "being crafted right now" placeholder instead of a
// real page). This widens the same merged real-video query the hub uses
// (JournalPost.videoUrl + Product.videoUrl -- the two real places a seller
// can attach a video, per the 2026-07-30 undercount fix) from a top-8
// preview to a full, filterable library.
//
// "Filterable by craft" uses Product.category, the only real category field
// available (JournalPost has none) -- a journal-sourced video is honestly
// labelled "Journal Story" rather than assigned a fabricated craft category.

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { jpCss } from '../journals/jpStyles'

function publiclyVisibleWhere() {
  return {
    OR: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: new Date() } },
    ],
  }
}

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ category?: string }> }

export default async function WorkshopVideosPage({ searchParams }: Props) {
  const { category } = await searchParams
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Workshop Videos</h1>
          <p className="jp-note" style={{ marginTop: 10 }}>The Makers&rsquo; Circle isn&rsquo;t switched on yet &mdash; check back soon.</p>
        </div>
      </main>
    )
  }

  const [journalVideoPosts, productVideos] = await Promise.all([
    prisma.journalPost.findMany({
      where: { ...publiclyVisibleWhere(), seller: { approved: true }, videoUrl: { not: null } },
      select: {
        id: true,
        title: true,
        images: true,
        createdAt: true,
        seller: { select: { id: true, storeName: true, country: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.product.findMany({
      where: { status: 'APPROVED', seller: { approved: true }, videoUrl: { not: null } },
      select: {
        id: true,
        title: true,
        images: true,
        category: true,
        createdAt: true,
        seller: { select: { id: true, storeName: true, country: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
  ])

  const JOURNAL_CATEGORY = 'Journal Story'
  const merged = [
    ...journalVideoPosts.map((p) => ({
      id: `journal:${p.id}`,
      title: p.title || 'Workshop video',
      image: p.images[0] || null,
      sellerName: p.seller.storeName,
      country: p.seller.country || 'Velor maker',
      href: `/seller/${p.seller.id}`,
      category: JOURNAL_CATEGORY,
      createdAt: p.createdAt,
    })),
    ...productVideos.map((p) => ({
      id: `product:${p.id}`,
      title: p.title,
      image: p.images[0] || null,
      sellerName: p.seller.storeName,
      country: p.seller.country || 'Velor maker',
      href: `/shop/${p.id}`,
      category: p.category,
      createdAt: p.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const categories = Array.from(new Set(merged.map((v) => v.category))).sort((a, b) => a.localeCompare(b))
  const filtered = category ? merged.filter((v) => v.category === category) : merged

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Workshop Videos</span>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ padding: '10px 4px 18px' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>Watch the Work</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            Real films from real workshops &mdash; every video here comes from a maker&rsquo;s own journal entry or
            listing, never stock footage.
          </p>
        </div>

        {merged.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            <Link href="/community/videos" className={category ? 'jp-tab' : 'jp-tab jp-tab-on'}>All</Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/community/videos?category=${encodeURIComponent(c)}`}
                className={category === c ? 'jp-tab jp-tab-on' : 'jp-tab'}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="jp-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="jp-note" style={{ margin: 0 }}>
              {merged.length === 0
                ? 'No workshop videos yet — makers add these from their journal or a listing.'
                : 'No videos in this craft yet — try another category.'}
            </p>
          </div>
        ) : (
          <div className="mc-video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {filtered.map((v) => (
              <Link key={v.id} href={v.href} className="jp-card" style={{ padding: 0, overflow: 'hidden', color: 'inherit', textDecoration: 'none' }}>
                <div style={{ aspectRatio: '4 / 3', background: 'var(--mc-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {v.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.image} alt={v.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="jp-note">No preview</span>
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{v.title}</div>
                  <div className="jp-note" style={{ margin: 0 }}>{v.sellerName} &middot; {v.country}</div>
                  <div className="jp-note" style={{ margin: '4px 0 0', color: 'var(--mc-gold)' }}>{v.category}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
