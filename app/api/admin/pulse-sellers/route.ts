import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { sendEmail, buildSellerApprovedEmail, buildSellerRejectedEmail } from '@/lib/email'

// Seller directory -- backs /pulse/sellers, the mobile ops dashboard's
// searchable list of every seller on the marketplace (store name, tier,
// approval state, ranking/seller score, payout rail, product count, and
// contact details). Auth follows the same convention as every other Pulse
// API route: isAuthorizedAdmin accepts EITHER a NextAuth ADMIN session OR
// the Pulse Bearer ADMIN_SECRET token, so this route works from both the
// desktop admin surface and the token-gated mobile PWA.
//
// Alongside the paginated/filtered seller list, this route also returns two
// summary aggregates (byTier, byCountry) computed independently of the
// current filters, so the page can show "shape of the whole seller base"
// context even while the list itself is filtered down to a search result.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const country = (searchParams.get('country') || '').trim()
  const tier = (searchParams.get('tier') || '').trim().toUpperCase()
  const status = (searchParams.get('status') || 'all').trim().toLowerCase()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25))

  const where: Prisma.SellerWhereInput = {}

  if (q) {
    where.OR = [
      { storeName: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ]
  }
  if (country) {
    where.country = { contains: country, mode: 'insensitive' }
  }
  if (tier === 'STARTER' || tier === 'PRO' || tier === 'ENTERPRISE') {
    where.tier = tier
  }
  if (status === 'approved') {
    where.approved = true
  } else if (status === 'pending') {
    where.approved = false
  }

  const [sellers, total, byTierRaw, byCountryRaw] = await Promise.all([
    prisma.seller.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        _count: { select: { products: true } },
      },
      orderBy: { rankingScore: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.seller.count({ where }),
    prisma.seller.groupBy({
      by: ['tier'],
      _count: { _all: true },
    }),
    prisma.seller.groupBy({
      by: ['country'],
      _count: { _all: true },
      orderBy: { _count: { country: 'desc' } },
      take: 15,
    }),
  ])

  const byTier = byTierRaw
    .map((row) => ({ tier: row.tier, count: row._count._all }))
    .sort((a, b) => b.count - a.count)

  const byCountry = byCountryRaw
    .map((row) => ({ country: row.country || 'Not provided', count: row._count._all }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    sellers: sellers.map((s) => ({
      id: s.id,
      storeName: s.storeName,
      country: s.country,
      currency: s.currency,
      approved: s.approved,
      tier: s.tier,
      sellerScore: s.sellerScore,
      sellerBadge: s.sellerBadge,
      rankingScore: s.rankingScore,
      foundingEligible: s.foundingEligible,
      foundingBadge: s.foundingBadge,
      payoutRail: s.payoutRail,
      productCount: s._count.products,
      contactName: s.user?.name || null,
      contactEmail: s.user?.email || null,
      createdAt: s.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    byTier,
    byCountry,
  })
}

// Approve/deny a seller directly from Pulse -- added 2026-07-23 for
// "orphaned" sellers: bare Seller rows (approved: false) created by the
// legacy /auth/sign-up -> /api/auth/register path, which never creates a
// SellerApplication and so never appears in the real review pipeline
// (review-applications cron, /pulse/applications, /admin/applications).
// Until now the only way to action one of these was the desktop-only
// /admin/sellers console (NextAuth session, not Bearer-token). This PATCH
// mirrors that route's approve/reject behaviour but is gated through
// isAuthorizedAdmin so it also works from Pulse's Bearer ADMIN_SECRET
// model. Deliberately scoped to approve/reject only, not "suspend" --
// this is for actioning a PENDING orphaned seller, not managing an
// already-approved seller's lifecycle.
export async function PATCH(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const sellerId = body?.sellerId
  const action = body?.action
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''

  if (!sellerId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request -- sellerId and action (approve|reject) are required' }, { status: 400 })
  }
  if (action === 'reject' && !reason) {
    return NextResponse.json({ error: 'A reason is required to deny a seller' }, { status: 400 })
  }

  const approved = action === 'approve'
  const seller = await prisma.seller.update({
    where: { id: sellerId },
    data: { approved },
    include: {
      user: { select: { name: true, email: true } },
    },
  }).catch(() => null)

  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }

  const sellerName = seller.user?.name || 'Seller'
  const sellerEmail = seller.user?.email || ''

  // Best-effort: a failed email must never undo the approve/reject that
  // already committed -- same pattern used elsewhere in this codebase
  // (e.g. order confirmation emails in lib/orders.ts).
  if (sellerEmail) {
    try {
      const built = approved
        ? buildSellerApprovedEmail({ sellerName, storeName: seller.storeName })
        : buildSellerRejectedEmail({ contactName: sellerName, businessName: seller.storeName, reason })
      await sendEmail({ to: sellerEmail, subject: built.subject, html: built.html })
    } catch (err) {
      console.error('pulse-sellers PATCH: failed to send seller decision email', err)
    }
  }

  return NextResponse.json({ seller })
}
