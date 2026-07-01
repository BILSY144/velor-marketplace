import ProductDetail from '../ProductDetail'

export default function MarketplaceProductPage({
  params,
}: {
  params: { id: string }
}) {
  return <ProductDetail id={params.id} />
}
