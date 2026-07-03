import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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
    const profile = await prisma.sellerShippingProfile.upsert({
      where: { sellerId: seller.id },
      create: {
        sellerId: seller.id,
        name, company: company || null,
        street1, street2: street2 || null,
        city, state: state || null,
        zip, country: country || 'GB',
        phone: phone || null,
      },
      update: {
        name, company: company || null,
        street1, street2: street2 || null,
        city, state: state || null,
        zip, country: country || 'GB',
        phone: phone || null,
      },
    })
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[dashboard/settings/shipping POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
