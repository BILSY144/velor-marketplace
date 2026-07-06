import { NextResponse } from 'next/server'
import { searchProducts, getProductDetail, checkFreight } from '@/lib/cj'

// TEMPORARY diagnostic route, no secret required, read-only, no PII.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const result: Record<string, unknown> = { step: 'start' }
  try {
    result.step = 'searchProducts'
    const products = await searchProducts({ keyWord: 'pet', page: 1, size: 5 })
    result.searchOk = true
    result.productCount = Array.isArray(products) ? products.length : null
    result.productSample = Array.isArray(products) ? products.slice(0, 2) : products

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ ok: true, ...result, note: 'search returned zero products' })
    }

    const first = products[0] as Record<string, unknown>
    result.firstProductRaw = first

    result.step = 'getProductDetail'
    const pid = (first.pid || first.id) as string
    result.pidUsed = pid
    const detail = await getProductDetail(pid)
    result.detailOk = true
    result.detailVariantCount = Array.isArray((detail as { variants?: unknown[] }).variants)
      ? (detail as { variants: unknown[] }).variants.length
      : null
    result.detailSample = detail

    result.step = 'checkFreight'
    const variants = (detail as { variants?: { vid: string }[] }).variants || []
    if (variants.length === 0) {
      return NextResponse.json({ ok: true, ...result, note: 'no variants to freight-check' })
    }
    const vid = variants[0].vid
    result.vidUsed = vid
    const freight = await checkFreight(vid, 1, 'GB')
    result.freightOk = true
    result.freightOptions = freight

    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const err = e as { message?: string; stack?: string }
    return NextResponse.json(
      {
        ok: false,
        failedAt: result.step,
        error: err?.message || String(e),
        stack: err?.stack ? String(err.stack).split('\n').slice(0, 8) : undefined,
        partialResult: result,
      },
      { status: 500 }
    )
  }
}
