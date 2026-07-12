import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Read-only diagnostic route: look up SellerApplication rows with full
// detail, including rejectionReason, which no other admin route currently
// selects. Built 2026-07-12 so William could see why a specific application
// (Indonesia) was rejected. GET only -- never writes anything. Delete once
// no longer needed, same as the prospect-lookup precedent from 2026-07-10.
//
// Modes:
//   ?country=Indonesia   -- case-insensitive partial match on country
//   ?id=<applicationId>  -- exact match on id
//   ?status=REJECTED     -- filter by status, combine with country/id
//   (no params)           -- most recent 20 applications, any status
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country')
  const id = searchParams.get('id')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (id) where.id = id
  if (country) where.country = { contains: country, mode: 'insensitive' }
  if (status) where.status = status

  const applications = await prisma.sellerApplication.findMany({
    where,
    select: {
      id: true,
      businessName: true,
      contactName: true,
      contactEmail: true,
      website: true,
      storeDescription: true,
      productCategories: true,
      country: true,
      status: true,
      rejectionReason: true,
      reviewedAt: true,
      reviewedBy: true,
      verificationStatus: true,
      verifiedAt: true,
      verificationNotes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ count: applications.length, applications })
}
