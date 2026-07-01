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

  // Send seller welcome email + admin notification in parallel
  await Promise.allSettled([
    sendEmail({
      from: 'Velor Marketplace <noreply@velorcommerce.co.uk>',
      reply_to: 'customerservice@velorcommerce.co.uk',
      to: email,
      subject: 'Welcome to Velor Marketplace — Application Received',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0D0D0D;color:#FFFFFF;padding:40px;border-radius:12px;">
          <h1 style="color:#FF6B00;font-size:28px;margin-bottom:8px;">Welcome to Velor, ${name}!</h1>
          <p style="color:#999;font-size:14px;margin-bottom:24px;">Seller Application Received</p>
          <p>Your seller account for <strong>${businessName}</strong> has been created and is now under review.</p>
          <p style="color:#999;">Our team reviews all new seller applications within <strong style="color:#FFFFFF;">24–48 hours</strong>. You'll receive an email when your account is approved.</p>
          <a href="https://velorcommerce.store/dashboard" style="display:inline-block;background:#FF6B00;color:#FFFFFF;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:24px 0;">Go to Dashboard</a>
          <hr style="border-color:#2A2A2A;margin:32px 0;" />
          <p style="color:#666;font-size:12px;">Velor Marketplace — velorcommerce.store</p>
        </div>
      `,
    }),
    sendEmail({
      from: 'Velor Marketplace <noreply@velorcommerce.co.uk>',
      to: 'willsinclair144@gmail.com',
      subject: `New Seller Application — ${businessName}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#FF6B00;">New Seller Application</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Name</td><td style="padding:8px;border:1px solid #eee;">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Email</td><td style="padding:8px;border:1px solid #eee;">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Business</td><td style="padding:8px;border:1px solid #eee;">${businessName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">User ID</td><td style="padding:8px;border:1px solid #eee;">${user.id}</td></tr>
          </table>
          <a href="https://velorcommerce.store/admin/sellers" style="display:inline-block;background:#FF6B00;color:#FFFFFF;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Review in Admin</a>
        </div>
      `,
    }),
  ])

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
}
