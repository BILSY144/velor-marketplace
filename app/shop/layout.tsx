import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /shop page.tsx (and its
// /shop/[productId] child route, which has no metadata of its own yet) so
// this section carries its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. Per-product metadata (pulling each product's
// own title/description/image) is a separate, larger follow-up logged to
// the backlog — it needs a dynamic generateMetadata with a DB read, not a
// static layout like this one.

const title = 'Shop Velor — Authentic Goods from Sellers Worldwide'
const description =
  'Browse the full Velor catalogue — ceramics, textiles, food, adornment and craft from independent sellers around the world. Filter by country or speciality; every listing carries its maker and its origin.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/shop',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale (vercel/next.js#50353: an explicit openGraph
    // object replaces the whole object, dropping the root file-convention
    // image unless listed here). This one field is safe to let
    // /shop/[productId] inherit too (unlike the canonical, deliberately not
    // set here per backlog item 2) -- a generic brand image asserts no false
    // per-product fact, it is simply a better fallback than no image at all.
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
