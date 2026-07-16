import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /shop/preview page.tsx
// so this route can carry its own metadata instead of inheriting
// app/shop/layout.tsx's metadata (title "Shop Velor — Authentic Goods from
// Sellers Worldwide" / a description describing the real catalogue), which
// it would otherwise inherit since Next.js metadata inherits down the
// segment tree unless overridden. Added by the standing SEO agent,
// 2026-07-16 -- found while auditing routes added since the last full audit
// (2026-07-15 22:xx UTC); this page did not exist before today (see
// page.tsx's own header comment: built the same day at William's request).
//
// Deliberately set to noindex, nofollow rather than given its own canonical:
// this is a static, seller-facing "how your listing will look" preview
// linked from all 200 open reserved-slot boxes on /shop?origin=CODE (see
// page.tsx's header comment and app/shop/page.tsx's shslots-box Link href),
// built as a recruiting tool for prospective sellers, not content meant for
// organic buyer discovery. Its gallery is entirely placeholder ("Example
// photo" SVG data URIs, explicitly labelled as an example throughout, per
// LAW #1 never implying real inventory) and its structure closely mirrors
// the real /shop/[productId] template -- indexing it under the inherited
// "Shop Velor" title would let a real product-page-shaped, placeholder-only
// page surface in search results next to genuine listings, which is
// misleading for a searcher and thin/duplicate-template content for search
// engines. Same reasoning class as the /apply/invited and /unsubscribe
// noindex fixes (2026-07-12/13): a page with a real, honest purpose that is
// nonetheless not meant for organic search discovery. nofollow (not follow)
// because its three outbound links -- Home (/), /shop, and /sell -- are all
// already indexed and independently discoverable via primary navigation and
// sitemap.xml, so there is no new destination a crawler would discover only
// by following a link from this page (identical reasoning to
// /apply/invited's nofollow choice).

const title = 'Listing Preview — Velor Marketplace'
const description =
  'See how your product listing will look on Velor before you apply — a preview for prospective sellers considering an open founding seat.'

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
}

export default function ShopPreviewLayout({ children }: { children: React.ReactNode }) {
  return children
}
