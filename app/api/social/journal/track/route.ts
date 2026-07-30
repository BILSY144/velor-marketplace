import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Creator Journals counters (2026-07-30): real view and product-click
// tracking for journal entries. Public, unauthenticated -- a buyer reading
// a maker's journal or clicking through to a tagged listing fires one
// beacon. Only publicly-visible entries count; increments are atomic.
// No response body worth caching; failures are silent by design.
export async function POST(req: NextRequest) {
  if (process.env.VELOR_SOCIAL_ENABLED !== 'true') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const postId = typeof body.postId === 'string' ? body.postId : ''
  const kind = body.kind === 'productClick' ? 'productClick' : 'view'
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const visible = {
    OR: [
      { status: 'PUBLISHED' },
      { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
    ],
  }
  const data = kind === 'view' ? { viewCount: { increment: 1 } } : { productClicks: { increment: 1 } }
  await prisma.journalPost.updateMany({ where: { id: postId, ...visible }, data })
  return NextResponse.json({ ok: true })
}
