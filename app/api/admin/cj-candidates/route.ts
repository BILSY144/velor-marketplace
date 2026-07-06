import { NextRequest, NextResponse } from 'next/server'
import { searchProducts, getProductDetail, checkFreight } from '@/lib/cj'

// Returns a small batch of CJ candidates for a keyword search, each already
// checked for at least one freight/shipping option to a representative
// destination (US). This is the automatable half of import screening --
// it does NOT check CJ's client-rendered per-product restriction warning
// text (that requires a real browser visit, done separately per William's
// 2026-07-06 instruction: "there is always a red area ... we need to read
// them before listing anything").
//
// CJ's API is rate-limited to 1 QPS, so this processes a small page at a
// time (default 6) with a delay between calls, rather than trying to
// screen an entire category in one request and risking a function timeout.
export const dynamic = 'force-dynamic'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(request: NextRequest) {
  try {
    const keyword = request.nextUrl.searchParams.get('keyword')
    const page = Number(request.nextUrl.searchParams.get('page') || '1')
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '6')
    if (!keyword) {
      return NextResponse.json({ ok: false, error: 'keyword required' }, { status: 400 })
    }

    const results = await searchProducts({ keyWord: keyword, page, size: pageSize })

    const candidates = []
    for (const item of results) {
      try {
        const detail = await getProductDetail(item.pid)
        await sleep(1100)
        const variant = detail.variants[0]
        if (!variant) continue
        const freightOptions = await checkFreight(variant.vid, 1, 'US')
        await sleep(1100)
        const cost = parseFloat(variant.variantSellPrice || item.sellPrice)
        candidates.push({
          pid: item.pid,
          vid: variant.vid,
          name: detail.productNameEn || detail.productName,
          cost,
          computedPrice: Math.ceil(cost * 1.2),
          images: detail.productImageSet?.slice(0, 8) || [],
          description: detail.description || '',
          freightAvailable: freightOptions.length > 0,
          freightOptionCount: freightOptions.length,
          productUrl: `https://cjdropshipping.com/product/x-p-${item.pid}.html`,
        })
      } catch (innerErr) {
        candidates.push({ pid: item.pid, error: innerErr instanceof Error ? innerErr.message : String(innerErr) })
      }
    }

    return NextResponse.json({ ok: true, keyword, page, pageSize, resultCount: results.length, candidates })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
