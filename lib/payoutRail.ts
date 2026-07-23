// Payout rail resolution: Stripe Connect where Stripe supports payouts in the
// seller's country, Dots everywhere else. This is the single source of
// truth the onboarding flow and dashboard should use.
//
// CHANGED 2026-07-23 (William: "Payoneer needs to get their act together...
// is there an alternative to Payoneer, quick set up"): Payoneer's Mass
// Payouts partner application has sat unanswered since 13 July (see the
// SELLER ACQUISITION / Payoneer checkpoints in CLAUDE.md) and its ENTIRE
// registration flow -- not just the payout transfer -- is blocked on
// credentials that may never arrive in time for the 6 Aug launch. Dots.dev
// (lib/dots.ts) is a self-serve payouts API with no partner-approval gate,
// so it is now the DEFAULT rail for every country Stripe Connect does not
// cover. PAYONEER remains a supported PayoutRail value and lib/payoneer.ts
// is untouched and still fully wired (release-payouts, the dashboard, the
// gate) -- if Payoneer's partner application is ever approved, a seller can
// still be moved onto it deliberately (e.g. via a future admin action), but
// getPayoutRail() itself will never resolve a seller onto PAYONEER again.
// Existing sellers already stored as PAYONEER self-heal to DOTS the next
// time any of the several self-healing call sites (payoutGate.ts,
// dashboard/payouts, release-payouts, /api/payoneer/onboard,
// /api/dots/onboard) recompute their rail from country.
//
// IMPORTANT: verify every Dots API call in sandbox before the first live
// payout -- see lib/dots.ts's own header for what is and isn't confirmed.
//
// Country list: Stripe cross-border Connect payout availability as published
// at stripe.com/global (checked 2026-07). Stripe expands this list over time
// -- re-verify against stripe.com/global before removing a country from the
// Payoneer rail, and prefer adding to this list over removing.

import { WORLD_COUNTRIES } from './worldCountries'

export type PayoutRail = 'STRIPE' | 'DOTS' | 'PAYONEER'

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
  // DOTS, not PAYONEER, is the live default for every non-Stripe country --
  // see the header note above. A seller already stored as PAYONEER (from
  // before this change) is corrected to DOTS wherever this function's
  // result is persisted.
  return STRIPE_PAYOUT_COUNTRIES.has(code) ? 'STRIPE' : 'DOTS'
}

export function payoutRailLabel(rail: PayoutRail): string {
  if (rail === 'STRIPE') return 'Stripe Connect'
  if (rail === 'PAYONEER') return 'Payoneer'
  return 'Dots'
}
