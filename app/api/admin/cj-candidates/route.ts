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
        // Total landed cost must include shipping, not just item price --
        // Velor advertises Free Delivery to buyers, so the CJ freight charge
        // has to be baked into the sale price up front rather than passed on.
        // Checkout has no country allowlist (worldwide), so the highest
        // shipping cost seen across the worldwide basket is used as the
        // basis so no single destination sells at a loss.
        const shippingCosts = Object.values(freightByCountry).map((f) => (f.available ? f.cost || 0 : 0))
        const maxShippingCost = shippingCosts.length ? Math.max(...shippingCosts) : 0
        const totalCost = cost + maxShippingCost
        candidates.push({
          pid: item.pid,
          vid: variant.vid,
          name: detail.productNameEn || detail.productName,
          cost,
          shippingCost: maxShippingCost,
          totalCost,
          computedPrice: Math.ceil(totalCost * 1.3),
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
