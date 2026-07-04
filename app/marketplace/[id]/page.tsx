import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductDetail from './ProductDetail'

export default async function MarketplaceProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

  const product = await prisma.product.findFirst({
        where: { id, status: 'APPROVED' },
        select: { id: true },
  })

  if (!product) notFound()

  return <ProductDetail id={id} />
}
