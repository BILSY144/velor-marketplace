import { prisma } from '@/lib/prisma'

// Live FX conversion with a DB-backed cache so we don't hammer the free rate
// APIs on every page load / checkout. Rates are cached per (base, quote) pair
// and refreshed once they're older than CACHE_TTL_MS.
//
// Primary source: frankfurter.app (ECB rates, free, no API key, updated on
// each business day). Fallback: open.er-api.com (free, no key, daily).

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export const SUPPORTED_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'AED', 'SGD',
  'CHF', 'SEK', 'NOK', 'DKK', 'NZD', 'HKD', 'ZAR', 'BRL', 'MXN', 'KRW',
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

async function fetchRatesFromFrankfurter(base: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.rates) return null
    return data.rates as Record<string, number>
  } catch {
    return null
  }
}

async function fetchRatesFromOpenErApi(base: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.rates) return null
    return data.rates as Record<string, number>
  } catch {
    return null
  }
}

async function fetchLiveRates(base: string): Promise<Record<string, number>> {
  const rates =
    (await fetchRatesFromFrankfurter(base)) ??
    (await fetchRatesFromOpenErApi(base))
  if (!rates) {
    throw new Error(`Could not fetch FX rates for base ${base} from any source`)
  }
  // Frankfurter doesn't return the base itself in the rates map — add it.
  rates[base] = 1
  return rates
}

// Returns a full rate table: 1 unit of `base` = rates[QUOTE] units of QUOTE,
// for every currency we support. Uses the DB cache when fresh enough.
export async function getRateTable(base: string): Promise<Record<string, number>> {
  const baseCode = base.toUpperCase()
  const cutoff = new Date(Date.now() - CACHE_TTL_MS)

  const cached = await prisma.fxRate.findMany({
    where: { base: baseCode, fetchedAt: { gte: cutoff } },
  })

  const cachedCodes = new Set(cached.map((r) => r.quote))
  const needsFresh = SUPPORTED_CURRENCIES.some((c) => !cachedCodes.has(c) && c !== baseCode)

  if (!needsFresh && cached.length > 0) {
    const table: Record<string, number> = { [baseCode]: 1 }
    for (const r of cached) table[r.quote] = r.rate
    return table
  }

  // Cache miss or stale — fetch live and upsert.
  const live = await fetchLiveRates(baseCode)
  const table: Record<string, number> = { [baseCode]: 1 }

  await Promise.all(
    SUPPORTED_CURRENCIES.filter((c) => c !== baseCode && live[c] != null).map(async (quote) => {
      const rate = live[quote]
      table[quote] = rate
      await prisma.fxRate.upsert({
        where: { base_quote: { base: baseCode, quote } },
        update: { rate, fetchedAt: new Date() },
        create: { base: baseCode, quote, rate },
      })
    })
  )

  return table
}

// Convert an amount from one currency to another using the cached/live table.
export async function convert(amount: number, from: string, to: string): Promise<number> {
  const fromCode = from.toUpperCase()
  const toCode = to.toUpperCase()
  if (fromCode === toCode) return amount
  const table = await getRateTable(fromCode)
  const rate = table[toCode]
  if (rate == null) {
    throw new Error(`No FX rate available from ${fromCode} to ${toCode}`)
  }
  return amount * rate
}

// Convenience: get a single rate (1 unit of `from` in `to`).
export async function getRate(from: string, to: string): Promise<number> {
  const fromCode = from.toUpperCase()
  const toCode = to.toUpperCase()
  if (fromCode === toCode) return 1
  const table = await getRateTable(fromCode)
  const rate = table[toCode]
  if (rate == null) {
    throw new Error(`No FX rate available from ${fromCode} to ${toCode}`)
  }
  return rate
}
