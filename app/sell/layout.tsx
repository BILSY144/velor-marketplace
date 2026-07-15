import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /sell page.tsx so this
// route can carry its own metadata instead of inheriting the generic root
// title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. Copy is drawn from the page's own live stats
// row (190 countries, 0% listing fees, live broadcasting on every tier
// sellers) — see the copy-honesty rule at the top of app/sell/page.tsx.

// description trimmed by the standing SEO agent, 2026-07-14 (full audit
// re-run) -- the previous version was 180 characters, past Google's
// practical ~155-160 char SERP display limit (same class of fix already
// applied to /apply, /origins and /founding the same run). Kept every
// concrete fact (free to list, live or anytime selling, 190 countries,
// maker + origin on every listing) and only tightened the phrasing.
const title = "Sell on Velor — Your Country's Shopping Channel"
const description =
  'List free and sell live or anytime. Velor connects buyers worldwide with sellers from 190 countries, each listing carrying its maker and origin.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/sell' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/sell',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website', images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image', images: ['https://velorcommerce.store/opengraph-image'],
    title,
    description,
  },
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children
}
