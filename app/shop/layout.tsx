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
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
