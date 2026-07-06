import { prisma } from '@/lib/prisma'

export interface DiscountCartItem {
  productId: string
  quantity: number
  priceGBP: number
}

export interface AppliedAutoDiscount {
  discountId: string
  code: string
  productIds: string[]
  amountGBP: number
  description: string
}

export interface AutomaticDiscountResult {
  totalDiscountGBP: number
  applied: AppliedAutoDiscount[]
}

// ---------------------------------------------------------------------------
// Fully automatic discounting — buyers never type a code. Every active,
// eligible discount a seller has created is considered and applied
// silently wherever it matches — on product listings (via
// computeListingDiscount below) and at checkout / the real charge
// computation (via findAutomaticDiscounts), so a buyer sees the exact same
// price on the listing that they're actually charged.
//
// Rules:
// - A code with an empty productIds array is store-wide; one with
//   productIds set only competes for those specific products.
// - Multiple different codes can apply simultaneously in one order, as
//   long as they target different products — e.g. a 10% code on Product A
//   and a 20% code on Product B both apply automatically at once.
// - If more than one active code could apply to the SAME product, it gets
//   whichever single code gives it the largest discount — codes are never
//   stacked on top of each other for one item.
// - A code's maxDiscount cap (if set) is enforced across everything that
//   code ends up discounting in a cart, not per item.
// - Discounts apply ONLY to product line items — never to shipping or
//   duties/taxes. Callers must not pass shipping cost into `items`, and
//   must add shipping/duties back on top of the result untouched.
// ---------------------------------------------------------------------------

// Cart-level (checkout + real charge). Fetches the seller's active codes
// itself, then assigns each cart line item to its single best-matching
// code, respecting each code's own maxDiscount across the whole cart.
export async function findAutomaticDiscounts(
  sellerId: string,
  items: DiscountCartItem[]
): Promise<AutomaticDiscountResult> {
  if (!sellerId || items.length === 0) {
    return { totalDiscountGBP: 0, applied: [] }
  }

  const now = new Date()
  const codes = await prisma.discountCode.findMany({
    where: {
      sellerId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  })
  if (codes.length === 0) {
    return { totalDiscountGBP: 0, applied: [] }
  }

  const fullSubtotal = items.reduce((sum, i) => sum + i.priceGBP * i.quantity, 0)

  const eligibleCodes = codes.filter((c) => {
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return false
    if (c.minOrder && fullSubtotal < c.minOrder) return false
    return true
  })
  if (eligibleCodes.length === 0) {
    return { totalDiscountGBP: 0, applied: [] }
  }

  const runningTotals = new Map<string, number>()
  const contributions = new Map<string, number>()
  let totalDiscount = 0

  for (const item of items) {
    const candidates = eligibleCodes.filter(
      (c) => c.productIds.length === 0 || c.productIds.includes(item.productId)
    )
    if (candidates.length === 0) continue

    const lineGBP = item.priceGBP * item.quantity
    let bestCodeId: string | null = null
    let bestAmount = 0

    for (const c of candidates) {
      let raw = c.type === 'PERCENTAGE' ? (lineGBP * c.value) / 100 : Math.min(c.value, lineGBP)
      if (c.maxDiscount) {
        const usedSoFar = runningTotals.get(c.id) ?? 0
        const remaining = Math.max(0, c.maxDiscount - usedSoFar)
        raw = Math.min(raw, remaining)
      }
      if (raw > bestAmount) {
        bestAmount = raw
        bestCodeId = c.id
      }
    }

    if (bestCodeId && bestAmount > 0) {
      runningTotals.set(bestCodeId, (runningTotals.get(bestCodeId) ?? 0) + bestAmount)
      contributions.set(bestCodeId, (contributions.get(bestCodeId) ?? 0) + bestAmount)
      totalDiscount += bestAmount
    }
  }

  const applied: AppliedAutoDiscount[] = []
  for (const [discountId, amount] of contributions) {
    const c = codes.find((x) => x.id === discountId)
    if (!c) continue
    applied.push({
      discountId,
      code: c.code,
      productIds: c.productIds,
      amountGBP: Math.round(amount * 100) / 100,
      description: c.type === 'PERCENTAGE' ? `${c.value}% off` : `£${c.value.toFixed(2)} off`,
    })
  }

  return {
    totalDiscountGBP: Math.round(totalDiscount * 100) / 100,
    applied,
  }
}

export interface ListingDiscount {
  discountedPriceGBP: number
  originalPriceGBP: number
  percentOff: number
  code: string
}

// Minimal shape callers need to have already fetched (a raw Prisma
// DiscountCode row satisfies this structurally).
export interface DiscountCodeLike {
  id: string
  code: string
  type: string
  value: number
  maxDiscount: number | null
  productIds: string[]
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  expiresAt: Date | string | null
}

// Listing / product-detail pages. Pure — takes codes the caller already
// fetched (batch-fetch once per seller, not once per product, to avoid
// N+1 queries on a grid of many products) and computes the single best
// discount for ONE unit of ONE product. minOrder is intentionally ignored
// here since a standalone listing has no "order" to measure against yet —
// that gate is only meaningful at checkout, in findAutomaticDiscounts.
export function computeListingDiscount(
  codes: DiscountCodeLike[],
  productId: string,
  priceGBP: number,
  now: Date = new Date()
): ListingDiscount | null {
  let best = 0
  let bestCode: DiscountCodeLike | null = null

  for (const c of codes) {
    if (!c.isActive) continue
    if (c.expiresAt && new Date(c.expiresAt) <= now) continue
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit) continue
    if (c.productIds.length > 0 && !c.productIds.includes(productId)) continue

    let raw = c.type === 'PERCENTAGE' ? (priceGBP * c.value) / 100 : Math.min(c.value, priceGBP)
    if (c.maxDiscount) raw = Math.min(raw, c.maxDiscount)
    if (raw > best) {
      best = raw
      bestCode = c
    }
  }

  if (!bestCode || best <= 0) return null

  const discountedPriceGBP = Math.max(0, Math.round((priceGBP - best) * 100) / 100)
  const percentOff = Math.round((best / priceGBP) * 100)

  return {
    discountedPriceGBP,
    originalPriceGBP: priceGBP,
    percentOff,
    code: bestCode.code,
  }
}
