import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    select: { id: true, approved: true },
  })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  return NextResponse.json({ id: seller.id, approved: seller.approved })
}
