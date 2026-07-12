import MarketplaceGrid from './MarketplaceGrid'

export const metadata = {
  title: 'Marketplace | Velor',
  description: 'Browse products from independent sellers on Velor Marketplace',
  alternates: { canonical: 'https://velorcommerce.store/marketplace' },
}

export default function MarketplacePage() {
  return <MarketplaceGrid />
}
