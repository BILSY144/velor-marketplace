import type { Metadata } from 'next'

// New route, added 2026-08-02 per William's direction to link the Velor
// Roots Foundation footer badge (components/GlobalFooter.tsx) to a real
// vision/mission page. Kept under Google's ~155-160 char SERP display
// limit per the standing SEO agent's established convention on other
// route layouts (see /vs/etsy/layout.tsx, /founding/layout.tsx).
//
// canonical/openGraph/twitter added by the standing SEO agent, 2026-08-03
// full audit -- this file had title/description only, so (per the
// vercel/next.js#50353 finding already documented on app/layout.tsx and
// every other route layout in this codebase) it had no openGraph/twitter
// object of its own and no self-referencing canonical either. Same
// established pattern reused verbatim: 'en_GB' locale (lib/currency.ts's
// real GBP default), the shared /opengraph-image route (no page-specific
// image exists for this route), same title/description reused for OG/
// Twitter rather than invented separately.
const title = 'Velor Roots Foundation — Our Vision & Mission'
const description =
  'Velor Roots Foundation is our plan to help artisan sellers get out of, and stay out of, homelessness — trade with purpose, not just commerce.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/roots-foundation' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/roots-foundation',
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

export default function RootsFoundationLayout({ children }: { children: React.ReactNode }) {
  return children
}
