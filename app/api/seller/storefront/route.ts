import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { canUseTheme, getTheme } from '@/lib/store-themes'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  const s = seller as unknown as { tier?: string; storeTheme?: string; storefrontUnlocked?: boolean; storeLogo?: string }
  return NextResponse.json({
    theme: s.storeTheme || 'classic',
    tier: s.tier || 'STARTER',
    unlocked: s.storefrontUnlocked === true,
    logo: s.storeLogo || null,
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  const { themeId } = await req.json()
  const theme = getTheme(themeId)
  if (!themeId || theme.id !== themeId) {
    return NextResponse.json({ error: 'Unknown theme' }, { status: 400 })
  }

  const s = seller as unknown as { tier?: string; storefrontUnlocked?: boolean }
  if (!canUseTheme(s.tier, s.storefrontUnlocked, themeId)) {
    return NextResponse.json({ error: 'locked' }, { status: 403 })
  }

  try {
    await prisma.seller.update({
      where: { id: seller.id },
      data: { storeTheme: themeId } as unknown as Record<string, unknown>,
    })
    return NextResponse.json({ ok: true, theme: themeId })
  } catch (err) {
    console.error('Failed to apply storefront theme', err)
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: 'Database error: ' + message }, { status: 500 })
  }
}
