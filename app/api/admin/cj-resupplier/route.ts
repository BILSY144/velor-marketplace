import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProductDetail } from '@/lib/cj'

export const dynamic = 'force-dynamic'

// One-off / repeatable admin utility: re-checks CJ's live product detail for
// already-imported CJ-sourced products and reassigns each one to a Seller
// record named after its REAL CJ supplierName wherever CJ actually provides
// one. "CJ Dropshippers" is the last-resort fallback only -- per William,
// real supplier names must be used whenever CJ's own data has them.
//
// Uses cjSupplierName on Product as a checked-state marker to avoid
// re-querying CJ for the same product every run:
//   null        -> not yet checked against live CJ data
//   '' (empty)  -> checked, CJ genuinely returned no supplier name (ORDINARY_PRODUCT)
//   'Some Name' -> checked, real supplier name found and applied
//
// This never fabricates a name -- if CJ's own /product/query response has no
// supplierName for a given pid, the product stays attributed to the
// "CJ Dropshippers" fallback seller, which is the honest answer.

const FALLBACK_STORE_NAME = 'CJ Dropshippers'
const INTERNAL_EMAIL_DOMAIN = 'velorcommerce.store'

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'supplier'
}

async function findOrCreateInternalSeller(storeName: string) {
  const existing = await prisma.seller.findFirst({ where: { isInternal: true, storeName } })
  if (existing) return existing

  const slug = slugify(storeName)
  const email = `sourcing+${slug}@${INTERNAL_EMAIL_DOMAIN}`
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: storeName, role: 'seller' },
  })
  return prisma.seller.create({
    data: {
      userId: user.id,
      storeName,
      description: 'Curated home, lifestyle and everyday essentials.',
      country: 'CN',
      currency: 'USD',
      approved: true,
      tier: 'ENTERPRISE',
      isInternal: true,
      stripeOnboarded: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    let limit = 25
    try {
      const body = await request.json()
      if (body && typeof body.limit === 'number' && body.limit > 0) limit = Math.min(body.limit, 50)
    } catch {
      // no body -- use default limit
    }

    // Only re-check products we haven't already resolved (cjSupplierName is
    // null, i.e. never checked). Already-checked ones (empty string or a real
    // name) are skipped so repeated calls make forward progress.
    const candidates = await prisma.product.findMany({
      where: { cjSourced: true, cjSupplierName: null, cjProductId: { not: null } },
      take: limit,
      select: { id: true, cjProductId: true, title: true, sellerId: true },
    })

    const foundReal: Array<{ productId: string; name: string; supplierName: string; sellerId: string }> = []
    const confirmedNoSupplier: Array<{ productId: string; name: string }> = []
    const errors: Array<{ productId: string; error: string }> = []

    for (const p of candidates) {
      try {
        // CJ enforces a 1 request/second QPS limit on /product/query -- without
        // this delay, batches beyond a handful of items fail with
        // "[1600200] Too Many Requests". Matches the same enforced-sleep
        // pattern already used for freight checks in cj-candidates.
        await new Promise((r) => setTimeout(r, 1100))
        const detail = await getProductDetail(p.cjProductId as string)
        const supplierName = (detail.supplierName || '').trim()
        if (supplierName && supplierName.toLowerCase() !== 'nordholm supply co.') {
          const seller = await findOrCreateInternalSeller(supplierName)
          await prisma.product.update({
            where: { id: p.id },
            data: { sellerId: seller.id, cjSupplierName: supplierName },
          })
          foundReal.push({ productId: p.id, name: p.title, supplierName, sellerId: seller.id })
        } else {
          await prisma.product.update({ where: { id: p.id }, data: { cjSupplierName: '' } })
          confirmedNoSupplier.push({ productId: p.id, name: p.title })
        }
      } catch (err) {
        errors.push({ productId: p.id, error: err instanceof Error ? err.message : String(err) })
      }
    }

    const remaining = await prisma.product.count({ where: { cjSourced: true, cjSupplierName: null, cjProductId: { not: null } } })

    return NextResponse.json({
      ok: true,
      processed: candidates.length,
      foundReal,
      confirmedNoSupplier,
      errors,
      remaining,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
