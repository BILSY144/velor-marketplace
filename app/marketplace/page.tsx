import MarketplaceGrid from './MarketplaceGrid'

export const metadata = {
  title: 'Marketplace | Velor',
  description: 'Browse products from independent sellers on Velor Marketplace',
  alternates: { canonical: 'https://velorcommerce.store/marketplace' },
  openGraph: {
    title: 'Marketplace | Velor',
    description: 'Browse products from independent sellers on Velor Marketplace',
    url: 'https://velorcommerce.store/marketplace',
    siteName: 'Velor',
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
    description: 'Browse products from independent sellers on Velor Marketplace',
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function MarketplacePage() {
  return <MarketplaceGrid />
}
