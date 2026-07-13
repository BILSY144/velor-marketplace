import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Product catalogue / listings browser for Velor Pulse -- backs the mobile
// ops dashboard page at /pulse/listings. Read-only: a paginated, filterable
// view over every product on the marketplace (any status), plus a set of
// filter-independent summary counts (by status, low stock, out of stock,
// certificate-gated pending) for the KPI row on that page.
//
// Auth via the shared isAuthorizedAdmin() helper (NextAuth ADMIN session or
// Bearer ADMIN_SECRET), same convention as every other /api/admin/pulse-*
// route.
//
// IMPORTANT -- NO SIDE EFFECTS: this route must stay a pure read. It
// deliberately does NOT call or reuse app/api/admin/low-stock/route.ts,
// which sends a real low-stock alert email and writes an AgentLog row on
// every GET. Any low/out-of-stock figures here are computed directly with
// prisma.product.count -- never via that route or its logic.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'ALL'
  const stock = searchParams.get('stock') || ''
  const category = (searchParams.get('category') || '').trim()
  const q = (searchParams.get('q') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25))

  const where: Prisma.ProductWhereInput = {}
  if (status !== 'ALL') {
    where.status = status as Prisma.ProductWhereInput['status']
  }
  if (category) {
    where.category = { equals: category, mode: 'insensitive' }
  }
  if (q) {
    where.title = { contains: q, mode: 'insensitive' }
  }
  if (stock === 'low') {
    where.stock = { gt: 0, lt: 5 }
  } else if (stock === 'out') {
    where.stock = 0
  }

  const [products, total, byStatusRaw, lowStockCount, outOfStockCount, certificateGatedPendingCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { seller: { select: { storeName: true, country: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.product.count({ where: { stock: { gt: 0, lt: 5 }, status: 'APPROVED' } }),
    prisma.product.count({ where: { stock: 0, status: 'APPROVED' } }),
    prisma.product.count({ where: { requiresCertificate: true, status: 'PENDING_REVIEW' } }),
  ])

  const byStatus = byStatusRaw.map((row) => ({ status: row.status, count: row._count.status }))

  return NextResponse.json({
    products,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    byStatus,
    lowStockCount,
    outOfStockCount,
    certificateGatedPendingCount,
  })
}
