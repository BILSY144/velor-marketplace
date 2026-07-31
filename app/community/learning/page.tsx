// Learning Centre -- the real, fuller lesson library (2026-07-31, William:
// "a lot of the clickable links/buttons go nowhere" -- this box's "View
// all" routed to the generic "being crafted right now" placeholder even
// though the hub card already shows real content).
//
// Same rule as the hub card (app/community/page.tsx's buildLearningItems):
// real seller videos (from JournalPost.videoUrl or Product.videoUrl) fill
// slots first; a small, fixed set of labelled guest craft videos from
// outside Velor only backfill what's left. GUEST_LESSONS is a duplicate of
// the hub's own list (same real, existing YouTube videos -- not invented),
// per this codebase's convention of duplicating small lookup constants
// per-file rather than sharing an import.

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

const GUEST_LESSONS = [
  {
    href: 'https://www.youtube.com/watch?v=LzYDnlQvem0',
    thumb: 'https://img.youtube.com/vi/LzYDnlQvem0/hqdefault.jpg',
    title: 'How Leather Is Still Made Using an Ancient Method',
    country: 'Morocco',
  },
  {
    href: 'https://www.youtube.com/watch?v=LEusHADd6SU',
    thumb: 'https://img.youtube.com/vi/LEusHADd6SU/hqdefault.jpg',
    title: 'Life of a Traditional Japanese Pottery Craftsman',
    country: 'Japan',
  },
  {
    href: 'https://www.youtube.com/watch?v=sJMOrAW1vxw',
    thumb: 'https://img.youtube.com/vi/sJMOrAW1vxw/hqdefault.jpg',
    title: 'Alpaca Wool Clothing From Peru',
    country: 'Peru',
  },
  {
    href: 'https://www.youtube.com/watch?v=5UoZDpXtrPw',
    thumb: 'https://img.youtube.com/vi/5UoZDpXtrPw/hqdefault.jpg',
    title: 'Turkish Carpet Weaving',
    country: 'Turkey',
  },
]

export const dynamic = 'force-dynamic'

export default async function LearningCentrePage() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Learning Centre</h1>
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
      take: 40,
    }),
    prisma.product.findMany({
      where: { status: 'APPROVED', seller: { approved: true }, videoUrl: { not: null } },
      select: {
        id: true,
        title: true,
        images: true,
        createdAt: true,
        seller: { select: { id: true, storeName: true, country: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    }),
  ])

  const realVideos = [
    ...journalVideoPosts.map((p) => ({
      href: `/seller/${p.seller.id}`,
      thumb: p.images[0] || null,
      title: p.title || 'Workshop video',
      sub: `${p.seller.storeName} · ${p.seller.country || 'Velor maker'}`,
      createdAt: p.createdAt,
      source: 'seller' as const,
    })),
    ...productVideos.map((p) => ({
      href: `/shop/${p.id}`,
      thumb: p.images[0] || null,
      title: p.title,
      sub: `${p.seller.storeName} · ${p.seller.country || 'Velor maker'}`,
      createdAt: p.createdAt,
      source: 'seller' as const,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const guest = GUEST_LESSONS.map((g) => ({
    href: g.href, thumb: g.thumb, title: g.title, sub: g.country, source: 'guest' as const,
  }))

  const items = [...realVideos, ...guest]

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Learning Centre</span>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ padding: '10px 4px 22px' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>Learn From the Source</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            Real seller videos fill this list first; a handful of guest craft videos from outside Velor backfill the
            rest &mdash; every card says which. As more makers add their own videos, guest content naturally gets
            crowded out.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="jp-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="jp-note" style={{ margin: 0 }}>Nothing to watch yet &mdash; check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {items.map((l, i) => (
              <Link
                key={l.href + i}
                href={l.href}
                target={l.source === 'guest' ? '_blank' : undefined}
                rel={l.source === 'guest' ? 'noopener noreferrer' : undefined}
                className="jp-card"
                style={{ padding: 0, overflow: 'hidden', color: 'inherit', textDecoration: 'none' }}
              >
                <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'var(--mc-card2)' }}>
                  {l.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.thumb} alt={l.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                  <span
                    className="jp-chip-gold"
                    style={{ position: 'absolute', top: 8, right: 8, background: 'var(--mc-bg)' }}
                  >
                    {l.source === 'seller' ? 'From this seller' : 'Guest video'}
                  </span>
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{l.title}</div>
                  <div className="jp-note" style={{ margin: 0 }}>{l.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
