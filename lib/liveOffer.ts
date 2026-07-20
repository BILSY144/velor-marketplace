// Live-only offers (2026-07-20). A live offer is an ordinary DiscountCode
// restricted to the stream's featured products, so the existing automatic
// discount engine (lib/discount.ts) shows and charges the reduced price
// everywhere with zero new checkout logic. The code is named from the
// stream's room so it can always be found again without a schema change:
// created inactive when a stream is scheduled, activated when the seller
// goes live, deactivated when the stream ends (plus a hard expiresAt as a
// backstop in case an end is never recorded).

import { prisma } from '@/lib/prisma'

export const LIVE_OFFER_MIN_PERCENT = 5
export const LIVE_OFFER_MAX_PERCENT = 50
export const LIVE_OFFER_TTL_HOURS = 12

export function liveOfferCode(roomName: string): string {
  const suffix = roomName.split('-').pop() || roomName
  return `LIVE-${suffix.toUpperCase()}`
}

export function parseLiveOfferPercent(raw: unknown): number | null {
  const n = Math.round(Number(raw))
  if (!Number.isFinite(n)) return null
  if (n < LIVE_OFFER_MIN_PERCENT || n > LIVE_OFFER_MAX_PERCENT) return null
  return n
}

export async function createLiveOffer(
  sellerId: string,
  roomName: string,
  percent: number,
  productIds: string[],
  active: boolean
) {
  if (productIds.length === 0) return null
  return prisma.discountCode.create({
    data: {
      sellerId,
      code: liveOfferCode(roomName),
      type: 'PERCENTAGE',
      value: percent,
      productIds,
      isActive: active,
      expiresAt: active ? new Date(Date.now() + LIVE_OFFER_TTL_HOURS * 3600000) : null,
    },
  })
}

export async function activateLiveOffer(roomName: string) {
  await prisma.discountCode.updateMany({
    where: { code: liveOfferCode(roomName) },
    data: { isActive: true, expiresAt: new Date(Date.now() + LIVE_OFFER_TTL_HOURS * 3600000) },
  })
}

export async function deactivateLiveOffer(roomName: string) {
  await prisma.discountCode.updateMany({
    where: { code: liveOfferCode(roomName) },
    data: { isActive: false },
  })
}

// The active offer for a stream, if any — used by the public stream API so
// the viewer page can show the live price honestly (same engine that will
// charge it).
export async function getActiveLiveOffer(roomName: string) {
  const code = await prisma.discountCode.findUnique({ where: { code: liveOfferCode(roomName) } })
  if (!code || !code.isActive) return null
  if (code.expiresAt && code.expiresAt < new Date()) return null
  return { percent: code.value, productIds: code.productIds }
}
