import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateNextDrop, isDropLive, DROP_LIVE_HOURS } from '@/lib/drops'

// Public weekly-drop state: the live-or-next drop and its pieces.
// Gated by VELOR_SOCIAL_ENABLED like every social surface.

export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.VELOR_SOCIAL_ENABLED === 'false') {
    return NextResponse.json({ enabled: false })
  }
  const drop = await getOrCreateNextDrop()
  const live = isDropLive(drop.scheduledAt)
  const items = await prisma.dropItem.findMany({
    where: { dropId: drop.id, product: { status: 'APPROVED' } },
    select: {
      id: true,
      product: {
        select: {
          id: true, title: true, images: true, originCountry: true,
          seller: { select: { id: true, storeName: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 60,
  })
  // NO prices in drop cards on purpose: cards tease the piece and link to
  // the PDP where the price-display rule (seller-currency conversion)
  // already applies. Adding prices here first requires the fx wiring.
  return NextResponse.json({
    enabled: true,
    drop: { id: drop.id, title: drop.title, scheduledAt: drop.scheduledAt, live, liveHours: DROP_LIVE_HOURS },
    items: items.map(i => ({
      id: i.id,
      productId: i.product.id,
      title: i.product.title,
      image: i.product.images[0] || null,
      originCountry: i.product.originCountry,
      storeName: i.product.seller.storeName,
    })),
  })
}
