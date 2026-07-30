import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// A buyer liking a seller -- the journal page's "Never Miss A Story" heart
// icon (William, 2026-08-01: "just needs to show red when clicked and i
// guess api routed to buyers likes"). Distinct from Follow (that's the
// orange button right next to it, for update notifications) -- this is a
// lighter-weight "I like this maker" signal. One like per signed-in buyer
// per seller, via the SellerLike model (unique on sellerId+userId).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { sellerId } = await params

  const seller = await prisma.seller.findFirst({ where: { id: sellerId, approved: true }, select: { id: true } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  try {
    await prisma.sellerLike.create({ data: { sellerId, userId: session.user.id } })
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code
    if (code !== 'P2002') throw err
  }

  return NextResponse.json({ ok: true, liked: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { sellerId } = await params

  await prisma.sellerLike.deleteMany({ where: { sellerId, userId: session.user.id } })

  return NextResponse.json({ ok: true, liked: false })
}
