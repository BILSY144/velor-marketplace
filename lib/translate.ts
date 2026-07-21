// Whole-page translation for the 19 languages Velor speaks (William,
// 2026-07-17: "once they choose the language, the whole page they visit
// turns the text into their language").
//
// Cache-first: every unique string is translated by the Anthropic API at
// most ONCE per language (TranslationCache, unique on [hash, lang]) and
// served from Postgres afterwards, so API spend is bounded by the amount
// of unique copy on the site, not by traffic.

import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

const LANG_NAMES: Record<string, string> = {
  es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
  nl: 'Dutch', pl: 'Polish', tr: 'Turkish', ru: 'Russian', ar: 'Arabic',
  hi: 'Hindi', bn: 'Bengali', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian',
  zh: 'Simplified Chinese', ja: 'Japanese', ko: 'Korean',
}

export function isTranslatableLang(lang: string): boolean {
  return Object.prototype.hasOwnProperty.call(LANG_NAMES, lang)
}

export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 40)
}

async function modelTranslate(lang: string, texts: string[]): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 8000,
      system:
        `You translate user-interface strings for Velor, a global marketplace for authentic cultural goods. Translate each string in the given JSON array into ${LANG_NAMES[lang]}. Rules: keep the brand name "Velor" untranslated; keep numbers, prices, currency symbols and punctuation intact; keep the register natural for an ecommerce site; never add or drop items. Reply with ONLY a JSON array of the translated strings, same length and order as the input.`,
      messages: [{ role: 'user', content: JSON.stringify(texts) }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  // claude-sonnet-5 can return thinking blocks before the text block --
  // read EVERY text block, same fix the assistant needed (commit 6ad3a35).
  const raw: string = (Array.isArray(data?.content) ? data.content : [])
    .filter((b: { type?: string }) => b?.type === 'text')
    .map((b: { text?: string }) => b?.text ?? '')
    .join('')
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start < 0 || end < start) throw new Error('translator returned no JSON array')
  const arr = JSON.parse(raw.slice(start, end + 1))
  if (!Array.isArray(arr) || arr.length !== texts.length || arr.some((x) => typeof x !== 'string')) {
    throw new Error('translator array shape mismatch')
  }
  return arr as string[]
}

// Returns translations aligned to `texts`. Untranslatable/failed entries
// fall back to the source string -- the page must never lose text.
// cacheOnly (anti-abuse, 2026-07-17): serve cached translations but do NOT
// call the model for misses -- misses fall back to source text. Used when a
// caller has exhausted its new-translation budget; real users on warmed
// languages never notice, because their strings are all cache hits.
export async function translateBatch(lang: string, texts: string[], debug = false, cacheOnly = false): Promise<{ translations: string[]; error?: string; missCount: number; performed: number }> {
  const hashes = texts.map(hashText)
  const cached = await prisma.translationCache.findMany({
    where: { lang, hash: { in: [...new Set(hashes)] } },
  })
  const byHash = new Map(cached.map((r) => [r.hash, r.translated]))

  // unique missing strings, preserving first-seen order
  const missing: { hash: string; text: string }[] = []
  const seen = new Set<string>()
  texts.forEach((t, i) => {
    const h = hashes[i]
    if (!byHash.has(h) && !seen.has(h)) {
      seen.add(h)
      missing.push({ hash: h, text: t })
    }
  })

  if (cacheOnly) {
    return { translations: texts.map((t, i) => byHash.get(hashes[i]) ?? t), missCount: missing.length, performed: 0 }
  }

  let lastError: string | undefined
  let performed = 0
  // translate missing in model-call chunks (~50 strings / ~6k chars each)
  for (let i = 0; i < missing.length; ) {
    const chunk: typeof missing = []
    let chars = 0
    while (i < missing.length && chunk.length < 50 && chars < 6000) {
      chunk.push(missing[i])
      chars += missing[i].text.length
      i++
    }
    try {
      const out = await modelTranslate(lang, chunk.map((c) => c.text))
      await prisma.translationCache.createMany({
        data: chunk.map((c, j) => ({ hash: c.hash, lang, source: c.text, translated: out[j] })),
        skipDuplicates: true,
      })
      chunk.forEach((c, j) => byHash.set(c.hash, out[j]))
      performed += chunk.length
    } catch (e) {
      // fail-safe: leave this chunk untranslated (sources returned below)
      lastError = e instanceof Error ? e.message : String(e)
      console.error('translateBatch chunk failed:', lastError)
      if (debug) break
    }
  }

  return { translations: texts.map((t, i) => byHash.get(hashes[i]) ?? t), error: lastError, missCount: missing.length, performed }
}

// ---- Anti-abuse budgets for /api/translate (2026-07-17) -------------------
// The endpoint is public by design (anonymous buyers must be able to read
// the site in their language -- William's standing promise). What must be
// bounded is MODEL SPEND, i.e. cache-miss translations of never-seen
// strings. Cached strings stay free and unlimited for everyone.

// Worst-case daily spend ceiling across ALL callers. 25k new strings/day is
// far above any legitimate day (full site warm-up was ~46k once, ever) but
// caps a sustained attack at a known, survivable daily cost.
export const GLOBAL_DAILY_NEW_LIMIT = 25000
// Per-IP ceiling. A real user browsing warmed languages triggers ~0 new
// translations; even a first-ever user on a brand-new catalogue page sees
// dozens. 2000 leaves room for legitimate warm-up runs from one machine.
export const PER_IP_DAILY_NEW_LIMIT = 2000

const utcDay = () => new Date().toISOString().slice(0, 10)

// Counts how many of `texts` would need a model call right now (cache
// misses), without translating anything.
export async function countMisses(lang: string, texts: string[]): Promise<number> {
  const uniq = [...new Set(texts.map(hashText))]
  const cachedCount = await prisma.translationCache.count({ where: { lang, hash: { in: uniq } } })
  return uniq.length - cachedCount
}

// Budget accounting v2 (2026-07-21). The v1 gate counted REQUESTED misses
// and incremented even after a caller was capped -- a death spiral: capped
// misses were never translated, so they never became cache hits, so every
// later page view re-counted the same strings forever. One heavy day of
// legitimate testing left William's own home IP at 39k+ "misses" against
// the 2,000 cap with no way to ever recover, and any real household or
// office NAT would hit the same wall. v2 counts only translations actually
// PERFORMED (real model spend): the gate peeks without recording, and the
// route records the performed count after translateBatch succeeds. The day
// key is prefixed 'd2:' so v1's poisoned rows are orphaned rather than
// migrated -- caps now measure the thing they were built to bound.
const dayKey = () => 'd2:' + utcDay()

// Peek-only: may this caller model-translate `misses` new strings right
// now? Records NOTHING. Fails OPEN on database errors -- a broken budget
// table must degrade to the pre-existing behaviour, never take
// translation down.
export async function allowNewTranslations(ip: string, misses: number): Promise<{ allowed: boolean; reason?: string }> {
  if (misses <= 0) return { allowed: true }
  try {
    const day = utcDay()
    const globalToday = await prisma.translationCache.count({
      where: { createdAt: { gte: new Date(day + 'T00:00:00Z') } },
    })
    if (globalToday + misses > GLOBAL_DAILY_NEW_LIMIT) {
      console.error(`translate budget: GLOBAL daily cap hit (${globalToday} today) -- serving cache-only`)
      return { allowed: false, reason: 'global-daily-cap' }
    }
    const row = await prisma.translationIpDaily.findUnique({
      where: { ip_day: { ip, day: dayKey() } },
    })
    if ((row?.count ?? 0) + misses > PER_IP_DAILY_NEW_LIMIT) {
      console.error(`translate budget: per-IP cap hit for ${ip} (${row?.count ?? 0} performed today) -- serving cache-only`)
      return { allowed: false, reason: 'ip-daily-cap' }
    }
    return { allowed: true }
  } catch (e) {
    console.error('translate budget check failed (failing open):', e instanceof Error ? e.message : e)
    return { allowed: true }
  }
}

// Records translations actually performed for this IP today. Called by the
// route AFTER translateBatch has done real model work, with the number of
// strings that genuinely got a new model translation. Never throws.
export async function recordNewTranslations(ip: string, performed: number): Promise<void> {
  if (performed <= 0) return
  try {
    await prisma.translationIpDaily.upsert({
      where: { ip_day: { ip, day: dayKey() } },
      create: { ip, day: dayKey(), count: performed },
      update: { count: { increment: performed } },
    })
  } catch (e) {
    console.error('translate budget record failed (ignored):', e instanceof Error ? e.message : e)
  }
}
