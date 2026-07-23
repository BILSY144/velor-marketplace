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
 * TROLLEY-rail sellers (added 2026-07-23 evening, replacing DOTS as the
 * default non-Stripe rail -- see lib/payoutRail.ts and lib/trolley.ts's
 * headers for why): must have finished real Trolley onboarding -- a
 * compliance status AND payout method Trolley itself reports complete
 * (Seller.trolleyOnboarded, self-healed from lib/trolley.ts's
 * getRecipientStatus()). TROLLEY is now the rail getPayoutRail() actually
 * assigns for every non-Stripe country.
 *
 * TROLLEY-NOT-YET-CONFIGURED exemption (same reasoning as the DOTS and
 * PAYONEER exemptions below): Trolley's own KYC review of Velor's Bank
 * Transfer Activation submission (William, 2026-07-23 evening) is still
 * pending -- TROLLEY_ACCESS_KEY/TROLLEY_SECRET_KEY do not exist in Vercel
 * yet, so isTrolleyConfigured() is still false and the entire Trolley
 * onboarding flow 400s (see app/api/trolley/onboard's POST). Without this
 * exemption, every approved seller outside Stripe's supported countries
 * would be locked out of Products/Orders/Settings with no way through --
 * the same dead-end-not-friction reasoning that caused real approved
 * sellers (LAKA's Studio, HALLORY) to get stuck when the DOTS rail first
 * landed without this escape hatch. The caller passes whether Trolley is
 * actually configured (computed Node-side via lib/trolley.ts's
 * isTrolleyConfigured() -- never imported directly into this Edge-safe
 * file) rather than this file checking env vars itself.
 *
 * REVISIT (TROLLEY): the moment isTrolleyConfigured() can return true
 * (Trolley approves + William adds the API keys), stop passing
 * trolleyConfigured=false and TROLLEY-rail sellers are held to the same bar
 * as Stripe -- a real completed Trolley onboarding, not just an exemption.
 *
 * DOTS-rail sellers: exempted unconditionally now, not just while
 * unconfigured. DOTS is a confirmed PERMANENT dead end (Dots.dev is
 * hard-locked to United States businesses only; Velor Commerce Ltd is
 * UK-registered and can never create an account) -- unlike Payoneer this
 * will never become configurable, so there is nothing to "revisit" here.
 * DOTS is no longer auto-assigned by getPayoutRail() (TROLLEY is), so this
 * branch only matters for a seller who was already stored as DOTS before
 * 2026-07-23 evening and has not yet self-healed to TROLLEY on their next
 * dashboard visit -- kept exempted rather than gated on a step that can
 * never be completed.
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
 * PAYONEER is no longer auto-assigned by getPayoutRail() (TROLLEY is), so
 * this branch only matters for a seller who was already stored as PAYONEER
 * before 2026-07-23 and has not yet self-healed to TROLLEY on their next
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
  trolleyOnboarded: boolean = false,
  trolleyConfigured: boolean = true
): boolean {
  if (rail === 'PAYONEER') return true;
  if (rail === 'DOTS') return true;
  if (rail === 'TROLLEY') return trolleyConfigured ? trolleyOnboarded === true : true;
  return stripeOnboarded === true;
}
