import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'
import { evaluateDiscount, DiscountCartItem } from '@/lib/discount'

// Re-quotes a discount code against the buyer's real cart using prices
// pulled fresh from the database — never trusts prices sent by the client.
// This is the same "always re-verify server-side" pattern used by
// /api/stripe/payment-intent, so a code preview here always matches what
// actually gets charged.
export async function POST(request: NextRequest) {
  try {
    const { code, sellerId, items } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Code is required' }, { status: 400 })
    }
    if (!sellerId || typeof sellerId !== 'string') {
      return NextResponse.json({ valid: false, error: 'Missing seller for this cart' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ valid: false, error: 'Cart is empty' }, { status: 400 })
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
      return NextResponse.json({ valid: false, error: 'No matching items found in cart' }, { status: 400 })
    }

    const result = await evaluateDiscount(code, sellerId, cartItems)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Discount validate error:', error)
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 })
  }
}
