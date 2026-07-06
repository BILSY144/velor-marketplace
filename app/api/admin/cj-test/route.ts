import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getCategories, getProductDetail } from '@/lib/cj'

export const dynamic = 'force-dynamic'
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

export async function GET(request: NextRequest) {
  try {
    const pid = request.nextUrl.searchParams.get('pid')
    const keyword = request.nextUrl.searchParams.get('keyword')

    if (keyword) {
      const token = await getAccessToken()
      const qs = new URLSearchParams()
      qs.set('keyWord', keyword)
      qs.set('page', '1')
      qs.set('size', '3')
      const res = await fetch(`${CJ_BASE}/product/listV2?${qs.toString()}`, {
        headers: { 'CJ-Access-Token': token },
      })
      const rawJson = await res.json()
      return NextResponse.json({ ok: true, keyword, rawSearchResponse: rawJson })
    }

    if (pid) {
      const token = await getAccessToken()
      const detail = await getProductDetail(pid)
      const vid = detail.variants[0]?.vid
      if (!vid) {
        return NextResponse.json({ ok: false, error: 'no variants on this product' }, { status: 400 })
      }
      const res = await fetch(`${CJ_BASE}/logistic/freightCalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
        body: JSON.stringify({
          startCountryCode: 'CN',
          endCountryCode: 'US',
          products: [{ vid, quantity: 1 }],
        }),
      })
      const rawJson = await res.json()
      return NextResponse.json({ ok: true, pid, vid, productName: detail.productNameEn || detail.productName, rawFreightResponse: rawJson })
    }

    const token = await getAccessToken()
    const categories = await getCategories()
    return NextResponse.json({
      ok: true,
      tokenPrefix: token.slice(0, 8) + '...',
      categoryCount: categories.length,
      firstCategory: categories[0]?.categoryFirstName || null,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
