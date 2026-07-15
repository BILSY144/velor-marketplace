'use client'

// Client-side currency helpers: symbol formatting, locale-based detection of
// a buyer's likely currency, and persisting their chosen display currency.
// This is a display-layer concern only -- the actual amount charged at
// checkout is computed server-side (see app/checkout and the FX conversion
// there), so what a buyer sees here is guaranteed to match what they pay.
//
// The actual data (SUPPORTED_CURRENCIES, COUNTRY_TO_CURRENCY, CURRENCY_NAMES)
// moved to lib/currencyData.ts 2026-07-15 -- see that file's header comment
// for why (a real bug: a server component importing SUPPORTED_CURRENCIES
// from this 'use client' file got an empty array at render time). Re-exported
// here so every existing `from '@/lib/currency'` import keeps working
// unchanged; new server-side code should import lib/currencyData.ts directly.
import { SUPPORTED_CURRENCIES, COUNTRY_TO_CURRENCY, CURRENCY_NAMES } from './currencyData'
import type { SupportedCurrency } from './currencyData'
export { SUPPORTED_CURRENCIES, COUNTRY_TO_CURRENCY, CURRENCY_NAMES }
export type { SupportedCurrency }

const STORAGE_KEY = 'velor-display-currency'


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
// Never throws â always returns a supported currency, defaulting to GBP.
export function detectCurrencyFromLocale(): SupportedCurrency {
  if (typeof navigator === 'undefined') return 'GBP'
  try {
    const locale = navigator.language || (navigator.languages && navigator.languages[0]) || 'en-GB'
    const region = new Intl.Locale(locale).maximize().region
    if (region && COUNTRY_TO_CURRENCY[region]) return COUNTRY_TO_CURRENCY[region]
  } catch {
    // Intl.Locale unsupported or malformed locale â fall through to default.
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
