import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { sendEmail, buildOutreachEmail } from '@/lib/email';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

const MAX_OUTREACH_PER_PROSPECT = 3;
const VALID_EMAIL_TYPES = ['initial', 'followup1', 'followup2'] as const;
type OutreachEmailType = typeof VALID_EMAIL_TYPES[number];

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { prospectId, emailType } = body;

  if (!prospectId || !emailType) {
    return NextResponse.json({ error: 'prospectId and emailType are required' }, { status: 400 });
  }

  if (!VALID_EMAIL_TYPES.includes(emailType as OutreachEmailType)) {
    return NextResponse.json(
      { error: `emailType must be one of: ${VALID_EMAIL_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const prospect = await prisma.sellerProspect.findUnique({
    where: { id: String(prospectId) },
    include: { outreachLogs: true },
  });

  if (!prospect) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  }

  if (!prospect.email) {
    return NextResponse.json({ error: 'Prospect has no email address' }, { status: 400 });
  }

  if (prospect.outreachLogs.length >= MAX_OUTREACH_PER_PROSPECT) {
    return NextResponse.json(
      { error: `Maximum outreach limit (${MAX_OUTREACH_PER_PROSPECT}) reached for this prospect` },
      { status: 400 }
    );
  }

  const alreadySent = prospect.outreachLogs.some(log => log.emailType === emailType);
  if (alreadySent) {
    return NextResponse.json(
      { error: `Email type '${emailType}' has already been sent to this prospect` },
      { status: 400 }
    );
  }

  const { subject, html } = buildOutreachEmail({
    prospect: {
      name: prospect.name,
      platform: prospect.platform,
      storeUrl: prospect.storeUrl,
      category: prospect.category,
      sellerType: prospect.sellerType as 'individual' | 'small_business' | 'brand',
    },
    emailType: emailType as OutreachEmailType,
  });

  await sendEmail({ to: prospect.email, subject, html });

  const [log] = await Promise.all([
    prisma.outreachLog.create({
      data: {
        prospectId: prospect.id,
        emailType,
        subject,
      },
    }),
    prisma.sellerProspect.update({
      where: { id: prospect.id },
      data: { status: 'contacted' },
    }),
  ]);
  await prisma.agentLog.create({
    data: {
      agentName: 'outreach',
      action: 'email_sent',
      status: 'success',
      targetId: prospect.id,
      details: { emailType, prospectId: prospect.id },
    },
  });


  return NextResponse.json({ success: true, logId: log.id, subject }, { status: 201 });
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const prospectId = searchParams.get('prospectId');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = 50;

  const where: Record<string, unknown> = {};
  if (prospectId) where.prospectId = prospectId;

  const [logs, total] = await Promise.all([
    prisma.outreachLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { prospect: { select: { id: true, name: true, platform: true } } },
    }),
    prisma.outreachLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize });
}
