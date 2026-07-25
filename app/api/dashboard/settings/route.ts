import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SUPPORTED_CURRENCIES } from '@/lib/fx'
import { checkMessageContent } from '@/lib/messageFilter'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    select: { storeName: true, description: true, country: true, currency: true },
  })

  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  return NextResponse.json({
    name: user?.name ?? '',
    email: user?.email ?? '',
    storeName: seller.storeName,
    description: seller.description ?? '',
    // Read-only here -- see the PATCH handler below for why country can no
    // longer be set from this route.
    country: seller.country ?? '',
    currency: seller.currency ?? 'GBP',
  })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const body = await request.json()
  // `country` is deliberately NOT accepted here (William, 2026-07-25). It
  // used to be a free-text field a seller could set to anything, completely
  // disconnected from their real ship-from address, which fed straight into
  // getPayoutRail() and could misroute their own payouts. A seller's country
  // is now derived only from their ship-from address in Settings -> Shipping
  // -- see POST /api/dashboard/settings/shipping, which updates it (and
  // recomputes payoutRail) whenever that address changes.
  const { name, storeName, description, currency } = body

  if (typeof storeName === 'string' && storeName.trim().length < 2) {
    return NextResponse.json({ error: 'Store name must be at least 2 characters' }, { status: 400 })
  }

  // Velor is the platform -- sellers promote through Velor, not their own
  // business or contact details. Reuses the same email/phone/social
  // detector that guards buyer<->seller messages (lib/messageFilter.ts) and
  // product listings (app/api/dashboard/products/route.ts), since a store
  // name or bio is exactly as public as either of those once it is live on
  // /seller/[sellerId].
  const contactCheck = checkMessageContent(`${storeName || ''} ${description || ''}`)
  if (contactCheck.blocked) {
    return NextResponse.json(
      { error: "Your store name and bio can't include email addresses, phone numbers, or social/messaging handles -- Velor is the platform, sellers promote through Velor, not their own contact details." },
      { status: 400 }
    )
  }

  if (
    currency !== undefined &&
    !(SUPPORTED_CURRENCIES as readonly string[]).includes(String(currency).toUpperCase())
  ) {
    return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 })
  }

  await Promise.all([
    name !== undefined
      ? prisma.user.update({ where: { id: session.user.id }, data: { name: String(name).trim() } })
      : Promise.resolve(),
    prisma.seller.update({
      where: { userId: session.user.id },
      data: {
        ...(storeName !== undefined && { storeName: String(storeName).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(currency !== undefined && { currency: String(currency).toUpperCase() }),
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
