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
  const raw: string = data?.content?.[0]?.text ?? ''
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
export async function translateBatch(lang: string, texts: string[], debug = false): Promise<{ translations: string[]; error?: string }> {
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

  let lastError: string | undefined
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
    } catch (e) {
      // fail-safe: leave this chunk untranslated (sources returned below)
      lastError = e instanceof Error ? e.message : String(e)
      console.error('translateBatch chunk failed:', lastError)
      if (debug) break
    }
  }

  return { translations: texts.map((t, i) => byHash.get(hashes[i]) ?? t), error: lastError }
}
