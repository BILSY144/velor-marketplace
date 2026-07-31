import type { Metadata } from 'next'

// Server-component layout wrapping /community/passport/page.tsx so this
// route carries its own metadata instead of inheriting app/community/
// layout.tsx's title/description/canonical (which describe the /community
// hub, not this page). Added by the standing SEO agent, 2026-07-31 -- same
// gap class and fix as app/community/ask/layout.tsx (see that file's
// comment for the full false-canonical reasoning). /community/passport
// (commit d2cbb337, "Build a real Maker Passport directory, ranked
// automatically not editorially") is a real, live directory of every
// approved maker with a listed product, ranked purely by follower count --
// prominently linked from /community's own "Maker Passport" section box
// (app/community/CommunityPageClient.tsx, confirmed via grep) -- the
// page's own h1 matches the box label exactly.
//
// Title/description are drawn only from copy already live on page.tsx
// itself (the h1 "Maker Passport" and the intro paragraph's first
// sentence) -- nothing paraphrased beyond tightening for SERP length,
// nothing invented, per LAW #1. Indexed (not noindex).
const title = 'Maker Passport — Velor Marketplace'
const description =
  'Every verified maker who has listed at least one product earns a passport: orders completed, followers, videos, journal entries, years preserving their craft.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/community/passport' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/community/passport',
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

export default function CommunityPassportLayout({ children }: { children: React.ReactNode }) {
  return children
}
