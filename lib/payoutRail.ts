// Payout rail resolution: Stripe Connect where Stripe supports payouts in the
// seller's country, Payoneer everywhere else. This is the single source of
// truth the onboarding flow and dashboard should use, so the "Stripe or
// Payoneer where applicable" promise in the Seller Agreement, dashboard terms
// and Help FAQ maps to real behaviour.
//
// IMPORTANT: Payoneer payouts are NOT live yet -- the Payoneer Mass Payouts
// partner application must be approved and the registration-link onboarding
// flow built before any PAYONEER-rail seller is told payouts are ready. Until
// then, getPayoutRail() still answers correctly ("which rail WILL this seller
// use") but UI copy must say Payoneer onboarding is being set up.
//
// Country list: Stripe cross-border Connect payout availability as published
// at stripe.com/global (checked 2026-07). Stripe expands this list over time
// -- re-verify against stripe.com/global before removing a country from the
// Payoneer rail, and prefer adding to this list over removing.

export type PayoutRail = 'STRIPE' | 'PAYONEER'

export const STRIPE_PAYOUT_COUNTRIES = new Set<string>([
  // Americas
  'US', 'CA', 'MX', 'BR',
  // Europe
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GI',
  'GR', 'HU', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL',
  'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB',
  // Asia-Pacific
  'AU', 'NZ', 'JP', 'SG', 'HK', 'MY', 'TH',
  // Middle East
  'AE',
])

export function getPayoutRail(countryCode: string | null | undefined): PayoutRail {
  if (!countryCode) return 'STRIPE' // unknown country: default rail, confirmed at onboarding
  return STRIPE_PAYOUT_COUNTRIES.has(countryCode.toUpperCase()) ? 'STRIPE' : 'PAYONEER'
}

export function payoutRailLabel(rail: PayoutRail): string {
  return rail === 'STRIPE' ? 'Stripe Connect' : 'Payoneer'
}
