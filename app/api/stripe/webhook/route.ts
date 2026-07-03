import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        await prisma.order.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: 'PAID' },
        });
      } catch {
        // Order may not exist yet (client-side creation pending)
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        await prisma.order.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: 'CANCELLED' },
        });
      } catch {
        // Order may not exist yet
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.seller.updateMany({ where: { stripeCustomerId: sub.customer as string }, data: { tier: (sub.items.data[0]?.price?.metadata?.tier ?? 'PRO') as any, stripeSubscriptionId: sub.id, subscriptionStatus: sub.status, subscriptionCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000) } });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.seller.updateMany({ where: { stripeCustomerId: sub.customer as string }, data: { tier: 'STARTER', stripeSubscriptionId: null, subscriptionStatus: 'cancelled', subscriptionCurrentPeriodEnd: null } });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
