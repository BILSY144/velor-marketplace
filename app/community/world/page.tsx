// Around the World -- the real country directory (2026-07-31, William: "a
// lot of the clickable links/buttons go nowhere" -- Around the World's
// "View all" and "Explore Map" both routed to the generic "being crafted
// right now" placeholder). This is the real page: every country with at
// least one approved seller who has actually listed a product, ranked by
// maker count, with real per-country maker/product/live-now counts.
//
// No interactive globe/map exists (a real cartographic map is a bigger,
// separate build) so this is honestly presented as a full directory rather
// than a fake "map" -- the placeholder's own promise ("map every live
// seller, journal and product around the world") is met by making the full
// real breakdown genuinely browsable, not by faking a map widget.
//
// Reuses the same real-activity gate and country aggregation the hub
// (app/community/page.tsx) already uses, just expanded from a top-6
// spotlight to the full list, and adds real per-country product/live-now
// counts the hub doesn't surface. Each country links to its own real,
// already-live shopping channel at /shop?origin=CODE.

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

export default async function AroundTheWorldPage() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Around the World</h1>
          <p className="jp-note" style={{ marginTop: 10 }}>The Makers&rsquo; Circle isn&rsquo;t switched on yet &mdash; check back soon.</p>
        </div>
      </main>
    )
  }

  // Same real-activity gate used everywhere else on the Makers' Circle: a
  // seller must be admin-approved AND have actually listed a product.
  const sellers = await prisma.seller.findMany({
    where: { approved: true, products: { some: { status: 'APPROVED' } } },
    select: { id: true, country: true },
  })
  const sellerIds = sellers.map((s) => s.id)
  const countryBySeller = new Map<string, string>(sellers.map((s) => [s.id, s.country || 'Unlisted']))

  const [productCounts, liveCounts] = await Promise.all([
    sellerIds.length > 0
      ? prisma.product.groupBy({
          by: ['sellerId'],
          where: { sellerId: { in: sellerIds }, status: 'APPROVED' },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    sellerIds.length > 0
      ? prisma.liveStream.groupBy({
          by: ['sellerId'],
          where: { sellerId: { in: sellerIds }, status: 'LIVE' },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ])

  type CountryStats = { name: string; cc: string | null; makers: number; products: number; liveNow: number }
  const byCountry = new Map<string, CountryStats>()
  for (const s of sellers) {
    const name = s.country || 'Unlisted'
    const row = byCountry.get(name) ?? { name, cc: countryToCode(s.country), makers: 0, products: 0, liveNow: 0 }
    row.makers += 1
    byCountry.set(name, row)
  }
  for (const row of productCounts) {
    const name = countryBySeller.get(row.sellerId) ?? 'Unlisted'
    const c = byCountry.get(name)
    if (c) c.products += row._count._all
  }
  for (const row of liveCounts) {
    const name = countryBySeller.get(row.sellerId) ?? 'Unlisted'
    const c = byCountry.get(name)
    if (c) c.liveNow += row._count._all
  }

  const countries = Array.from(byCountry.values()).sort((a, b) => b.makers - a.makers)
  const totals = {
    countries: countries.length,
    makers: sellers.length,
    products: productCounts.reduce((n, r) => n + r._count._all, 0),
    liveNow: liveCounts.reduce((n, r) => n + r._count._all, 0),
  }

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Around the World</span>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ padding: '10px 4px 22px' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>The Map of Makers</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            Every country with at least one verified maker who has listed a product on Velor, ranked by how many
            makers call it home. Real counts, updated on every visit &mdash; pick a country to shop its channel.
          </p>
        </div>

        <div className="jp-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: 560, marginBottom: 26 }}>
          <div className="jp-stat"><span className="jp-stat-num">{totals.countries}</span><span className="jp-stat-label">Countries</span></div>
          <div className="jp-stat"><span className="jp-stat-num">{totals.makers}</span><span className="jp-stat-label">Makers</span></div>
          <div className="jp-stat"><span className="jp-stat-num">{totals.liveNow}</span><span className="jp-stat-label">Live Now</span></div>
          <div className="jp-stat"><span className="jp-stat-num">{totals.products}</span><span className="jp-stat-label">Products</span></div>
        </div>

        {countries.length === 0 ? (
          <div className="jp-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="jp-note" style={{ margin: 0 }}>No makers have listed a product yet &mdash; the first country appears here the moment one does.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {countries.map((c) => {
              const flag = flagFor(c.cc)
              return (
                <Link
                  key={c.name}
                  href={c.cc ? `/shop?origin=${c.cc}` : '/shop'}
                  className="jp-card"
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'inherit', textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {flag && <span style={{ fontSize: 24 }} aria-hidden="true">{flag}</span>}
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}>{c.name}</span>
                    {c.liveNow > 0 && <span className="jp-chip-gold" style={{ marginLeft: 'auto' }}>{c.liveNow} live</span>}
                  </div>
                  <div className="jp-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="jp-stat">
                      <span className="jp-stat-num">{c.makers}</span>
                      <span className="jp-stat-label">Maker{c.makers === 1 ? '' : 's'}</span>
                    </div>
                    <div className="jp-stat">
                      <span className="jp-stat-num">{c.products}</span>
                      <span className="jp-stat-label">Product{c.products === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
