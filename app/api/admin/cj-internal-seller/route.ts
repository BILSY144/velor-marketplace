import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Idempotent: finds (or creates) an internal Seller account that CJ-sourced
// products are attached to. This is a real Seller record that blends in like
// any other store -- no "Velor Official" badge, per the 2026-07-06 decision
// in CLAUDE.md. isInternal marks it for special-casing in payout/commission
// logic later (it must never receive a real Stripe Connect payout -- there
// is no third-party seller to pay).
//
// 2026-07-07 update (per William): one internal Seller record PER REAL CJ
// SUPPLIER NAME, not one single global "Nordholm Supply Co." seller. Pass
// the real supplier name (item.supplierName / cjSupplierName) as storeName
// when CJ provides one. When CJ gives no named supplier (the common case --
// CJ's own ORDINARY_PRODUCT inventory has no separate named supplier), fall
// back to the shared name "CJ Dropshippers". "Nordholm Supply Co." was a
// test name and must never be created again -- use the rename action below
// to retire any existing record still using it.
export const dynamic = 'force-dynamic'

const FALLBACK_STORE_NAME = 'CJ Dropshippers'
const INTERNAL_EMAIL_DOMAIN = 'velorcommerce.store'

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'supplier'
}

export async function POST(req: NextRequest) {
  try {
    let storeName = FALLBACK_STORE_NAME
    try {
      const body = await req.json()
      if (body && typeof body.storeName === 'string' && body.storeName.trim()) {
        storeName = body.storeName.trim()
      }
    } catch {
      // no body / not JSON -- use fallback name
    }

    // Never allow the retired test seller name to be (re)created.
    if (storeName.toLowerCase() === 'nordholm supply co.') {
      storeName = FALLBACK_STORE_NAME
    }

    const existing = await prisma.seller.findFirst({ where: { isInternal: true, storeName } })
    if (existing) {
      return NextResponse.json({ ok: true, created: false, sellerId: existing.id, storeName: existing.storeName })
    }

    const slug = slugify(storeName)
    const email = `sourcing+${slug}@${INTERNAL_EMAIL_DOMAIN}`

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: storeName,
        role: 'seller',
      },
    })

    const seller = await prisma.seller.create({
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

    return NextResponse.json({ ok: true, created: true, sellerId: seller.id, storeName: seller.storeName })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

// One-off admin utility: rename an existing internal seller's storeName.
// Used to retire the "Nordholm Supply Co." test seller in favour of a real
// supplier name or the "CJ Dropshippers" fallback. Only ever touches
// isInternal sellers -- refuses to rename a real third-party seller.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { sellerId, newStoreName } = body || {}
    if (!sellerId || !newStoreName || typeof newStoreName !== 'string' || !newStoreName.trim()) {
      return NextResponse.json({ ok: false, error: 'sellerId and newStoreName are required' }, { status: 400 })
    }
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } })
    if (!seller) {
      return NextResponse.json({ ok: false, error: 'seller not found' }, { status: 404 })
    }
    if (!seller.isInternal) {
      return NextResponse.json({ ok: false, error: 'refusing to rename a non-internal (real third-party) seller' }, { status: 403 })
    }
    const updated = await prisma.seller.update({
      where: { id: sellerId },
      data: { storeName: newStoreName.trim() },
    })
    return NextResponse.json({ ok: true, sellerId: updated.id, storeName: updated.storeName })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
