// TEMPORARY MEASURE (William, 2026-07-29): outreach emails go ONLY to sellers
// in countries where Velor has BOTH automatic shipping-label generation
// (Shippo origins GB/DE/CA; Easyship pre-negotiated origins GB/US/CA/AU/FR/
// DE/NL/BE/HK/SG/NZ) AND Stripe Connect payouts. Payoneer-only countries are
// excluded for now (William: "lets avoid payoneer sellers atm... this is a
// temporary messure"). Widen or remove this gate when the global shipping
// rollout covers more origins -- see CLAUDE.md TOP PRIORITY GLOBAL SHIPPING.

const ALLOWED = new Set([
  'gb', 'uk', 'united kingdom', 'great britain', 'england', 'scotland', 'wales', 'northern ireland',
  'us', 'usa', 'united states', 'united states of america', 'america',
  'ca', 'canada',
  'au', 'australia',
  'fr', 'france',
  'de', 'germany', 'deutschland',
  'nl', 'netherlands', 'holland', 'the netherlands',
  'be', 'belgium',
  'hk', 'hong kong', 'hong kong sar',
  'sg', 'singapore',
  'nz', 'new zealand',
])

// Unknown/blank country means we cannot prove the seller is on a supported
// lane, so under the temporary rule they are NOT emailed.
export function isAllowedOutreachCountry(country: string | null | undefined): boolean {
  if (!country) return false
  return ALLOWED.has(country.trim().toLowerCase())
}
