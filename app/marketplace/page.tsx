import MarketplaceGrid from './MarketplaceGrid'

// description tightened by the standing SEO agent, 2026-07-14 -- the prior
// text ("Browse products from independent sellers on Velor Marketplace")
// was generic, redundantly repeated the site name ("Velor Marketplace" when
// the site itself is "Velor"), and dated from before this route's real
// scope was reconsidered (see SEO_LOG.md's new flagged backlog item on this
// page's overlap with /shop). Rewritten to describe only what this specific
// page's own UI actually renders (search by name, filter by the 14
// CATEGORIES tabs, sort by price/newest -- verified directly against
// MarketplaceGrid.tsx, not assumed) -- deliberately NOT reusing /shop's
// "filter by country or speciality... every listing carries its maker and
// its origin" language, since this page's grid cards show only category,
// product name, seller store name and price, with no origin/maker field
// rendered here. Title left unchanged ("Marketplace | Velor", 20 chars,
// already short and accurate). No canonical, robots, image, or any other
// field touched.
export const metadata = {
  title: 'Marketplace | Velor',
  description: 'Browse products from independent Velor sellers — search by name, filter by category, and sort by price.',
  alternates: { canonical: 'https://velorcommerce.store/marketplace' },
  openGraph: {
    title: 'Marketplace | Velor',
    description: 'Browse products from independent Velor sellers — search by name, filter by category, and sort by price.',
    url: 'https://velorcommerce.store/marketplace',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- an explicit
    // openGraph object on a route replaces the whole object, so the root
    // app/opengraph-image.tsx isn't inherited here without listing it
    // (verified via Next.js docs + vercel/next.js#50353; same fix as
    // app/sell/layout.tsx already carries).
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace | Velor',
    description: 'Browse products from independent Velor sellers — search by name, filter by category, and sort by price.',
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function MarketplacePage() {
  return <MarketplaceGrid />
}
