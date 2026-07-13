import Stripe from 'stripe'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

interface PricedItem {
  productId: string
  quantity: number
  priceGBP: number
}

// Creates the Order + OrderItems record for a successfully-paid PaymentIntent.
//
// SECURITY: this is the ONLY place an Order should ever be created. It reads
// exclusively from PaymentIntent metadata that app/api/stripe/payment-intent/route.ts
// computed itself, server-side, at PaymentIntent-creation time (price, quantity,
// commission rate, seller, totals). It never trusts anything supplied directly
// by a client at order-creation time -- there is no client-suppliable price,
// total, or seller ID anywhere in this function.
//
// Idempotent via Order.stripePaymentId's unique DB constraint: if the Stripe
// webhook and the checkout-confirmation accelerator (app/api/orders POST) both
// race to create the same order, the loser's transaction hits a P2002 unique
// violation and this function just returns the winner's row instead of erroring.
export async function createOrderFromPaymentIntent(pi: Stripe.PaymentIntent) {
  const existing = await prisma.order.findUnique({ where: { stripePaymentId: pi.id } })
  if (existing) return existing

  const md = (pi.metadata || {}) as Record<string, string>

  if (!md.sellerDbId) {
    throw new Error(`PaymentIntent ${pi.id} has no sellerDbId in metadata -- refusing to create order`)
  }

  let items: PricedItem[] = []
  try {
    items = JSON.parse(md.items || '[]')
  } catch {
    items = []
  }
  items = items.filter((i) => i && i.productId && Number(i.quantity) > 0)
  if (items.length === 0) {
    throw new Error(`PaymentIntent ${pi.id} has no valid items in metadata -- refusing to create order`)
  }

  // Prisma's Json field wants InputJsonValue, not a plain Record<string, unknown>
  // (unknown values aren't assignable) -- JSON.parse's return is safe to treat
  // as such here since md.shippingAddress was itself produced by JSON.stringify
  // of a plain, JSON-safe object in payment-intent/route.ts.
  let shippingAddress: Prisma.InputJsonValue = {}
  try {
    shippingAddress = JSON.parse(md.shippingAddress || '{}') as Prisma.InputJsonValue
  } catch {
    shippingAddress = {}
  }

  const commissionRate = Number.isFinite(parseFloat(md.commissionRate)) ? parseFloat(md.commissionRate) : 0.1
  const totalGBP = parseFloat(md.totalGBP || '0') || 0
  const sellerEarnings = parseFloat(md.sellerShareGBP || '0') || 0
  const platformFee = Math.max(0, totalGBP - sellerEarnings)
  const customerEmail = (md.buyerEmail || '').toLowerCase().trim()

  try {
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          sellerId: md.sellerDbId,
          customerEmail,
          customerName: md.buyerName || customerEmail || 'Velor customer',
          shippingAddress,
          subtotal: totalGBP,
          platformFee,
          sellerEarnings,
          currency: 'gbp',
          status: 'PAID',
          stripePaymentId: pi.id,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: Math.round(Number(item.quantity)) || 0,
              price: Number(item.priceGBP) || 0,
              commission: (Number(item.priceGBP) || 0) * (Math.round(Number(item.quantity)) || 0) * commissionRate,
            })),
          },
        },
      }),
      // Decrement stock atomically with order creation. payment-intent/route.ts
      // already blocked the charge if quantity exceeded stock at intent-creation
      // time, so this should always have enough -- the stock:{gte} guard here is
      // just defense against a race between two near-simultaneous checkouts, so
      // stock can never go negative even in that edge case.
      ...items.map((item) =>
        prisma.product.updateMany({
          where: { id: item.productId, stock: { gte: Math.round(Number(item.quantity)) || 0 } },
          data: { stock: { decrement: Math.round(Number(item.quantity)) || 0 } },
        })
      ),
    ])
    return order
  } catch (err: unknown) {
    // Someone else (webhook vs. the confirmation-page accelerator) won the
    // race and created it first -- not an error, just return their row.
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      const raced = await prisma.order.findUnique({ where: { stripePaymentId: pi.id } })
      if (raced) return raced
    }
    throw err
  }
}
