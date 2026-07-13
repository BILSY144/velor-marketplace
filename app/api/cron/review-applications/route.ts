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
import {
  createVerificationSession,
  isIdentityConfigured,
  isRestrictedForIdentity,
} from '@/lib/identity';
import { requireCronSecret } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';

const SUPPORT_EMAIL = 'customerservice@velorcommerce.co.uk';
const SELLER_FROM = 'Velor Seller Team <sellers@velorcommerce.store>';
const AGENT = 'seller-onboarding';

// Seller Onboarding Agent, hourly.
//
// Velor accepts NO seller without a verified government-issued identity
// document. The clock Velor publishes is "a decision within 24 hours of your
// verification completing" -- the 24 hours is ours to honour, the verification
// step belongs to the seller.
//
// Order of operations per pending application, and it matters:
//   1. Screen against the published rules (/legal/seller-rules). A prohibited
//      or plainly incomplete application is rejected immediately -- we do not
//      make someone photograph their passport for a listing we will refuse.
//   2. Restricted jurisdiction (China, Russia, Cuba, Iran, North Korea, Syria)?
//      Stripe Identity is legally barred from verifying them. HOLD, tell the
//      seller honestly why, and wait for Payoneer's own KYC rail.
//   3. No verification started? Create a Stripe Identity session and email the
//      seller the link. HOLD.
//   4. Verification VERIFIED? Approve, provision the account, email them.
//   5. Anything else (PROCESSING / FAILED / CANCELED)? HOLD.
//
// LAW #1: this agent never approves an unverified seller, and never approves an
// application it could not fully screen, however close the deadline is. A held
// application stays PENDING, a human is told, and an SLA breach is reported
// loudly rather than hidden.
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
  let verificationsStarted = 0;
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

    // --- 2. Restricted jurisdiction --------------------------------------
    if (isRestrictedForIdentity(app.country)) {
      if (app.verificationStatus !== 'RESTRICTED') {
        try {
          await prisma.sellerApplication.update({
            where: { id: app.id },
            data: {
              verificationStatus: 'RESTRICTED',
              verificationNotes: `Stripe Identity is not permitted to verify applicants from ${app.country}. Awaiting Payoneer KYC rail.`,
            },
          });
          await sendEmail({
            from: SELLER_FROM,
            to: app.contactEmail,
            subject: 'Your Velor application: an honest update',
            html: `<p>Hi ${app.contactName},</p>
              <p>Thank you for applying to sell on Velor. We want to be straight with you about where your application stands.</p>
              <p>Velor verifies every seller's identity before accepting them. Our verification provider is not permitted to verify applicants based in ${app.country}, so we cannot complete that step for you today. This is a restriction placed on us, not a judgement about you or your work.</p>
              <p>We are building a second verification route for exactly this reason. Your application stays open, and we will contact you the moment it is available. We will not ask you for money or documents in the meantime.</p>
              <p>&mdash; The Velor Seller Team</p>`,
          });
        } catch (err) {
          errors.push(`restricted ${app.id}: ${err instanceof Error ? err.message : 'error'}`);
        }
      }
      hold(app, `Restricted jurisdiction (${app.country}) -- Stripe Identity not permitted. Awaiting Payoneer KYC.`);
      continue;
    }

    // --- 3. Verification not started -------------------------------------
    if (app.verificationStatus === 'NOT_STARTED' || !app.verificationSessionId) {
      if (!isIdentityConfigured()) {
        hold(app, 'Identity verification is not configured (STRIPE_SECRET_KEY missing). No seller can be approved.');
        continue;
      }
      try {
        const { sessionId, url } = await createVerificationSession(app.id, app.contactEmail);
        await prisma.sellerApplication.update({
          where: { id: app.id },
          data: { verificationSessionId: sessionId, verificationStatus: 'PENDING' },
        });
        await sendEmail({
          from: SELLER_FROM,
          to: app.contactEmail,
          subject: 'One step left: verify your identity to sell on Velor',
          html: `<p>Hi ${app.contactName},</p>
            <p>Your application to sell on Velor looks good. One step remains: verifying your identity.</p>
            <p>Velor verifies every seller before accepting them. It protects buyers, and it protects honest sellers from being lumped in with the dishonest ones. It takes about two minutes and needs a government-issued ID.</p>
            <p><a href="${url}" style="display:inline-block;background:#FF6B00;color:#000;font-weight:800;text-decoration:none;padding:14px 30px;border-radius:8px;">Verify my identity</a></p>
            <p>Your documents go directly to Stripe, our verification provider. Velor never sees or stores them &mdash; we receive only a pass or fail.</p>
            <p>Once you have verified, we will make a decision on your application within 24 hours.</p>
            <p>&mdash; The Velor Seller Team</p>`,
        });
        verificationsStarted++;
      } catch (err) {
        errors.push(`identity ${app.id}: ${err instanceof Error ? err.message : 'error'}`);
      }
      hold(app, 'Identity verification link sent; waiting on the seller.');
      continue;
    }

    // --- 4. Verified: approve --------------------------------------------
    if (app.verificationStatus === 'VERIFIED') {
      const hoursSinceVerified = app.verifiedAt ? hoursSince(app.verifiedAt, now) : 0;
      try {
        await approveApplication(app, AGENT);
        approved++;
      } catch (err) {
        errors.push(`approve ${app.id}: ${err instanceof Error ? err.message : 'error'}`);
        // Only a verified application is on our 24-hour clock, so only a verified
        // application can breach it.
        if (hoursSinceVerified >= APPLICATION_SLA_HOURS) {
          breached.push({ id: app.id, businessName: app.businessName, ageHours: Math.round(hoursSinceVerified) });
        }
      }
      continue;
    }

    // --- 5. Everything else: hold ----------------------------------------
    hold(app, `Identity verification is ${app.verificationStatus}.`);
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
    verificationsStarted,
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
    verificationsStarted,
    held: held.length,
    slaBreached: breached.length,
    errors,
  });
}
