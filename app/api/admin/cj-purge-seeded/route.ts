import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// One-off cleanup endpoint: the original 24 catalogue products were seeded
// from a dropshipping supplier before the marketplace's origin-first model
// was settled. They contradict the model (no real maker, no real origin
// claim, seller is an internal placeholder account) and William has ordered
// their complete removal on 2026-07-08. Real Chinese sellers will join
// through the normal application route once the Payoneer identity rail opens.
//
// GET  -> dry run: lists every cjSourced product and how many order items
//         reference each (OrderItem->Product has no cascade, so any product
//         with orders cannot be hard-deleted and is reported instead), plus
//         every isInternal seller account that will be deactivated.
// POST -> deletes every cjSourced product with zero order items (products
//         with order items are skipped and reported, never force-deleted),
//         then deactivates every isInternal seller (approved: false) so no
//         internal supplier account can ever list again.
//
// Remove this route once the purge is confirmed on the live shop page.

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const products = await prisma.product.findMany({
    where: { cjSourced: true },
    select: {
      id: true,
      title: true,
      price: true,
      status: true,
      sellerId: true,
      cjProductId: true,
      createdAt: true,
      _count: { select: { orderItems: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const internalSellers = await prisma.seller.findMany({
    where: { isInternal: true },
    select: { id: true, storeName: true, approved: true, _count: { select: { products: true, orders: true } } },
  })

  return NextResponse.json({
    count: products.length,
    withOrders: products.filter((p) => p._count.orderItems > 0).length,
    products,
    internalSellers,
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const products = await prisma.product.findMany({
    where: { cjSourced: true },
    select: { id: true, title: true, _count: { select: { orderItems: true } } },
  })

  const deleted: { id: string; title: string }[] = []
  const skipped: { id: string; title: string; reason: string }[] = []

  for (const product of products) {
    if (product._count.orderItems > 0) {
      skipped.push({
        id: product.id,
        title: product.title,
        reason: 'has order items - resolve orders first, never force-delete',
      })
      continue
    }
    try {
      await prisma.product.delete({ where: { id: product.id } })
      deleted.push({ id: product.id, title: product.title })
    } catch (err) {
      skipped.push({
        id: product.id,
        title: product.title,
        reason: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const deactivated = await prisma.seller.updateMany({
    where: { isInternal: true },
    data: { approved: false },
  })

  return NextResponse.json({
    deletedCount: deleted.length,
    deleted,
    skipped,
    internalSellersDeactivated: deactivated.count,
  })
}
