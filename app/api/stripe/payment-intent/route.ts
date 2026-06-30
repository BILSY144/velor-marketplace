import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const PLATFORM_COMMISSION_RATE = 0.15;

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
  const { amount, currency = 'usd', sellerId, items } = await request.json();
  const applicationFeeAmount = Math.round(amount * PLATFORM_COMMISSION_RATE);
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    application_fee_amount: applicationFeeAmount,
    transfer_data: { destination: sellerId },
    metadata: {
      sellerId,
      platformFee: applicationFeeAmount.toString(),
      sellerPayout: (amount - applicationFeeAmount).toString(),
    },
    automatic_payment_methods: { enabled: true },
  });
  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    applicationFeeAmount,
    sellerPayout: amount - applicationFeeAmount,
  });
}

export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
  const paymentIntentId = new URL(request.url).searchParams.get('id');
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return NextResponse.json({
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata,
  });
}
