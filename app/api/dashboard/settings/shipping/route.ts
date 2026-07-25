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
    return NextResponse.json({ profile: seller.shippingProfile })
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
    const shipFromCountry = country || 'GB'
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
      },
      update: {
        name, company: company || null,
        street1, street2: street2 || null,
        city, state: state || null,
        zip, country: shipFromCountry,
        phone: phone || null,
        handlingFeeGBP,
      },
    })

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
