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
import { requireCronSecret } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';

const SUPPORT_EMAIL = 'customerservice@velorcommerce.co.uk';
const SELLER_FROM = 'Velor Seller Team <sellers@velorcommerce.store>';
const AGENT = 'seller-onboarding';

// Seller Onboarding Agent, hourly.
//
// IDENTITY MODEL CHANGED 2026-07-21 (William: "same process as payouts...
// we dont require photo, just id verification like payouts"). Velor no
// longer runs its own photo-ID (Stripe Identity) step at application.
// Identity assurance is the payout rail's own regulated KYC: Stripe
// Connect verifies each seller's personal identity at payout onboarding
// (name/DOB/address, escalating to photo ID only where Stripe must), and
// Payoneer runs its own KYC on its rail. The money stays protected
// regardless of what is approved here: app/api/cron/release-payouts
// refuses to move a penny to any seller whose payout account has not
// passed the rail's KYC (Stripe charges+payouts enabled / Payoneer payee
// ACTIVE). Approval therefore needs only the rules screening:
//   1. Screen against the published rules (/legal/seller-rules). A
//      prohibited or plainly incomplete application is rejected
//      immediately; an ambiguous one holds for a human.
//   2. Screening passed? Approve and provision. The seller proves their
//      identity to Stripe/Payoneer when they set up payouts -- exactly
//      once, exactly where the money moves.
//
// LAW #1: this agent never approves an application it could not fully
// screen, and never claims an identity check happened here -- it happens
// on the payout rail, and the payout cron enforces it.
export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req);
  if (authError) return authError;

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

  const hold = (app: { id: string; businessName: string; createdAt: Date }, reason: string) => {
    const ageHours = Math.round(hoursSince(app.createdAt, now));
    held.push({ id: app.id, businessName: app.businessName, ageHours, reason });
    // Only a VERIFIED application is on Velor's 24-hour clock. We cannot breach a
    // promise about our own decision speed while waiting on the seller's camera.
  };

  for (const app of pending) {
    // --- 1. Rules screening first ---------------------------------------
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

    if (result.verdict === 'reject') {
      try {
        await rejectApplication(app, result.reason, AGENT);
        rejected++;
      } catch (err) {
        errors.push(`reject ${app.id}: ${err instanceof Error ? err.message : 'error'}`);
      }
      continue;
    }

    if (result.verdict === 'hold') {
      hold(app, result.reason);
      continue;
    }

    // --- 2. Screening passed: approve. Identity is proven on the payout
    // rail (Stripe Connect / Payoneer KYC) and enforced by release-payouts
    // before any money moves.
    const ageHours = hoursSince(app.createdAt, now);
    try {
      await approveApplication(app, AGENT);
      approved++;
    } catch (err) {
      errors.push(`approve ${app.id}: ${err instanceof Error ? err.message : 'error'}`);
      if (ageHours >= APPLICATION_SLA_HOURS) {
        breached.push({ id: app.id, businessName: app.businessName, ageHours: Math.round(ageHours) });
      }
    }
  }

  // Escalate to a human, in time to still keep the promise.
  const needsHuman = held.filter((h) => h.ageHours >= APPLICATION_ESCALATE_AFTER_HOURS);
  if (needsHuman.length || breached.length) {
    const rows = needsHuman
      .map((h) => `<tr><td>${h.businessName}</td><td>${h.ageHours}h</td><td>${h.reason}</td></tr>`)
      .join('');
    const breachRows = breached
      .map((b) => `<tr><td>${b.businessName}</td><td><strong>${b.ageHours}h since VERIFIED -- SLA BREACHED</strong></td></tr>`)
      .join('');
    const html = `
      <p>Seller applications need attention. Velor promises a decision within ${APPLICATION_SLA_HOURS} hours of a seller's verification completing.</p>
      ${breachRows ? `<h3>Past the ${APPLICATION_SLA_HOURS}-hour promise</h3><table>${breachRows}</table>` : ''}
      ${rows ? `<h3>Held (escalated after ${APPLICATION_ESCALATE_AFTER_HOURS}h)</h3><table><tr><th>Business</th><th>Age</th><th>Why held</th></tr>${rows}</table>` : ''}
      <p>Review at https://velorcommerce.store/admin</p>`;
    try {
      await sendEmail({
        to: SUPPORT_EMAIL,
        subject: breached.length
          ? `URGENT: ${breached.length} verified seller(s) past the ${APPLICATION_SLA_HOURS}h promise`
          : `${needsHuman.length} seller application(s) held`,
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
