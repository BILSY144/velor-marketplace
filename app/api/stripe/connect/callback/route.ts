import { NextRequest, NextResponse } from 'next/server';

// GET /api/stripe/connect/callback?account=acct_xxx&seller=xxx
// Called by Stripe after seller completes onboarding flow
// Verifies account status and redirects back to dashboard

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('account');
  const sellerId = searchParams.get('seller');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store';

  if (!accountId || !sellerId) {
    return NextResponse.redirect(`${baseUrl}/dashboard/stripe-connect?error=missing_params`);
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.redirect(`${baseUrl}/dashboard/stripe-connect?error=config`);
    }

    // Verify the account is now active
    const res = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });

    const account = await res.json();

    if (!res.ok) {
      console.error('Stripe Connect callback — account fetch failed:', account);
      return NextResponse.redirect(`${baseUrl}/dashboard/stripe-connect?error=account_not_found`);
    }

    const status = account.details_submitted && account.charges_enabled ? 'active' : 'pending';

    // Redirect to dashboard with status
    const redirectUrl = new URL(`${baseUrl}/dashboard/stripe-connect`);
    redirectUrl.searchParams.set('accountId', accountId);
    redirectUrl.searchParams.set('status', status);
    redirectUrl.searchParams.set('seller', sellerId);

    return NextResponse.redirect(redirectUrl.toString());

  } catch (err) {
    console.error('Stripe Connect callback error:', err);
    return NextResponse.redirect(`${baseUrl}/dashboard/stripe-connect?error=server`);
  }
}
