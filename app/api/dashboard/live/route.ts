import { auth } from '@/auth'
import { checkMessageContent } from '@/lib/messageFilter'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createBroadcasterToken, getWsUrl, liveKitConfigured, makeRoomName } from '@/lib/livekit'
import { normalizeSellerTier } from '@/lib/tier'
import { createLiveOffer, parseLiveOfferPercent } from '@/lib/liveOffer'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const streams = await prisma.liveStream.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    tier: normalizeSellerTier(seller.tier),
    canGoLive: true, // live shopping is for every seller tier (William, 2026-07-15)
    liveKitReady: liveKitConfigured(),
    streams,
    storeName: seller.storeName,
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  // Live Shopping is open to every seller tier (William, 2026-07-15) — no
  // tier gate. Founding sellers additionally keep it as part of the founding
  // perk bundle, but that flag no longer gates anything here.

  if (!liveKitConfigured()) {
    return NextResponse.json({ error: 'Live Shopping infrastructure is being finalised - check back shortly.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : ''
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : null

  // Live streams are buyer-facing like listings and messages -- the same
  // no-contact-details rule applies to their title and description
  // (William, 2026-07-21: "that also goes for live videos"). On-camera
  // speech cannot be auto-filtered; that is covered by the viewer report
  // button (auto-end on threshold) and the seller rules.
  if (checkMessageContent(`${title} ${description || ''}`).blocked) {
    return NextResponse.json({ error: "Stream titles and descriptions can't include email addresses, phone numbers, website links, or social/messaging handles." }, { status: 400 })
  }
  const productIds = Array.isArray(body.productIds) ? body.productIds.filter((x: unknown) => typeof x === 'string').slice(0, 12) : []

  // Optional scheduling (2026-07-20): a future date creates a SCHEDULED
  // stream buyers can see on /live and ask to be notified about; the seller
  // starts it later via /api/dashboard/live/[id]/start.
  let scheduledFor: Date | null = null
  if (body.scheduledFor) {
    const d = new Date(String(body.scheduledFor))
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid schedule date' }, { status: 400 })
    if (d.getTime() < Date.now() + 5 * 60000) return NextResponse.json({ error: 'Schedule at least 5 minutes ahead' }, { status: 400 })
    if (d.getTime() > Date.now() + 30 * 86400000) return NextResponse.json({ error: 'Schedule within the next 30 days' }, { status: 400 })
    scheduledFor = d
  }

  // Optional live-only offer (5-50% off featured products, only while the
  // stream is live) — implemented as an ordinary automatic DiscountCode so
  // listings and checkout charge exactly what the stream shows.
  const liveOfferPercent = body.liveOfferPercent != null ? parseLiveOfferPercent(body.liveOfferPercent) : null
  if (body.liveOfferPercent != null && liveOfferPercent === null) {
    return NextResponse.json({ error: 'Live offer must be between 5 and 50 percent' }, { status: 400 })
  }
  if (liveOfferPercent !== null && productIds.length === 0) {
    return NextResponse.json({ error: 'A live offer needs at least one featured product' }, { status: 400 })
  }

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  if (productIds.length > 0) {
    const owned = await prisma.product.count({ where: { id: { in: productIds }, sellerId: seller.id } })
    if (owned !== productIds.length) return NextResponse.json({ error: 'One or more products do not belong to your store' }, { status: 400 })
  }

  const activeCount = await prisma.liveStream.count({ where: { sellerId: seller.id, status: { in: ['LIVE', 'SCHEDULED'] } } })
  if (activeCount > 0) {
    return NextResponse.json({ error: 'You already have a live or scheduled stream. End it before starting a new one.' }, { status: 409 })
  }

  const roomName = makeRoomName(seller.id)

  const stream = await prisma.liveStream.create({
    data: {
      sellerId: seller.id,
      title,
      description,
      roomName,
      productIds,
      status: scheduledFor ? 'SCHEDULED' : 'LIVE',
      scheduledFor,
      startedAt: scheduledFor ? null : new Date(),
    },
  })

  if (liveOfferPercent !== null) {
    // Active immediately for an instant stream; created dormant for a
    // scheduled one and switched on by the start route.
    try {
      await createLiveOffer(seller.id, roomName, liveOfferPercent, productIds, !scheduledFor)
    } catch (err) {
      console.warn('[dashboard/live] live offer creation failed (non-blocking):', err)
    }
  }

  if (scheduledFor) {
    return NextResponse.json({ stream })
  }

  const identity = `seller-${seller.id}`
  const token = await createBroadcasterToken(roomName, identity, seller.storeName)

  return NextResponse.json({ stream, token, wsUrl: getWsUrl() })
}
