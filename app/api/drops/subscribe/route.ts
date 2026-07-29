import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Opt-in list for the weekly drop digest. Explicit consent only: a
// visitor types their email into the /drops box (guests welcome). GET
// with a base64url u parameter is the one-click unsubscribe used in
// every digest email.

export async function POST(req: NextRequest) {
  if (process.env.VELOR_SOCIAL_ENABLED === 'false') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  let email: string
  try {
    const body = await req.json()
    email = String(body.email || '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) && email.length <= 254
  if (!valid) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  await prisma.dropDigestSubscriber.upsert({ where: { email }, create: { email }, update: {} })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u')
  if (u) {
    try {
      const email = Buffer.from(u, 'base64url').toString('utf8').trim().toLowerCase()
      await prisma.dropDigestSubscriber.deleteMany({ where: { email } })
    } catch {
      // fall through to the redirect either way -- unsubscribe must never error at the user
    }
  }
  return NextResponse.redirect(new URL('/drops?unsubscribed=1', req.nextUrl.origin))
}
