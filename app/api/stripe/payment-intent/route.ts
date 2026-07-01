import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const PLATFORM_COMMISSION_RATE = 0.15;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
    const { amount, currency = 'gbp', sellerId, items } = await request.json();

    if (!amount || typeof amount !== 'number' || amount < 50) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: items ? JSON.stringify(items).slice(0, 500) : '',
      },
    };

    // Only apply Connect split when a valid seller account is provided.
    // transfer_data.destination and application_fee_amount both require
    // a connected Stripe Express account — omit them for platform-only payments.
    if (sellerId && typeof sellerId === 'string' && sellerId.startsWith('acct_')) {
      const applicationFeeAmount = Math.round(amount * PLATFORM_COMMISSION_RATE);
      intentParams.application_fee_amount = applicationFeeAmount;
      intentParams.transfer_data = { destination: sellerId };
      intentParams.metadata = {
        ...intentParams.metadata,
        sellerId,
        platformFee: applicationFeeAmount.toString(),
        sellerPayout: (amount - applicationFeeAmount).toString(),
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(intentParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[payment-intent]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
