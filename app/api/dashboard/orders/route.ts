import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function maskName(name: string): string {
  if (!name) return 'Customer'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0] + '***'
  return parts[0] + ' ' + parts[parts.length - 1][0] + '.'
}

// 2026-07-21: this route used to group OrderItem rows into an ad-hoc summary
// shape (totalRevenue/totalPayout, productName/unitPrice) that never matched
// what app/dashboard/orders/page.tsx actually renders (order.total,
// order.productSubtotal/shippingCost/dutiesCost, item.price,
// item.product.name/images, order.shippingAddress, order.shipments[]) --
// found live while doing the Halo visual pass on this page: every order
// showed "£NaN" for its total and every line item, no product image or
// real name, and a blank shipping address. Rebuilt to query Order directly
// and shape the response to match the page's Order/OrderItem/Shipment
// interfaces one-to-one against the real Prisma schema.
//
// KNOWN LIMITATION: Order.subtotal (renamed `total` below) is the seller's
// full share of the sale -- product price + their portion of shipping AND
// duties combined (see lib/orders.ts SellerBreakdownEntry `o` = "thisSeller's
// TotalGBP"). Only the combined product total is persisted on the Order row;
// the shipping/duties split itself (metadata fields `h`/`u` in
// app/api/stripe/payment-intent/route.ts) is never written to the database,
// so it can't be reconstructed after the fact. Below, `productSubtotal` is
// computed honestly from the real per-item prices, and the true remainder
// (total minus that) is reported as `shippingCost` -- for the common case
// (no international duty) that's exactly correct; for a DDP order it will
// also include that order's duty, mislabelled as shipping. `dutiesCost` is
// left at 0 rather than guessed. The total itself is always exactly right
// either way. Splitting shipping from duties precisely would need a schema
// migration (persist `h`/`u` on Order at creation) -- flagged to William
// as a follow-up, not done here since it touches the production schema.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller profile not found' }, { status: 403 })

  const orders = await prisma.order.findMany({
    where: { sellerId: seller.id },
    include: {
      items: { include: { product: { select: { title: true, images: true } } } },
      shipment: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const shaped = orders.map((o) => {
    const items = o.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      product: { name: item.product?.title ?? 'Product', images: item.product?.images ?? [] },
    }))
    const productSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shippingCost = Math.max(0, Number((o.subtotal - productSubtotal).toFixed(2)))
    return {
      id: o.id,
      status: o.status,
      total: o.subtotal,
      productSubtotal,
      shippingCost,
      dutiesCost: 0,
      currency: (o.currency || 'GBP').toUpperCase(),
      buyerEmail: o.customerEmail,
      buyerName: maskName(o.customerName ?? ''),
      createdAt: o.createdAt,
      shippingAddress: (o.shippingAddress ?? {}) as Record<string, string>,
      items,
      shipments: o.shipment ? [o.shipment] : [],
    }
  })

  return NextResponse.json({ orders: shaped })
}
