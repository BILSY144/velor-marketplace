import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function maskName(name: string): string {
  if (!name) return 'Customer'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0] + '***'
  return parts[0] + ' ' + parts[parts.length - 1][0] + '.'
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller profile not found' }, { status: 403 })
  const orderItems = await prisma.orderItem.findMany({
    where: { product: { sellerId: seller.id } },
    include: {
      order: { select: { id: true, buyerName: true, status: true, createdAt: true, currency: true } },
      product: { select: { id: true, name: true, images: true } }
    },
    orderBy: { order: { createdAt: 'desc' } }
  })
  const ordersMap = new Map<string, any>()
  for (const item of orderItems) {
    const oid = item.orderId
    if (!ordersMap.has(oid)) {
      ordersMap.set(oid, {
        id: item.order.id, buyerName: maskName(item.order.buyerName),
        status: item.order.status, createdAt: item.order.createdAt,
        currency: item.order.currency, items: [], totalRevenue: 0, totalPayout: 0,
      })
    }
    const o = ordersMap.get(oid)
    const lineTotal = item.price * item.quantity
    const payout = lineTotal - item.commission
    o.items.push({ id: item.id, productId: item.productId, productName: item.product.name,
      productImage: item.product.images[0] ?? null, quantity: item.quantity,
      unitPrice: item.price, commission: item.commission, payout })
    o.totalRevenue += lineTotal
    o.totalPayout += payout
  }
  return NextResponse.json({ orders: Array.from(ordersMap.values()) })
}