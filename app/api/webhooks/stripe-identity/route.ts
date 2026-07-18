import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { constructIdentityEvent, statusFromEventType } from '@/lib/identity';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Stripe Identity webhook. Stripe tells us the outcome of a seller's document
// check; the hourly onboarding agent (app/api/cron/review-applications) then
// approves, holds, or rejects on the next pass.
//
// We never receive the document itself -- only the verdict.
//
// Configure in the Stripe dashboard:
// endpoint: https://velorcommerce.store/api/webhooks/stripe-identity
// events: identity.verification_session.verified
// identity.verification_session.requires_input
// identity.verification_session.processing
// identity.verification_session.canceled
// then put the signing secret in STRIPE_IDENTITY_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

// The raw body is required: any parsing breaks the signature check.
const rawBody = await req.text();

let event;
  try {
    event = constructIdentityEvent(rawBody, signature);
  } catch (err) {
    // An invalid signature means this did not come from Stripe. Never act on it.
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Invalid signature' },
    { status: 400 }
    );
  }

const status = statusFromEventType(event.type);
  if (!status) {
    // An event type we do not act on. Acknowledge so Stripe stops retrying.
  return NextResponse.json({ received: true, ignored: event.type });
  }

const session = event.data.object as { id: string; metadata?: Record<string, string> | null };
  const applicationId = session.metadata?.applicationId;
  if (!applicationId) {
    return NextResponse.json({ received: true, ignored: 'no applicationId in metadata' });
  }

const application = await prisma.sellerApplication.findUnique({ where: { id: applicationId } });
  if (!application) {
    return NextResponse.json({ received: true, ignored: 'unknown application' });
  }

// Only ever move an application's verification forward from the session we
// ourselves created. A stale session must not overwrite a newer verdict.
if (application.verificationSessionId && application.verificationSessionId !== session.id) {
  return NextResponse.json({ received: true, ignored: 'superseded session' });
}

await prisma.sellerApplication.update({
  where: { id: applicationId },
  data: {
    verificationStatus: status,
    verifiedAt: status === 'VERIFIED' ? new Date() : null,
    verificationNotes:
      status === 'FAILED'
    ? 'Stripe Identity could not verify the document. The seller may retry.'
      : null,
  },
});

await prisma.agentLog.create({
  data: {
    agentName: 'seller-onboarding',
    action: 'identity_webhook',
    status: 'success',
    details: { applicationId, verificationStatus: status, eventType: event.type },
  },
});

// Normally a VERIFIED result here is picked up by the next hourly cron pass,
// which approves the (still-PENDING) application. If a human already
// approved this application before verification finished, the cron will
// never look at an already-APPROVED row again -- so tell the director
// directly instead of relying on the cron to notice.
if (status === 'VERIFIED' && application.status === 'APPROVED') {
  try {
    await sendEmail({
      to: 'willsinclair144@gmail.com',
      subject: `Identity verified: ${application.businessName}`,
      html: `<p>${application.businessName} (${application.contactEmail}) has now completed Stripe identity verification.</p>
      <p>This seller was approved on ${application.reviewedAt ? new Date(application.reviewedAt).toLocaleString('en-GB') : 'an earlier date'} before their verification finished. Their identity is now confirmed.</p>`,
    });
  } catch {
    // Best-effort notification; never fail the webhook over an email error.
  }
}

return NextResponse.json({ received: true, applicationId, verificationStatus: status });
}
