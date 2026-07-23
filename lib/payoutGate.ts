// DB-backed resolver for the payout-verification dashboard gate. Node
// runtime only -- used by API routes (never import this from middleware.ts;
// see lib/payoutGateCookie.ts for the Edge-safe piece middleware actually
// uses).

import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayoutRail } from '@/lib/payoutRail';
import { isTrolleyConfigured } from '@/lib/trolley';
import { PAYOUT_GATE_COOKIE, payoutGateSatisfied } from '@/lib/payoutGateCookie';

export { PAYOUT_GATE_COOKIE, payoutGateSatisfied };

export interface PayoutGateStatus {
  rail: string;
  stripeOnboarded: boolean;
  trolleyOnboarded: boolean;
  satisfied: boolean;
}

/**
 * Look up a seller's live payout-rail state and decide whether the dashboard
 * gate is satisfied. Also self-heals Seller.payoutRail if the seller's
 * country resolves to a different rail than what's stored, same pattern
 * already used in app/api/payoneer/onboard, app/api/dots/onboard,
 * app/api/trolley/onboard, and app/api/dashboard/payouts.
 */
export async function resolvePayoutGate(userId: string): Promise<PayoutGateStatus | null> {
  const seller = await prisma.seller.findUnique({
    where: { userId },
    select: { id: true, country: true, payoutRail: true, stripeOnboarded: true, trolleyOnboarded: true },
  });
  if (!seller) return null;

  const rail = getPayoutRail(seller.country);
  if (rail !== seller.payoutRail) {
    await prisma.seller.update({ where: { id: seller.id }, data: { payoutRail: rail } }).catch(() => {});
  }

  return {
    rail,
    stripeOnboarded: seller.stripeOnboarded,
    trolleyOnboarded: seller.trolleyOnboarded,
    satisfied: payoutGateSatisfied(rail, seller.stripeOnboarded, seller.trolleyOnboarded, isTrolleyConfigured()),
  };
}

/** Set or clear the gate cookie on a response, matching the same
 * httpOnly/secure/sameSite/maxAge shape as the existing velor_terms cookie
 * (app/api/seller/terms/route.ts) for consistency.
 *
 * BOUND TO userId (fixed 2026-07-23, found live by William testing his own
 * China/Trolley test seller): the cookie value used to be a flat '1', which
 * middleware.ts only ever checked for PRESENCE, not identity. Any seller who
 * was ever satisfied in a given browser (a different, already-onboarded
 * seller account, or an old test account) left a year-long cookie that then
 * silently unlocked the dashboard for ANY seller later signed in on that
 * same browser -- including one who has completed zero payout verification.
 * Exactly the "William: I can access the dashboard without ID verification,
 * that's not what I want" bug. The cookie now stores the satisfied seller's
 * own userId, and middleware compares it against the CURRENTLY signed-in
 * user's id -- so switching accounts in the same browser can never inherit
 * another account's satisfied state. Same root-cause shape as the
 * `seller_account_id` cookie bug fixed 2026-07-21 (see that checkpoint in
 * CLAUDE.md) -- a per-browser cookie standing in for per-session truth. */
export function setPayoutGateCookie(res: NextResponse, satisfied: boolean, userId: string): void {
  if (satisfied) {
    res.cookies.set(PAYOUT_GATE_COOKIE, userId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  } else {
    res.cookies.delete(PAYOUT_GATE_COOKIE);
  }
}
