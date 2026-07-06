import { NextResponse } from 'next/server'
import { getAccessToken, getCategories } from '@/lib/cj'

// Temporary verification endpoint -- confirms CJ_API_KEY + the auth flow +
// category fetch all work end-to-end against a live CJ account. Gated by
// ADMIN_SECRET via middleware.ts. Safe to delete once CJ integration is
// proven and the real import/order routes exist.
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
