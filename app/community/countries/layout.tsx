import type { Metadata } from 'next'

// Server-component layout wrapping /community/countries/page.tsx so this
// route carries its own metadata instead of inheriting app/community/
// layout.tsx's title/description/canonical (which describe the /community
// hub, not this page). Added by the standing SEO agent, 2026-07-31 -- same
// gap class and fix as app/community/ask/layout.tsx (see that file's
// comment for the full false-canonical reasoning). /community/countries
// (commit 185c20a9) is a real, live per-country browse page, prominently
// linked from /community's own "Follow Countries" section box
// (app/community/CommunityPageClient.tsx, confirmed via grep).
//
// Title uses the "Follow Countries" label the page is linked with sitewide;
// description is drawn only from copy already live on page.tsx itself (the
// intro paragraph, tightened for length by dropping the closing "browse
// any of them below" clause, which just duplicates the page's own on-page
// buttons) -- nothing paraphrased, nothing invented, per LAW #1. Indexed
// (not noindex).
const title = 'Follow Countries — Velor Marketplace'
const description =
  "Following a country's newest makers, pieces and journals is coming soon. For today, every country already has its own real shopping channel."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/countries' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/countries',
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

export default function CommunityCountriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
