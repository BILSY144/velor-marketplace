import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Stripe Connect not configured' }, { status: 500 });
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store';
  const redirectUri = baseUrl + '/dashboard/stripe-connect/callback';
  const oauthUrl =
    'https://connect.stripe.com/oauth/authorize?response_type=code&client_id=' +
    clientId + '&scope=read_write&redirect_uri=' + encodeURIComponent(redirectUri);
  return NextResponse.json({ url: oauthUrl });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }
    const response = await stripe.oauth.token({ grant_type: 'authorization_code', code });
    const accountId = response.stripe_user_id;
    if (!accountId) {
      return NextResponse.json({ error: 'Failed to retrieve account ID from Stripe' }, { status: 500 });
    }
    const res = NextResponse.json({ accountId });
    res.cookies.set('seller_account_id', accountId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OAuth exchange failed';
    console.error('[stripe/connect POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
