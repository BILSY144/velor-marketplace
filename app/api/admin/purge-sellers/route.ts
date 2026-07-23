import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// ONE-OFF admin utility -- William asked (2026-07-23) to permanently delete
// 4 named test/legacy seller accounts (Test Storefront Preview, 义乌市芳拓
// 饰品厂, CJ Dropshippers, Bills deals) after fixing the deny/reject bug
// that surfaced them. Safe by construction, not by trust: a seller is only
// ever deleted if it has ZERO Order rows and ZERO Product rows referenced
// by any OrderItem -- Product.seller and User.seller both cascade in the
// schema, but OrderItem.product and Order.seller do NOT, so force-deleting
// a seller with real order history would either silently destroy that
// order data or throw a raw FK-violation error. Matches the precedent set
// by the 2026-07-08 cj-purge-seeded route, which kept one product
// (REJECTED, not deleted) for exactly this reason.
//
// GET  = dry run, no writes, reports what WOULD happen for each requested
//        seller (found/not-found, blocked-by-order with details, or clear).
// POST = executes the deletion for every seller in the list that is clear;
//        anything blocked is left completely untouched and reported back.
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

  if (sellerIds.length === 0) {
    return NextResponse.json({ error: 'sellerIds query param required (comma-separated Seller.id list)' }, { status: 400 })
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
      // Deleting the User cascades: Seller (onDelete:Cascade on Seller.user)
      // -> Product (onDelete:Cascade on Product.seller) -> Review/WishlistItem/
      // Message/ProductCertificate (all cascade from Product or User) ->
      // SellerShippingProfile (cascade from Seller). Safe here because we
      // just confirmed zero Orders/Payouts/Shipments and zero OrderItems on
      // any of this seller's products.
      await prisma.user.delete({ where: { id: seller.user.id } })
      summary.deleted = true
    }

    results.push(summary)
  }

  return NextResponse.json({ execute, results })
}
