import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing activation token' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { setupToken: token } })

  if (!user) {
    return NextResponse.json({ error: 'Invalid or already-used activation link' }, { status: 400 })
  }

  if (!user.setupTokenExpiresAt || user.setupTokenExpiresAt < new Date()) {
    return NextResponse.json(
      { error: 'This activation link has expired. Contact customerservice@velorcommerce.store for a new one.' },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      setupToken: null,
      setupTokenExpiresAt: null,
    },
  })

  return NextResponse.json({ success: true })
}
