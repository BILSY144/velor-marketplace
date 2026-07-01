import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal, sellerId } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Code is required' }, { status: 400 })
    }

    const now = new Date()
    const discount = await prisma.discountCode.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
        sellerId: sellerId ?? undefined,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    })

    if (!discount) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired discount code' })
    }

    if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
      return NextResponse.json({ valid: false, error: 'This code has reached its usage limit' })
    }

    const sub = typeof subtotal === 'number' ? subtotal : 0

    if (discount.minimumOrder && sub < discount.minimumOrder) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order of Â£${discount.minimumOrder.toFixed(2)} required`,
      })
    }

    let discountAmount = 0
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (sub * discount.value) / 100
      if (discount.maxDiscount) {
        discountAmount = Math.min(discountAmount, discount.maxDiscount)
      }
    } else {
      discountAmount = Math.min(discount.value, sub)
    }

    return NextResponse.json({
      valid: true,
      discountId: discount.id,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount: Math.round(discountAmount * 100) / 100,
      description: discount.type === 'PERCENTAGE'
        ? `${discount.value}% off`
        : `Â£${discount.value.toFixed(2)} off`,
    })
  } catch (error) {
    console.error('Discount validate error:', error)
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 })
  }
}
