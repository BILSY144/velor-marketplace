import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, subject, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'name, email and message are required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const subjectLine = subject?.trim() || 'New Contact Form Submission'

  const { error: notifyError } = await resend.emails.send({
    from: 'Velor Contact Form <noreply@velorcommerce.co.uk>',
    to: ['customerservice@velorcommerce.co.uk'],
    reply_to: email,
    subject: `[Contact] ${subjectLine}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:32px 24px}h2{font-size:18px;font-weight:700;margin:0 0 24px}table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px}td{padding:10px 0;vertical-align:top;border-bottom:1px solid #f0f0f0}td:first-child{font-weight:600;width:30%;color:#555}.msg{background:#f9f9f9;border-left:3px solid #e5e5e5;padding:16px;font-size:14px;line-height:1.6;white-space:pre-wrap}</style></head><body><h2>New Contact Form Submission</h2><table><tr><td>Name</td><td>${name}</td></tr><tr><td>Email</td><td>${email}</td></tr><tr><td>Subject</td><td>${subjectLine}</td></tr></table><div class="msg">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></body></html>`,
  })

  if (notifyError) {
    console.error('Contact notify error:', notifyError)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  await resend.emails.send({
    from: 'Velor Support <noreply@velorcommerce.co.uk>',
    to: [email],
    subject: 'We received your message',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:32px 24px}h2{font-size:18px;font-weight:700;margin:0 0 16px}p{font-size:14px;line-height:1.7;color:#333}</style></head><body><h2>Thanks for getting in touch, ${name}.</h2><p>We have received your message and will respond within 1 business day.</p><p>If your matter is urgent, please reply directly to this email.</p><p style="color:#888;font-size:12px;margin-top:32px">Velor Global Marketplace &mdash; velorcommerce.store</p></body></html>`,
  }).catch(() => null)

  return NextResponse.json({ ok: true })
                                                                                 }
