import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isApproved: true, isActive: true },
    include: {
      seller: {
        select: { storeName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}
