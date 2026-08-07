import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import {
  REPORT_REASONS,
  REPORT_CONTENT_TYPES,
  isValidReportReason,
  isValidReportContentType,
} from '@/lib/reportReasons'

// Content reporting for every UGC surface (2026-07-29), per the SIGNED
// online safety policy (docs/osa/online-safety-policy.md):
// - reviews, messages, listings, streams, sellers are all reportable;
// - the route is open to NON-USERS too (the public /safety page posts here
//   with an email address instead of a session) -- the OSA complaints route
//   must be usable by people without an account;
// - every report is recorded (ContentReport), surfaced to ops as a
//   SupportTicket, and emailed to customer service so the policy's 24-48h
//   review window has a real inbox behind it.
//
// Abuse guards: one report per person per piece of content (DB unique), a
// per-email daily cap, and details required when the reason is "other".

const MAX_REPORTS_PER_EMAIL_PER_DAY = 20
const MAX_DETAILS_LEN = 2000
const MAX_URL_LEN = 500

function isPlausibleEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}

export async function POST(request: Request) {
  const session = await auth()
  const body = await request.json().catch(() => ({}))

  const contentType = typeof body.contentType === 'string' ? body.contentType.toUpperCase() : ''
  if (!isValidReportContentType(contentType)) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }
  if (!isValidReportReason(body.reason)) {
    return NextResponse.json({ error: 'Pick a reason for the report' }, { status: 400 })
  }
  const reason = body.reason as string
  const details = typeof body.details === 'string' ? body.details.trim().slice(0, MAX_DETAILS_LEN) : ''
  if (reason === 'other' && !details) {
    return NextResponse.json({ error: 'Please describe the problem' }, { status: 400 })
  }

  const contentId = typeof body.contentId === 'string' && body.contentId ? body.contentId.slice(0, 100) : null
  const contentUrl = typeof body.contentUrl === 'string' && body.contentUrl ? body.contentUrl.trim().slice(0, MAX_URL_LEN) : null
  if (!contentId && !contentUrl) {
    return NextResponse.json({ error: 'Tell us which listing, review, message or page you are reporting' }, { status: 400 })
  }

  // Signed-in reporters are identified by their session; non-users (the
  // /safety page) must supply a contact email so the outcome can be
  // communicated, per the policy's complaints route.
  let reporterEmail: string = session?.user?.email ?? ''
  const reporterUserId: string | null = (session?.user as { id?: string } | undefined)?.id ?? null
  if (!reporterEmail) {
    if (!isPlausibleEmail(body.email)) {
      return NextResponse.json({ error: 'A contact email is required so we can follow up on your report' }, { status: 400 })
    }
    reporterEmail = body.email.toLowerCase()
  }

  // Per-email daily cap -- keeps the open (non-user) route from being
  // flooded. Legitimate reporters never come near 20 reports a day.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recent = await prisma.contentReport.count({
    where: { reporterEmail, createdAt: { gte: dayAgo } },
  })
  if (recent >= MAX_REPORTS_PER_EMAIL_PER_DAY) {
    return NextResponse.json({ error: 'Report limit reached for today. If this is urgent, email customerservice@velorglobalmarket.com' }, { status: 429 })
  }

  let report
  try {
    report = await prisma.contentReport.create({
      data: {
        contentType,
        contentId,
        contentUrl,
        reporterEmail,
        reporterUserId,
        reason,
        details: details || null,
      },
    })
  } catch (e) {
    // Unique violation = this person already reported this content. That is
    // a success from the reporter's point of view, not an error.
    if ((e as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ ok: true, alreadyReported: true })
    }
    throw e
  }

  // Ops visibility: a SupportTicket per report (shows on /pulse/support),
  // PRIORITY for safety/prohibited per the policy's escalation posture.
  const priority = reason === 'safety' || reason === 'prohibited' ? 'PRIORITY' : 'STANDARD'
  const what = `${REPORT_CONTENT_TYPES[contentType]}${contentId ? ` (id ${contentId})` : ''}${contentUrl ? ` at ${contentUrl}` : ''}`
  try {
    await prisma.supportTicket.create({
      data: {
        name: 'Content report',
        email: reporterEmail,
        subject: `Content report [${reason}]: ${contentType}`,
        message: `Reported: ${what}\nReason: ${REPORT_REASONS[reason]}${details ? `\nDetails: ${details}` : ''}\nReporter: ${reporterEmail}${reporterUserId ? ' (signed in)' : ' (not signed in)'}\nContentReport id: ${report.id}\n\nPolicy window: review within 24-48h (docs/osa/online-safety-policy.md).`,
        priority: priority as 'PRIORITY' | 'STANDARD',
      },
    })
  } catch {
    // Ticket creation is best-effort; the ContentReport row is the record.
  }

  // Email customer service -- best-effort, never blocks the report itself.
  try {
    await sendEmail({
      to: 'customerservice@velorglobalmarket.com',
      subject: `[${priority}] Content report: ${contentType} - ${reason}`,
      html: `<p>New content report on Velor.</p>
<p><strong>What:</strong> ${what}<br>
<strong>Reason:</strong> ${REPORT_REASONS[reason]}<br>
${details ? `<strong>Details:</strong> ${details.replace(/</g, '&lt;')}<br>` : ''}
<strong>Reporter:</strong> ${reporterEmail}${reporterUserId ? ' (signed in)' : ' (not signed in)'}</p>
<p>Review window per the online safety policy: 24-48 hours. ContentReport id: ${report.id}</p>`,
    })
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
