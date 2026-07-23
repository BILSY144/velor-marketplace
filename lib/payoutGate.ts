// DB-backed resolver for the payout-verification dashboard gate. Node
// runtime only -- used by API routes (never import this from middleware.ts;
// see lib/payoutGateCookie.ts for the Edge-safe piece middleware actually
// uses).

import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayoutRail } from '@/lib/payoutRail';
import { isDotsConfigured } from '@/lib/dots';
import { PAYOUT_GATE_COOKIE, payoutGateSatisfied } from '@/lib/payoutGateCookie';

export { PAYOUT_GATE_COOKIE, payoutGateSatisfied };

export interface PayoutGateStatus {
  rail: string;
  stripeOnboarded: boolean;
  dotsOnboarded: boolean;
  satisfied: boolean;
}

/**
 * Look up a seller's live payout-rail state and decide whether the dashboard
 * gate is satisfied. Also self-heals Seller.payoutRail if the seller's
 * country resolves to a different rail than what's stored, same pattern
 * already used in app/api/payoneer/onboard, app/api/dots/onboard, and
 * app/api/dashboard/payouts.
 */
export async function resolvePayoutGate(userId: string): Promise<PayoutGateStatus | null> {
  const seller = await prisma.seller.findUnique({
    where: { userId },
    select: { id: true, country: true, payoutRail: true, stripeOnboarded: true, dotsOnboarded: true },
  });
  if (!seller) return null;

  const rail = getPayoutRail(seller.country);
  if (rail !== seller.payoutRail) {
    await prisma.seller.update({ where: { id: seller.id }, data: { payoutRail: rail } }).catch(() => {});
  }

  return {
    rail,
    stripeOnboarded: seller.stripeOnboarded,
    dotsOnboarded: seller.dotsOnboarded,
    satisfied: payoutGateSatisfied(rail, seller.stripeOnboarded, seller.dotsOnboarded, isDotsConfigured()),
  };
}

/** Set or clear the gate cookie on a response, matching the same
 * httpOnly/secure/sameSite/maxAge shape as the existing velor_terms cookie
 * (app/api/seller/terms/route.ts) for consistency. */
export function setPayoutGateCookie(res: NextResponse, satisfied: boolean): void {
  if (satisfied) {
    res.cookies.set(PAYOUT_GATE_COOKIE, '1', {
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
