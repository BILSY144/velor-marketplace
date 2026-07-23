import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { resolvePayoutGate, setPayoutGateCookie } from '@/lib/payoutGate';

export const dynamic = 'force-dynamic';

// ============================================================
// Stripe Connect account status -- REBUILT 2026-07-21 after
// William caught the payouts surfaces reporting "Stripe Connect
// linked" for a seller who had never set it up.
//
// ROOT CAUSE: this route (and the resume route) read a year-long
// `seller_account_id` BROWSER COOKIE with priority over the
// seller's own database record, then "self-healed" the cookie's
// account id ONTO the signed-in seller's row. The cookie is
// per-browser, not per-seller: any account id ever set in that
// browser (a different seller's account, an old test account)
// was reported as -- and then PERSISTED as -- the current
// seller's payout destination. That is a money-path corruption
// vector, not a display bug.
//
// THE RULE NOW: the seller's own row (Seller.stripeAccountId) is
// the ONLY source of the account id. Cookies are never read and
// never set; any stale cookie is actively deleted. The retrieved
// account is additionally validated: it must not be the
// platform's own Stripe account (the platform can never be a
// seller's payout destination) -- if the stored id fails
// validation it is cleared, honestly returning the seller to
// the not-connected state.
// ============================================================

async function platformAccountId(stripe: Stripe): Promise<string | null> {
  try {
    // accounts.retrieve() with no id returns the PLATFORM's own account.
    const platform = await stripe.accounts.retrieve();
    return platform.id;
  } catch {
    return null;
  }
}

// Keeps the payout-verification dashboard gate cookie (middleware.ts) in sync
// with this route's own live Stripe check, every time this route is called --
// this is one of the two places (the other is /api/payoneer/onboard) a
// seller's velor_payout_setup cookie ever gets refreshed. See
// lib/payoutGateCookie.ts for what "satisfied" means.
async function syncPayoutGateCookie(res: NextResponse, userId: string): Promise<void> {
  const gate = await resolvePayoutGate(userId);
  setPayoutGateCookie(res, gate?.satisfied ?? false);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  const accountId = seller?.stripeAccountId || null;

  if (!accountId) {
    const res = NextResponse.json({ connected: false, needsAccount: true });
    res.cookies.delete('seller_account_id');
    await syncPayoutGateCookie(res, session.user.id);
    return res;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

    // GUARD: the stored id must never be the platform's own account. A
    // contaminated row (from the old cookie behaviour) is cleaned here and
    // the seller honestly shown as not connected.
    const platformId = await platformAccountId(stripe);
    if (platformId && accountId === platformId) {
      console.error('[stripe/connect/account GET] stored stripeAccountId was the PLATFORM account -- clearing');
      if (seller) {
        await prisma.seller.update({
          where: { id: seller.id },
          data: { stripeAccountId: null, stripeOnboarded: false },
        }).catch(() => {});
      }
      const res = NextResponse.json({ connected: false, needsAccount: true, cleaned: true });
      res.cookies.delete('seller_account_id');
      await syncPayoutGateCookie(res, session.user.id);
      return res;
    }

    const account = await stripe.accounts.retrieve(accountId);

    // Persist the real onboarded state so the stored flag never lags or
    // leads the live truth. Note: this only ever syncs the FLAG for the
    // account id already on the seller's own row -- it never changes which
    // account the row points at.
    if (seller) {
      const onboarded = !!(account.charges_enabled && account.payouts_enabled);
      if (seller.stripeOnboarded !== onboarded) {
        await prisma.seller.update({
          where: { id: seller.id },
          data: { stripeOnboarded: onboarded },
        }).catch((dbErr) => console.error('Failed to persist stripe onboarded flag', dbErr));
      }
    }

    const res = NextResponse.json({
      connected: true,
      accountId,
      displayName: account.business_profile?.name || account.email || accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      country: account.country,
      email: account.email,
    });
    res.cookies.delete('seller_account_id');
    await syncPayoutGateCookie(res, session.user.id);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve account';
    console.error('[stripe/connect/account GET]', message);
    const res = NextResponse.json({ connected: false, error: message });
    res.cookies.delete('seller_account_id');
    await syncPayoutGateCookie(res, session.user.id);
    return res;
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Clears BOTH DB fields so disconnect is real: stripeOnboarded: false
  // stops release-payouts from attempting a transfer (funds stay safely in
  // escrow), and stripeAccountId: null means a later "Connect with Stripe"
  // creates a fresh Express account rather than resuming an abandoned one.
  await prisma.seller.updateMany({
    where: { userId: session.user.id },
    data: { stripeAccountId: null, stripeOnboarded: false },
  });
  const res = NextResponse.json({ disconnected: true });
  res.cookies.delete('seller_account_id');
  // Re-syncs the payout-verification gate cookie now that stripeOnboarded is
  // false again -- disconnecting always re-arms the gate for a Stripe-rail
  // seller (a Payoneer-rail seller could never reach this route in the first
  // place; the Stripe Connect page redirects them away before it renders).
  await syncPayoutGateCookie(res, session.user.id);
  return res;
}
