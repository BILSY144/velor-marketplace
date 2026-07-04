'use client'

// Client-side currency helpers: symbol formatting, locale-based detection of
// a buyer's likely currency, and persisting their chosen display currency.
// This is a display-layer concern only — the actual amount charged at
// checkout is computed server-side (see app/checkout and the FX conversion
// there), so what a buyer sees here is guaranteed to match what they pay.

export const SUPPORTED_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'AED', 'SGD',
  'CHF', 'SEK', 'NOK', 'DKK', 'NZD', 'HKD', 'ZAR', 'BRL', 'MXN', 'KRW',
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

const STORAGE_KEY = 'velor-display-currency'

// Maps a country code (from Intl locale region, or a seller's Origin Country
// field) to its most common currency. Falls back to GBP for anything unmapped.
export const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  GB: 'GBP', US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
  JP: 'JPY', CN: 'CNY', HK: 'HKD', SG: 'SGD', IN: 'INR', KR: 'KRW',
  AE: 'AED', ZA: 'ZAR', BR: 'BRL', MX: 'MXN',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
}

export function symbolFor(currency: string): string {
  const symbols: Record<string, string> = {
    GBP: '£', USD: '$', EUR: '€', JPY: '¥', CNY: '¥', INR: '₹',
    KRW: '₩', CHF: 'CHF ', AED: 'AED ', SGD: 'S$', HKD: 'HK$',
    CAD: 'C$', AUD: 'A$', NZD: 'NZ$', ZAR: 'R', BRL: 'R$', MXN: 'MX$',
    SEK: 'kr ', NOK: 'kr ', DKK: 'kr ',
  }
  return symbols[currency.toUpperCase()] ?? currency.toUpperCase() + ' '
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(amount)
  } catch {
    return `${symbolFor(currency)}${amount.toFixed(2)}`
  }
}

// Best-effort guess at the buyer's currency from their browser locale.
// Never throws — always returns a supported currency, defaulting to GBP.
export function detectCurrencyFromLocale(): SupportedCurrency {
  if (typeof navigator === 'undefined') return 'GBP'
  try {
    const locale = navigator.language || (navigator.languages && navigator.languages[0]) || 'en-GB'
    const region = new Intl.Locale(locale).maximize().region
    if (region && COUNTRY_TO_CURRENCY[region]) return COUNTRY_TO_CURRENCY[region]
  } catch {
    // Intl.Locale unsupported or malformed locale — fall through to default.
  }
  return 'GBP'
}

export function getStoredCurrency(): SupportedCurrency | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw && (SUPPORTED_CURRENCIES as readonly string[]).includes(raw)) {
    return raw as SupportedCurrency
  }
  return null
}

export function setStoredCurrency(currency: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, currency.toUpperCase())
  window.dispatchEvent(new CustomEvent('velor-currency-changed', { detail: currency.toUpperCase() }))
}

// The currency to display prices in for this visitor: their saved choice,
// or an auto-detected guess from their browser locale on first visit.
export function getDisplayCurrency(): SupportedCurrency {
  const stored = getStoredCurrency()
  if (stored) return stored
  const detected = detectCurrencyFromLocale()
  setStoredCurrency(detected)
  return detected
}

export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  GBP: 'British Pound', USD: 'US Dollar', EUR: 'Euro', CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar', JPY: 'Japanese Yen', CNY: 'Chinese Yuan',
  INR: 'Indian Rupee', AED: 'UAE Dirham', SGD: 'Singapore Dollar',
  CHF: 'Swiss Franc', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
  DKK: 'Danish Krone', NZD: 'New Zealand Dollar', HKD: 'Hong Kong Dollar',
  ZAR: 'South African Rand', BRL: 'Brazilian Real', MXN: 'Mexican Peso',
  KRW: 'South Korean Won',
}
