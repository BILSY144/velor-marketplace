import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductDetail from './ProductDetail'

// Added by the standing SEO agent, 2026-07-17. When app/marketplace/page.tsx
// was turned into a permanentRedirect('/shop') (2026-07-15), this sibling
// dynamic route was deliberately left alone with the stated reason "app/
// search/page.tsx actively links search results to /marketplace/${id}, so
// that route stays live and is out of scope for this fix" (see that file's
// own header comment). That premise is no longer true: this run confirmed
// directly (reading app/search/page.tsx line-for-line) that both of its
// result-card branches now link to `/shop/${item.id}`, not `/marketplace/
// ${item.id}` -- a change made in an unrelated commit reviewed by this
// log's own 2026-07-17 05:xx UTC entry, which did not connect it back to
// this route's indexability. A repo-wide grep confirms zero remaining
// internal `<Link>`/`href` anywhere in app/, components/, or lib/ pointing
// at `/marketplace/${id}` other than MarketplaceGrid.tsx (this page's own
// unimported, dead sibling -- see SEO_LOG.md backlog item 20) and this
// page's own "Back to Marketplace" links (which point at `/marketplace`,
// itself a redirect to /shop -- a self-contained loop, not a real entry
// point). This page has no `layout.tsx` of its own, so it was silently
// inheriting the root layout's generic, indexable "Velor — Global
// Marketplace for Culture & Heritage" title/description -- wrong for a
// specific product page, and it queries the same `prisma.product` table
// `/shop/[productId]` does, so any real APPROVED product is fully
// crawlable/indexable here too: a live duplicate-content risk (two
// indexable URLs for the same listing), not a hypothetical one. Set to
// noindex/nofollow rather than given real per-product metadata: this is
// the same "orphaned, not meant for organic discovery" reasoning already
// applied to /live/[room], /unsubscribe, /apply/invited, and /activate
// (see SEO_LOG.md completed log), not the "wait for a real catalogue"
// reasoning backlog item 8 uses for /shop/[productId] and /seller/
// [sellerId] -- unlike those, this route has no legitimate indexable
// future even once the catalogue is real, since /shop/[productId] is the
// canonical home for that content. `follow: false` because its only
// outbound links (`/marketplace`, `/marketplace/${id}` variants inside
// ProductDetail.tsx, if any) all resolve back into this same
// already-noindexed, already-redirecting subtree -- nothing new for a
// crawler to discover by following them.
export const metadata: Metadata = {
  title: 'Marketplace — Velor',
  robots: { index: false, follow: false },
}

export default async function MarketplaceProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

  const product = await prisma.product.findFirst({
        where: { id, status: 'APPROVED' },
        select: { id: true },
  })

  if (!product) notFound()

  return <ProductDetail id={id} />
}
