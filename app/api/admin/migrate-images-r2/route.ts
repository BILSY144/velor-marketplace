import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { isR2Configured, isDataUrlImage, uploadDataUrlToR2 } from '@/lib/r2'

// One-shot (but re-runnable) migration of existing base64 data-URL images
// out of Postgres and into R2 (2026-07-29, Velor Social prerequisite).
//
// GET  -> read-only report: how many Product / ProductVariant / Seller rows
//         still hold at least one data-URL image. Zero side effects.
// POST -> migrate up to `limit` rows per model (default 25): upload each
//         data URL to R2, then replace the field ONLY with successfully
//         uploaded URLs. A failed upload leaves that image (and only that
//         image) as a data URL for the next run -- never destructive,
//         idempotent (migrated rows simply stop matching the data:-prefix
//         scan), safe to run repeatedly until GET reports zero everywhere.
//
// Uses $queryRaw for the scans because Prisma cannot filter String[]
// elements by prefix; the raw queries return IDs only (never the heavy
// image payloads of non-matching rows).

export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [products, variants, sellers] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Product" WHERE EXISTS (SELECT 1 FROM unnest(images) img WHERE img LIKE 'data:image/%')`,
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "ProductVariant" WHERE EXISTS (SELECT 1 FROM unnest(images) img WHERE img LIKE 'data:image/%')`,
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Seller" WHERE "storeLogo" LIKE 'data:image/%'`,
  ])
  return NextResponse.json({
    r2Configured: isR2Configured(),
    remaining: {
      products: Number(products[0]?.count ?? 0),
      variants: Number(variants[0]?.count ?? 0),
      sellerLogos: Number(sellers[0]?.count ?? 0),
    },
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'R2 is not configured (env vars missing)' }, { status: 400 })
  }

  let limit = 25
  try {
    const body = await request.json()
    if (body && Number.isFinite(Number(body.limit))) limit = Math.min(200, Math.max(1, Number(body.limit)))
  } catch {
    /* empty body is fine */
  }

  const result = {
    products: { rows: 0, imagesUploaded: 0, imagesFailed: 0 },
    variants: { rows: 0, imagesUploaded: 0, imagesFailed: 0 },
    sellerLogos: { rows: 0, imagesUploaded: 0, imagesFailed: 0 },
  }

  // Helper: replace every data URL in a list via R2, tracking outcomes.
  async function convert(images: string[], keyPrefix: string, stats: { imagesUploaded: number; imagesFailed: number }): Promise<string[]> {
    const out: string[] = []
    for (const img of images) {
      if (isDataUrlImage(img)) {
        const uploaded = await uploadDataUrlToR2(img, keyPrefix)
        if (uploaded) {
          stats.imagesUploaded++
          out.push(uploaded)
        } else {
          stats.imagesFailed++
          out.push(img) // keep original; retried on the next run
        }
      } else {
        out.push(img)
      }
    }
    return out
  }

  // 1) Products
  const productIds = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Product" WHERE EXISTS (SELECT 1 FROM unnest(images) img WHERE img LIKE 'data:image/%') LIMIT ${limit}`
  for (const { id } of productIds) {
    const p = await prisma.product.findUnique({ where: { id }, select: { id: true, sellerId: true, images: true } })
    if (!p) continue
    const images = await convert(p.images, `products/${p.sellerId}`, result.products)
    await prisma.product.update({ where: { id }, data: { images } })
    result.products.rows++
  }

  // 2) Variants
  const variantIds = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "ProductVariant" WHERE EXISTS (SELECT 1 FROM unnest(images) img WHERE img LIKE 'data:image/%') LIMIT ${limit}`
  for (const { id } of variantIds) {
    const v = await prisma.productVariant.findUnique({ where: { id }, select: { id: true, images: true, product: { select: { sellerId: true } } } })
    if (!v) continue
    const images = await convert(v.images, `products/${v.product.sellerId}/variants`, result.variants)
    await prisma.productVariant.update({ where: { id }, data: { images } })
    result.variants.rows++
  }

  // 3) Seller logos
  const sellerIds = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Seller" WHERE "storeLogo" LIKE 'data:image/%' LIMIT ${limit}`
  for (const { id } of sellerIds) {
    const s = await prisma.seller.findUnique({ where: { id }, select: { id: true, storeLogo: true } })
    if (!s?.storeLogo || !isDataUrlImage(s.storeLogo)) continue
    const uploaded = await uploadDataUrlToR2(s.storeLogo, `sellers/${s.id}/logo`)
    if (uploaded) {
      await prisma.seller.update({ where: { id }, data: { storeLogo: uploaded } })
      result.sellerLogos.rows++
      result.sellerLogos.imagesUploaded++
    } else {
      result.sellerLogos.imagesFailed++
    }
  }

  return NextResponse.json({ ok: true, migrated: result })
}
