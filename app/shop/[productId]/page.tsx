import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductPageClient from './ProductPageClient'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params

  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'APPROVED' },
    select: { id: true },
  })

  if (!product) notFound()

  return <ProductPageClient />
}
