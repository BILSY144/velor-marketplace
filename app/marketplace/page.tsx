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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace | Velor',
    description: 'Browse products from independent sellers on Velor Marketplace',
  },
}

export default function MarketplacePage() {
  return <MarketplaceGrid />
}
