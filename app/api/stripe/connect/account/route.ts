import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const accountId = request.cookies.get('seller_account_id')?.value;
  if (!accountId) {
    return NextResponse.json({ connected: false });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
    const account = await stripe.accounts.retrieve(accountId);
    return NextResponse.json({
      connected: true,
      accountId,
      displayName: account.business_profile?.name || account.email || accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      country: account.country,
      email: account.email,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve account';
    console.error('[stripe/connect/account GET]', message);
    const res = NextResponse.json({ connected: false, error: message });
    res.cookies.delete('seller_account_id');
    return res;
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const res = NextResponse.json({ disconnected: true });
  res.cookies.delete('seller_account_id');
  return res;
}
