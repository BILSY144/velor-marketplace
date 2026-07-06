import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/cj'

// Temporary verification endpoint -- confirms the CJ_API_KEY env var and the
// auth flow in lib/cj.ts actually work against a live CJ account, and prints
// the RAW category-endpoint response so we can see CJ's actual response
// shape before trusting our typed wrapper. Gated by ADMIN_SECRET via
// middleware.ts. Safe to delete once CJ integration is proven.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const token = await getAccessToken()
    const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/getCategory', {
      headers: { 'CJ-Access-Token': token },
    })
    const raw = await res.text()
    return NextResponse.json({
      ok: true,
      tokenPrefix: token.slice(0, 8) + '...',
      httpStatus: res.status,
      rawBodyPrefix: raw.slice(0, 1500),
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
