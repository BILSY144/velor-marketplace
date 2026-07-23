import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// ONE-OFF admin utility -- William asked (2026-07-23) to permanently delete
// 4 named test/legacy seller accounts (Test Storefront Preview, 义乌市芳拓
// 饰品厂, CJ Dropshippers, Bills deals). Safe by construction, not by
// trust: a seller is only ever deleted if it has ZERO Order rows and ZERO
// Product rows referenced by any OrderItem -- Product.seller and User.seller
// both cascade in the schema, but OrderItem.product and Order.seller do NOT,
// so force-deleting a seller with real order history would either silently
// destroy that order data or throw a raw FK-violation error. Matches the
// precedent set by the 2026-07-08 cj-purge-seeded route, which kept one
// product (REJECTED, not deleted) for exactly this reason.
//
// Three of the four were clear on the first pass. The fourth (义乌市芳拓
// 饰品厂) has one real product referenced by one real PAID order -- William's
// own earlier test purchase, kept until now as proof the payment pipeline
// works end to end. William explicitly confirmed (2026-07-23, via
// AskUserQuestion) he wants it fully gone too, order included. `forceOrderIds`
// below is the narrow, verified path for that: it deletes an Order ONLY if
// that order's sellerId matches one of the sellerIds in this same request --
// never an arbitrary order by ID alone -- then relies on the schema's own
// cascades (OrderItem/ReturnRequest/Dispute all cascade from Order) before
// the normal safe-seller-delete logic runs. Shipment/Payout still block (no
// cascade in the schema) -- if either exists on the order, it is left
// completely alone and reported, never forced.
//
// GET  = dry run, no writes, reports what WOULD happen for each requested
//        seller (found/not-found, blocked-by-order with details, or clear).
// POST = executes the deletion for every seller in the list that is clear
//        (after any requested forceOrderIds are removed); anything still
//        blocked is left completely untouched and reported back.
//
// Delete this route once William confirms the cleanup looks right --
// same disposable-utility pattern as prospect-lookup/prospect-cleanup
// (2026-07-10) and application-lookup/reinvite-application (2026-07-12).
export async function GET(request: NextRequest) {
  return handle(request, false)
}

export async function POST(request: NextRequest) {
  return handle(request, true)
}

async function handle(request: NextRequest, execute: boolean) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('sellerIds') || ''
  const sellerIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
  const forceOrderIdsParam = searchParams.get('forceOrderIds') || ''
  const forceOrderIds = forceOrderIdsParam.split(',').map((s) => s.trim()).filter(Boolean)

  if (sellerIds.length === 0) {
    return NextResponse.json({ error: 'sellerIds query param required (comma-separated Seller.id list)' }, { status: 400 })
  }

  const forceLog: Array<Record<string, unknown>> = []

  if (execute && forceOrderIds.length > 0) {
    for (const orderId of forceOrderIds) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, sellerId: true, status: true, customerEmail: true, shipment: { select: { id: true } }, payout: { select: { id: true } } },
      })
      if (!order) {
        forceLog.push({ orderId, found: false })
        continue
      }
      if (!sellerIds.includes(order.sellerId)) {
        forceLog.push({ orderId, skipped: true, reason: 'sellerId does not match any seller in this request -- refusing to force-delete an unrelated order' })
        continue
      }
      if (order.shipment || order.payout) {
        forceLog.push({ orderId, skipped: true, reason: 'Order has a Shipment or Payout row (no cascade) -- not force-deleted' })
        continue
      }
      // Cascades: OrderItem, ReturnRequest, Dispute all onDelete:Cascade
      // from Order in the schema.
      await prisma.order.delete({ where: { id: orderId } })
      forceLog.push({ orderId, deleted: true, wasStatus: order.status, wasCustomerEmail: order.customerEmail })
    }
  }

  const results: Array<Record<string, unknown>> = []

  for (const sellerId of sellerIds) {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        products: { select: { id: true, title: true, _count: { select: { orderItems: true } } } },
        orders: { select: { id: true, status: true } },
        payouts: { select: { id: true } },
        shipments: { select: { id: true } },
      },
    })

    if (!seller) {
      results.push({ sellerId, found: false })
      continue
    }

    const productsWithOrders = seller.products.filter((p) => p._count.orderItems > 0)
    const blocked =
      seller.orders.length > 0 ||
      seller.payouts.length > 0 ||
      seller.shipments.length > 0 ||
      productsWithOrders.length > 0

    const summary = {
      sellerId,
      found: true,
      storeName: seller.storeName,
      userEmail: seller.user?.email,
      productCount: seller.products.length,
      orderCount: seller.orders.length,
      payoutCount: seller.payouts.length,
      shipmentCount: seller.shipments.length,
      productsWithRealOrders: productsWithOrders.map((p) => ({ id: p.id, title: p.title, orderItemCount: p._count.orderItems })),
      blocked,
      blockedReason: blocked
        ? 'Has real Order/Payout/Shipment rows, or a Product referenced by a real OrderItem -- deleting would destroy real transaction data. Not deleted.'
        : null,
      deleted: false,
    }

    if (!blocked && execute && seller.user?.id) {
      await prisma.user.delete({ where: { id: seller.user.id } })
      summary.deleted = true
    }

    results.push(summary)
  }

  return NextResponse.json({ execute, forceLog, results })
}
