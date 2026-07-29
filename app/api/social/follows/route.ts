import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Velor Social: Follows (LAW #4 stage 3 foundations, built 2026-07-29).
//
// DORMANT BY DESIGN: every method 403s unless VELOR_SOCIAL_ENABLED is
// exactly 'true' in Vercel. William flips that env var ONLY after the OSA
// pack in docs/osa/ is signed off -- no user-facing social surface may go
// live before the paperwork (CLAUDE.md LAW #4, item 2).
//
// Privacy posture (docs/osa/dpia-velor-social.md): a user sees only their
// own follow list; there is no public followers list at launch. Follower
// COUNTS may be surfaced later as an aggregate on seller profiles.

function socialDisabled(): NextResponse | null {
  if (process.env.VELOR_SOCIAL_ENABLED === 'true') return null
  return NextResponse.json({ error: 'Velor Social is not yet enabled' }, { status: 403 })
}

export async function GET() {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const follows = await prisma.follow.findMany({
    where: { userId: session.user.id },
    select: {
      sellerId: true,
      createdAt: true,
      seller: { select: { storeName: true, storeLogo: true, country: true, foundingBadge: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ follows })
}

export async function POST(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { sellerId } = await req.json().catch(() => ({}))
  if (typeof sellerId !== 'string' || !sellerId) {
    return NextResponse.json({ error: 'sellerId required' }, { status: 400 })
  }
  const seller = await prisma.seller.findUnique({ where: { id: sellerId }, select: { id: true, approved: true } })
  if (!seller || !seller.approved) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  await prisma.follow.upsert({
    where: { userId_sellerId: { userId: session.user.id, sellerId } },
    create: { userId: session.user.id, sellerId },
    update: {},
  })
  return NextResponse.json({ ok: true, following: true })
}

export async function DELETE(req: NextRequest) {
  const gate = socialDisabled()
  if (gate) return gate
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { sellerId } = await req.json().catch(() => ({}))
  if (typeof sellerId !== 'string' || !sellerId) {
    return NextResponse.json({ error: 'sellerId required' }, { status: 400 })
  }
  await prisma.follow.deleteMany({ where: { userId: session.user.id, sellerId } })
  return NextResponse.json({ ok: true, following: false })
}
