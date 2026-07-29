import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { codeToCountryName } from '@/lib/worldCountries'
import { getPayoutRail } from '@/lib/payoutRail'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const seller = await prisma.seller.findFirst({
      where: { user: { email: session.user.email } },
      include: { shippingProfile: true },
    })
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }
    // autoLabelOrigin false for ALL sellers in the universal seller-arranged
    // era -- the dashboard locks the chooser to FREE for everyone.
    return NextResponse.json({ profile: seller.shippingProfile, autoLabelOrigin: false })
  } catch (err) {
    console.error('[dashboard/settings/shipping GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const seller = await prisma.seller.findFirst({
      where: { user: { email: session.user.email } },
    })
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }
    const body = await request.json()
    const { name, company, street1, street2, city, state, zip, country, phone } = body
    if (!name || !street1 || !city || !zip || !country) {
      return NextResponse.json({ error: 'Missing required fields: name, street1, city, zip, country' }, { status: 400 })
    }
    // Optional shipping buffer: a flat GBP amount added to every carrier
    // quote shown to buyers (packaging + rate-drift cover). Clamped 0-25
    // server-side so it can never be abused as a hidden price hike.
    const rawFee = Number(body.handlingFeeGBP)
    const handlingFeeGBP = Number.isFinite(rawFee) ? Math.min(Math.max(rawFee, 0), 25) : 0
    // Seller-set flat international shipping price -- the fallback used
    // whenever Shippo can't calculate a live rate for this seller's route
    // (see app/api/shipping/rates). Empty/blank means "not set" (null),
    // distinct from an explicit 0 (free shipping). Clamped 0-500 to catch
    // obvious typos without being restrictive for genuinely large/heavy items.
    const rawFlat = body.internationalFlatRateGBP
    let internationalFlatRateGBP: number | null = null
    if (rawFlat !== null && rawFlat !== undefined && rawFlat !== '') {
      const n = Number(rawFlat)
      if (Number.isFinite(n)) internationalFlatRateGBP = Math.min(Math.max(n, 0), 500)
    }
    const shipFromCountry = country || 'GB'
    // TEMPORARY NON-NEGOTIABLE RULE (William, 2026-07-29): out-of-label
    // origins always save FREE shipping (0) -- the seller bakes postage
    // into the product price. Mirrors the point-of-use enforcement in
    // app/api/shipping/rates; see lib/labelOrigins.ts.
    // Universal seller-arranged era (2026-07-29): FREE for everyone.
    internationalFlatRateGBP = 0
    const profile = await prisma.sellerShippingProfile.upsert({
      where: { sellerId: seller.id },
      create: {
        sellerId: seller.id,
        name, company: company || null,
        street1, street2: street2 || null,
        city, state: state || null,
        zip, country: shipFromCountry,
        phone: phone || null,
        handlingFeeGBP,
        internationalFlatRateGBP,
      },
      update: {
        name, company: company || null,
        street1, street2: street2 || null,
        city, state: state || null,
        zip, country: shipFromCountry,
        phone: phone || null,
        handlingFeeGBP,
        internationalFlatRateGBP,
      },
    })

    // Any shipping-settings change (flat rate, buffer, dispatch address)
    // changes the quotes buyers should see, so drop this seller's cached
    // PDP delivery estimates immediately -- otherwise a seller fixing an
    // atrocious platform-default price would keep showing the old number
    // for up to 24h (ShippingEstimate TTL). Added 2026-07-29 alongside the
    // PDP delivery-estimate feature.
    await prisma.shippingEstimate.deleteMany({ where: { sellerId: seller.id } }).catch(() => {})

    // Keep Seller.country and Seller.payoutRail in lockstep with the real
    // ship-from address (William, 2026-07-25 -- see the note on
    // app/api/dashboard/settings/route.ts). This is now the only place a
    // seller's stated country can change after their application is
    // approved, so a seller who genuinely relocates gets routed correctly
    // without needing an admin to run the repair route.
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        country: codeToCountryName(shipFromCountry) ?? shipFromCountry,
        payoutRail: getPayoutRail(shipFromCountry),
      },
    })

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[dashboard/settings/shipping POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
