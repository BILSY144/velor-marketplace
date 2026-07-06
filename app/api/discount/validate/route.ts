import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'
import { findAutomaticDiscounts, DiscountCartItem } from '@/lib/discount'

// Automatic discount lookup — buyers never type a code. Checkout calls this
// on mount (and whenever the cart changes) to show exactly what will be
// deducted, using prices pulled fresh from the database rather than trusting
// anything the client sends. /api/stripe/payment-intent uses the same
// findAutomaticDiscounts() function to compute the real charge, so the
// number shown here always matches what the buyer is actually charged.
export async function POST(request: NextRequest) {
  try {
    const { sellerId, items } = await request.json()

    if (!sellerId || typeof sellerId !== 'string') {
      return NextResponse.json({ totalDiscountGBP: 0, applied: [] })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ totalDiscountGBP: 0, applied: [] })
    }

    const productIds = items.map((i: { productId: string }) => i.productId).filter(Boolean)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        price: true,
        seller: { select: { id: true, currency: true } },
      },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const cartItems: DiscountCartItem[] = []
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) continue
      const qty = Math.max(1, Number(item.quantity) || 1)
      const sellerCurrency = product.seller?.currency ?? 'GBP'
      const unitGBP =
        sellerCurrency === 'GBP' ? product.price : await convert(product.price, sellerCurrency, 'GBP')
      cartItems.push({ productId: item.productId, quantity: qty, priceGBP: unitGBP })
    }

    if (cartItems.length === 0) {
      return NextResponse.json({ totalDiscountGBP: 0, applied: [] })
    }

    const result = await findAutomaticDiscounts(sellerId, cartItems)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Discount lookup error:', error)
    return NextResponse.json({ totalDiscountGBP: 0, applied: [] }, { status: 500 })
  }
}
