import type { Metadata } from 'next'

// Server-component layout wrapping /community/learning/page.tsx so this
// route carries its own metadata instead of inheriting app/community/
// layout.tsx's title/description/canonical (which describe the /community
// hub, not this page). Added by the standing SEO agent, 2026-07-31 -- same
// gap class and fix as app/community/ask/layout.tsx (see that file's
// comment for the full false-canonical reasoning). /community/learning
// (commit 185c20a9) is a real, live lesson library (real seller videos
// first, a small fixed set of labelled guest craft videos backfilling the
// rest), prominently linked from /community's own "Learning Centre"
// section box (app/community/CommunityPageClient.tsx, confirmed via grep).
//
// Title uses the "Learning Centre" label the page is linked with sitewide;
// description is drawn only from copy already live on page.tsx itself (the
// intro paragraph's first sentence) -- nothing paraphrased beyond
// tightening for SERP length, nothing invented, per LAW #1. Indexed (not
// noindex).
const title = 'Learning Centre — Velor Marketplace'
const description =
  'Real seller videos fill this list first; a handful of guest craft videos from outside Velor backfill the rest — every card says which.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/learning' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/learning',
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

export default function CommunityLearningLayout({ children }: { children: React.ReactNode }) {
  return children
}
