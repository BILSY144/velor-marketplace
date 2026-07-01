import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any });
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://velor-marketplace.vercel.app';
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const account = await stripe.accounts.create({ type: 'express', capabilities: { card_payments: { requested: true }, transfers: { requested: true } } });
  const accountLink = await stripe.accountLinks.create({ account: account.id, refresh_url: BASE_URL + '/dashboard/stripe-connect/refresh', return_url: BASE_URL + '/dashboard/stripe-connect/return', type: 'account_onboarding' });
  const res = NextResponse.json({ onboardingUrl: accountLink.url, accountId: account.id });
  res.cookies.set('seller_account_id', account.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60*60*24*365, path: '/' });
  return res;
}
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const accountId = request.cookies.get('seller_account_id')?.value;
  if (!accountId) return NextResponse.json({ needsAccount: true });
  const accountLink = await stripe.accountLinks.create({ account: accountId, refresh_url: BASE_URL + '/dashboard/stripe-connect/refresh', return_url: BASE_URL + '/dashboard/stripe-connect/return', type: 'account_onboarding' });
  return NextResponse.json({ onboardingUrl: accountLink.url });
}���