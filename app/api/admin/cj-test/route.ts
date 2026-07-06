import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getCategories, getProductDetail } from '@/lib/cj'

// Temporary verification endpoint -- confirms CJ_API_KEY + the auth flow +
// category fetch all work end-to-end against a live CJ account. Gated by
// ADMIN_SECRET via middleware.ts. Safe to delete once CJ integration is
// proven and the real import/order routes exist.
//
// DEBUG MODE: ?pid=<cjProductId> dumps the RAW (untyped) freightCalculate
// response for that product's first variant shipped to the US, so we can
// see whether CJ's API surfaces shipping-restriction remarks (e.g. "no PO
// Box delivery") the same way the CJ web UI shows them in red text on the
// product page. This determines whether restriction-checking can be fully
// automated via API or requires a manual read of the product page.
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const pid = request.nextUrl.searchParams.get('pid')

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
