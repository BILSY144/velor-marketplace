import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// One-off cleanup endpoint: Velor lists single-option products only (no
// variant/colour picker UI exists on the buyer-facing pages), but earlier CJ
// imports let multi-option products through -- those listings always
// fulfilled using the first variant regardless of what the description's
// "Available options: ..." text implied, risking the wrong colour/design
// being shipped. cj-candidates and cj-import now both reject multi-option
// items before they reach the catalogue; this route removes the ones that
// were already imported before that fix landed.
//
// GET  -> dry run, lists affected products without deleting anything
// POST -> deletes the affected products
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const candidates = await prisma.product.findMany({
    where: {
      cjSourced: true,
      description: { contains: 'Available options:' },
    },
    select: { id: true, title: true, sellerId: true, status: true, cjProductId: true, description: true },
  })

  return NextResponse.json({ count: candidates.length, products: candidates })
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const candidates = await prisma.product.findMany({
    where: {
      cjSourced: true,
      description: { contains: 'Available options:' },
    },
    select: { id: true, title: true },
  })

  const deleted: { id: string; title: string }[] = []
  const failed: { id: string; title: string; error: string }[] = []

  for (const product of candidates) {
    try {
      await prisma.product.delete({ where: { id: product.id } })
      deleted.push(product)
    } catch (err) {
      failed.push({ ...product, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ deletedCount: deleted.length, deleted, failed })
}
