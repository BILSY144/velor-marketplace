import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

const PLATFORM_COMMISSION_RATE = 0.15; // 15% platform fee, 85% to seller

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', sellerId, items } = body;

    if (!amount || amount < 50) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId required' }, { status: 400 });
    }

    // Verify seller has an active Stripe Connect account with charges enabled
    const account = await stripe.accounts.retrieve(sellerId);
    if (!account.charges_enabled) {
      return NextResponse.json(
        { error: 'Seller payment account is not fully set up' },
        { status: 422 }
      );
    }

    // Calculate commission: 15% to platform, 85% to seller
    const applicationFeeAmount = Math.round(amount * PLATFORM_COMMISSION_RATE);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: sellerId,
      },
      metadata: {
        sellerId,
        platformFee: applicationFeeAmount.toString(),
        sellerPayout: (amount - applicationFeeAmount).toString(),
        items: items ? JSON.stringify(items) : '',
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      applicationFeeAmount,
      sellerPayout: amount - applicationFeeAmount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment intent creation failed';
    console.error('payment-intent error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentIntentId = searchParams.get('id');

  if (!paymentIntentId) {
    return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve payment intent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
