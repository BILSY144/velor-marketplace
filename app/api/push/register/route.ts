import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Register an Expo push token from the Velor app. One row per device
// (upsert on the token), linked to the signed-in user when there is one so
// launch events — opening bells, order updates — can notify the right
// phones with the bell chime. Anonymous registration is allowed: a buyer
// who enables notifications before sign-in still gets global opening bells.
export async function POST(req: NextRequest) {
  let token = ''
  let platform = ''
  try {
    const body = await req.json()
    token = String(body?.token ?? '')
    platform = String(body?.platform ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Expo push tokens look like ExponentPushToken[xxxx] — reject junk early.
  if (!/^ExponentPushToken\[[A-Za-z0-9_-]+\]$/.test(token) || token.length > 200) {
    return NextResponse.json({ error: 'Not an Expo push token' }, { status: 400 })
  }

  const session = await auth().catch(() => null)
  const userId = session?.user?.id ?? null

  await prisma.pushToken.upsert({
    where: { token },
    create: { token, platform: platform.slice(0, 16), userId },
    update: { lastSeenAt: new Date(), ...(userId ? { userId } : {}) },
  })

  return NextResponse.json({ ok: true })
}
