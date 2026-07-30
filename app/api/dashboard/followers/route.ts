import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { maskPersonalName } from '@/lib/messageIdentity'

// The real Followers list for the signed-in seller's dashboard (William,
// 2026-08-01: "when clicking followers it should take me to a page what
// lists all my followers or at least show the followers and name of
// followers" -- the sidebar link previously routed to Analytics instead,
// a prior session's deliberate substitute that no longer matches what the
// seller actually wants). Buyer names are masked the same way as everywhere
// else a seller sees a buyer's identity (messages, reviews, comments) --
// "First L.", never a full name or email -- per the signed messaging
// privacy rule in lib/messageIdentity.ts.
async function getSellerId(): Promise<string | null> {
  const session = await auth()
  return (session?.user as { sellerId?: string } | undefined)?.sellerId ?? null
}

export async function GET() {
  const sellerId = await getSellerId()
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const follows = await prisma.follow.findMany({
    where: { sellerId },
    select: { id: true, createdAt: true, user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    followers: follows.map((f) => ({
      id: f.id,
      name: maskPersonalName(f.user.name),
      since: f.createdAt.toISOString(),
    })),
  })
}
