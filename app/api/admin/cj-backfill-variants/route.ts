import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProductDetail } from '@/lib/cj'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// One-time (re-runnable) backfill: populates real ProductVariant rows for
// CJ-sourced products that were imported before ProductVariant existed.
// Safe to re-run -- skips products that already have variants.
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    where: { cjSourced: true, cjProductId: { not: null }, variants: { none: {} } },
    select: { id: true, cjProductId: true, title: true },
  })

  const results: Array<{ productId: string; title: string; ok: boolean; variantCount?: number; error?: string }> = []

  for (const p of products) {
    try {
      const detail = await getProductDetail(p.cjProductId as string)
      const variants = (detail.variants || []).filter((v) => v.vid)
      if (variants.length === 0) {
        results.push({ productId: p.id, title: p.title, ok: false, error: 'CJ returned no variants' })
        continue
      }
      await prisma.productVariant.createMany({
        data: variants.map((v) => ({
          productId: p.id,
          cjVid: v.vid,
          color: v.variantKey || null,
          sku: v.variantSku || null,
          image: v.variantImage || null,
          sellPrice: v.variantSellPrice ? Number(v.variantSellPrice) : null,
        })),
        skipDuplicates: true,
      })
      results.push({ productId: p.id, title: p.title, ok: true, variantCount: variants.length })
    } catch (err) {
      results.push({ productId: p.id, title: p.title, ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
