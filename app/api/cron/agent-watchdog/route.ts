import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PROBATION_HOLD_MS, TRUSTED_HOLD_MS, isSellerTrusted, orderHasOpenIssue } from '@/lib/payouts'
import { requireCronSecret } from '@/lib/cronAuth'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Agent watchdog -- the enforcement arm of docs/AGENT_OPERATIONS.md.
// Runs hourly. Checks real, observable OUTCOMES in the database (never
// self-reported statuses) against each agent's duty and SLA. Any breach is
// emailed to customerservice@velorcommerce.co.uk immediately and every run is
// recorded in AgentLog so the daily director briefing can report watchdog
// health honestly.

const HOURS = 60 * 60 * 1000

async function sendAlert(subject: string, lines: string[]) {
  if (!process.env.RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Velor Agent Watchdog <noreply@velorcommerce.store>',
      to: ['customerservice@velorcommerce.co.uk'],
      subject: `[WATCHDOG] ${subject}`,
      html: `<div style="font-family:Inter,sans-serif;background:#0D0D0D;color:#fff;padding:32px;border-radius:12px;max-width:640px;margin:0 auto;"><h2 style="color:#FF6B00;margin:0 0 16px;">Agent Watchdog Alert</h2>${lines.map(l => `<p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 8px;">${l}</p>`).join('')}<p style="color:#666;font-size:12px;margin-top:20px;">Duties and SLAs: docs/AGENT_OPERATIONS.md. This alert is generated from live database checks, not self-reported statuses.</p></div>`,
    }),
  }).catch(() => {})
}

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  const now = Date.now()
  const breaches: string[] = []
  const checks: Record<string, string | number> = {}

  // 1. Listings Quality (Agent 7): clean listings should never sit unmoderated
  // for 6h+ (auto-moderate runs every 5 minutes). Certificate-gated and
  // regulated-held listings are excluded -- they legitimately wait for humans.
  const staleModeration = await prisma.product.count({
    where: {
      status: 'PENDING_REVIEW',
      requiresCertificate: false,
      createdAt: { lt: new Date(now - 6 * HOURS) },
    },
  })
  checks.staleModerationQueue = staleModeration
  if (staleModeration > 0) breaches.push(`${staleModeration} clean listing(s) stuck in PENDING_REVIEW for over 6 hours -- auto-moderation may be stalled (note: listings held for human review by design are counted here too; check the queue).`)

  // 2. Seller Onboarding (Agent 3): applications reviewed within 24h.
  const staleApplications = await prisma.sellerApplication.count({
    where: { status: 'PENDING', createdAt: { lt: new Date(now - 24 * HOURS) } },
  })
  checks.staleApplications = staleApplications
  if (staleApplications > 0) breaches.push(`${staleApplications} seller application(s) PENDING for over 24 hours (SLA breach -- target is 1 hour).`)

  // 3. Seller Success (Agent 4): OPEN tickets -- 24h standard, 4h priority.
  const stalePriorityTickets = await prisma.supportTicket.count({
    where: { status: 'OPEN', priority: 'PRIORITY', createdAt: { lt: new Date(now - 4 * HOURS) } },
  })
  const staleTickets = await prisma.supportTicket.count({
    where: { status: 'OPEN', priority: 'STANDARD', createdAt: { lt: new Date(now - 24 * HOURS) } },
  })
  checks.stalePriorityTickets = stalePriorityTickets
  checks.staleStandardTickets = staleTickets
  if (stalePriorityTickets > 0) breaches.push(`${stalePriorityTickets} PRIORITY support ticket(s) open past the 4-hour SLA.`)
  if (staleTickets > 0) breaches.push(`${staleTickets} standard support ticket(s) open past the 24-hour SLA.`)

  // 4. Prospecting (Agent 1): scout should produce prospects continuously.
  const recentProspects = await prisma.sellerProspect.count({
    where: { createdAt: { gt: new Date(now - 48 * HOURS) } },
  })
  checks.prospectsLast48h = recentProspects
  if (recentProspects === 0) breaches.push('No new seller prospects in 48 hours -- scout-sellers cron may be failing.')

  // 5. Outreach (Agent 2): only meaningful when OUTREACH_ENABLED is on.
  if (process.env.OUTREACH_ENABLED === 'true') {
    const recentOutreach = await prisma.outreachLog.count({
      where: { sentAt: { gt: new Date(now - 24 * HOURS) } },
    })
    checks.outreachLast24h = recentOutreach
    if (recentOutreach === 0) breaches.push('OUTREACH_ENABLED is on but no outreach emails were sent in 24 hours.')
  } else {
    checks.outreach = 'disabled (OUTREACH_ENABLED not true)'
  }

  // 6. Finance (Agent 8): delivered orders past their hold window must have a
  // payout, an open issue, or be legitimately waiting on the Payoneer rail.
  const payoutCandidates = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      deliveredAt: { not: null, lt: new Date(now - TRUSTED_HOLD_MS) },
      payout: null,
      stripePaymentId: { not: null },
    },
    select: { id: true, sellerId: true, deliveredAt: true },
    take: 50,
  })
  let overduePayouts = 0
  for (const o of payoutCandidates) {
    if (!o.deliveredAt) continue
    if (await orderHasOpenIssue(o.id)) continue
    const trusted = await isSellerTrusted(o.sellerId)
    const hold = trusted ? TRUSTED_HOLD_MS : PROBATION_HOLD_MS
    if (o.deliveredAt.getTime() + hold > now) continue
    const seller = await prisma.seller.findUnique({ where: { id: o.sellerId }, select: { payoutRail: true } })
    if (seller?.payoutRail === 'PAYONEER') continue // awaiting rail activation by design
    overduePayouts++
  }
  checks.overdueStripePayouts = overduePayouts
  if (overduePayouts > 0) breaches.push(`${overduePayouts} delivered order(s) past their hold window with no payout and no open dispute -- release-payouts may be failing.`)

  // 7. Compliance: certificate review queue must not silently rot.
  const staleCertificates = await prisma.productCertificate.count({
    where: { status: 'PENDING', createdAt: { lt: new Date(now - 48 * HOURS) } },
  })
  checks.staleCertificates = staleCertificates
  if (staleCertificates > 0) breaches.push(`${staleCertificates} certificate document(s) awaiting review for over 48 hours.`)

  // Record the run honestly, breaches and all.
  await prisma.agentLog.create({
    data: {
      agentName: 'agent-watchdog',
      action: 'hourly-check',
      status: breaches.length === 0 ? 'success' : 'breaches-found',
      details: { checks, breaches },
    },
  })

  if (breaches.length > 0) {
    await sendAlert(`${breaches.length} agent dut${breaches.length === 1 ? 'y' : 'ies'} breached`, breaches)
  }

  return NextResponse.json({ ok: true, breaches: breaches.length, checks })
}
