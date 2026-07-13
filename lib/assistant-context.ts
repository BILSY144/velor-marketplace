import { prisma } from '@/lib/prisma'

export type AssistantTier = 'STARTER' | 'PRO' | 'ENTERPRISE'

// Same commission map used by app/api/seller/payouts/route.ts - kept in one
// place here so the assistant never states a number that could drift from
// what payouts actually charge.
export const TIER_COMMISSION: Record<AssistantTier, number> = {
  STARTER: 0.1,
  PRO: 0.04,
  ENTERPRISE: 0,
}

// Matches docs/PAYOUTS.md "Freeze on issues" section exactly.
const RESOLVED_RETURN_STATUSES = ['RESOLVED', 'REJECTED', 'CLOSED', 'COMPLETED', 'REFUNDED', 'DENIED']
const RESOLVED_DISPUTE_STATUSES = ['RESOLVED', 'CLOSED', 'WON', 'LOST']

export function capabilitiesForTier(tier: string) {
  const isPro = tier === 'PRO' || tier === 'ENTERPRISE'
  const isEnterprise = tier === 'ENTERPRISE'
  return {
    canReadOwnData: isPro,
    canLookupOrders: isEnterprise,
    canDraftReplies: isEnterprise,
    canEscalate: isEnterprise,
  }
}

// Builds a plain-text, seller-scoped account snapshot to inject into the
// system prompt for Pro and Enterprise. Starter gets none of this - it stays
// on the generic, knowledge-only assistant. Everything here is a real query
// against that seller's own data, never fabricated and never another
// seller's data.
export async function buildAccountSnapshot(sellerId: string, tier: AssistantTier): Promise<string> {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { storeName: true, tier: true, sellerScore: true, sellerBadge: true, createdAt: true },
  })
  if (!seller) return ''

  const orders = await prisma.order.findMany({
    where: { sellerId },
    select: { id: true, status: true, sellerEarnings: true, currency: true, deliveredAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED')

  const [openDisputes, openReturns] = await Promise.all([
    prisma.dispute.findMany({
      where: { order: { sellerId }, status: { notIn: RESOLVED_DISPUTE_STATUSES } },
      select: { orderId: true },
    }),
    prisma.returnRequest.findMany({
      where: { order: { sellerId }, status: { notIn: RESOLVED_RETURN_STATUSES } },
      select: { orderId: true },
    }),
  ])
  const hasUnresolvedIssue = openDisputes.length > 0 || openReturns.length > 0
  const accountAgeDays = Math.floor((Date.now() - seller.createdAt.getTime()) / 86400000)
  const isTrustedForPayout = deliveredOrders.length >= 10 && accountAgeDays >= 30 && !hasUnresolvedIssue
  const holdWindow = isTrustedForPayout ? '72 hours after delivery' : '15 days after delivery'
  const commission = TIER_COMMISSION[tier] ?? TIER_COMMISSION.STARTER

  const statusCounts: Record<string, number> = {}
  for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
  const statusSummary = Object.entries(statusCounts).map(([s, n]) => `${s}: ${n}`).join(', ') || 'no orders yet'

  const lines: string[] = []
  lines.push(`Store: ${seller.storeName}. Tier: ${seller.tier}. Commission rate: ${Math.round(commission * 100)}%.`)
  lines.push(`Merit score: ${seller.sellerScore ?? 0}/100. Buyer-facing badge: ${seller.sellerBadge ?? 'NEW'} (this badge is separate from the payout-trust status below - do not conflate them).`)
  lines.push(`Total orders: ${orders.length}. Delivered: ${deliveredOrders.length}. Status breakdown: ${statusSummary}.`)
  lines.push(`Payout hold window for this account: ${holdWindow}. The shorter 72-hour window requires 10+ delivered orders, 30+ days account age, and zero unresolved disputes or returns; this account is ${accountAgeDays} days old.`)
  if (hasUnresolvedIssue) {
    lines.push(`This seller currently has ${openDisputes.length} unresolved dispute(s) and ${openReturns.length} unresolved return(s) - any order involved in one of those is frozen for payout regardless of the hold window until it is resolved.`)
  }

  if (tier === 'ENTERPRISE' && orders.length > 0) {
    const recent = orders.slice(0, 10).map((o) => {
      const shortId = o.id.slice(-8)
      const placed = o.createdAt.toISOString().slice(0, 10)
      const delivered = o.deliveredAt ? `, delivered ${o.deliveredAt.toISOString().slice(0, 10)}` : ''
      return `Order ...${shortId}: status ${o.status}, your earnings ${o.sellerEarnings.toFixed(2)} ${o.currency.toUpperCase()}, placed ${placed}${delivered}.`
    })
    lines.push('Most recent orders (newest first, referenced by the last 8 characters of the order ID - use these for specific order-status questions):')
    lines.push(...recent)
  }

  return lines.join('\n')
}
