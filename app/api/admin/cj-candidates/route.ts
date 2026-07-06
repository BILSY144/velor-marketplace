import { NextRequest, NextResponse } from 'next/server'
import { searchProducts, getProductDetail, checkFreight } from '@/lib/cj'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Representative global basket spanning every inhabited continent, chosen to
// match the countries Velor's own currency system already recognises
// (see lib/currency.ts COUNTRY_TO_CURRENCY). Velor has no checkout country
// allowlist -- buyers can check out from anywhere -- so "ships worldwide"
// is verified here as "a real paid CJ shipping method exists to all of
// these", not literally all ~195 countries (CJ's 1 QPS rate limit makes
// checking every country per candidate infeasible at import scale).
const WORLDWIDE_BASKET = ['US', 'GB', 'DE', 'AU', 'JP', 'AE', 'BR', 'ZA']

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

        // Velor lists single-option products only -- no variant/colour
        // picker UI exists on the buyer-facing product pages, and CJ import
        // always fulfils using variants[0] regardless of what the
        // description text implies. Letting a multi-option product through
        // risks the buyer receiving a different colour/design than the one
        // named in the listing. Skip any candidate with more than one
        // distinct option before it ever reaches the import queue.
        const uniqueOptionKeys = new Set(
          (detail.variants || []).map((v: any) => v.variantKey || v.variantSku).filter(Boolean)
        )
        if (uniqueOptionKeys.size > 1) continue

        // Check freight against the worldwide basket. Stop at the first
        // country with no available paid shipping method -- no need to
        // burn through the rest of the basket for a candidate that already
        // fails the worldwide bar.
        const freightByCountry: Record<string, { available: boolean; cost?: number; method?: string }> = {}
        let worldwide = true
        for (const country of WORLDWIDE_BASKET) {
          const freightOptions = await checkFreight(variant.vid, 1, country)
          await sleep(1100)
          const available = freightOptions.length > 0
          freightByCountry[country] = available
            ? { available: true, cost: freightOptions[0].logisticPrice, method: freightOptions[0].logisticName }
            : { available: false }
          if (!available) {
            worldwide = false
            break
          }
        }

        const cost = parseFloat(variant.variantSellPrice || item.sellPrice)
        // Price = item cost + 30% margin ONLY. Shipping is quoted live and
        // charged separately at checkout via Shippo -- it must never be
        // folded into the item price here (that would double-charge the
        // buyer: once via an inflated item price, again via the real
        // shipping quote). Round to the nearest CENT (2dp), never to the
        // nearest whole currency unit -- ceiling to a whole dollar/pound
        // massively over-inflates margin on sub-$5 items (a $0.70 cost
        // item would otherwise ceiling to $1.00, a ~43% markup, not 30%).
        const computedPrice = Math.ceil(cost * 1.3 * 100) / 100
        candidates.push({
          pid: item.pid,
          vid: variant.vid,
          name: detail.productNameEn || detail.productName,
          cost,
          computedPrice,
          // Real CJ supplier name (empty string for ORDINARY_PRODUCT, since
          // CJ manages that inventory itself with no separate named
          // supplier) -- never fabricate a name when this is blank.
          supplierName: detail.supplierName || null,
          images: detail.productImageSet || [],
          description: detail.description || '',
          variants: detail.variants.map((v) => ({
            vid: v.vid,
            sku: v.variantSku,
            key: v.variantKey,
            price: v.variantSellPrice,
            image: v.variantImage,
          })),
          worldwideShipping: worldwide,
          freightByCountry,
          productUrl: `https://cjdropshipping.com/product/x-p-${item.pid}.html`,
        })
      } catch (innerErr) {
        candidates.push({ pid: item.pid, error: innerErr instanceof Error ? innerErr.message : String(innerErr) })
      }
    }
    return NextResponse.json({ ok: true, keyword, page, pageSize, resultCount: results.length, worldwideBasket: WORLDWIDE_BASKET, candidates })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
