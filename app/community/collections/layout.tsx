import type { Metadata } from 'next'

// Server-component layout wrapping /community/collections/page.tsx so this
// route carries its own metadata instead of inheriting app/community/
// layout.tsx's title/description/canonical (which describe the /community
// hub, not this page). Added by the standing SEO agent, 2026-07-31 -- same
// gap class and fix as app/community/ask/layout.tsx (see that file's
// comment for the full false-canonical reasoning). /community/collections
// (commit 185c20a9, "Make Around the World, Workshop Videos, Follow
// Countries, Maker Passport live...") is a real, live directory of buyers'
// public collections, prominently linked from /community's own "Buyer's
// Collections" section box (app/community/CommunityPageClient.tsx,
// confirmed via grep).
//
// Title uses the same "Buyer's Collections" label the page is linked with
// sitewide (the nav box, the breadcrumb); description is drawn only from
// copy already live on page.tsx itself (the intro paragraph's first
// sentence) -- nothing paraphrased beyond tightening for SERP length,
// nothing invented, per LAW #1. Indexed (not noindex).
const title = "Buyer's Collections — Velor Marketplace"
const description =
  'Real collections buyers have chosen to share — a dream kitchen, a gallery wall, gifts to come back to.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/collections' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/collections',
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

export default function CommunityCollectionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
