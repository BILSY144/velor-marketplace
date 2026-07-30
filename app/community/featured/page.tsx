// Featured Today -- the real, live front page of the Makers' Circle
// (2026-08-01, William: "make the makers circle live connected to all
// sellers, routed, wired correctly ... make this epic once and for all").
// Previously this URL had no dedicated page and fell through to the
// honest "being built" placeholder. Composed entirely from real, already-
// live data -- no invented "featured" algorithm, no fabricated content:
// sellers live on air right now, the freshest published journal entries,
// and the newest real Q&A activity across the marketplace. Each section
// links to its own full real page (/live, the Creator Journals directory,
// Ask The Maker).

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { jpCss } from '../journals/jpStyles'
import { maskPersonalName } from '@/lib/messageIdentity'

function timeAgo(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function publiclyVisibleWhere() {
  return {
    OR: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: new Date() } },
    ],
  }
}

export const dynamic = 'force-dynamic'

export default async function FeaturedTodayPage() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Featured Today</h1>
          <p className="jp-note" style={{ marginTop: 10 }}>The front page isn&rsquo;t switched on yet &mdash; check back soon.</p>
        </div>
      </main>
    )
  }

  const [liveNow, freshPosts, latestQuestions] = await Promise.all([
    prisma.liveStream.findMany({
      where: { status: 'LIVE', seller: { approved: true } },
      select: {
        id: true, title: true, roomName: true, startedAt: true,
        seller: { select: { id: true, storeName: true, storeLogo: true } },
        _count: { select: { viewerSessions: { where: { leftAt: null } } } },
      },
      orderBy: { startedAt: 'desc' },
      take: 6,
    }),
    prisma.journalPost.findMany({
      where: { ...publiclyVisibleWhere(), seller: { approved: true } },
      select: {
        id: true, title: true, body: true, images: true, createdAt: true,
        seller: { select: { id: true, storeName: true, storeLogo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.sellerQuestion.findMany({
      where: { status: 'PUBLISHED', seller: { approved: true } },
      select: {
        id: true, body: true, askerId: true, createdAt: true,
        seller: { select: { id: true, storeName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const askerIds = Array.from(new Set(latestQuestions.map((q) => q.askerId)))
  const askers = askerIds.length ? await prisma.user.findMany({ where: { id: { in: askerIds } }, select: { id: true, name: true } }) : []
  const nameById = new Map(askers.map((a) => [a.id, a.name]))

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Featured Today</span>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ padding: '10px 4px 0' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>Featured Today</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            A real front page for the community: makers live on air right now, the freshest journal entries, and the newest questions buyers are asking &mdash; nothing here is fabricated or ranked, just what&rsquo;s genuinely happening today.
          </p>
        </div>

        {/* Live now */}
        <section className="jp-section">
          <div className="jp-sechead">
            <h2 className="jp-sectitle">Live Now</h2>
            <Link href="/live" className="jp-viewall">See the live channel <span aria-hidden="true">&rarr;</span></Link>
          </div>
          {liveNow.length === 0 ? (
            <p className="jp-note" style={{ margin: 0 }}>No maker is live right now &mdash; check the live channel to see who&rsquo;s on next.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {liveNow.map((l) => (
                <Link key={l.id} href={`/live/${l.roomName}`} className="jp-card" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--red)' }}>Live</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{l.title}</div>
                  <div className="jp-note">{l.seller.storeName} &middot; {l._count.viewerSessions} watching</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Fresh journal entries */}
        <section className="jp-section">
          <div className="jp-sechead">
            <h2 className="jp-sectitle">Fresh From The Workshop</h2>
            <Link href="/community/journals" className="jp-viewall">Browse all journals <span aria-hidden="true">&rarr;</span></Link>
          </div>
          {freshPosts.length === 0 ? (
            <p className="jp-note" style={{ margin: 0 }}>No journal entries have been published yet &mdash; the first one will appear here.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {freshPosts.map((p) => (
                <Link key={p.id} href={`/seller/${p.seller.id}`} className="jp-card" style={{ padding: 0, overflow: 'hidden', color: 'inherit', textDecoration: 'none' }}>
                  <div style={{ aspectRatio: '4 / 3', background: 'var(--mc-card2)' }}>
                    {p.images[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.images[0]} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.title || p.body.slice(0, 50)}</div>
                    <div className="jp-note">{p.seller.storeName} &middot; {timeAgo(p.createdAt)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Latest Q&A */}
        <section className="jp-section" style={{ marginBottom: 40 }}>
          <div className="jp-sechead">
            <h2 className="jp-sectitle">Questions Buyers Are Asking</h2>
            <Link href="/community/ask" className="jp-viewall">See all Q&amp;A <span aria-hidden="true">&rarr;</span></Link>
          </div>
          {latestQuestions.length === 0 ? (
            <p className="jp-note" style={{ margin: 0 }}>No questions have been asked yet &mdash; the first one will appear here.</p>
          ) : (
            <div className="jp-comments">
              {latestQuestions.map((q) => (
                <Link key={q.id} href={`/seller/${q.seller.id}#ask-the-maker`} className="jp-comment" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <span className="jp-comment-avatar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mc-card2)', color: 'var(--mc-gold)' }} aria-hidden="true">?</span>
                  <div className="jp-comment-body">
                    <div className="jp-comment-top">
                      <span className="jp-comment-name">{maskPersonalName(nameById.get(q.askerId) ?? null)} asked {q.seller.storeName}</span>
                      <span className="jp-comment-time">{timeAgo(q.createdAt)}</span>
                    </div>
                    <p className="jp-comment-text">{q.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
