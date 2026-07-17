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
// Legacy API on SDK 54: documentDirectory + read/writeAsStringAsync. Used
// to persist each language's dictionary on-device (v4), so a cold start
// paints translated from disk instantly instead of refetching every open.
import * as FileSystem from 'expo-file-system/legacy'

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

// ---- On-device dictionary persistence (v4) -------------------------------
const dictPath = (lang: string) => `${FileSystem.documentDirectory}velor-i18n-${lang}.json`
const loadedFromDisk = new Set<string>()
let saveTimer: ReturnType<typeof setTimeout> | null = null

async function loadDict(lang: string) {
  if (lang === 'en' || loadedFromDisk.has(lang)) return
  loadedFromDisk.add(lang)
  try {
    const raw = await FileSystem.readAsStringAsync(dictPath(lang))
    const obj: Record<string, string> = JSON.parse(raw)
    const d = dicts[lang] || (dicts[lang] = new Map())
    for (const k of Object.keys(obj)) if (!d.has(k)) d.set(k, obj[k])
    if (d.size > 0) emit()
  } catch {} // first run for this language, or FS unavailable -- fine
}

function scheduleSaveDict(lang: string) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    const d = dicts[lang]
    if (!d || d.size === 0) return
    const obj: Record<string, string> = {}
    d.forEach((v, k) => { obj[k] = v })
    FileSystem.writeAsStringAsync(dictPath(lang), JSON.stringify(obj)).catch(() => {})
  }, 1500)
}
// --------------------------------------------------------------------------

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
  // Cold start with a stored language: paint from the on-disk dictionary
  // immediately, then pull anything missing from the warmed server cache.
  if (LANG !== 'en') {
    const lang = LANG
    void loadDict(lang).then(() => prefetchAll(lang))
  }
}

export function setAppLanguage(code: string) {
  if (!APP_LANGS.some((x) => x.code === code)) return
  LANG = code
  SecureStore.setItemAsync('velor_lang', code).catch(() => {})
  emit()
  // v4 (William: "it needs instant conversion"): don't wait for screens to
  // queue their own strings -- disk dictionary first (instant), then the
  // ENTIRE app dictionary from the warmed server cache in parallel chunks.
  if (code !== 'en') void loadDict(code).then(() => prefetchAll(code))
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
  // 120ms (was 600): long enough to batch one render pass, short enough
  // that a missed-by-the-manifest string still swaps in near-instantly.
  if (!flushTimer) flushTimer = setTimeout(() => { void flush() }, 120)
  return s
}

// On-screen diagnostics (v3): the Language screen shows this so a failed
// stage is visible on-device instead of silently leaving the app English.
let lastFlush = 'no batch sent yet'
export function i18nDiag(): string {
  const d = dicts[LANG]
  return `engine v4 · lang ${LANG} · cached ${d ? d.size : 0} · queued ${pending.size} · last: ${lastFlush}`
}

// v4: whole-dictionary prefetch. The manifest is every display string in the
// app (AST-extracted at build time). Chunks fetch with limited concurrency;
// each landed chunk emits, so the UI fills in progressively and is fully
// translated in a couple of seconds against the warmed server cache.
const PREFETCH_CHUNK = 150
const PREFETCH_CONCURRENCY = 4
let prefetchedFor = ''

async function prefetchAll(lang: string) {
  if (prefetchedFor === lang) return
  prefetchedFor = lang
  let manifest: string[]
  try {
    manifest = require('./i18n-manifest').I18N_MANIFEST
  } catch {
    return
  }
  const d = dicts[lang] || (dicts[lang] = new Map())
  const todo = manifest.filter((t) => !d.has(t))
  if (todo.length === 0) return
  const chunks: string[][] = []
  for (let i = 0; i < todo.length; i += PREFETCH_CHUNK) chunks.push(todo.slice(i, i + PREFETCH_CHUNK))
  let next = 0
  const worker = async () => {
    while (next < chunks.length && LANG === lang) {
      const chunk = chunks[next++]
      try {
        const r = await fetch(API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ lang, texts: chunk }),
        })
        if (r.ok) {
          const { translations } = await r.json()
          chunk.forEach((t, i) => {
            if (typeof translations?.[i] === 'string') d.set(t, translations[i])
          })
          lastFlush = `prefetch ${d.size}/${manifest.length}`
          emit()
          scheduleSaveDict(lang)
        }
      } catch {
        // A failed chunk is retried on the next prefetch call; per-screen
        // flush() still covers anything a user actually looks at.
        prefetchedFor = ''
      }
    }
  }
  await Promise.all(Array.from({ length: PREFETCH_CONCURRENCY }, worker))
}

let failures = 0

async function flush() {
  flushTimer = null
  const lang = LANG
  if (lang === 'en') { pending.clear(); return }
  const texts = [...pending].slice(0, 150)
  if (texts.length === 0) return
  const t0 = Date.now()
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang, texts }),
    })
    if (r.ok) {
      const { translations } = await r.json()
      const d = dicts[lang] || (dicts[lang] = new Map())
      texts.forEach((t, i) => {
        if (typeof translations?.[i] === 'string') d.set(t, translations[i])
      })
      // Only strings that actually got a translation leave the queue -- a
      // failed or partial batch is retried, never silently dropped (the v2
      // engine deleted texts from pending BEFORE the fetch, so one network
      // error left the whole visible screen English forever).
      texts.forEach((t) => { if (d.has(t)) pending.delete(t) })
      failures = 0
      lastFlush = `ok ${texts.length} in ${((Date.now() - t0) / 1000).toFixed(1)}s`
      emit()
      scheduleSaveDict(lang)
    } else {
      failures += 1
      lastFlush = `HTTP ${r.status} after ${((Date.now() - t0) / 1000).toFixed(1)}s`
      emit()
    }
  } catch (e) {
    failures += 1
    lastFlush = `network error: ${e instanceof Error ? e.message.slice(0, 60) : 'unknown'}`
    emit()
  }
  if (pending.size > 0 && !flushTimer) {
    // Backoff on repeated failures so a dead network doesn't hot-loop.
    const delay = failures === 0 ? 500 : Math.min(15000, 1000 * 2 ** failures)
    flushTimer = setTimeout(() => { void flush() }, delay)
  }
}
