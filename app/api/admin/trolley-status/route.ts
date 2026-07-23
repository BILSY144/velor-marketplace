import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { isTrolleyConfigured } from '@/lib/trolley'

// One-off diagnostic -- added 2026-07-23 to confirm TROLLEY_ACCESS_KEY/
// TROLLEY_SECRET_KEY actually landed in the live Production environment
// after William added them in Vercel, without guessing from the dashboard
// UI alone. Read-only, no seller/order data touched. Delete after use, same
// disposable-admin-utility pattern as purge-sellers/prospect-lookup/etc.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ configured: isTrolleyConfigured() })
}
