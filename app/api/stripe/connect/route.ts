import { NextRequest, NextResponse } from 'next/server';

// POST /api/stripe/connect
// Creates a Stripe Connect Express account for a seller and returns the onboarding URL
// Body: { sellerId, email, businessName? }

export async function POST(request: NextRequest) {
  try {
    const { sellerId, email, businessName } = await request.json();

    if (!sellerId || !email) {
      return NextResponse.json({ error: 'sellerId and email are required' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store';

    // Step 1: Create a Stripe Connect Express account
    const accountParams = new URLSearchParams({
      type: 'express',
      email,
      'capabilities[card_payments][requested]': 'true',
      'capabilities[transfers][requested]': 'true',
      'business_profile[name]': businessName || email,
      'metadata[velor_seller_id]': sellerId,
    });

    const accountRes = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: accountParams.toString(),
    });

    const account = await accountRes.json();

    if (!accountRes.ok) {
      console.error('Stripe Connect account creation failed:', account);
      return NextResponse.json({ error: account.error?.message || 'Failed to create account' }, { status: 500 });
    }

    // Step 2: Create an Account Link (onboarding URL)
    const linkParams = new URLSearchParams({
      account: account.id,
      'refresh_url': `${baseUrl}/dashboard/stripe-connect?refresh=1&seller=${sellerId}`,
      'return_url': `${baseUrl}/api/stripe/connect/callback?account=${account.id}&seller=${sellerId}`,
      type: 'account_onboarding',
    });

    const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: linkParams.toString(),
    });

    const link = await linkRes.json();

    if (!linkRes.ok) {
      console.error('Stripe Account Link creation failed:', link);
      return NextResponse.json({ error: link.error?.message || 'Failed to create onboarding link' }, { status: 500 });
    }

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: link.url,
      status: 'pending',
    });

  } catch (err) {
    console.error('Stripe Connect POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/stripe/connect?accountId=acct_xxx
// Returns the current status of a Connect account
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const res = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });

    const account = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: account.error?.message || 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({
      accountId: account.id,
      email: account.email,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      defaultCurrency: account.default_currency,
      country: account.country,
    });

  } catch (err) {
    console.error('Stripe Connect GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
