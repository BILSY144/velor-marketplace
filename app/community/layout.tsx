import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /community page.tsx so
// this route can carry its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-30 --
// found while reviewing commits since the last SEO push: /community ("The
// Makers' Circle", commit 99a777a4, "community hub replaces Workshop/Drops
// in nav") shipped with no layout.tsx of its own and no entry in
// app/sitemap.ts, and is now the primary community destination in
// components/GlobalHeader.tsx's main nav (desktop mega-menu image link plus
// mobile panel item) -- the same real-page/no-metadata gap class as
// /workshop (2026-07-29), /safety (2026-07-29), /drops (2026-07-30) and
// /mission (2026-07-23) before it. Confirmed not auth-gated:
// middleware.ts's protected-route matcher covers /dashboard/:path*,
// /api/admin/:path*, /api/chat/:path*, /api/contact/:path*, and
// /api/stripe/payment-intent only -- /community is not in that list, and
// page.tsx renders its full hero/sections unconditionally with no session
// check.
//
// Title/description are drawn only from copy already live on page.tsx
// itself (the hero h1 "The World's Makers. One Community." and the hero
// subtitle paragraph, verbatim) -- nothing paraphrased beyond tightening
// for SERP length, nothing invented, per LAW #1. Indexed (not noindex):
// this is permanent, real, prominently-linked content a searcher could
// reasonably look for ("velor community", "velor makers circle"), the same
// reasoning class as the already-indexed /workshop and /safety -- not
// placeholder or token-gated content. (The /community/[section] and
// /community/journals sub-routes are a separate, deliberately NOT-yet-
// fixed gap -- see this cycle's SEO_LOG.md entry and backlog: several of
// the [section] pages are explicit "being crafted right now" placeholders,
// which needs a distinct, more careful metadata/indexability treatment
// than this single top-level hub page.)
const title = "The Makers' Circle — Velor Marketplace"
const description =
  'Watch artisans, ask questions, follow their journey and discover how authentic goods are created around the world.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community',
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

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children
}
