// POST { lang, texts: string[] } -> { translations: string[] } aligned to input.
//
// Public buyer-facing endpoint behind hard caps: only the 18 non-English
// languages Velor speaks, max 400 strings / 600 chars each / 30k chars per
// request. Cache-first (TranslationCache), so repeat traffic costs nothing;
// only never-seen strings reach the Anthropic API. If abuse ever shows up in
// spend, the next step is an origin check + per-IP daily budget -- flagged in
// CLAUDE.md rather than silently assumed unnecessary.

import { NextResponse } from 'next/server'
import { isTranslatableLang, translateBatch } from '@/lib/translate'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
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
  const result = await translateBatch(lang, texts, debug)
  return NextResponse.json(debug ? result : { translations: result.translations })
}
