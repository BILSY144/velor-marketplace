import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Live counts for the seller dashboard sidebar (William's 2026-07-30
// dashboard design: Orders / Products / Questions & Answers / Messages /
// Followers carry count badges and Payments carries the held balance).
// Every figure is the signed-in seller's REAL data -- counters are
// genuine and start at zero, per his explicit "build them all for real"
// decision. One request, cheap COUNT/SUM queries only.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    select: { id: true, userId: true, storeLogo: true },
  })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const [orders, products, questions, messages, followers, balanceAgg] = await Promise.all([
    prisma.order.count({ where: { sellerId: seller.id } }),
    prisma.product.count({ where: { sellerId: seller.id } }),
    // Unanswered buyer questions across this seller's listings.
    prisma.productQuestion.count({ where: { product: { sellerId: seller.id }, answer: null } }),
    // Unread messages in the seller's inbox.
    prisma.message.count({ where: { receiverId: seller.userId, isRead: false } }),
    prisma.follow.count({ where: { sellerId: seller.id } }),
    // Earnings held for this seller and not yet paid out -- every paid
    // order with no Payout row. Same sellerEarnings field release-payouts
    // itself reads; GBP-denominated (see lib/orders.ts).
    prisma.order.aggregate({
      where: {
        sellerId: seller.id,
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        payout: null,
      },
      _sum: { sellerEarnings: true },
    }),
  ])

  return NextResponse.json({
    orders,
    products,
    questions,
    messages,
    followers,
    balanceGBP: balanceAgg._sum.sellerEarnings || 0,
    storeLogo: seller.storeLogo || null,
  })
}
