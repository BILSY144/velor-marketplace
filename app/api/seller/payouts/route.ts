import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const TIER_COMMISSION: Record<string, number> = {
  STARTER:    0.15,
  PRO:        0.08,
  ENTERPRISE: 0.05,
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id }
  })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }

  // Get all delivered orders for this seller
  const deliveredOrders = await prisma.order.findMany({
    where: { sellerId: seller.id, status: 'DELIVERED' },
    include: { items: true }
  })

  // Calculate gross earnings: sum of all order item totals
  const grossEarnings = deliveredOrders.reduce((sum, order) => {
    const orderTotal = order.items.reduce((s, item) => s + item.price * item.quantity, 0)
    return sum + orderTotal
  }, 0)

  // Seller receives gross minus platform fee
  const totalEarned = grossEarnings * (1 - TIER_COMMISSION[(seller as any).tier ?? 'STARTER'])

  // Get total already paid out
  const paidPayouts = await prisma.payout.findMany({
    where: { sellerId: seller.id, status: 'PAID' }
  })
  const totalPaid = paidPayouts.reduce((sum, p) => sum + p.amount, 0)

  const availableBalance = Math.max(0, totalEarned - totalPaid)

  // Get pending payouts
  const pendingPayouts = await prisma.payout.findMany({
    where: { sellerId: seller.id, status: { in: ['PENDING', 'PROCESSING'] } }
  })
  const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0)

  // Get all payouts for history
  const allPayouts = await prisma.payout.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({
    availableBalance,
    pendingAmount,
    totalEarned,
    totalPaid,
    payouts: allPayouts
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id }
  })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }

  if (!seller.stripeAccountId) {
    return NextResponse.json(
      { error: 'Stripe account not connected. Please complete onboarding first.' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { amount } = body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  // Recalculate available balance to validate
  const deliveredOrders = await prisma.order.findMany({
    where: { sellerId: seller.id, status: 'DELIVERED' },
    include: { items: true }
  })
  const grossEarnings = deliveredOrders.reduce((sum, order) => {
    const orderTotal = order.items.reduce((s, item) => s + item.price * item.quantity, 0)
    return sum + orderTotal
  }, 0)
  const totalEarned = grossEarnings * (1 - TIER_COMMISSION[(seller as any).tier ?? 'STARTER'])
  const paidPayouts = await prisma.payout.findMany({
    where: { sellerId: seller.id, status: 'PAID' }
  })
  const totalPaid = paidPayouts.reduce((sum, p) => sum + p.amount, 0)
  const availableBalance = Math.max(0, totalEarned - totalPaid)

  if (amount > availableBalance) {
    return NextResponse.json(
      { error: 'Requested amount exceeds available balance' },
      { status: 400 }
    )
  }

  const payout = await prisma.payout.create({
    data: {
      sellerId: seller.id,
      amount,
      status: 'PENDING'
    }
  })

  return NextResponse.json({ payout }, { status: 201 })
}
