import type { Metadata } from 'next'

// Server-component layout wrapping /community/videos/page.tsx so this
// route carries its own metadata instead of inheriting app/community/
// layout.tsx's title/description/canonical (which describe the /community
// hub, not this page). Added by the standing SEO agent, 2026-07-31 -- same
// gap class and fix as app/community/ask/layout.tsx (see that file's
// comment for the full false-canonical reasoning). /community/videos
// (commit 185c20a9) is a real, live, filterable library over every video a
// maker has attached to a journal entry or listing, prominently linked
// from /community's own "Workshop Videos" section box (app/community/
// CommunityPageClient.tsx, confirmed via grep).
//
// Title uses the "Workshop Videos" label the page is linked with sitewide;
// description is drawn only from copy already live on page.tsx itself (the
// intro paragraph's first sentence) -- nothing paraphrased beyond
// tightening for SERP length, nothing invented, per LAW #1. Indexed (not
// noindex).
const title = 'Workshop Videos — Velor Marketplace'
const description =
  "Real films from real workshops — every video here comes from a maker's own journal entry or listing, never stock footage."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/videos' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/videos',
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

export default function CommunityVideosLayout({ children }: { children: React.ReactNode }) {
  return children
}
