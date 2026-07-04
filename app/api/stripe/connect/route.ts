import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any });
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://velor-marketplace.vercel.app';
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) {
    return NextResponse.json({ error: 'No seller profile is linked to this account.' }, { status: 404 });
  }
  const account = await stripe.accounts.create({ type: 'express', capabilities: { card_payments: { requested: true }, transfers: { requested: true } } });
  const accountLink = await stripe.accountLinks.create({ account: account.id, refresh_url: BASE_URL + '/dashboard/stripe-connect/refresh', return_url: BASE_URL + '/dashboard/stripe-connect/return', type: 'account_onboarding' });
  try {
    await prisma.seller.update({
      where: { id: seller.id },
      data: { stripeAccountId: account.id } as unknown as Record<string, unknown>,
    });
  } catch (dbErr) {
    console.error('Failed to persist new stripe account id', dbErr);
  }
  const res = NextResponse.json({ onboardingUrl: accountLink.url, accountId: account.id });
  res.cookies.set('seller_account_id', account.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60*60*24*365, path: '/' });
  return res;
}
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let accountId = request.cookies.get('seller_account_id')?.value;
  if (!accountId) {
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (seller?.stripeAccountId) accountId = seller.stripeAccountId;
  }
  if (!accountId) return NextResponse.json({ needsAccount: true });
  const accountLink = await stripe.accountLinks.create({ account: accountId, refresh_url: BASE_URL + '/dashboard/stripe-connect/refresh', return_url: BASE_URL + '/dashboard/stripe-connect/return', type: 'account_onboarding' });
  const res = NextResponse.json({ onboardingUrl: accountLink.url });
  res.cookies.set('seller_account_id', accountId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60*60*24*365, path: '/' });
  return res;
}
