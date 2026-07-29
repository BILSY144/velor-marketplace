// Which dispatch origins can Velor auto-purchase shipping labels for?
// Shippo carrier accounts cover GB/DE/CA; Easyship origins are switched
// on via the EASYSHIP_ORIGINS env var (same var as app/api/shipping/rates
// and lib/orders.ts -- keep the parse identical).
//
// TEMPORARY NON-NEGOTIABLE RULE (William, 2026-07-29): sellers outside
// these origins MUST offer free shipping and bake real postage into the
// product price. Enforced in app/api/shipping/rates (point of use, all
// sellers past and future) and app/api/dashboard/settings/shipping
// (point of save). Remove when label coverage is global.

const SHIPPO_AUTO_LABEL_ORIGINS = ['GB', 'DE', 'CA']

export function easyshipRateOrigins(): Set<string> {
  return new Set(
    (process.env.EASYSHIP_ORIGINS || '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c))
  )
}

export function isAutoLabelOrigin(country: string | null | undefined): boolean {
  const code = (country || '').trim().toUpperCase()
  if (!code) return false
  return SHIPPO_AUTO_LABEL_ORIGINS.includes(code) || easyshipRateOrigins().has(code)
}
