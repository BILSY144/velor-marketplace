import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Paginated/filterable seller-payout lookup, backing the mobile Pulse detail
// page at /pulse/payouts. Mirrors app/api/admin/orders/route.ts's
// auth/pagination/filter pattern and reuses the exact live-FX-conversion
// pattern from app/api/admin/pulse-data/route.ts's pendingPayoutsGBP block
// (try/catch per row via lib/fx.ts's convert(), accumulating a running total
// and flagging fxError on any failure) so the two pages never disagree on
// how "pending" is converted to GBP.
//
// Payout.status has no fixed enum in the schema -- the Prisma default value
// for new rows is the lowercase string 'pending', but nothing prevents other
// values from being written elsewhere in the codebase, so this route groups
// by whatever status strings actually exist in the database (via groupBy)
// rather than assuming 'pending'/'paid' are the only two.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const q = (searchParams.get('q') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25))

  const where: Prisma.PayoutWhereInput = {}
  if (status) {
    where.status = status
  }
  if (q) {
    where.seller = { storeName: { contains: q, mode: 'insensitive' } }
  }

  const [payouts, total, statusRows, pendingRows] = await Promise.all([
    prisma.payout.findMany({
      where,
      include: { seller: { select: { storeName: true, country: true, payoutRail: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payout.count({ where }),
    prisma.payout.groupBy({ by: ['status'], _count: { status: true } }),
    // 'pending' here is the literal string used as the Prisma schema default
    // for new Payout rows -- see the note above.
    prisma.payout.findMany({
      where: { status: 'pending' },
      select: { amount: true, currency: true },
    }),
  ])

  let pendingGBP = 0
  let fxError = false
  for (const row of pendingRows) {
    try {
      pendingGBP += await convert(row.amount, row.currency, 'GBP')
    } catch {
      fxError = true
    }
  }

  const byStatus = statusRows.map((row) => ({ status: row.status, count: row._count.status }))

  return NextResponse.json({
    payouts,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    byStatus,
    pendingGBP: Math.round(pendingGBP * 100) / 100,
    pendingCount: pendingRows.length,
    fxNote: fxError
      ? 'Some payouts could not be converted to GBP and are excluded from this total.'
      : 'Converted to GBP at live exchange rates.',
  })
}
