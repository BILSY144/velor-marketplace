import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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

  const storeSlug = storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: 'SELLER',
      seller: {
        create: {
          storeName,
          storeSlug,
        },
      },
    },
  })

  await Promise.allSettled([
    sendEmail({
      from: 'Velor Marketplace <noreply@velorcommerce.store>',
      reply_to: 'customerservice@velorcommerce.store',
      to: email,
      subject: 'Welcome to Velor Marketplace — Application Received',
      html: `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0D0D0D;color:#FFFFFF;padding:40px;border-radius:12px;">
  <h1 style="color:#FF6B00;font-size:28px;margin-bottom:8px;">Welcome to Velor, ${name}!</h1>
  <p style="color:#999;font-size:14px;margin-bottom:24px;">Seller Application Received</p>
  <p>Your seller account for <strong>${storeName}</strong> has been created and is now under review.</p>
  <p style="color:#999;">Applications are reviewed automatically. You will receive an email confirmation shortly.</p>
  <a href="https://velorcommerce.store/dashboard" style="display:inline-block;background:#FF6B00;color:#FFFFFF;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:24px 0;">Go to Dashboard</a>
  <hr style="border-color:#2A2A2A;margin:32px 0;" />
  <p style="color:#666;font-size:12px;">Velor Marketplace — velorcommerce.store</p>
</div>
`,
    }),
  ])

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
}
