import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { approveApplication, rejectApplication } from '@/lib/provisionSeller';
import {
  screenApplication,
  hoursSince,
  APPLICATION_SLA_HOURS,
  APPLICATION_ESCALATE_AFTER_HOURS,
} from '@/lib/sellerApplicationReview';

export const dynamic = 'force-dynamic';

const SUPPORT_EMAIL = 'customerservice@velorcommerce.co.uk';
const AGENT = 'seller-onboarding';

// Seller Onboarding Agent, running hourly.
//
// Velor's published promise is a decision within 24 hours. This route is what
// makes that true rather than aspirational:
//
//   - Clear-cut applications (complete, compliant, known categories) are
//     approved immediately -- typically within the hour, not 24.
//   - Applications that objectively fail the published rules in
//     /legal/seller-rules (prohibited goods, missing photos, invalid email)
//     are rejected immediately with a specific reason.
//   - Anything the screener is not certain about is HELD and escalated to a
//     human by email once it passes APPLICATION_ESCALATE_AFTER_HOURS, which is
//     deliberately well inside the 24-hour deadline.
//
// LAW #1: this agent never auto-approves an application it could not fully
// screen just to make the deadline look met. A held application stays PENDING
// and a human is told about it. If one ever breaches the SLA, the breach is
// reported loudly rather than hidden.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const pending = await prisma.sellerApplication.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  let approved = 0;
  let rejected = 0;
  const held: { id: string; businessName: string; ageHours: number; reason: string }[] = [];
  const breached: { id: string; businessName: string; ageHours: number }[] = [];
  const errors: string[] = [];

  for (const app of pending) {
    const ageHours = hoursSince(app.createdAt, now);
    let result;
    try {
      result = screenApplication({
        businessName: app.businessName,
        contactName: app.contactName,
        contactEmail: app.contactEmail,
        storeDescription: app.storeDescription,
        website: app.website,
        productCategories: app.productCategories,
        sampleImages: app.sampleImages,
        country: app.country,
      });
    } catch (err) {
      errors.push(`screen ${app.id}: ${err instanceof Error ? err.message : 'error'}`);
      continue;
    }

    try {
      if (result.verdict === 'approve') {
        await approveApplication(app, AGENT);
        approved++;
      } else if (result.verdict === 'reject') {
        await rejectApplication(app, result.reason, AGENT);
        rejected++;
      } else {
        held.push({ id: app.id, businessName: app.businessName, ageHours: Math.round(ageHours), reason: result.reason });
        if (ageHours >= APPLICATION_SLA_HOURS) {
          breached.push({ id: app.id, businessName: app.businessName, ageHours: Math.round(ageHours) });
        }
      }
    } catch (err) {
      errors.push(`${result.verdict} ${app.id}: ${err instanceof Error ? err.message : 'error'}`);
    }
  }

  // Escalate held applications to a human, in time to still meet the promise.
  const needsHuman = held.filter((h) => h.ageHours >= APPLICATION_ESCALATE_AFTER_HOURS);
  if (needsHuman.length || breached.length) {
    const rows = needsHuman
      .map((h) => `<tr><td>${h.businessName}</td><td>${h.ageHours}h</td><td>${h.reason}</td></tr>`)
      .join('');
    const breachRows = breached
      .map((b) => `<tr><td>${b.businessName}</td><td><strong>${b.ageHours}h -- SLA BREACHED</strong></td></tr>`)
      .join('');
    const html = `
      <p>Seller applications need a human decision. Velor promises a decision within ${APPLICATION_SLA_HOURS} hours.</p>
      ${breachRows ? `<h3>Past the ${APPLICATION_SLA_HOURS}-hour promise</h3><table>${breachRows}</table>` : ''}
      ${rows ? `<h3>Held for review (escalated after ${APPLICATION_ESCALATE_AFTER_HOURS}h)</h3><table><tr><th>Business</th><th>Age</th><th>Why held</th></tr>${rows}</table>` : ''}
      <p>Review at https://velorcommerce.store/admin</p>`;
    try {
      await sendEmail({
        to: SUPPORT_EMAIL,
        subject: breached.length
          ? `URGENT: ${breached.length} seller application(s) past the ${APPLICATION_SLA_HOURS}h promise`
          : `${needsHuman.length} seller application(s) need a human decision`,
        html,
      });
    } catch (err) {
      errors.push(`escalation email: ${err instanceof Error ? err.message : 'error'}`);
    }
  }

  const details: Record<string, string | number> = {
    scanned: pending.length,
    approved,
    rejected,
    held: held.length,
    escalated: needsHuman.length,
    slaBreached: breached.length,
    slaHours: APPLICATION_SLA_HOURS,
    errorCount: errors.length,
    errors: errors.slice(0, 10).join(' | '),
  };

  await prisma.agentLog.create({
    data: {
      agentName: AGENT,
      action: 'review_applications',
      status: errors.length === 0 && breached.length === 0 ? 'success' : 'partial',
      details,
    },
  });

  return NextResponse.json({
    ok: true,
    scanned: pending.length,
    approved,
    rejected,
    held: held.length,
    slaBreached: breached.length,
    errors,
  });
}
