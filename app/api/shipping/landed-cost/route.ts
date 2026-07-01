import { NextRequest, NextResponse } from 'next/server'
import { calculateLandedCost } from '@/lib/duty-rates'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const {
      cartItems,
      destinationCountry,
      originCountry,
      shippingCostGBP,
    } = await request.json()

    if (!destinationCountry) {
      return NextResponse.json({ error: 'destinationCountry required' }, { status: 400 })
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'cartItems required' }, { status: 400 })
    }

    // Calculate declared value from cart
    const declaredValueGBP = cartItems.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    )

    // Use the HS code from the first cart item that has one, or null
    const representativeHsCode = cartItems.find(
      (i: { hsCode?: string }) => i.hsCode
    )?.hsCode ?? null

    const result = calculateLandedCost({
      hsCode: representativeHsCode,
      originCountry: originCountry ?? 'GB',
      destinationCountry,
      declaredValueGBP,
      shippingCostGBP: shippingCostGBP ?? 0,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[landed-cost]', err)
    return NextResponse.json({ error: 'Failed to calculate landed cost' }, { status: 500 })
  }
}
