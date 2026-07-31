import type { Metadata } from 'next'

// Server-component layout wrapping /community/journals/page.tsx so this
// route carries its own metadata instead of inheriting app/community/
// layout.tsx's title/description/canonical (which describe the /community
// hub, not this page). Added by the standing SEO agent, 2026-07-31 -- same
// gap class and fix as app/community/ask/layout.tsx (see that file's
// comment for the full false-canonical reasoning). Unlike that batch of
// brand-new pages, /community/journals is a long-standing route (previously
// a fixed single-seller demo, rewritten to a real live directory in commit
// 952e975d, "Make the Makers' Circle real: live Creator Journals, Ask The
// Maker, Featured Today") that was already flagged, unfixed, as backlog
// item 50's part (a) -- this closes that part. Prominently linked from
// /community's own "Creator Journals" section box (app/community/
// CommunityPageClient.tsx, confirmed via grep) and from /workshop's own
// copy -- the page's own h1 matches the box label exactly. Note:
// /community/journals/[sellerId] (backlog item 50's part b) is now a plain
// redirect to /seller/[sellerId] (commit f170c61a, "Merge seller journal
// into the storefront"), which already has its own real metadata per
// backlog item 8 -- no separate metadata needed for a redirect-only route,
// so that part of item 50 is resolved by removal rather than by a new
// layout.tsx.
//
// Title/description are drawn only from copy already live on page.tsx
// itself (the h1 "Creator Journals" and the intro paragraph's first
// sentence -- the sentence naming a live maker count was deliberately
// dropped since that number changes on every visit and a static meta
// description should not embed a value that goes stale) -- nothing
// paraphrased beyond that, nothing invented, per LAW #1. Indexed (not
// noindex).
const title = 'Creator Journals — Velor Marketplace'
const description =
  'Every maker keeps a real journal of their work — first orders, failed glazes, finished commissions.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/journals' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/journals',
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

export default function CommunityJournalsLayout({ children }: { children: React.ReactNode }) {
  return children
}
