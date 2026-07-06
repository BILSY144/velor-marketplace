import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Idempotent: creates (or returns) the single internal Seller account that
// CJ-sourced products are attached to. This is a real Seller record that
// blends in like any other store -- no "Velor Official" badge, per the
// 2026-07-06 decision in CLAUDE.md. isInternal marks it for special-casing
// in payout/commission logic later (it must never receive a real Stripe
// Connect payout -- there is no third-party seller to pay).
export const dynamic = 'force-dynamic'

const INTERNAL_SELLER_EMAIL = 'sourcing@velorcommerce.store'
const INTERNAL_STORE_NAME = 'Nordholm Supply Co.'

export async function POST() {
  try {
    const existing = await prisma.seller.findFirst({ where: { isInternal: true } })
    if (existing) {
      return NextResponse.json({ ok: true, created: false, sellerId: existing.id, storeName: existing.storeName })
    }

    const user = await prisma.user.create({
      data: {
        email: INTERNAL_SELLER_EMAIL,
        name: INTERNAL_STORE_NAME,
        role: 'seller',
      },
    })

    const seller = await prisma.seller.create({
      data: {
        userId: user.id,
        storeName: INTERNAL_STORE_NAME,
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
