import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Live count of countries with a claimed founding seat (i.e. at least one
// approved product whose origin country has been credited via
// grantCountryFounderIfFirst -- see lib/founding.ts) -- backs the homepage
// header's top trust-bar 'N Countries Connected' stat.
//
// Added 2026-08-02: the trust bar previously hardcoded '190 Countries
// Connected', which read as an existing-reach claim ('we have live sellers
// in 190 countries') when 190 is really the total number of founding SEATS
// (WORLD_COUNTRIES.length), not claimed connections -- the /apply page's
// own live '189 FOUNDING SEATS. STILL OPEN.' copy (getAvailableFoundingSeatCount())
// already proves almost all of them are still unclaimed. This route reads
// the exact same CountryFounder table that function counts against, so the
// header's number and the apply-page seat count can never drift apart or
// overstate real reach.
//
// force-dynamic + a short Cache-Control (rather than no caching at all)
// balances staleness against hitting the DB on every single homepage
// header render across every visitor.
export const dynamic = 'force-dynamic'

export async function GET() {
  const count = await prisma.countryFounder.count()
  return NextResponse.json(
    { count },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } }
  )
}
