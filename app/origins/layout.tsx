import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /origins page.tsx (the
// buyer-facing, shopping-oriented index of all 190 countries -- companion to
// /founding, which is seller-recruitment-facing) so this route carries its
// own metadata instead of inheriting the generic root title/description.
//
// Added by the standing SEO agent, 2026-07-13. /origins and /origins/[slug]
// (see app/origins/[slug]/layout.tsx, added in the same pass) were built by
// a separate interactive session earlier the same day (commit a62357e,
// "Build /origins and /origins/[slug] buyer-facing lattice pages") and
// shipped with zero metadata of their own -- confirmed via `find app/origins
// -type f` returning only the two 'use client' page.tsx files, no layout.
//
// Canonical is safe to set here (unlike /shop/layout.tsx, which deliberately
// omits one -- see backlog item 2): /origins/[slug] gets its own
// generateMetadata with its own per-country canonical in the sibling layout,
// so there is no inheritance leak the way there would be for /shop/[productId]
// (which still has no metadata of its own).

const title = 'Shop by Origin | 190 Countries — Velor'
const description =
  'Browse Velor by country of origin. Every listing carries its maker and its origin — shop authentic culture and heritage goods, or see which of 190 countries are still an open seat for a founding seller.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/origins' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/origins',
    siteName: 'Velor',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function OriginsLayout({ children }: { children: React.ReactNode }) {
  return children
}
