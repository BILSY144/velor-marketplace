import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
  if (adminCount > 0) {
    return NextResponse.json(
      { error: 'An admin account already exists. This one-time setup is disabled.' },
      { status: 403 }
    )
  }

  const hashed = await bcrypt.hash(password, 12)

  const existing = await prisma.user.findUnique({ where: { email } })

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', password: hashed, name },
      })
    : await prisma.user.create({
        data: { name, email, password: hashed, role: 'ADMIN' },
      })

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
}

export async function GET() {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
  return NextResponse.json({ available: adminCount === 0 })
}
