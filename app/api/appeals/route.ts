import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// Appeals route (2026-07-29), per the signed online safety policy: anyone
// whose content was removed, listing rejected, stream ended, or account
// restricted can ask for the decision to be looked at again -- including
// people without an account (the public /safety page posts here). Every
// appeal becomes a PRIORITY SupportTicket and an email to customer service,
// and the named safety owner (William) decides; an appeal is never handled
// by the same automated path that made the original decision.

const MAX_LEN = 3000
const MAX_APPEALS_PER_EMAIL_PER_DAY = 5

function isPlausibleEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}

export async function POST(request: Request) {
  const session = await auth()
  const body = await request.json().catch(() => ({}))

  const decision = typeof body.decision === 'string' ? body.decision.trim().slice(0, 300) : ''
  const grounds = typeof body.grounds === 'string' ? body.grounds.trim().slice(0, MAX_LEN) : ''
  if (!decision || !grounds) {
    return NextResponse.json({ error: 'Tell us which decision you are appealing and why it should be reconsidered' }, { status: 400 })
  }

  let email: string = session?.user?.email ?? ''
  if (!email) {
    if (!isPlausibleEmail(body.email)) {
      return NextResponse.json({ error: 'A contact email is required so we can reply with the outcome' }, { status: 400 })
    }
    email = body.email.toLowerCase()
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recent = await prisma.supportTicket.count({
    where: { email, subject: { startsWith: 'Appeal:' }, createdAt: { gte: dayAgo } },
  })
  if (recent >= MAX_APPEALS_PER_EMAIL_PER_DAY) {
    return NextResponse.json({ error: 'Appeal limit reached for today. If this is urgent, email customerservice@velorglobalmarket.com' }, { status: 429 })
  }

  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : 'Appeal'
  await prisma.supportTicket.create({
    data: {
      name,
      email,
      subject: `Appeal: ${decision}`,
      message: `APPEAL (per docs/osa/online-safety-policy.md -- decided by the named safety owner, not the automated path that made the original decision).\n\nDecision being appealed: ${decision}\n\nGrounds:\n${grounds}\n\nContact: ${email}${session?.user?.email ? ' (signed in)' : ' (not signed in)'}`,
      priority: 'PRIORITY',
    },
  })

  try {
    await sendEmail({
      to: 'customerservice@velorglobalmarket.com',
      subject: `[PRIORITY] Appeal: ${decision}`,
      html: `<p>New appeal on Velor.</p>
<p><strong>Decision being appealed:</strong> ${decision.replace(/</g, '&lt;')}<br>
<strong>Grounds:</strong> ${grounds.replace(/</g, '&lt;')}<br>
<strong>Contact:</strong> ${email}</p>
<p>Appeals are decided by the named safety owner per the online safety policy.</p>`,
    })
  } catch {
    // best-effort; the SupportTicket row is the record
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
