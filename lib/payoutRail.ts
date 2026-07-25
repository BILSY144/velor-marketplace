// Payout rail resolution: Stripe Connect where Stripe supports payouts in the
// seller's country, Payoneer everywhere else. This is the single source of
// truth the onboarding flow and dashboard should use.
//
// PAYONEER is the non-Stripe default (its Mass Payouts partner application
// has been pending since 13 July 2026 -- see CLAUDE.md -- so this rail
// exempts sellers from the payout gate while unconfigured; see
// lib/payoutGateCookie.ts). No other payout provider is integrated; see
// CLAUDE.md's payout-rail history for prior providers evaluated and
// rejected -- including Dots (tried 2026-07-23, removed the same day: a
// hard dead end, Dots.dev is US-businesses-only and Velor is UK-registered)
// and Trolley (tried and removed 2026-07-24). 'DOTS' fully removed as a
// PayoutRail value 2026-07-25 -- every seller confirmed migrated off it
// first; see lib/dots.ts's git history if the old adapter is ever needed
// for reference.
//
// Country list: Stripe cross-border Connect payout availability as published
// at stripe.com/global (checked 2026-07). Stripe expands this list over time
// -- re-verify against stripe.com/global before removing a country from the
// Payoneer rail, and prefer adding to this list over removing.

import { WORLD_COUNTRIES } from './worldCountries'

export type PayoutRail = 'STRIPE' | 'PAYONEER'

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
  // PAYONEER is the live default for every non-Stripe country -- see the
  // header note above. A seller row still holding a stale legacy value
  // (DOTS, Trolley) is corrected to PAYONEER wherever this function's
  // result is persisted.
  return STRIPE_PAYOUT_COUNTRIES.has(code) ? 'STRIPE' : 'PAYONEER'
}

export function payoutRailLabel(rail: PayoutRail): string {
  if (rail === 'STRIPE') return 'Stripe Connect'
  return 'Payoneer'
}
