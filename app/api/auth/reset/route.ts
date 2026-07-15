import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Complete a password reset: verify the emailed token (unexpired, unused),
// set the new bcrypt password, burn the token. Also marks the email
// verified — clicking a link only that inbox received IS the verification.
export async function POST(req: NextRequest) {
  let token = ''
  let password = ''
  try {
    const body = await req.json()
    token = String(body?.token ?? '')
    password = String(body?.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!token || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    )
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'This link has expired or was already used — request a new one.' },
      { status: 400 }
    )
  }

  const hash = await bcrypt.hash(password, 10)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { password: hash, emailVerified: new Date() },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true })
}
