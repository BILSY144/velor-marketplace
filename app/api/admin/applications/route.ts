import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Permanent admin route: browse every SellerApplication with full detail,
// filterable and paginated. Built 2026-07-12 to back /pulse/applications so
// William has a permanent, searchable view instead of relying on the
// temporary application-lookup diagnostic route (app/api/admin/application-lookup,
// built 2026-07-12, "delete once no longer needed"). That route is left in
// place untouched -- this is additive, not a replacement of it.
//
// Query params (all optional):
//   status    -- exact match, case-insensitive (e.g. PENDING, APPROVED, REJECTED)
//   country   -- partial match, case-insensitive
//   q         -- searches businessName, contactName, contactEmail (partial, case-insensitive)
//   page      -- 1-indexed page number, default 1
//   pageSize  -- default 25, max 100
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const country = searchParams.get('country')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25))

  const where: Record<string, unknown> = {}
  if (status) where.status = { equals: status, mode: 'insensitive' }
  if (country) where.country = { contains: country, mode: 'insensitive' }
  if (q) {
    where.OR = [
      { businessName: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { contactEmail: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [applications, total] = await Promise.all([
    prisma.sellerApplication.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        contactName: true,
        contactEmail: true,
        website: true,
        storeDescription: true,
        productCategories: true,
        sampleImages: true,
        country: true,
        status: true,
        verificationStatus: true,
        rejectionReason: true,
        reviewedBy: true,
        reviewedAt: true,
        verifiedAt: true,
        verificationNotes: true,
        prospectId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sellerApplication.count({ where }),
  ])

  return NextResponse.json({
    applications,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}
