import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Final step of the CJ import pipeline. Takes candidates that have already
// passed (a) freight-availability screening via /api/admin/cj-candidates
// and (b) a real browser read of CJ's per-product restriction warning
// (done manually per item, not automatable -- see CLAUDE.md 2026-07-06).
// Creates real Product rows attached to the internal CJ seller. Idempotent
// per cjProductId so it is safe to re-run.
export const dynamic = 'force-dynamic'

interface ImportItem {
  pid: string
  vid: string
  name: string
  description: string
  computedPrice: number
  images: string[]
  category: string
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripEmoji(input: string): string {
  return input.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()
}

export async function POST(request: NextRequest) {
  try {
    const { sellerId, items } = (await request.json()) as { sellerId: string; items: ImportItem[] }
    if (!sellerId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'sellerId and items[] required' }, { status: 400 })
    }

    const created = []
    const skipped = []

    for (const item of items) {
      const existing = await prisma.product.findFirst({ where: { cjProductId: item.pid, sellerId } })
      if (existing) {
        skipped.push({ pid: item.pid, reason: 'already imported', productId: existing.id })
        continue
      }

      const title = stripEmoji(item.name).slice(0, 200)
      const description = stripEmoji(stripHtml(item.description)).slice(0, 4000)

      const product = await prisma.product.create({
        data: {
          sellerId,
          title,
          description: description || null,
          price: item.computedPrice,
          images: item.images,
          category: item.category,
          tags: [],
          stock: 999,
          status: 'APPROVED',
          cjSourced: true,
          cjProductId: item.pid,
          cjVid: item.vid,
        },
      })
      created.push({ pid: item.pid, productId: product.id, title })
    }

    return NextResponse.json({ ok: true, createdCount: created.length, skippedCount: skipped.length, created, skipped })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
