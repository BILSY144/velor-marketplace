import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

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
