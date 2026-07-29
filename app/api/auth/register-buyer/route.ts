import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Buyer account creation (William found the gap 2026-07-29: every door
// said seller). Buyers need an account to follow makers, save pieces to
// collections, review, and track orders. Deliberately minimal: no store,
// no application, no review queue -- shop straight away.

export async function POST(req: NextRequest) {
  let name: string, email: string, password: string
  try {
    const body = await req.json()
    name = String(body.name || '').trim()
    email = String(body.email || '').trim().toLowerCase()
    password = String(body.password || '')
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (!name || name.length > 80) return NextResponse.json({ error: 'Enter your name' }, { status: 400 })
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) && email.length <= 254
  if (!emailOk) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) return NextResponse.json({ error: 'An account with that email already exists -- try signing in' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { name, email, password: hashed, role: 'user' } })
  return NextResponse.json({ ok: true })
}
