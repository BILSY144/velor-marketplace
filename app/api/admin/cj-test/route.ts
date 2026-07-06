import { NextResponse } from 'next/server'
import { getAccessToken, getCategories } from '@/lib/cj'

// Temporary verification endpoint -- confirms the CJ_API_KEY env var and the
// auth flow in lib/cj.ts actually work against a live CJ account. Gated by
// the same ADMIN_SECRET convention as every other /api/admin/* route
// (enforced by middleware.ts). Safe to delete once CJ integration is proven
// and the real import/order routes exist.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
