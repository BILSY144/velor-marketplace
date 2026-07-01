import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const codes = await prisma.discountCode.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ codes })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const body = await request.json()
  const { code, type, value, minimumOrder, maxDiscount, usageLimit, expiresAt } = body

  if (!code || !type || !value) {
    return NextResponse.json({ error: 'Code, type, and value are required' }, { status: 400 })
  }

  if (!['PERCENTAGE', 'FIXED'].includes(type)) {
    return NextResponse.json({ error: 'Type must be PERCENTAGE or FIXED' }, { status: 400 })
  }

  if (type === 'PERCENTAGE' && (value <= 0 || value > 100)) {
    return NextResponse.json({ error: 'Percentage must be between 1 and 100' }, { status: 400 })
  }

  const existing = await prisma.discountCode.findFirst({
    where: { code: code.toUpperCase().trim() },
  })
  if (existing) {
    return NextResponse.json({ error: 'Code already exists' }, { status: 400 })
  }

  const discount = await prisma.discountCode.create({
    data: {
      sellerId: seller.id,
      code: code.toUpperCase().trim(),
      type,
      value: parseFloat(value),
      minimumOrder: minimumOrder ? parseFloat(minimumOrder) : null,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    },
  })

  return NextResponse.json({ discount }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const { id, isActive } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const code = await prisma.discountCode.findFirst({ where: { id, sellerId: seller.id } })
  if (!code) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.discountCode.update({
    where: { id },
    data: { isActive: Boolean(isActive) },
  })

  return NextResponse.json({ discount: updated })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const code = await prisma.discountCode.findFirst({ where: { id, sellerId: seller.id } })
  if (!code) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.discountCode.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
