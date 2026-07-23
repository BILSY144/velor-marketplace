// Payout-verification dashboard gate -- shared, EDGE-SAFE constant + pure
// logic only. middleware.ts imports this file directly (Edge runtime, no
// Node/Prisma available), so it must never import prisma, next-auth, or
// anything else that touches a database or the filesystem. The DB-backed
// resolver that actually looks up a seller's live state lives in
// lib/payoutGate.ts (Node runtime, used by API routes only).
//
// Background (William, 2026-07-23): "anyone can get in the dashboard without
// stripe verification... put stripe sign up at the start... same rules for
// stripe just when a seller signs up not after." Previously a seller was
// approved (rules screening only, per the 2026-07-21 identity-model change)
// and could sign in and use the whole dashboard immediately -- Stripe/
// Payoneer payout onboarding was something they could do "whenever," with
// nothing forcing it. This cookie is what middleware.ts checks to force it
// up front instead, the same pattern already used for the mandatory Terms
// acceptance gate.

export const PAYOUT_GATE_COOKIE = 'velor_payout_setup';

/**
 * Whether a seller's payout-rail verification is complete enough to use the
 * rest of the dashboard (Products, Orders, Settings, etc.) beyond the setup
 * pages themselves.
 *
 * STRIPE-rail sellers: must have finished real Stripe Connect onboarding
 * (charges_enabled && payouts_enabled -- the same definition already used as
 * Seller.stripeOnboarded elsewhere in this codebase).
 *
 * DOTS-rail sellers (added 2026-07-23, William: "same rules in place for
 * outside of stripe's reach"): must have finished real Dots onboarding --
 * a payout method/compliance status Dots itself reports complete
 * (Seller.dotsOnboarded, self-healed from lib/dots.ts's getUserStatus()).
 * DOTS is now the rail getPayoutRail() actually assigns for every non-
 * Stripe country (see lib/payoutRail.ts).
 *
 * DOTS-NOT-YET-CONFIGURED exemption (added same day, a few hours after the
 * DOTS rail landed): William has not yet signed up at dashboard.dots.dev
 * and added DOTS_API_KEY to Vercel, so isDotsConfigured() is still false --
 * the entire Dots onboarding flow 400s (see app/api/dots/onboard's POST).
 * Without this exemption, EVERY approved seller outside Stripe's supported
 * countries (the exact countries this recruitment push most needs) would
 * be locked out of Products/Orders/Settings with no way through, discovered
 * live on 2026-07-23 when two approved China-origin sellers (LAKA's
 * Studio, HALLORY) could sign in but never reach their dashboard. This is
 * the identical dead-end-not-friction reasoning as the PAYONEER exemption
 * below -- carried over a few hours late because Dots replaced Payoneer as
 * the auto-assigned rail without carrying its "rail isn't live yet" escape
 * hatch along with it. The caller passes whether Dots is actually
 * configured (computed Node-side via lib/dots.ts's isDotsConfigured() --
 * never imported directly into this Edge-safe file) rather than this file
 * checking env vars itself.
 *
 * REVISIT (DOTS): the moment isDotsConfigured() can return true, stop
 * passing dotsConfigured=false and DOTS-rail sellers are held to the same
 * bar as Stripe -- a real completed Dots onboarding, not just an
 * exemption.
 *
 * PAYONEER-rail sellers: exempted (William, confirmed 2026-07-23 after
 * asking directly whether Payoneer verification could happen independently
 * of the payout API -- it cannot). The ENTIRE Payoneer registration flow,
 * not just the money transfer, runs through Payoneer's hosted registration
 * page via lib/payoneer.ts's getRegistrationLink(), which requires the Mass
 * Payouts partner API credentials (PAYONEER_CLIENT_ID/SECRET/PROGRAM_ID/
 * API_BASE). Those do not exist yet -- isPayoneerConfigured() is still
 * false, partner approval has been pending since 13 July 2026 (support case
 * 260721-023420, chased 21 Jul). Gating a Payoneer-rail seller on a step
 * that cannot currently be completed would be a dead end, not friction.
 * PAYONEER is no longer auto-assigned by getPayoutRail() (DOTS is), so this
 * branch only matters for a seller who was already stored as PAYONEER
 * before 2026-07-23 and has not yet self-healed to DOTS on their next
 * dashboard visit -- kept exempted rather than gated on a dead-end step.
 *
 * REVISIT THIS the moment Payoneer approves partner access and
 * isPayoneerConfigured() can return true: at that point Payoneer-rail
 * sellers should be held to the same bar as every other rail (a real
 * completed registration, i.e. Seller.payoneerPayeeId confirmed ACTIVE via
 * getPayeeStatus()), not exempted.
 */
export function payoutGateSatisfied(
  rail: string,
  stripeOnboarded: boolean,
  dotsOnboarded: boolean = false,
  dotsConfigured: boolean = true
): boolean {
  if (rail === 'PAYONEER') return true;
  if (rail === 'DOTS') return dotsConfigured ? dotsOnboarded === true : true;
  return stripeOnboarded === true;
}
