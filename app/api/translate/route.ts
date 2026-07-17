// POST { lang, texts: string[] } -> { translations: string[] } aligned to input.
//
// Public buyer-facing endpoint behind hard caps: only the 18 non-English
// languages Velor speaks, max 400 strings / 600 chars each / 30k chars per
// request. Cache-first (TranslationCache), so repeat traffic costs nothing;
// only never-seen strings reach the Anthropic API. If abuse ever shows up in
// spend, the next step is an origin check + per-IP daily budget -- flagged in
// CLAUDE.md rather than silently assumed unnecessary.

import { NextResponse } from 'next/server'
import { isTranslatableLang, translateBatch, countMisses, allowNewTranslations } from '@/lib/translate'

export const runtime = 'nodejs'
export const maxDuration = 60

// Anti-abuse (2026-07-17, William: protect translation spend). The endpoint
// stays public -- anonymous buyers must read the site in their language, and
// cached translations are free to serve. What's bounded is NEW model
// translations: browser calls must come from our own origin, and every
// caller has a per-IP daily budget plus a global daily ceiling. Over-budget
// callers get cache-only service (never an error page).
const OWN_HOSTS = ['velorcommerce.store', 'www.velorcommerce.store', 'localhost']

function browserOriginAllowed(req: Request): boolean {
  const raw = req.headers.get('origin') || req.headers.get('referer')
  // Native app / server callers send no Origin or Referer -- allowed, the
  // budgets below still bound them. (A forged no-Origin script is bounded
  // the same way, which is the point: the wall is the budget, not the header.)
  if (!raw) return true
  try {
    const host = new URL(raw).hostname
    return OWN_HOSTS.includes(host) || host.endsWith('.vercel.app')
  } catch {
    return false
  }
}

function callerIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown').slice(0, 64)
}

export async function POST(req: Request) {
  if (!browserOriginAllowed(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  let body: { lang?: string; texts?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  const lang = String(body.lang || '')
  if (!isTranslatableLang(lang)) {
    return NextResponse.json({ error: 'unsupported language' }, { status: 400 })
  }
  if (!Array.isArray(body.texts) || body.texts.length === 0 || body.texts.length > 400) {
    return NextResponse.json({ error: 'texts must be 1-400 strings' }, { status: 400 })
  }
  const texts: string[] = []
  let total = 0
  for (const t of body.texts) {
    if (typeof t !== 'string') return NextResponse.json({ error: 'texts must be strings' }, { status: 400 })
    const s = t.slice(0, 600)
    total += s.length
    if (total > 30000) return NextResponse.json({ error: 'payload too large' }, { status: 400 })
    texts.push(s)
  }
  const debug = body && (body as Record<string, unknown>).debug === true

  // Budget gate: only NEW (cache-miss) strings cost model spend, so only
  // they are counted. All-cached requests -- the overwhelming majority now
  // that every language is warmed -- skip the gate entirely.
  let cacheOnly = false
  const misses = await countMisses(lang, texts)
  if (misses > 0) {
    const verdict = await allowNewTranslations(callerIp(req), misses)
    cacheOnly = !verdict.allowed
  }

  const result = await translateBatch(lang, texts, debug, cacheOnly)
  return NextResponse.json(debug ? { ...result, cacheOnly } : { translations: result.translations })
}
