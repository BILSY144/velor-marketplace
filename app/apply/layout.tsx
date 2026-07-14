import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /apply page.tsx so this
// route can carry its own metadata instead of inheriting the generic root
// title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. Copy is drawn directly from the live page copy
// (the "Be the first from your country" hero, the founding-seller perks
// list, and the 24-hour decision line already on the page) — nothing here
// invents a claim the page itself doesn't already make.
//
// description trimmed by the standing SEO agent, 2026-07-14 (full audit
// re-run) -- the previous version was 215 characters, well past Google's
// practical ~155-160 char SERP display limit (the same class of issue this
// log already fixed on the 4 /legal/* pages, 2026-07-14 01:xx UTC), meaning
// it was being truncated mid-sentence in search results. Trimmed to keep
// every concrete fact (free to list, 24-hour decision, Pro free for life
// for founding sellers) and only cut the generic "global marketplace for
// authentic cultural and heritage goods" framing, which duplicates the
// title and the root layout's own description -- no fact added or removed.
const title = 'Apply to Sell on Velor | Founding Seller Programme'
const description =
  'Be the first seller from your country on Velor. Free to list, a decision within 24 hours, and Pro free for life for founding sellers.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/apply' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/apply',
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

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children
}
