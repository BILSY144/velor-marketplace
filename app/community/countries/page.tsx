// Follow Countries -- the real country browse page (2026-07-31, William:
// "a lot of the clickable links/buttons go nowhere" -- this box's "View
// all" routed to the generic "being crafted right now" placeholder).
//
// Honesty note: there is no persisted "follow a country" feature yet (only
// following a SELLER exists -- see the Follow Prisma model). Rather than
// fake a "Follow" button that doesn't actually do anything, this page says
// so plainly and offers the real thing that exists today: browsing every
// country's real, live shopping channel. Same real per-country seller-count
// data as Around the World (app/community/world/page.tsx), duplicated here
// per this codebase's convention rather than shared, since the two pages
// present it differently.

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { jpCss } from '../journals/jpStyles'
import { countryToCode } from '@/lib/payoutRail'

function flagFor(code: string | null): string {
  if (!code || code.length !== 2) return ''
  const base = 0x1f1e6
  const a = 'A'.charCodeAt(0)
  return String.fromCodePoint(base + code.toUpperCase().charCodeAt(0) - a, base + code.toUpperCase().charCodeAt(1) - a)
}

export const dynamic = 'force-dynamic'

export default async function FollowCountriesPage() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Follow Countries</h1>
          <p className="jp-note" style={{ marginTop: 10 }}>The Makers&rsquo; Circle isn&rsquo;t switched on yet &mdash; check back soon.</p>
        </div>
      </main>
    )
  }

  const sellers = await prisma.seller.findMany({
    where: { approved: true, products: { some: { status: 'APPROVED' } } },
    select: { country: true },
  })
  const countryCounts = new Map<string, number>()
  for (const s of sellers) {
    if (!s.country) continue
    countryCounts.set(s.country, (countryCounts.get(s.country) ?? 0) + 1)
  }
  const countries = Array.from(countryCounts.entries())
    .map(([name, count]) => ({ name, cc: countryToCode(name), count }))
    .sort((a, b) => b.count - a.count)

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Follow Countries</span>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ padding: '10px 4px 22px' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>Your World, Your Feed</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            Following a country&rsquo;s newest makers, pieces and journals is coming soon. For today, every country
            already has its own real shopping channel &mdash; browse any of them below.
          </p>
        </div>

        {countries.length === 0 ? (
          <div className="jp-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="jp-note" style={{ margin: 0 }}>No countries yet &mdash; the first appears here once a maker lists a product.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {countries.map((c) => {
              const flag = flagFor(c.cc)
              return (
                <Link
                  key={c.name}
                  href={c.cc ? `/shop?origin=${c.cc}` : '/shop'}
                  className="jp-card"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}
                >
                  {flag && <span style={{ fontSize: 20 }} aria-hidden="true">{flag}</span>}
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14.5, flex: 1 }}>{c.name}</span>
                  <span className="jp-chip-gold">{c.count} maker{c.count === 1 ? '' : 's'}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
