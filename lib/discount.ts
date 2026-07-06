import { prisma } from '@/lib/prisma'

export interface DiscountCartItem {
  productId: string
  quantity: number
  priceGBP: number
}

export interface DiscountEvalResult {
  valid: boolean
  error?: string
  discountId?: string
  code?: string
  type?: string
  value?: number
  eligibleSubtotalGBP?: number
  discountAmountGBP?: number
  description?: string
}

// Shared discount evaluation used by both the checkout "apply code" preview
// (app/api/discount/validate) and the real charge computation
// (app/api/stripe/payment-intent) so the two can never disagree.
//
// A code with an empty productIds array applies store-wide across the
// seller's whole catalogue. A code with productIds set only discounts the
// matching line items in the cart — everything else in the order is
// charged at full price.
//
// Discounts apply ONLY to product line items — never to shipping or
// duties/taxes. Callers must not pass shipping cost into `items`, and must
// add shipping/duties back on top of the result untouched.
export async function evaluateDiscount(
  codeInput: string,
  sellerId: string,
  items: DiscountCartItem[]
): Promise<DiscountEvalResult> {
  if (!codeInput || typeof codeInput !== 'string') {
    return { valid: false, error: 'Code is required' }
  }
  if (!sellerId) {
    return { valid: false, error: 'Unable to determine seller for this code' }
  }

  const now = new Date()
  const discount = await prisma.discountCode.findFirst({
    where: {
      code: codeInput.toUpperCase().trim(),
      sellerId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  })

  if (!discount) {
    return { valid: false, error: 'Invalid or expired discount code' }
  }

  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
    return { valid: false, error: 'This code has reached its usage limit' }
  }

  const hasScope = discount.productIds && discount.productIds.length > 0
  const scopedItems = hasScope
    ? items.filter((i) => discount.productIds.includes(i.productId))
    : items

  if (scopedItems.length === 0) {
    return {
      valid: false,
      error: 'This code only applies to specific products that are not in your cart',
    }
  }

  const fullSubtotal = items.reduce((sum, i) => sum + i.priceGBP * i.quantity, 0)
  if (discount.minOrder && fullSubtotal < discount.minOrder) {
    return {
      valid: false,
      error: `Minimum order of £${discount.minOrder.toFixed(2)} required`,
    }
  }

  const eligibleSubtotal = scopedItems.reduce((sum, i) => sum + i.priceGBP * i.quantity, 0)

  let discountAmount = 0
  if (discount.type === 'PERCENTAGE') {
    discountAmount = (eligibleSubtotal * discount.value) / 100
    if (discount.maxDiscount) discountAmount = Math.min(discountAmount, discount.maxDiscount)
  } else {
    discountAmount = Math.min(discount.value, eligibleSubtotal)
  }
  discountAmount = Math.round(discountAmount * 100) / 100

  const baseLabel =
    discount.type === 'PERCENTAGE' ? `${discount.value}% off` : `£${discount.value.toFixed(2)} off`

  return {
    valid: true,
    discountId: discount.id,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    eligibleSubtotalGBP: eligibleSubtotal,
    discountAmountGBP: discountAmount,
    description: hasScope
      ? `${baseLabel} ${scopedItems.length > 1 ? 'selected items' : 'selected item'}`
      : baseLabel,
  }
}
