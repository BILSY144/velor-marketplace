import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
// Was 'https://velor-marketplace.vercel.app' -- a stale placeholder from
// before the custom domain existed. Every other file in this codebase that
// needs a base-URL fallback (lib/orders.ts callers, app/api/payoneer/onboard,
// app/api/stripe/connect/callback) already uses velorcommerce.store. If
// NEXT_PUBLIC_BASE_URL is ever unset in a Vercel environment, this file's
// old fallback would send sellers into Stripe's hosted onboarding with a
// refresh_url/return_url on a different, unmaintained domain -- breaking the
// redirect back into the dashboard. Matches the rest of the codebase now.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) {
    return NextResponse.json({ error: 'No seller profile is linked to this account.' }, { status: 404 });
  }

  try {
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

    // The seller's row is the ONLY record of their account id -- the old
    // per-browser seller_account_id cookie is gone (2026-07-21: it let one
    // browser's account id masquerade as, and get persisted onto, whichever
    // seller was signed in). Actively delete any stale copy.
    const res = NextResponse.json({ onboardingUrl: accountLink.url, accountId: account.id });
    res.cookies.delete('seller_account_id');
    return res;
  } catch (err) {
    console.error('[stripe/connect POST] failed to create account/link', err);
    const message = err instanceof Error ? err.message : 'Unknown Stripe error';
    return NextResponse.json({ error: 'Could not start Stripe onboarding: ' + message }, { status: 502 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Resume onboarding for the account on the seller's OWN row only -- the
  // per-browser cookie is never consulted (see POST above for why).
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  const accountId = seller?.stripeAccountId || null;
  if (!accountId) {
    const res = NextResponse.json({ needsAccount: true });
    res.cookies.delete('seller_account_id');
    return res;
  }

  try {
    const accountLink = await stripe.accountLinks.create({ account: accountId, refresh_url: BASE_URL + '/dashboard/stripe-connect/refresh', return_url: BASE_URL + '/dashboard/stripe-connect/return', type: 'account_onboarding' });
    const res = NextResponse.json({ onboardingUrl: accountLink.url });
    res.cookies.delete('seller_account_id');
    return res;
  } catch (err) {
    console.error('[stripe/connect GET] failed to create account link', err);
    const message = err instanceof Error ? err.message : 'Unknown Stripe error';
    return NextResponse.json({ error: 'Could not resume Stripe onboarding: ' + message }, { status: 502 });
  }
}
