import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { normalizeSellerTier } from '@/lib/tier'
import { getPayoutRail, payoutRailLabel } from '@/lib/payoutRail'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    select: { id: true, approved: true, tier: true, foundingBadge: true, country: true, storeName: true },
  })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  // The payout rail is resolved LIVE from the seller's country via
  // lib/payoutRail.ts -- the single source of truth -- so the dashboard
  // shell can show every seller exactly (and only) the payment system that
  // is correct for their country. Never read a stored rail field here.
  const payoutRail = getPayoutRail(seller.country)

  return NextResponse.json({
    id: seller.id,
    approved: seller.approved,
    tier: normalizeSellerTier(seller.tier),
    foundingBadge: seller.foundingBadge ?? false,
    country: seller.country,
    storeName: seller.storeName,
    payoutRail,
    payoutRailLabel: payoutRailLabel(payoutRail),
  })
}
