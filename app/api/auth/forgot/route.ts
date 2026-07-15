import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store'
const TOKEN_TTL_MS = 60 * 60 * 1000 // one hour, as published in the app copy

// Request a password reset. ALWAYS returns 200 with the same body whether
// or not the account exists — no user enumeration. The raw token appears
// only inside the emailed link; the database stores its SHA-256 hash.
export async function POST(req: NextRequest) {
  let email = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    // fall through to the uniform response
  }

  if (email && email.includes('@')) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const raw = randomBytes(32).toString('hex')
      const tokenHash = createHash('sha256').update(raw).digest('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      })
      const link = `${BASE}/auth/reset?token=${raw}`
      await sendEmail({
        to: email,
        subject: 'Reset your Velor password',
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#111">Reset your Velor password</h2>
            <p style="color:#444;line-height:1.6">Someone asked to reset the password for this account.
            If it was you, the link below works for <strong>one hour</strong> and can be used once:</p>
            <p style="margin:28px 0">
              <a href="${link}" style="background:#FF6B00;color:#160a00;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:bold">Set a new password</a>
            </p>
            <p style="color:#888;font-size:13px;line-height:1.6">If you didn't ask for this, ignore this email — nothing changes unless the link is used.
            For help, write to customerservice@velorcommerce.co.uk.</p>
          </div>`,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
