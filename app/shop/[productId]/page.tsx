import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ProductPageClient from './ProductPageClient'

// Share cards (Velor Social stage 3, 2026-07-29, plan section "share-out
// cards"): a listing shared to WhatsApp/Instagram/Pinterest/X renders a
// real preview -- photo, title, maker -- with a deep link back. Everything
// here mirrors page-rendered values (LAW #1): the first listing image and
// the seller's real store name, nothing invented. Prices are deliberately
// NOT in the card -- they are stored in the seller's currency and a static
// card cannot convert per-viewer (the price-display rule in CLAUDE.md).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>
}): Promise<Metadata> {
  const { productId } = await params
  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'APPROVED' },
    select: {
      title: true,
      description: true,
      images: true,
      originCountry: true,
      seller: { select: { storeName: true } },
    },
  })
  if (!product) return { title: 'Velor — Global Marketplace' }

  const title = `${product.title} — ${product.seller.storeName} | Velor`
  const description = (product.description || `Authentic goods from ${product.seller.storeName} on Velor, the global marketplace for culture and heritage.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
  // Only real hosted URLs make valid share images (data URLs are ignored by
  // scrapers; post-R2-migration all images are https, this guard is belt
  // and braces).
  const image = (product.images || []).find(u => typeof u === 'string' && u.startsWith('http'))
  const url = `https://velorcommerce.store/shop/${productId}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Velor',
      type: 'website',
      ...(image ? { images: [{ url: image, alt: product.title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

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
