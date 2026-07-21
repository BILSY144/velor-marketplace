'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getDisplayCurrency, symbolFor } from './currency'

type RatesCache = Record<string, Record<string, number>>

export function useCurrencyDisplay() {
  const [displayCurrency, setDisplayCurrency] = useState('GBP')
  const ratesRef = useRef<RatesCache>({})
    const [, bump] = useState(0)

useEffect(() => {
  setDisplayCurrency(getDisplayCurrency())
  const onChange = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail
    if (detail) setDisplayCurrency(detail)
  }
  window.addEventListener('velor-currency-changed', onChange)
  return () => window.removeEventListener('velor-currency-changed', onChange)
}, [])

const ensureRates = useCallback((from: string) => {
  const key = from.toUpperCase()
  if (ratesRef.current[key]) return
  ratesRef.current[key] = {}
    fetch(`/api/fx/rates?base=${key}`)
  .then((res) => res.json())
  .then((data) => {
    ratesRef.current[key] = data.rates || {}
      bump((n) => n + 1)
  })
  .catch(() => {})
}, [])

const convert = useCallback((amount: number, from: string) => {
  const fromCode = from.toUpperCase()
  const toCode = displayCurrency.toUpperCase()
  if (fromCode === toCode) return amount
  const table = ratesRef.current[fromCode]
  if (!table || table[toCode] == null) {
    ensureRates(fromCode)
    return amount
  }
  return amount * table[toCode]
}, [displayCurrency, ensureRates])

return { displayCurrency, symbol: symbolFor(displayCurrency), convert }
}


// Converting GBP formatter shared by dashboard pages (2026-07-21, William:
// currency must convert everywhere, not just Overview). Renders a GBP
// amount in the user's chosen display currency; falls back to the raw
// symbol+amount if Intl rejects the code.
export function useMoneyFmt(): (gbpAmount: number) => string {
  const { displayCurrency, symbol, convert } = useCurrencyDisplay()
  return (gbpAmount: number) => {
    const converted = convert(gbpAmount, 'GBP')
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: displayCurrency }).format(converted)
    } catch {
      return `${symbol}${converted.toFixed(2)}`
    }
  }
}
