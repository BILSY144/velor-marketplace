import { prisma } from '@/lib/prisma'

// Velor seller ranking — LOCKED weights (sum = 100). See docs/SUBSCRIPTION_AND_TIERS.md.
const W = { rating: 30, fulfilment: 20, dispute: 15, cancel: 10, volume: 15, response: 10 }
const VOLUME_CAP = 200 // delivered orders for full volume marks
const BADGE_MIN_ORDERS = 10 // completed (delivered) orders required to unlock a badge

export type ScoreBreakdown = {
  rating: number
  fulfilment: number
  dispute: number
  cancel: number
  volume: number
  response: number
  avgRating: number
  reviewCount: number
  deliveredOrders: number
  paidOrders: number
  totalOrders: number
  disputeRate: number
  cancelRate: number
  fulfilmentRate: number
  responseRate: number
}

function badgeFor(score: number, deliveredOrders: number): string {
  if (deliveredOrders < BADGE_MIN_ORDERS) return 'NEW'
  if (score >= 90) return 'TOP_RATED'
  if (score >= 75) return 'TRUSTED'
  if (score >= 60) return 'ESTABLISHED'
  return 'NEW'
}

// Recompute one seller's score from live data and persist it.
// New sellers (no data) score 0 by design — they start at the bottom and earn rank.
export async function computeSellerScore(sellerId: string) {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { id: true, userId: true },
  })
  if (!seller) return null

  const orders = await prisma.order.findMany({
    where: { sellerId },
    select: { status: true },
  })
  const totalOrders = orders.length
  const(#ountBy = (statuses: string[]) =>
    orders.filter((o) => statuses.includes(o.status)).length
  const paidOrders = countBy(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'REFUNDED'])
  const deliveredOrders = countBy(['DELIVERED'])
  const fulfilled = countBy(['SHIPPED', 'DELIVERED'])
  const disputed = countBy(['DISPUTED'])
  const refunded = countBy(['REFUNDED'])
  const cancelled = countBy(['CANCELLED'])

  const agg = await prisma.review.aggregate({
    where: { product: { sellerId } },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const reviewCount = agg._count.rating ?? 0
  const avgRating = agg._avg.rating ?? 0

  const received = await prisma.message.count({ where: { receiverId: seller.userId } })
  const sent = await prisma.message.count({ where: { senderId: seller.userId } })

  // Each component is 0 when there is no data, so new sellers start at the bottom.
  const ratingScore = reviewCount > 0 ? W.rating * (avgRating / 5) : 0
  const fulfilmentRate = paidOrders > 0 ? fulfilled / paidOrders : 0
  const fulfilmentScore = paidOrders > 0 ? W.fulfilment * fulfilmentRate : 0
  const disputeRate = paidOrders > 0 ? (disputed + refunded) / paidOrders : 0
  const disputeScore = paidOrders > 0 ? W.dispute * (1 - disputeRate) : 0
  const cancelRate = totalOrders > 0 ? cancelled / totalOrders : 0
  const cancelScore = totalOrders > 0 ? W.cancel * (1 - cancelRate) : 0
  const volumeScore = deliveredOrders > 0
    ? W.volume * Math.min(1, Math.log10(1 + deliveredOrders) / Math.log10(1 + VOLUME_CAP))
    : 0
  const responseRate = received > 0 ? Math.min(1, sent / received) : 0
  const responseScore = received > 0 ? W.response * responseRate : 0

  const score = Math.round(
    ratingScore + fulfilmentScore + disputeScore + cancelScore + volumeScore + responseScore
  )
  const badge = badgeFor(score, deliveredOrders)

  const breakdown: ScoreBreakdown = {
    rating: Math.round(ratingScore),
    fulfilment: Math.round(fulfilmentScore),
    dispute: Math.round(disputeScore),
    cancel: Math.round(cancelScore),
    volume: Math.round(volumeScore),
    response: Math.round(responseScore),
    avgRating: Number(avgRating.toFixed(2)),
    reviewCount,
    deliveredOrders,
    paidOrders,
    totalOrders,
    disputeRate: Number(disputeRate.toFixed(3)),
    cancelRate: Number(cancelRate.toFixed(3)),
    fulfilmentRate: Number(fulfilmentRate.toFixed(3)),
    responseRate: Number(responseRate.toFixed(3)),
  }

  await prisma.seller.update({
    where: { id: sellerId },
    data: {
      sellerScore: score,
      sellerBadge: badge,
      sellerScoreUpdatedAt: new Date(),
      scoreBreakdown: breakdown as unknown as object,
    } as unknown as Record<string, unknown>,
  })

  return { score, badge, breakdown }
}

// Recompute every approved seller (used by the daily cron).
export async function recomputeAllSellerScores() {
  const sellers = await prisma.seller.findMany({
    where: { approved: true },
    select: { id: true },
  })
  let updated = 0
  for (const s of sellers) {
    try {
      await computeSellerScore(s.id)
      updated++
    } catch {
      // skip a failing seller, keep going
    }
  }
  return { total: sellers.length, updated }
}
