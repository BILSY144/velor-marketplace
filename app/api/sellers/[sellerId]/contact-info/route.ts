import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Resolves a Seller.id to the info needed to start a conversation with them
// (William, 2026-08-01: "everything linked and routed to somewhere" audit --
// the journal page's "Message {storeName}" button linked to the generic
// /messages inbox with no way to actually start contacting that seller if
// no thread existed yet, since Message.receiverId is a USER id while the
// journal page only has the seller's SELLER id). Public and unauthenticated
// -- storeName and storeLogo are already shown to anyone on the storefront
// page; userId is likewise not sensitive (it's exposed as senderId/
// receiverId to the other party in every conversation already).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  const { sellerId } = await params

  const seller = await prisma.seller.findFirst({
    where: { id: sellerId, approved: true },
    select: { userId: true, storeName: true, storeLogo: true },
  })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const storeLogo = (seller as unknown as { storeLogo?: string }).storeLogo ?? null

  return NextResponse.json({
    userId: seller.userId,
    storeName: seller.storeName,
    storeLogo,
  })
}
