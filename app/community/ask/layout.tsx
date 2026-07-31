import type { Metadata } from 'next'

// Server-component layout wrapping /community/ask/page.tsx so this route
// carries its own metadata instead of inheriting app/community/layout.tsx's
// title/description/canonical (which describe the /community hub, not this
// page). Added by the standing SEO agent, 2026-07-31 -- found during a full
// audit reviewing commits since the last SEO push: /community/ask (commit
// 952e975d, "Make the Makers' Circle real: live Creator Journals, Ask The
// Maker, Featured Today") shipped as a real, live, DB-backed page with no
// layout.tsx of its own, so without this fix it would silently inherit
// /community's canonical -- the exact same false-canonical shape backlog
// items 2/3/8 already fixed for /shop and /shop/[productId] before Share
// cards gave those their own metadata. This page is prominently linked from
// /community's own "Ask the Maker" section box (app/community/
// CommunityPageClient.tsx, confirmed via grep), so it is real, permanent,
// indexable content, not a placeholder.
//
// Title/description are drawn only from copy already live on page.tsx
// itself (the h1 "Ask The Maker" and the intro paragraph's first sentence)
// -- nothing paraphrased beyond tightening for SERP length, nothing
// invented, per LAW #1. Indexed (not noindex).
const title = 'Ask The Maker — Velor Marketplace'
const description =
  "Real questions, answered by the maker or by other buyers — gathered from every seller's journal."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/ask' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/ask',
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

export default function CommunityAskLayout({ children }: { children: React.ReactNode }) {
  return children
}
