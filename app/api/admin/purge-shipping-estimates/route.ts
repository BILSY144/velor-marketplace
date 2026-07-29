import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Purge the PDP shipping-estimate cache (2026-07-29). Needed whenever
// pricing rules change platform-wide -- e.g. the same-day removal of the
// per-item admin fee from seller-provided rates left cached seller-set
// rows holding fee-inflated amounts for up to the cache TTL. POST with
// optional { sellerSetOnly: true } to purge only seller-set-rate rows.
// Rows self-repopulate on the next PDP visit via the live rates engine.

export async function POST(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const where = body?.sellerSetOnly ? { service: { contains: 'seller-set' } } : {}
  const result = await prisma.shippingEstimate.deleteMany({ where })
  return NextResponse.json({ ok: true, purged: result.count })
}
