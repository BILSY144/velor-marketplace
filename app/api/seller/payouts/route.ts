import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await prisma.seller.findUnique({
    where: { userId: (session.user as any).id },
  })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }

  const payouts = await prisma.payoutRequest.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Calculate available balance: sum of seller earnings minus paid out
  const orderItems = await prisma.orderItem.findMany({
    where: { sellerId: seller.id },
    include: { order: { select: { status: true } } },
  })

  const totalEarned = orderItems
    .filter(item => item.order.status === 'COMPLETED' || item.order.status === 'DELIVERED')
    .reduce((sum, item) => sum + item.sellerEarnings, 0)

  const totalPaidOut = payouts
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingPayout = payouts
    .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
    .reduce((sum, p) => sum + p.amount, 0)

  const available = Math.max(0, totalEarned - totalPaidOut - pendingPayout)

  return NextResponse.json({ payouts, available, totalEarned, totalPaidOut, pendingPayout })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await prisma.seller.findUnique({
    where: { userId: (session.user as any).id },
  })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }
  if (seller.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Seller account not approved' }, { status: 403 })
  }

  const body = await request.json()
  const { amount } = body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  // Verify sufficient balance
  const orderItems = await prisma.orderItem.findMany({
    where: { sellerId: seller.id },
    include: { order: { select: { status: true } } },
  })

  const totalEarned = orderItems
    .filter(item => item.order.status === 'COMPLETED' || item.order.status === 'DELIVERED')
    .reduce((sum, item) => sum + item.sellerEarnings, 0)

  const existingPayouts = await prisma.payoutRequest.findMany({
    where: { sellerId: seller.id, status: { in: ['PAID', 'PENDING', 'PROCESSING'] } },
  })

  const alreadyPaidOrPending = existingPayouts.reduce((sum, p) => sum + p.amount, 0)
  const available = Math.max(0, totalEarned - alreadyPaidOrPending)

  if (amount > available) {
    return NextResponse.json({ error: 'Amount exceeds available balance' }, { status: 400 })
  }

  const minPayout = 1000 // £10 minimum in pence
  if (amount < minPayout) {
    return NextResponse.json({ error: 'Minimum payout is £10.00' }, { status: 400 })
  }

  const payout = await prisma.payoutRequest.create({
    data: {
      sellerId: seller.id,
      amount,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ payout }, { status: 201 })
}
