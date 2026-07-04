import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { canBrandLogo } from '@/lib/store-themes'

// Max stored logo size. The client resizes/compresses before upload, so this is a safety cap.
const MAX_LEN = 200_000

// Upload (or replace) the seller's custom store logo. Stored as a compressed data URL.
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const s = seller as unknown as { tier?: string; storefrontUnlocked?: boolean }
  if (!canBrandLogo(s.tier, s.storefrontUnlocked)) {
    return NextResponse.json({ error: 'locked' }, { status: 403 })
  }

  const { dataUrl } = await req.json()
  if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
  }
  if (dataUrl.length > MAX_LEN) {
    return NextResponse.json({ error: 'Image too large' }, { status: 413 })
  }

  await prisma.seller.update({
    where: { id: seller.id },
    data: { storeLogo: dataUrl } as unknown as Record<string, unknown>,
  })
  return NextResponse.json({ ok: true })
}

// Remove the custom logo (store falls back to its name in the hero).
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  await prisma.seller.update({
    where: { id: seller.id },
    data: { storeLogo: null } as unknown as Record<string, unknown>,
  })
  return NextResponse.json({ ok: true })
}
