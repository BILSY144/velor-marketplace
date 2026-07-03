import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, buildOutreachEmail } from '@/lib/email';

const MAX_PER_RUN = 25;
const MONITOR = process.env.MONITOR_EMAIL || 'willsinclair144@gmail.com';
const FOLLOWUP1_DELAY_MS = 3 * 86_400_000;
const FOLLOWUP2_DELAY_MS = 5 * 86_400_000;

type SellerTypeStr = 'individual' | 'brand';
function safeSellerType(raw: string): SellerTypeStr {
  return raw === 'brand' ? 'brand' : 'individual';
}

function unsub(email: string | null): string {
  return 'https://velorcommerce.store/unsubscribe?u=' + Buffer.from(email || '', 'utf8').toString('base64url');
}

export async function GET() {
  let initialSent = 0, followup1Sent = 0, followup2Sent = 0;
  const errors: string[] = [];

  // Stage 1: Initial outreach
  const newProspects = await prisma.sellerProspect.findMany({
    where: { email: { not: null }, status: 'prospected', outreachLogs: { none: {} } },
    orderBy: { score: 'desc' },
    take: MAX_PER_RUN,
  });
  for (const prospect of newProspects) {
    if (!prospect.email) continue;
    try {
      const { subject, html } = buildOutreachEmail({
        prospect: { name: prospect.name, platform: prospect.platform, storeUrl: prospect.storeUrl,
          category: prospect.category, sellerType: safeSellerType(prospect.sellerType) },
        emailType: 'initial',
        unsubscribeUrl: unsub(prospect.email),
      });
      await sendEmail({ to: prospect.email, subject, html, bcc: MONITOR });
      await prisma.outreachLog.create({ data: { prospectId: prospect.id, emailType: 'initial', subject } });
      initialSent++;
    } catch (err) { errors.push(`initial -> ${prospect.id}: ${err instanceof Error ? err.message : 'error'}`); }
  }

  // Stage 2: Followup 1 (3+ days after initial)
  const budget1 = MAX_PER_RUN - initialSent;
  if (budget1 > 0) {
    const followup1Due = await prisma.sellerProspect.findMany({
      where: { email: { not: null }, status: 'prospected',
        outreachLogs: {
          some: { emailType: 'initial', sentAt: { lte: new Date(Date.now() - FOLLOWUP1_DELAY_MS) } },
          none: { emailType: 'followup1' },
        } },
      orderBy: { score: 'desc' }, take: budget1,
    });
    for (const prospect of followup1Due) {
      if (!prospect.email) continue;
      try {
        const { subject, html } = buildOutreachEmail({
          prospect: { name: prospect.name, platform: prospect.platform, storeUrl: prospect.storeUrl,
            category: prospect.category, sellerType: safeSellerType(prospect.sellerType) },
          emailType: 'followup1',
          unsubscribeUrl: unsub(prospect.email),
        });
        await sendEmail({ to: prospect.email, subject, html, bcc: MONITOR });
        await prisma.outreachLog.create({ data: { prospectId: prospect.id, emailType: 'followup1', subject } });
        followup1Sent++;
      } catch (err) { errors.push(`followup1 -> ${prospect.id}: ${err instanceof Error ? err.message : 'error'}`); }
    }
  }

  // Stage 3: Followup 2 (5+ days after followup1) — marks status 'outreached'
  const budget2 = MAX_PER_RUN - initialSent - followup1Sent;
  if (budget2 > 0) {
    const followup2Due = await prisma.sellerProspect.findMany({
      where: { email: { not: null }, status: 'prospected',
        outreachLogs: {
          some: { emailType: 'followup1', sentAt: { lte: new Date(Date.now() - FOLLOWUP2_DELAY_MS) } },
          none: { emailType: 'followup2' },
        } },
      orderBy: { score: 'desc' }, take: budget2,
    });
    for (const prospect of followup2Due) {
      if (!prospect.email) continue;
      try {
        const { subject, html } = buildOutreachEmail({
          prospect: { name: prospect.name, platform: prospect.platform, storeUrl: prospect.storeUrl,
            category: prospect.category, sellerType: safeSellerType(prospect.sellerType) },
          emailType: 'followup2',
          unsubscribeUrl: unsub(prospect.email),
        });
        await sendEmail({ to: prospect.email, subject, html, bcc: MONITOR });
        await prisma.outreachLog.create({ data: { prospectId: prospect.id, emailType: 'followup2', subject } });
        await prisma.sellerProspect.update({ where: { id: prospect.id }, data: { status: 'outreached' } });
        followup2Sent++;
      } catch (err) { errors.push(`followup2 -> ${prospect.id}: ${err instanceof Error ? err.message : 'error'}`); }
    }
  }

  const totalSent = initialSent + followup1Sent + followup2Sent;
  await prisma.agentLog.create({
    data: { agentName: 'outreach-auto', action: 'outreach_run',
      status: errors.length === 0 ? 'success' : totalSent > 0 ? 'partial' : 'error',
      details: { initialSent, followup1Sent, followup2Sent, totalSent, errorCount: errors.length, errors: errors.slice(0, 10) } },
  });
  return NextResponse.json({ ok: true, initialSent, followup1Sent, followup2Sent, totalSent, errors });
}
