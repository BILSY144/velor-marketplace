import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const tickets = await prisma.supportTicket.findMany({
        where: { sellerId: seller.id },
        orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
        tier: seller.tier,
        isPriority: seller.tier === 'ENTERPRISE' || seller.tier === 'PRO',
        tickets,
  })
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
        include: { user: true },
  })
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  let body: { subject?: string; message?: string }
    try {
          body = await req.json()
    } catch {
          return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

  const { subject, message } = body
    if (!subject?.trim() || !message?.trim()) {
          return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

  const isPriority = seller.tier === 'ENTERPRISE' || seller.tier === 'PRO'
    const sellerEmail = seller.user.email ?? ''

  const ticket = await prisma.supportTicket.create({
        data: {
                sellerId: seller.id,
                name: seller.storeName,
                email: sellerEmail,
                subject: subject.trim(),
                message: message.trim(),
                priority: isPriority ? 'PRIORITY' : 'STANDARD',
        },
  })

  const subjectLine = `${isPriority ? '[PRIORITY] ' : ''}[Seller Support - ${seller.tier}] ${subject.trim()}`

  const { error: notifyError } = await resend.emails.send({
        from: 'Velor Seller Support <noreply@velorcommerce.store>',
        to: ['sellers@velorcommerce.store'],
        replyTo: sellerEmail || undefined,
        subject: subjectLine,
        html: `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a">
              <p><strong>Seller:</strong> ${seller.storeName} (${seller.tier})</p>
                    <p><strong>Ticket ID:</strong> ${ticket.id}</p>
                          <p><strong>Reply-to:</strong> ${sellerEmail}</p>
                                <p><strong>Subject:</strong> ${subject.trim()}</p>
                                      <p>${message.trim().replace(/\n/g, '<br/>')}</p>
                                          </body></html>`,
  })

  if (notifyError) {
        console.error('Support ticket notify error:', notifyError)
  }

  if (sellerEmail) {
        await resend.emails.send({
                from: 'Velor Seller Support <noreply@velorcommerce.store>',
                to: [sellerEmail],
                subject: 'We received your support request',
                html: `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a">
                        <p>Hi ${seller.storeName},</p>
                                <p>We've received your message${isPriority ? ' and flagged it for priority review as an Enterprise seller' : ''}. Our team will get back to you soon.</p>
                                        <p><strong>Subject:</strong> ${subject.trim()}</p>
                                              </body></html>`,
        }).catch(() => null)
  }

  return NextResponse.json({ ok: true, ticket })
}
