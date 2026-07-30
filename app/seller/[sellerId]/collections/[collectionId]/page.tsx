import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { jpCss } from '@/app/community/journals/jpStyles'

// A single seller-curated Collection, viewed by buyers (William, 2026-07-30:
// "wired up exactly like Maria's page" -- her design's "Maria's Collections"
// sidebar card links out to a collection view). Reuses the journal page's
// own dark/light design tokens (jpCss) so it feels like part of the same
// journal experience rather than a separate page style. Real products
// only -- an empty or since-unapproved product list shows an honest state,
// never a placeholder.
export const dynamic = 'force-dynamic'

function HeartIco() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21C7 16.5 3.5 13.2 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .8 3.9 2a4.9 4.9 0 0 1 3.9-2 4.6 4.6 0 0 1 4.6 4.6c0 3.6-3.5 6.9-8.5 11.4z" />
    </svg>
  )
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ sellerId: string; collectionId: string }>
}) {
  const { sellerId, collectionId } = await params

  const [seller, collection] = await Promise.all([
    prisma.seller.findFirst({
      where: { id: sellerId, approved: true },
      select: { id: true, storeName: true, currency: true },
    }),
    prisma.sellerCollection.findFirst({
      where: { id: collectionId, sellerId },
      select: { id: true, name: true, productIds: true },
    }),
  ])

  if (!seller || !collection) notFound()

  const products = collection.productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: collection.productIds }, sellerId, status: 'APPROVED' },
        select: { id: true, title: true, price: true, images: true, _count: { select: { wishlistItems: true } } },
      })
    : []

  function money(amount: number): string {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: seller!.currency || 'GBP' }).format(amount)
    } catch {
      return `${seller!.currency || 'GBP'} ${amount.toFixed(2)}`
    }
  }

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link href={`/seller/${seller.id}`}>{seller.storeName}</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">{collection.name}</span>
      </nav>

      <Link href={`/seller/${seller.id}`} className="jp-back">
        &larr; Back to {seller.storeName}
      </Link>

      <div style={{ marginTop: 18, marginBottom: 18 }}>
        <h1 className="jp-title" style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}>{collection.name}</h1>
        <p className="jp-note" style={{ marginTop: 8 }}>
          {products.length} item{products.length === 1 ? '' : 's'} from {seller.storeName}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="jp-note">
          Nothing in this collection right now &mdash; {seller.storeName} may still be adding pieces to it.
        </p>
      ) : (
        <div className="jp-prod-grid">
          {products.map((pr) => (
            <Link key={pr.id} href={`/shop/${pr.id}`} className="jp-prod">
              {pr.images[0]
                ? /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={pr.images[0]} alt={pr.title} loading="lazy" />
                : <span style={{ display: 'block', aspectRatio: '1', background: 'var(--mc-card2)' }} aria-hidden />}
              <span className="jp-prod-name">{pr.title}</span>
              <span className="jp-prod-price">{money(pr.price)}</span>
              <span className="jp-prod-foot">
                <span className="jp-prod-loves"><HeartIco /> {pr._count.wishlistItems}</span>
                <span className="jp-prod-view">View product <span aria-hidden="true">&rarr;</span></span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
