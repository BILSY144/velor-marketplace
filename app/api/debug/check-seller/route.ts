import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'email query param required' }, { status: 400 })
  }

  const seller = await prisma.seller.findFirst({
    where: { user: { email } },
    select: {
      id: true,
      approved: true,
      storeName: true,
      createdAt: true,
      user: { select: { email: true, role: true } },
    },
  })

  if (!seller) {
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({
    exists: true,
    id: seller.id,
    approved: seller.approved,
    storeName: seller.storeName,
    createdAt: seller.createdAt,
  })
}
