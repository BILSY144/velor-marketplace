import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { approveApplication, rejectApplication } from '@/lib/provisionSeller';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const application = await prisma.sellerApplication.findUnique({
    where: { id: (await params).id },
  });

  if (!application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ application });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  const reviewerEmail = (session.user as { email?: string }).email ?? 'admin';

  // Both branches go through the same helpers the 24-hour review cron uses, so
  // a human decision and an automated decision provision the account and send
  // the emails identically.
  try {
    const updated =
      action === 'approve'
        ? await approveApplication(application, reviewerEmail)
        : await rejectApplication(application, String(reason), reviewerEmail);
    return NextResponse.json({ application: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Review failed' },
      { status: 400 }
    );
  }
}
