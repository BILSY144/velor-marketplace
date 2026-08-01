import { NextRequest, NextResponse } from 'next/server'
import { calculateLandedCost } from '@/lib/duty-rates'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'

export const dynamic = 'force-dynamic'

// Quotes import duties/taxes for the checkout page. The declared value is
// resolved SERVER-SIDE from each product's real price in its seller's own
// currency, converted to GBP -- never taken from the client. Found live
// 2026-07-29 (William): the checkout sent raw cart prices as if GBP, so the
// $9.00 Door God print was declared as GBP 9.00 and quoted GBP 1.80 duty
// while the real charge (payment-intent recomputes with proper conversion)
// was GBP 1.35 on a GBP 6.77 declared value. This route now mirrors
// payment-intent's own price resolution exactly, so the quote and the
// charge can never disagree.
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

    const productIds = Array.from(
      new Set(
        cartItems
          .map((i: { productId?: string }) => i.productId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      )
    )
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'cartItems must carry productId' }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        price: true,
        hsCode: true,
        seller: { select: { currency: true } },
        // FIX 2026-08-01 (William: VAT quoted way under 20% of the displayed
        // item price): this route always priced by the BASE product only,
        // ignoring which variant the buyer actually selected --
        // ProductVariant.priceOverride was never read here. Live-confirmed:
        // "Custom Classic Pet Portrait Frame" base price GBP 40.00, selected
        // variant "Oval 2 Pets" GBP 54.96 -- this route quoted VAT on GBP 40
        // (GBP 8.00) instead of the correct GBP 54.96 (GBP 10.99). See
        // lib/cart.ts's CartItem for the full incident writeup.
        variants: { select: { id: true, priceOverride: true } },
      },
    })
    const byId = new Map(products.map((p) => [p.id, p]))

    let declaredValueGBP = 0
    let totalItemCount = 0
    let representativeHsCode: string | null = null
    for (const item of cartItems as Array<{ productId?: string; variantId?: string; quantity?: number }>) {
      const product = item.productId ? byId.get(item.productId) : undefined
      if (!product) continue
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
      const sellerCurrency = product.seller?.currency ?? 'GBP'
      // Resolve the SAME price the buyer was actually quoted: the selected
      // variant's priceOverride when one applies, exactly mirroring
      // app/api/shop/products/[productId]/route.ts's own
      // `v.priceOverride ?? product.price` formula -- never just the base
      // product price.
      const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : undefined
      const nativePrice = variant?.priceOverride ?? product.price
      const unitGBP =
        sellerCurrency === 'GBP' ? nativePrice : await convert(nativePrice, sellerCurrency, 'GBP')
      declaredValueGBP += unitGBP * qty
      totalItemCount += qty
      if (!representativeHsCode && product.hsCode) representativeHsCode = product.hsCode
    }

    if (declaredValueGBP <= 0) {
      return NextResponse.json({ error: 'No matching products found' }, { status: 404 })
    }

    const result = calculateLandedCost({
      hsCode: representativeHsCode,
      originCountry: originCountry ?? 'GB',
      destinationCountry,
      declaredValueGBP,
      shippingCostGBP: shippingCostGBP ?? 0,
      // EU low-value flat duty (since 2026-07-01) is charged PER ITEM.
      itemCount: totalItemCount,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[landed-cost]', err)
    return NextResponse.json({ error: 'Failed to calculate landed cost' }, { status: 500 })
  }
}
