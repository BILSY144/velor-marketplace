// Creator Journals -- the real, live directory of every maker with a
// published journal (2026-08-01, William: "make the makers circle live
// connected to all sellers, routed, wired correctly ... make this epic
// once and for all"). This route used to render a fixed, non-interactive
// demo of a single made-up seller ("Maria Quispe", William's own design
// file, kept verbatim at his explicit prior instruction) -- with a real
// Q&A/comments system and dozens of real sellers now live, that static
// page was the dead end at the end of the header's "Creator Journals"
// link. This is a real server-rendered grid: every approved seller who
// has at least one publicly visible entry, newest-active first, no
// algorithm, same honest "nothing yet" pattern as the rest of the site.
//
// Reuses the shared jpCss dark/light design tokens from the per-seller
// journal page so the whole journal system (directory -> entry -> Q&A)
// feels like one continuous surface.

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { jpCss } from './jpStyles'
import { countryToCode } from '@/lib/payoutRail'
import FollowSellerButton from '@/components/FollowSellerButton'
import { FounderMedal } from '@/components/FounderMedal'

function flagFor(code: string | null): string {
  if (!code || code.length !== 2) return ''
  const base = 0x1f1e6
  const a = 'A'.charCodeAt(0)
  return String.fromCodePoint(base + code.toUpperCase().charCodeAt(0) - a, base + code.toUpperCase().charCodeAt(1) - a)
}

function timeAgo(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Same "publicly visible" rule as every journal API route: PUBLISHED, or
// SCHEDULED whose moment has already passed.
function publiclyVisibleWhere() {
  return {
    OR: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: new Date() } },
    ],
  }
}

export const dynamic = 'force-dynamic'

export default async function CreatorJournalsDirectory() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Creator Journals</h1>
          <p className="jp-note" style={{ marginTop: 10 }}>Journals aren&rsquo;t switched on yet &mdash; check back soon.</p>
        </div>
      </main>
    )
  }

  const sellers = await prisma.seller.findMany({
    where: { approved: true, journalPosts: { some: publiclyVisibleWhere() } },
    select: {
      id: true,
      storeName: true,
      storeLogo: true,
      country: true,
      foundingBadge: true,
      _count: { select: { followers: true, journalPosts: { where: publiclyVisibleWhere() } } },
      journalPosts: {
        where: publiclyVisibleWhere(),
        select: { title: true, body: true, images: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    take: 200,
  })

  // Most recently active journal first -- real, no invented ranking, same
  // "no algorithm" posture as the Workshop Feed.
  const withLatest = sellers
    .filter((s) => s.journalPosts.length > 0)
    .map((s) => ({ ...s, latest: s.journalPosts[0] }))
    .sort((a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime())

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Creator Journals</span>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ padding: '10px 4px 28px' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>Creator Journals</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            Every maker keeps a real journal of their work &mdash; first orders, failed glazes, finished commissions.
            Browse {withLatest.length > 0 ? `${withLatest.length} real maker${withLatest.length === 1 ? '' : 's'}` : 'the makers'} below, or see every entry from everyone at once in the <Link href="/workshop" className="jp-viewall" style={{ display: 'inline', marginTop: 0 }}>Workshop Feed</Link>.
          </p>
        </div>

        {withLatest.length === 0 ? (
          <div className="jp-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="jp-note" style={{ margin: 0 }}>No maker has published a journal yet &mdash; the first one to write will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {withLatest.map((s) => {
              const code = countryToCode(s.country)
              const flag = flagFor(code)
              const img = s.latest.images[0] || s.storeLogo || null
              return (
                <div key={s.id} className="jp-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <Link href={`/seller/${s.id}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                    <div style={{ aspectRatio: '16 / 10', background: 'var(--mc-card2)', position: 'relative' }}>
                      {img ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={img} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : null}
                    </div>
                    <div style={{ padding: '16px 16px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {s.storeLogo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={s.storeLogo} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #FF8A2B, #FF6B00)', color: '#fff', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {s.storeName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span style={{ fontWeight: 700, fontSize: 14.5 }}>{s.storeName}</span>
                        {s.foundingBadge && <FounderMedal countryName={s.country} size={16} />}
                      </div>
                      <div className="jp-note" style={{ marginBottom: 8 }}>
                        {flag && <span aria-hidden="true">{flag} </span>}{s.country || 'Velor maker'} &middot; {s._count.followers} follower{s._count.followers === 1 ? '' : 's'} &middot; {s._count.journalPosts} entr{s._count.journalPosts === 1 ? 'y' : 'ies'}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{s.latest.title || s.latest.body.slice(0, 60)}</div>
                      <p className="jp-note" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.latest.body}
                      </p>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 16px' }}>
                    <Link href={`/seller/${s.id}`} className="jp-note" style={{ margin: 0 }}>{timeAgo(s.latest.createdAt)}</Link>
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
