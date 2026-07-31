import type { Metadata } from 'next'

// Server-component layout wrapping /community/featured/page.tsx so this
// route carries its own metadata instead of inheriting app/community/
// layout.tsx's title/description/canonical (which describe the /community
// hub, not this page). Added by the standing SEO agent, 2026-07-31 -- same
// gap class and fix as app/community/ask/layout.tsx (see that file's
// comment for the full false-canonical reasoning). /community/featured
// (commit 952e975d, "Make the Makers' Circle real: live Creator Journals,
// Ask The Maker, Featured Today") is a real, live front page over who's
// live, the freshest journal entries and the newest Q&A, prominently
// linked from /community's own "Featured Today" section box (app/
// community/CommunityPageClient.tsx, confirmed via grep) -- the page's own
// h1 matches the box label exactly.
//
// Title/description are drawn only from copy already live on page.tsx
// itself (the h1 "Featured Today" and the intro paragraph, tightened for
// length by dropping the closing "nothing here is fabricated or ranked"
// clause, which is meta-commentary about the page rather than descriptive
// of it) -- nothing paraphrased beyond that, nothing invented, per LAW #1.
// Indexed (not noindex).
const title = 'Featured Today — Velor Marketplace'
const description =
  "A real front page for the community: makers live on air right now, the freshest journal entries, and the newest questions buyers are asking."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/featured' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/featured',
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

export default function CommunityFeaturedLayout({ children }: { children: React.ReactNode }) {
  return children
}
