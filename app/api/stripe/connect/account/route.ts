import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let accountId = request.cookies.get('seller_account_id')?.value;
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!accountId && seller?.stripeAccountId) {
    accountId = seller.stripeAccountId;
  }
  if (!accountId) {
    return NextResponse.json({ connected: false, needsAccount: true });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
    const account = await stripe.accounts.retrieve(accountId);
    if (seller && (account.charges_enabled || account.payouts_enabled || seller.stripeAccountId !== accountId)) {
      try {
        await prisma.seller.update({
          where: { id: seller.id },
          data: {
            stripeAccountId: accountId,
            stripeOnboarded: !!(account.charges_enabled && account.payouts_enabled),
          } as unknown as Record<string, unknown>,
        });
      } catch (dbErr) {
        console.error('Failed to persist stripe account status', dbErr);
      }
    }
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Previously this only cleared the cookie. Seller.stripeAccountId stayed
  // in the database, so GET's cookie-missing fallback (`if (!accountId &&
  // seller?.stripeAccountId) accountId = seller.stripeAccountId`) resolved
  // the SAME account again on the very next status check -- "Disconnect"
  // appeared to work (the confirm() dialog fires, the button responds) but
  // the dashboard flipped straight back to "Connected" once fetchStatus()
  // re-ran, with nothing actually disconnected. Clearing both DB fields
  // makes this real: stripeOnboarded: false stops release-payouts from
  // attempting a transfer (funds simply stay held in escrow, matching the
  // "you will stop receiving payouts" warning already shown before this
  // call), and stripeAccountId: null means a later "Connect with Stripe"
  // creates a fresh Express account rather than trying to resume a
  // deliberately abandoned one.
  await prisma.seller.updateMany({
    where: { userId: session.user.id },
    data: { stripeAccountId: null, stripeOnboarded: false },
  });
  const res = NextResponse.json({ disconnected: true });
  res.cookies.delete('seller_account_id');
  return res;
}
