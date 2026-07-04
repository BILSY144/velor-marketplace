import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Velor Marketplace <customerservice@velorcommerce.co.uk>';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const cs = event.data.object as Stripe.Checkout.Session
      if (cs.metadata?.type === 'storefront_unlock' && cs.metadata?.sellerId) {
        await prisma.seller.update({ where: { id: cs.metadata.sellerId }, data: { storefrontUnlocked: true } as unknown as Record<string, unknown> })
      }
      break
    }
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID', stripePaymentId: pi.id },
        });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.seller.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: {
          tier: (sub.items.data[0]?.price?.id === process.env.STRIPE_ENTERPRISE_PRICE_ID ? 'ENTERPRISE' : sub.items.data[0]?.price?.id === process.env.STRIPE_PRO_PRICE_ID ? 'PRO' : (sub.items.data[0]?.price?.metadata?.tier ?? 'PRO')) as any,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
          subscriptionCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const downgraded = await prisma.seller.findMany({
        where: { stripeCustomerId: sub.customer as string },
        select: { id: true },
      });
      await prisma.seller.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: {
          tier: 'STARTER',
          stripeSubscriptionId: null,
          subscriptionStatus: 'cancelled',
          subscriptionCurrentPeriodEnd: null,
        },
      });
      // Enforce STARTER 50-listing cap: keep 50 oldest live listings, delist the rest
      for (const s of downgraded) {
        const live = await prisma.product.findMany({
          where: { sellerId: s.id, status: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            orderItems: {
              where: { order: { status: { in: ['PENDING', 'PROCESSING', 'DISPUTED'] } } },
              select: { id: true },
              take: 1,
            },
          },
        });
        if (live.length > 50) {
          const excess = live.slice(50);
          const toDelist = excess
            .filter((p) => p.orderItems.length === 0)
            .map((p) => p.id);
          if (toDelist.length > 0) {
            await prisma.product.updateMany({
              where: { id: { in: toDelist } },
              data: { status: 'DELISTED' },
            });
          }
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const seller = await prisma.seller.findUnique({
        where: { stripeCustomerId: customerId },
        include: { user: { select: { email: true, name: true } } },
      });

      if (seller) {
        await prisma.seller.update({
          where: { id: seller.id },
          data: { subscriptionStatus: 'past_due' },
        });

        const sellerEmail = seller.user?.email;
        const sellerName = seller.user?.name ?? seller.storeName;

        if (sellerEmail) {
          const nextRetry = (invoice as any).next_payment_attempt
            ? new Date((invoice as any).next_payment_attempt * 1000).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })
            : 'shortly';

          await resend.emails.send({
            from: FROM_EMAIL,
            to: [sellerEmail],
            subject: 'Action required: Your Velor Pro subscription payment failed',
            html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8f8f8;margin:0;padding:40px 20px;"><div style="max-width:560px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;"><div style="background:#0f0f0f;padding:32px 40px;"><p style="color:white;font-size:22px;font-weight:700;margin:0;">Velor Marketplace</p></div><div style="padding:40px;"><h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 16px;">Payment failed for your Pro subscription</h1><p style="color:#555;line-height:1.6;margin:0 0 20px;">Hi ${sellerName},</p><p style="color:#555;line-height:1.6;margin:0 0 20px;">We were unable to charge your payment method for your Velor Pro subscription. We will retry the payment on <strong>${nextRetry}</strong>.</p><p style="color:#555;line-height:1.6;margin:0 0 24px;">Until this is resolved, your account remains active but if payment continues to fail, your subscription will be cancelled and your store will revert to the Starter plan (15% commission, 50 listing cap).</p><a href="https://velorcommerce.store/dashboard/upgrade" style="display:inline-block;background:#7c3aed;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Update payment method</a><hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/><p style="color:#999;font-size:12px;margin:0;">Questions? <a href="mailto:customerservice@velorcommerce.co.uk" style="color:#7c3aed;">customerservice@velorcommerce.co.uk</a></p></div></div></body></html>`,
          });
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const recovered = await prisma.seller.findFirst({
        where: { stripeCustomerId: customerId, subscriptionStatus: 'past_due' },
        include: { user: { select: { email: true } } },
      });
      await prisma.seller.updateMany({
        where: { stripeCustomerId: customerId, subscriptionStatus: 'past_due' },
        data: { subscriptionStatus: 'active' },
      });
      if (recovered?.user?.email) {
        const sellerName = recovered.storeName || 'there';
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [recovered.user.email],
          subject: 'Payment recovered - your Pro subscription is active',
          html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8f8f8;margin:0;padding:40px 20px;"><div style="max-width:560px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;"><div style="background:#0f0f0f;padding:32px 40px;"><p style="color:white;font-size:22px;font-weight:700;margin:0;">Velor Marketplace</p></div><div style="padding:40px;"><h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 16px;">Your Pro subscription is back on</h1><p style="color:#555;line-height:1.6;margin:0 0 20px;">Hi ${sellerName},</p><p style="color:#555;line-height:1.6;margin:0 0 20px;">Your payment was successfully processed and your Velor Pro subscription is now active again. All your listings and seller features are fully restored.</p><p style="color:#555;line-height:1.6;margin:0 0 28px;">Thank you for resolving this.</p><p style="color:#999;font-size:12px;margin-top:32px;">Velor Marketplace &mdash; customerservice@velorcommerce.co.uk</p></div></div></body></html>`,
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
