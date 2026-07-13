import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /founding page.tsx so
// this route can carry its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. The page's own live copy ("Be the first from
// your country", the per-country founding perks) is the source for this;
// the live trading-country count is dynamic on the page itself and is
// deliberately NOT hardcoded here since it changes as sellers list.

const title = 'Founding Sellers | One Seat Per Country — Velor'
const description =
  '190 countries, one founding seller each. Be the first to list from yours and keep the founding badge, Pro free for life, and Velor Live access permanently — as the seller who opened your country.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/founding' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/founding',
    siteName: 'Velor',
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

export default function FoundingLayout({ children }: { children: React.ReactNode }) {
  return children
}
