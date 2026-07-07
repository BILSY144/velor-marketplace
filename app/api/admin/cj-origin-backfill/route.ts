import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// One-time (re-runnable) backfill: sets originCountry = 'CN' on every
// CJ-sourced product that doesn't already have an originCountry set.
// Authorised by William 2026-07-07 -- every live listing at the time this
// was written belongs to the single internal CJ seller account, which is
// based in China, so 'CN' is a genuine, verified value here rather than a
// guess. Safe to re-run: only touches rows where originCountry is still
// null, so it will never overwrite a real per-product value set later by
// an actual global seller.
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await prisma.product.updateMany({
    where: { cjSourced: true, originCountry: null },
    data: { originCountry: 'CN' },
  })

  return NextResponse.json({ updated: result.count })
}
