import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Read-only diagnostic route: look up SellerProspect + OutreachLog rows.
// Built 2026-07-10 to investigate a report from William that outreach emails
// reached service-sector/large-brand/placeholder inboxes. GET only -- never
// writes anything. Delete once the investigation is closed if it is not
// needed as a standing tool.
//
// Modes:
//   ?emails=a@b.com,c@d.com   -- look up specific prospects by exact email
//   ?all=1                    -- return every prospect that has at least one
//                                 OutreachLog, with qualified status, so the
//                                 full scope of a bad-recipient bug can be
//                                 seen at once instead of a handful of samples
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)

  if (searchParams.get('all') === '1') {
    const contacted = await prisma.sellerProspect.findMany({
      where: { outreachLogs: { some: {} } },
      include: { outreachLogs: { orderBy: { sentAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })

    const rows = contacted.map((p) => {
      const initial = p.outreachLogs.find((o) => o.emailType === 'initial')
      return {
        email: p.email,
        domain: p.email ? p.email.split('@')[1] || null : null,
        name: p.name,
        sellerType: p.sellerType,
        category: p.category,
        country: p.country,
        score: p.score,
        status: p.status,
        qualified: p.qualified,
        qualifiedAt: p.qualifiedAt,
        qualificationNotes: p.qualificationNotes,
        createdAt: p.createdAt,
        initialSentAt: initial ? initial.sentAt : null,
        emailCount: p.outreachLogs.length,
      }
    })

    const total = rows.length
    const qualifiedTrue = rows.filter((r) => r.qualified === true).length
    const qualifiedFalse = rows.filter((r) => r.qualified === false).length
    const qualifiedNull = rows.filter((r) => r.qualified === null).length
    const placeholderEmail = rows.filter((r) => r.email === 'user@domain.com').length

    return NextResponse.json({
      total,
      qualifiedTrue,
      qualifiedFalse,
      qualifiedNull,
      placeholderEmail,
      rows,
    })
  }

  const emailsParam = searchParams.get('emails')
  if (!emailsParam) {
    return NextResponse.json({ error: 'Provide ?emails=a@b.com,c@d.com or ?all=1' }, { status: 400 })
  }
  const emails = emailsParam.split(',').map((e) => e.trim()).filter(Boolean)

  const prospects = await prisma.sellerProspect.findMany({
    where: { email: { in: emails } },
    include: { outreachLogs: { orderBy: { sentAt: 'asc' } } },
  })

  const foundEmails = new Set(prospects.map((p) => p.email))
  const notFound = emails.filter((e) => !foundEmails.has(e))

  return NextResponse.json({ prospects, notFound })
}
