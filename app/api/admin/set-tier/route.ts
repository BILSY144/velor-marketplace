import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Internal QA tool only - lets the site owner flip a seller's tier directly,
// bypassing Stripe, so tier-gated pages/features can be reviewed without paying.
// Protected by CRON_SECRET (already set in Vercel). Never share this URL.
// force-dynamic: without this, Next.js can cache this GET handler's response
// at build/edge time and serve the same frozen output to every request,
// ignoring query params entirely.
export const dynamic = 'force-dynamic'

// resetFounding added 2026-07-31 (William's decision, via Claude session):
// William's own "williams workshop" seller account is a test account, never
// to be used as a real seller, and he wants it fully stripped of founding
// status so a genuine future UK seller can claim the country instead. A
// plain tier=STARTER change (the original purpose of this route) does NOT
// do that -- it leaves foundingBadge/foundingPerksGrantedAt set, AND leaves
// the CountryFounder row that permanently blocks anyone else from ever
// founding that same country (see the countryCode unique constraint in
// prisma/schema.prisma and grantCountryFounderIfFirst in lib/founding.ts).
// &resetFounding=true additionally clears both and deletes the seller's
// CountryFounder row(s), freeing the country for a real seller to found.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const envSecret = process.env.CRON_SECRET
  if (!envSecret || secret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = searchParams.get('email')
  const tier = searchParams.get('tier')
  const resetFounding = searchParams.get('resetFounding') === 'true'
  const validTiers = ['STARTER', 'PRO'] // Enterprise retired 2026-07-15
  if (!email || !tier || !validTiers.includes(tier)) {
    return NextResponse.json({ error: 'Provide email and tier (STARTER|PRO)' }, { status: 400 })
  }

  const seller = await prisma.seller.findFirst({
    where: { user: { email } },
    include: { user: { select: { email: true } } },
  })
  if (!seller) {
    return NextResponse.json({ error: 'No seller found for that email' }, { status: 404 })
  }

  const updated = await prisma.seller.update({
    where: { id: seller.id },
    data: resetFounding
      ? { tier: tier as any, foundingBadge: false, foundingPerksGrantedAt: null }
      : { tier: tier as any },
  })

  let releasedCountries: string[] = []
  if (resetFounding) {
    const founded = await prisma.countryFounder.findMany({ where: { sellerId: seller.id } })
    if (founded.length) {
      await prisma.countryFounder.deleteMany({ where: { sellerId: seller.id } })
      releasedCountries = founded.map((f) => f.countryName)
    }
  }

  return NextResponse.json({
    ok: true,
    email: seller.user.email,
    tier: updated.tier,
    foundingBadge: updated.foundingBadge,
    releasedCountries,
  })
}
