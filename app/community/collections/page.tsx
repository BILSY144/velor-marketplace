// Buyer's Collections -- the real public collections directory (2026-07-31,
// William: "a lot of the clickable links/buttons go nowhere" -- this box's
// "View all" routed to the generic "being crafted right now" placeholder
// even though the hub card beside it already shows real public collections).
//
// Only ever shows a collection its owner explicitly made public via the
// toggle on their own collections page (app/account/collections/page.tsx) --
// same gate as the hub preview, just widened from take:4 to a full grid.
// Buyer names stay masked (maskPersonalName), same as everywhere else.

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { jpCss } from '../journals/jpStyles'
import { maskPersonalName } from '@/lib/messageIdentity'

export const dynamic = 'force-dynamic'

export default async function BuyersCollectionsPage() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Buyer&rsquo;s Collections</h1>
          <p className="jp-note" style={{ marginTop: 10 }}>The Makers&rsquo; Circle isn&rsquo;t switched on yet &mdash; check back soon.</p>
        </div>
      </main>
    )
  }

  const rows = await prisma.collection.findMany({
    where: { isPublic: true, items: { some: {} } },
    select: {
      id: true,
      name: true,
      user: { select: { name: true } },
      items: {
        select: { product: { select: { images: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 60,
  })

  const collections = rows.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.items[0]?.product.images[0] || null,
    itemCount: c._count.items,
    by: maskPersonalName(c.user.name),
  }))

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Buyer&rsquo;s Collections</span>
      </nav>

      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ padding: '10px 4px 22px' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>Curate the World</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            Real collections buyers have chosen to share &mdash; a dream kitchen, a gallery wall, gifts to come back
            to. Only ever shown here once a buyer explicitly makes a collection public from their own account.
          </p>
          <Link href="/account/collections" className="jp-viewall" style={{ marginTop: 12 }}>
            My collections <span aria-hidden="true">&rsaquo;</span>
          </Link>
        </div>

        {collections.length === 0 ? (
          <div className="jp-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="jp-note" style={{ margin: 0 }}>No public collections yet &mdash; buyers can share one from their own collections page.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {collections.map((c) => (
              <div key={c.id} className="jp-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '1 / 1', background: 'var(--mc-card2)' }}>
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                  <div className="jp-note" style={{ margin: 0 }}>{c.itemCount} item{c.itemCount === 1 ? '' : 's'} &middot; by {c.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
