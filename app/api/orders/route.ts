import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { createOrderFromPaymentIntent } from '@/lib/orders'

// POST - authenticated accelerator for the checkout-confirmation page.
//
// This does NOT create an order from anything the client sends. The client
// only tells us WHICH PaymentIntent to look up; everything used to build the
// Order (seller, price, quantity, commission, shipping address) is read back
// from Stripe itself via createOrderFromPaymentIntent(), which trusts only
// the metadata app/api/stripe/payment-intent/route.ts set server-side.
//
// The Stripe webhook (payment_intent.succeeded) is the real, reliable path --
// it fires even if the buyer's tab closes before this ever runs. This route
// exists purely so the confirmation page can get order IDs back immediately
// instead of waiting on webhook delivery, and it's fully idempotent with the
// webhook via Order's compound (stripePaymentId, sellerId) unique constraint
// -- one PaymentIntent can now produce multiple orders, one per seller in
// the cart, and each is created at most once regardless of which caller
// (this route or the webhook) wins the race for that particular seller.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sessionEmail = session.user.email.toLowerCase().trim()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { paymentIntentId } = body as { paymentIntentId?: string }
  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 })
  }

  // Fast path: the webhook (or a previous call to this route) already
  // created it. One PaymentIntent can now produce MULTIPLE orders -- one
  // per seller in the cart -- so this is a findMany, not findUnique.
  const existing = await prisma.order.findMany({ where: { stripePaymentId: paymentIntentId } })
  if (existing.length > 0) {
    if (!existing.every((o) => o.customerEmail.toLowerCase().trim() === sessionEmail)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ orderIds: existing.map((o) => o.id) }, { status: 200 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  let pi: Stripe.PaymentIntent
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (pi.status !== 'succeeded') {
    return NextResponse.json({ error: 'Payment not completed yet' }, { status: 409 })
  }

  const metadataEmail = (pi.metadata?.buyerEmail || '').toLowerCase().trim()
  if (!metadataEmail || metadataEmail !== sessionEmail) {
    // The PaymentIntent belongs to someone else's account -- never let a
    // logged-in buyer create or view an order for another buyer's payment.
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // One PaymentIntent can produce multiple orders -- one per seller in
    // the cart. See lib/orders.ts.
    const orders = await createOrderFromPaymentIntent(pi)
    return NextResponse.json({ orderIds: orders.map((o) => o.id) }, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// GET /api/orders - list the signed-in buyer's own orders. Always scoped to
// the authenticated session's email -- a client-supplied email is never
// trusted here, so one buyer can never enumerate another buyer's order
// history.
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { customerEmail: session.user.email.toLowerCase().trim() },
    include: {
      items: { include: { product: { select: { id: true, title: true, images: true, category: true } } } },
      shipment: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ orders })
}
