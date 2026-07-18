import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { grantCountryFounderIfFirst } from '@/lib/founding'

// One-off admin endpoint: backfills CountryFounder rows for countries that
// already had approved, live products before the CountryFounder model
// existed (see prisma/schema.prisma and lib/founding.ts, added 2026-07-18
// to decouple founding credit from Seller.country -- see William's
// instructions in that day's session on why this exists).
//
// For each country, credit goes to whichever seller had the earliest
// APPROVED product with that origin. If that earliest seller already holds
// a different country's founding credit (a seller may found at most one
// country, ever), credit rolls to the next-earliest seller for that same
// country instead -- this happens automatically, not via special-cased
// logic here: grantCountryFounderIfFirst enforces "first wins" and "one
// seller, one country" via the countryCode/sellerId unique constraints on
// CountryFounder, and a P2002 from an already-decided country or an
// already-founding seller is just a safe no-op. Looping every approved
// product in ascending createdAt order and calling the same idempotent
// function used by the live approval paths reproduces the exact same
// outcome a full re-run of history would have produced.
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const products = await prisma.product.findMany({
    where: { status: 'APPROVED', originCountry: { not: null } },
    select: { id: true, sellerId: true, originCountry: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  for (const p of products) {
    await grantCountryFounderIfFirst(p.sellerId, p.id, p.originCountry)
  }

  const founders = await prisma.countryFounder.findMany({
    select: { countryCode: true, countryName: true, sellerId: true, productId: true, grantedAt: true },
    orderBy: { grantedAt: 'asc' },
  })

  return NextResponse.json({ ok: true, productsScanned: products.length, foundersNow: founders.length, founders })
}
