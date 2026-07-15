// Pure data, deliberately NOT 'use client' -- split out of lib/currency.ts
// (2026-07-15) after a real, live bug: app/press/page.tsx (a plain server
// component) imported SUPPORTED_CURRENCIES from lib/currency.ts and got an
// empty array at render time ("Prices display to buyers in 0 currencies"
// went live on /press), even though the exact same array renders correctly
// everywhere it's used from a client component (e.g. the header currency
// dropdown, which lists all 20). lib/currency.ts's 'use client' directive
// marks it as a client-boundary module; a Server Component importing a
// plain value export from it is not a safe, well-defined pattern in the
// App Router. Moving the data itself here (no directive) and having
// lib/currency.ts re-export it keeps every existing `from '@/lib/currency'`
// import working unchanged, while giving server components (this page, and
// any future one) a version they can import directly and safely.
export const SUPPORTED_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'AED', 'SGD',
  'CHF', 'SEK', 'NOK', 'DKK', 'NZD', 'HKD', 'ZAR', 'BRL', 'MXN', 'KRW',
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

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

export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  GBP: 'British Pound', USD: 'US Dollar', EUR: 'Euro', CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar', JPY: 'Japanese Yen', CNY: 'Chinese Yuan',
  INR: 'Indian Rupee', AED: 'UAE Dirham', SGD: 'Singapore Dollar',
  CHF: 'Swiss Franc', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
  DKK: 'Danish Krone', NZD: 'New Zealand Dollar', HKD: 'Hong Kong Dollar',
  ZAR: 'South African Rand', BRL: 'Brazilian Real', MXN: 'Mexican Peso',
  KRW: 'South Korean Won',
}
