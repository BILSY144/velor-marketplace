import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { sendEmail, buildSellerApprovedEmail, buildSellerRejectedEmail } from '@/lib/email';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const application = await prisma.sellerApplication.findUnique({
    where: { id: params.id },
  });

  if (!application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ application });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, reason } = body;

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const application = await prisma.sellerApplication.findUnique({
    where: { id: params.id },
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

  const reviewerEmail = (session.user as { email?: string }).email ?? 'admin';
  const now = new Date();

  if (action === 'approve') {
    const updated = await prisma.sellerApplication.update({
      where: { id: params.id },
      data: { status: 'APPROVED', reviewedAt: now, reviewedBy: reviewerEmail },
    });

    const { subject, html } = buildSellerApprovedEmail({
      sellerName: application.contactName,
      storeName: application.businessName,
    });
    await sendEmail({ to: application.contactEmail, subject, html });

    return NextResponse.json({ application: updated });
  }

  if (action === 'reject') {
    if (!reason) {
      return NextResponse.json({ error: 'reason is required for rejection' }, { status: 400 });
    }

    const updated = await prisma.sellerApplication.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectionReason: String(reason).trim(),
        reviewedAt: now,
        reviewedBy: reviewerEmail,
      },
    });

    const { subject, html } = buildSellerRejectedEmail({
      contactName: application.contactName,
      businessName: application.businessName,
      reason: String(reason).trim(),
    });
    await sendEmail({ to: application.contactEmail, subject, html });

    return NextResponse.json({ application: updated });
  }
}