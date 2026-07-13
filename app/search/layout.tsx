import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /search page.tsx so
// this route can carry its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 3 follow-up ("audit /search, /legal/*, /contact,
// /terms for their own metadata + canonical before ever adding one to root
// app/layout.tsx"). Copy is drawn directly from the live page's own hero
// ("Search the world.") already on the page.
//
// Deliberately set to noindex, follow rather than given a canonical: this is
// a query-param-driven internal search page (?q=...), and indexing every
// query variation as its own page is thin/duplicate content by definition —
// noindexing internal site-search result pages is standard, uncontroversial
// SEO practice (this is the same category of fix as the shop-layout
// canonical omission logged in SEO_LOG.md backlog item 2, not a new kind of
// judgment call). The links search results point to (real product and
// category pages) remain fully indexable and are unaffected by this.

const title = 'Search — Velor Marketplace'
const description =
  'Search Velor for products, crafts, and sellers by country, speciality or keyword.'

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: true },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/search',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale (vercel/next.js#50353: an explicit openGraph
    // object replaces the whole object, dropping the root file-convention
    // image unless listed here).
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
