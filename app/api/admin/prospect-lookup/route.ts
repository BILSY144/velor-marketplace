import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Read-only diagnostic route: look up SellerProspect + OutreachLog rows by
// exact email address(es). Built 2026-07-10 to investigate a report from
// William that outreach emails reached service-sector/large-brand inboxes
// (maisonette.com, poshbaby.com, petsupplies.com, plus a placeholder
// user@domain.com). GET only -- never writes anything. Delete once the
// investigation is closed if it is not needed as a standing tool.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const emailsParam = searchParams.get('emails')
  if (!emailsParam) {
    return NextResponse.json({ error: 'Provide ?emails=a@b.com,c@d.com' }, { status: 400 })
  }
  const emails = emailsParam.split(',').map((e) => e.trim()).filter(Boolean)

  const prospects = await prisma.sellerProspect.findMany({
    where: { email: { in: emails } },
    include: { outreachLogs: { orderBy: { createdAt: 'asc' } } },
  })

  const foundEmails = new Set(prospects.map((p) => p.email))
  const notFound = emails.filter((e) => !foundEmails.has(e))

  return NextResponse.json({ prospects, notFound })
}
