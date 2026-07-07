import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Admin certificate review queue for regulated-material listings.
// GET  -> list certificates (default: PENDING) with product + seller context.
// PATCH -> verify or reject a certificate. Verifying does NOT auto-approve
// the product -- it only clears the certificate gate; normal product review
// still applies. Rejecting keeps the product blocked from approval.

export async function GET(req: NextRequest) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = (searchParams.get('status') || 'PENDING').toUpperCase()
  const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
  }

  const certificates = await prisma.productCertificate.findMany({
    where: { status: status as 'PENDING' | 'VERIFIED' | 'REJECTED' },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: {
      product: {
        select: {
          id: true,
          title: true,
          category: true,
          materials: true,
          originCountry: true,
          status: true,
          seller: { select: { id: true, storeName: true, country: true } },
        },
      },
    },
  })

  return NextResponse.json({ count: certificates.length, certificates })
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { id, action, reviewNotes } = body as { id?: string; action?: string; reviewNotes?: string }
  if (!id || !action || !['verify', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'id and action (verify | reject) are required' }, { status: 400 })
  }

  const existing = await prisma.productCertificate.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })

  if (action === 'verify' && existing.expiresAt && existing.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Cannot verify an expired certificate' }, { status: 400 })
  }

  const certificate = await prisma.productCertificate.update({
    where: { id },
    data: {
      status: action === 'verify' ? 'VERIFIED' : 'REJECTED',
      reviewNotes: reviewNotes ? String(reviewNotes).slice(0, 2000) : null,
      reviewedAt: new Date(),
    },
  })

  return NextResponse.json({ certificate: { id: certificate.id, status: certificate.status, reviewedAt: certificate.reviewedAt } })
}
