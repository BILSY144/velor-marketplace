import type { Metadata } from 'next'

// New route, added 2026-08-02 per William's direction to build out the
// zero-budget visibility campaign. Fee figures for Etsy are sourced (see
// page.tsx comments); Velor figures are pulled from the live commission
// constant (PLATFORM_COMMISSION_RATE = 0.1 in app/api/stripe/payment-intent/
// route.ts) and 0% listing fees, both already true site-wide. Kept under
// Google's ~155-160 char SERP display limit per the standing SEO agent's
// established convention on other route layouts (see /founding/layout.tsx).
//
// canonical/openGraph/twitter added by the standing SEO agent, 2026-08-03
// full audit -- this file had title/description only, so (per the
// vercel/next.js#50353 finding already documented on app/layout.tsx and
// every other route layout in this codebase) it had no openGraph/twitter
// object of its own and no self-referencing canonical either -- meaning a
// page built specifically for a "zero-budget visibility campaign" (per
// this file's own comment above) would have shared the site's generic
// homepage title/description/image on social previews instead of its own
// comparison-page copy, undermining the exact goal the page was built for.
// Same established pattern reused verbatim: 'en_GB' locale (lib/currency.ts's
// real GBP default), the shared /opengraph-image route (no page-specific
// image exists for this route), same title/description reused for OG/
// Twitter rather than invented separately.
const title = 'Etsy Alternative: Velor vs Etsy Fees Compared (2026)'
const description =
  'Flat 10% commission, no listing fees, no ad tax. See exactly how Velor’s fees compare to Etsy’s in 2026, with real sourced numbers.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/vs/etsy' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/vs/etsy',
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

export default function EtsyComparisonLayout({ children }: { children: React.ReactNode }) {
  return children
}
