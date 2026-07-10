import { prisma } from '@/lib/prisma'

// Velor payout escrow — LOCKED rules. See docs/PAYOUTS.md.
// Funds are held on the platform until delivery is confirmed, then released
// after a hold window: 15 days for probation sellers, 72 hours for trusted sellers.
export const PROBATION_HOLD_MS = 15 * 24 * 60 * 60 * 1000 // 15 days
export const TRUSTED_HOLD_MS = 72 * 60 * 60 * 1000 // 72 hours

// Graduation to "trusted": clean track record.
export const TRUSTED_MIN_DELIVERED = 5
export const TRUSTED_MIN_AGE_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

// A return/dispute counts as OPEN (blocks payout) unless it is in a resolved state.
export const RESOLVED_RETURN = ['RESOLVED', 'REJECTED', 'CLOSED', 'COMPLETED', 'REFUNDED', 'DENIED', 'APPROVED']
export const RESOLVED_DISPUTE = ['RESOLVED', 'CLOSED', 'WON', 'LOST']

// A seller graduates off probation with 5+ delivered orders, a 14+ day old
// account, and zero unresolved disputes/returns across their orders.
export async function isSellerTrusted(sellerId: string): Promise<boolean> {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { createdAt: true },
  })
  if (!seller) return false
  if (seller.createdAt.getTime() > Date.now() - TRUSTED_MIN_AGE_MS) return false

  const delivered = await prisma.order.count({ where: { sellerId, status: 'DELIVERED' } })
  if (delivered < TRUSTED_MIN_DELIVERED) return false

  const openDisputes = await prisma.dispute.count({
    where: { order: { sellerId }, NOT: { status: { in: RESOLVED_DISPUTE } } },
  })
  if (openDisputes > 0) return false

  const openReturns = await prisma.returnRequest.count({
    where: { order: { sellerId }, NOT: { status: { in: RESOLVED_RETURN } } },
  })
  if (openReturns > 0) return false

  return true
}

// True if this specific order has an unresolved return or dispute — its payout
// stays frozen until that is closed, regardless of the hold timer.
export async function orderHasOpenIssue(orderId: string): Promise<boolean> {
  const openReturns = await prisma.returnRequest.count({
    where: { orderId, NOT: { status: { in: RESOLVED_RETURN } } },
  })
  if (openReturns > 0) return true

  const openDispute = await prisma.dispute.count({
    where: { orderId, NOT: { status: { in: RESOLVED_DISPUTE } } },
  })
  return openDispute > 0
}
