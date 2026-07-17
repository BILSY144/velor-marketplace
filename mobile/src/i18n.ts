// Live language + currency for the Velor app (William, 2026-07-17: the app
// must convert languages and currency like the website).
//
// Language: same engine as the website -- the shared /api/translate cache
// on velorcommerce.store (each unique string model-translated once per
// language, ever, then served from Postgres). T() is wired into React
// Native's Text at the root (App.tsx), so every screen translates without
// per-screen rewrites. Untranslated strings render English first and swap
// in as batches land.
//
// Currency: live FX, GBP-based, frankfurter.app with open.er-api.com
// fallback -- the same strategy as the site's lib/fx. fmt() converts a GBP
// amount into the chosen display currency. Seller-side money (payouts,
// listing price input) stays GBP deliberately: payouts ARE GBP.

import * as SecureStore from 'expo-secure-store'

const API = 'https://velorcommerce.store/api/translate'

export const APP_LANGS: { code: string; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'it', native: 'Italiano', english: 'Italian' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
  { code: 'nl', native: 'Nederlands', english: 'Dutch' },
  { code: 'pl', native: 'Polski', english: 'Polish' },
  { code: 'tr', native: 'Türkçe', english: 'Turkish' },
  { code: 'ru', native: 'Русский', english: 'Russian' },
  { code: 'ar', native: 'العربية', english: 'Arabic' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'th', native: 'ไทย', english: 'Thai' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'zh', native: '中文', english: 'Chinese' },
  { code: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'ko', native: '한국어', english: 'Korean' },
]

let LANG = 'en'
let CUR = 'GBP'
let RATES: Record<string, number> = { GBP: 1 }
const SYMBOLS: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', JPY: '¥', CNY: '¥', INR: '₹', KRW: '₩',
  BRL: 'R$', MXN: '$', CAD: '$', AUD: '$', CHF: 'CHF ', SEK: 'kr ', NOK: 'kr ',
  PLN: 'zł ', TRY: '₺', AED: 'د.إ ', SGD: '$', ZAR: 'R ', VND: '₫',
}

const dicts: Record<string, Map<string, string>> = {}
const pending = new Set<string>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((f) => {
    try { f() } catch {}
  })
}

export function onI18n(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export function getLang(): string { return LANG }
export function getCurrency(): string { return CUR }

export async function initPrefs() {
  try {
    const l = await SecureStore.getItemAsync('velor_lang')
    if (l && APP_LANGS.some((x) => x.code === l)) LANG = l
  } catch {}
  try {
    const c = await SecureStore.getItemAsync('velor_currency')
    if (c && SYMBOLS[c]) CUR = c
  } catch {}
  emit()
  void loadRates()
}

export function setAppLanguage(code: string) {
  if (!APP_LANGS.some((x) => x.code === code)) return
  LANG = code
  SecureStore.setItemAsync('velor_lang', code).catch(() => {})
  emit()
}

export function setAppCurrency(code: string) {
  if (!SYMBOLS[code]) return
  CUR = code
  SecureStore.setItemAsync('velor_currency', code).catch(() => {})
  emit()
  void loadRates()
}

async function loadRates() {
  if (CUR === 'GBP') return
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=GBP')
    if (r.ok) {
      const j = await r.json()
      if (j?.rates) { RATES = { GBP: 1, ...j.rates }; emit(); return }
    }
  } catch {}
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/GBP')
    if (r.ok) {
      const j = await r.json()
      if (j?.rates) { RATES = { GBP: 1, ...j.rates }; emit() }
    }
  } catch {}
}

// GBP amount -> display-currency string. Falls back to GBP until a rate
// exists (never shows a wrong number with the right symbol).
export function fmt(gbp: number, decimals = 2): string {
  const rate = RATES[CUR]
  if (CUR === 'GBP' || !rate) return '£' + gbp.toFixed(decimals)
  const zeroDec = CUR === 'JPY' || CUR === 'KRW' || CUR === 'VND'
  return (SYMBOLS[CUR] || CUR + ' ') + (gbp * rate).toFixed(zeroDec ? 0 : decimals)
}

const HAS_LETTER = /[A-Za-z]/

// Synchronous translate-or-queue. English (or non-letter strings) pass
// through; unknown strings render English now and swap when the batch lands.
export function T(s: string): string {
  if (LANG === 'en' || typeof s !== 'string') return s
  const t = s.trim()
  if (t.length < 2 || !HAS_LETTER.test(t)) return s
  const d = dicts[LANG] || (dicts[LANG] = new Map())
  const hit = d.get(t)
  if (hit !== undefined) return hit === t ? s : s.replace(t, hit)
  pending.add(t.slice(0, 600))
  if (!flushTimer) flushTimer = setTimeout(() => { void flush() }, 600)
  return s
}

async function flush() {
  flushTimer = null
  const lang = LANG
  if (lang === 'en') { pending.clear(); return }
  const texts = [...pending].slice(0, 150)
  texts.forEach((t) => pending.delete(t))
  if (texts.length === 0) return
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang, texts }),
    })
    if (r.ok) {
      const { translations } = await r.json()
      const d = dicts[lang] || (dicts[lang] = new Map())
      texts.forEach((t, i) => d.set(t, translations[i]))
      emit()
    }
  } catch {}
  if (pending.size > 0 && !flushTimer) flushTimer = setTimeout(() => { void flush() }, 500)
}
