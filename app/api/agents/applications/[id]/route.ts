import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isAuthorizedAdmin } from '@/lib/adminAuth';
import { approveApplication, rejectApplication, redactApplication } from '@/lib/provisionSeller';
import { findDuplicateApplicant } from '@/lib/duplicateApplicant';
import { translateBatch } from '@/lib/translate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  ) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

const application = await prisma.sellerApplication.findUnique({
  where: { id: (await params).id },
});

if (!application) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// Pulse detail view -- translate the seller's own-language storeDescription
// to English for whoever reviews the application next (William, 2026-08-05).
let translatedApplication = application;
if (application.storeDescription) {
  const { translations } = await translateBatch('en', [application.storeDescription]);
  translatedApplication = { ...application, storeDescription: translations[0] };
}

// Surface a possible-duplicate warning to whoever is reviewing this in
// Pulse (William, 2026-08-07 -- found two live "hushlume" storefronts
// approved same-day under two different emails; see
// lib/duplicateApplicant.ts for the full story). Additive and best-effort
// only: never blocks the detail view or the approve/reject action below --
// a human still makes the final call either way, this just makes sure they
// see the signal first instead of finding out from Pulse's Sellers list
// afterwards.
let duplicateWarning: string | null = null;
if (application.status === 'PENDING') {
  try {
    const duplicate = await findDuplicateApplicant({
      businessName: application.businessName,
      contactEmail: application.contactEmail,
      shippingStreet1: application.shippingStreet1,
      shippingZip: application.shippingZip,
      shippingPhone: application.shippingPhone,
    }, application.id);
    duplicateWarning = duplicate?.reason ?? null;
  } catch {
    // Best-effort -- never let this check block the detail view loading.
  }
}

return NextResponse.json({ application: redactApplication(translatedApplication), duplicateWarning });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  ) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

const body = await request.json();
  const { action, reason } = body;

if (!action || !['approve', 'reject'].includes(action)) {
  return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
}

const application = await prisma.sellerApplication.findUnique({
  where: { id: (await params).id },
});

if (!application) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

if (application.status !== 'PENDING') {
  return NextResponse.json(
    { error: `Cannot ${action} an application with status ${application.status}` },
    { status: 400 }
    );
}

if (action === 'reject' && !reason) {
  return NextResponse.json({ error: 'reason is required for rejection' }, { status: 400 });
}

// Bearer-token calls (the Pulse mobile dashboard) have no NextAuth session to
// credit -- fall back to a fixed label for those. A real NextAuth admin
// session (browsing the site directly) is still credited by email exactly
// as before.
const session = await auth();
  const reviewerEmail = (session?.user as { email?: string } | undefined)?.email ?? 'admin (pulse)';

// Both branches go through the same helpers the 24-hour review cron uses, so
// a human decision and an automated decision provision the account and send
// the emails identically.
try {
  const updated =
    action === 'approve'
  ? await approveApplication(application, reviewerEmail)
    : await rejectApplication(application, String(reason), reviewerEmail);
  return NextResponse.json({ application: redactApplication(updated) });
} catch (err) {
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Review failed' },
    { status: 400 }
    );
}
}
