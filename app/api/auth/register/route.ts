import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { name, email, password, businessName } = await req.json()

  if (!name || !email || !password || !businessName) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 409 }
    )
  }

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: 'SELLER',
      seller: {
        create: {
          businessName,
          status: 'PENDING',
        },
      },
    },
  })

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Velor Marketplace <noreply@velorcommerce.co.uk>',
      reply_to: 'customerservice@velorcommerce.co.uk',
      to: email,
      subject: 'Welcome to Velor Marketplace',
      html: `<h2>Welcome, ${name}!</h2><p>Your seller account for <strong>${businessName}</strong> has been created. Our team will review your application within 24 hours.</p><p><a href="https://velorcommerce.store/dashboard">Go to your dashboard</a></p>`,
    }),
  }).catch(() => {})

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
}
