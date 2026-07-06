import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendEmail as sendAlertEmail, buildNewSellerAlertEmail } from '@/lib/email'

async function sendEmail(payload: object) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  const { name, email, password, storeName } = await req.json()

  if (!name || !email || !password || !storeName) {
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
          storeName,
        },
      },
    },
    include: {
      seller: true,
    },
  })

  await Promise.allSettled([
    sendEmail({
      from: 'Velor Marketplace <noreply@velorcommerce.store>',
      reply_to: 'customerservice@velorcommerce.store',
      to: email,
      subject: 'Welcome to Velor Marketplace — Application Received',
      html: `<p>Hi ${name},</p><p>Thank you for applying to sell on Velor Marketplace. We will review your application and be in touch shortly.</p><p>The Velor Team</p>`,
    }),
    sendAlertEmail({
      to: 'willsinclair144@gmail.com',
      ...buildNewSellerAlertEmail({
        name,
        email,
        storeName: user.seller?.storeName ?? storeName,
        tier: user.seller?.tier ?? 'STARTER',
        signedUpAt: user.seller?.createdAt ?? new Date(),
      }),
    }),
  ])

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
}
