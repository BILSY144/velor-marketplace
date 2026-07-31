import type { Metadata } from 'next'

// Server-component layout wrapping /community/world/page.tsx so this route
// carries its own metadata instead of inheriting app/community/layout.tsx's
// title/description/canonical (which describe the /community hub, not this
// page). Added by the standing SEO agent, 2026-07-31 -- same gap class and
// fix as app/community/ask/layout.tsx (see that file's comment for the
// full false-canonical reasoning). /community/world (commit 185c20a9) is a
// real, live directory of every country with at least one approved seller
// who has listed a product, ranked by maker count, prominently linked from
// /community's own "Around the World" section box (app/community/
// CommunityPageClient.tsx, confirmed via grep).
//
// Title uses the "Around the World" label the page is linked with
// sitewide; description is drawn only from copy already live on page.tsx
// itself (the intro paragraph, tightened for length by dropping the
// closing "pick a country to shop its channel" clause, which just
// duplicates the page's own on-page links) -- nothing paraphrased, nothing
// invented, per LAW #1. Indexed (not noindex).
const title = 'Around the World — Velor Marketplace'
const description =
  'Every country with at least one verified maker who has listed a product on Velor, ranked by how many makers call it home.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/world' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/world',
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

export default function CommunityWorldLayout({ children }: { children: React.ReactNode }) {
  return children
}
