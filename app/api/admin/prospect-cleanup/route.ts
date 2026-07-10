import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// One-time remediation route (2026-07-10). William reported outreach emails
// reaching service-sector/large-brand/placeholder inboxes. Investigation via
// /api/admin/prospect-lookup?all=1 found 203 contacted prospects, of which
// only 4 were ever qualified:true -- the rest (121 qualified:false, 78
// qualified:null) were legacy scrape backlog from before the AI qualification
// gate existed. This route permanently drops that contaminated backlog so it
// can never re-enter any outreach-auto query stage (all three stages filter
// on status: 'prospected'). Companion fix: outreach-auto's followup1/followup2
// queries now also require qualified: true directly, so this is defense in
// depth, not the only gate. POST only, admin-gated, idempotent -- safe to
// delete once William confirms the cleanup looks right.
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const before = await prisma.sellerProspect.count({
    where: { qualified: { not: true }, status: 'prospected' },
  })

  const result = await prisma.sellerProspect.updateMany({
    where: { qualified: { not: true }, status: 'prospected' },
    data: { status: 'dropped' },
  })

  const remainingActiveQualifiedTrue = await prisma.sellerProspect.count({
    where: { status: 'prospected', qualified: true },
  })

  return NextResponse.json({
    ok: true,
    matchedBeforeUpdate: before,
    updatedCount: result.count,
    remainingActiveQualifiedTrue,
  })
}
