import { NextResponse } from 'next/server'
import { getAccessToken, getCategories } from '@/lib/cj'

// TEMPORARY diagnostic route, no secret required, read-only, no PII.
// Purpose: isolate exactly where the CJ integration is failing without
// needing ADMIN_SECRET in this session. DELETE after diagnosis is complete.
export const dynamic = 'force-dynamic'

export async function GET() {
  const result: Record<string, unknown> = { step: 'start' }
  try {
    result.step = 'getAccessToken'
    const token = await getAccessToken()
    result.tokenOk = !!token
    result.tokenLength = token ? token.length : 0

    result.step = 'getCategories'
    const categories = await getCategories()
    result.categoriesOk = true
    result.categoryCount = Array.isArray(categories) ? categories.length : null
    result.categorySample = Array.isArray(categories) ? categories.slice(0, 2) : categories

    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const err = e as { message?: string; stack?: string }
    return NextResponse.json(
      {
        ok: false,
        failedAt: result.step,
        error: err?.message || String(e),
        stack: err?.stack ? String(err.stack).split('\n').slice(0, 6) : undefined,
      },
      { status: 500 }
    )
  }
}
