// Payout rail resolution: Stripe Connect where Stripe supports payouts in the
// seller's country, Trolley everywhere else. This is the single source of
// truth the onboarding flow and dashboard should use.
//
// CHANGED 2026-07-23 EVENING (William, after choosing Trolley as the
// alternative and completing its Bank Transfer Activation submission same
// evening -- see CLAUDE.md): supersedes the DOTS default from earlier the
// same day. Dots.dev turned out to be a genuine dead end, not a pending-
// approval situation -- its Country field is hard-locked to United States
// businesses only, confirmed both live in the signup UI and by Dots' own AI
// documentation assistant. Velor Commerce Ltd is UK-registered, so a Dots
// account can never be created, ever. TROLLEY is now the DEFAULT rail for
// every country Stripe Connect does not cover. DOTS and PAYONEER remain
// supported PayoutRail values (lib/dots.ts and lib/payoneer.ts are
// untouched and still fully wired -- release-payouts, the dashboard, the
// gate) but getPayoutRail() will never resolve a seller onto either again.
// Existing sellers already stored as DOTS or PAYONEER self-heal to TROLLEY
// the next time any of the several self-healing call sites (payoutGate.ts,
// dashboard/payouts, release-payouts, /api/payoneer/onboard,
// /api/dots/onboard, /api/trolley/onboard) recompute their rail from
// country.
//
// IMPORTANT: verify every Trolley API call in sandbox before the first live
// payout -- see lib/trolley.ts's own header for what is and isn't
// confirmed. Trolley's own KYC review of Velor's Bank Transfer Activation
// submission was still pending at write time -- TROLLEY_ACCESS_KEY/
// TROLLEY_SECRET_KEY do not exist yet, so isTrolleyConfigured() returns
// false and every non-Stripe seller's earnings sit safely in escrow until
// William adds them (see docs/TROLLEY_SETUP.md).
//
// Country list: Stripe cross-border Connect payout availability as published
// at stripe.com/global (checked 2026-07). Stripe expands this list over time
// -- re-verify against stripe.com/global before removing a country from the
// Trolley rail, and prefer adding to this list over removing.

import { WORLD_COUNTRIES } from './worldCountries'

export type PayoutRail = 'STRIPE' | 'TROLLEY' | 'DOTS' | 'PAYONEER'

// Seller.country stores the COUNTRY NAME (the /apply form's business-country
// <select> uses names as option values), while SellerApplication.shippingCountry
// and Product.originCountry store 2-letter ISO codes. getPayoutRail() used to
// match ONLY codes, so any caller passing Seller.country (a name) resolved
// every seller to PAYONEER -- the exact bug class
// app/api/admin/recompute-payout-rails was built to clean up, resurfaced
// live 2026-07-21 (GB founding seller shown "via Payoneer", which would
// also have silently blocked their payouts: the release cron branches on
// the stored rail). countryToCode() accepts either form so every caller
// resolves correctly no matter which field it was handed.
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'uk': 'GB', 'great britain': 'GB', 'england': 'GB', 'scotland': 'GB',
  'wales': 'GB', 'northern ireland': 'GB',
  'usa': 'US', 'united states of america': 'US', 'america': 'US',
  'holland': 'NL', 'the netherlands': 'NL',
  'uae': 'AE', 'united arab emirates': 'AE',
  'czechia': 'CZ', 'turkiye': 'TR', 'republic of ireland': 'IE',
}

export function countryToCode(country: string | null | undefined): string | null {
  if (!country) return null
  const trimmed = country.trim()
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const upper = trimmed.toUpperCase()
    // "UK" is the one common two-letter form that is NOT the ISO code.
    return upper === 'UK' ? 'GB' : upper
  }
  const lower = trimmed.toLowerCase()
  const match = WORLD_COUNTRIES.find((c) => c.name.toLowerCase() === lower)
  if (match) return match.code
  return COUNTRY_NAME_ALIASES[lower] ?? null
}

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

// Accepts a 2-letter ISO code OR a country name (see countryToCode above).
export function getPayoutRail(country: string | null | undefined): PayoutRail {
  const code = countryToCode(country)
  // Unknown/unparseable country: default rail, confirmed at onboarding --
  // Stripe Connect onboarding independently validates the seller's real
  // country, so a wrong default here cannot misroute money, only copy.
  if (!code) return 'STRIPE'
  // TROLLEY is the live default for every non-Stripe country -- see the
  // header note above. A seller already stored as DOTS or PAYONEER (from
  // before this change) is corrected to TROLLEY wherever this function's
  // result is persisted.
  return STRIPE_PAYOUT_COUNTRIES.has(code) ? 'STRIPE' : 'TROLLEY'
}

export function payoutRailLabel(rail: PayoutRail): string {
  if (rail === 'STRIPE') return 'Stripe Connect'
  if (rail === 'PAYONEER') return 'Payoneer'
  if (rail === 'DOTS') return 'Dots'
  return 'Trolley'
}
