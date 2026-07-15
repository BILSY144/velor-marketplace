import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { buildOutreachEmail } from '@/lib/outreachEmail';
import { langForCountry } from '@/lib/outreachI18n';
import { requireCronSecret } from '@/lib/cronAuth';

const MAX_PER_RUN = Number(process.env.OUTREACH_MAX_PER_RUN) || 30;
const MONITOR = process.env.MONITOR_EMAIL || 'willsinclair144@gmail.com';
const SELLER_FROM = 'Velor Seller Team <noreply@velorcommerce.store>';
const FOLLOWUP1_DELAY_MS = 3 * 86_400_000;
const FOLLOWUP2_DELAY_MS = 5 * 86_400_000;

type SellerTypeStr = 'individual' | 'brand' | 'multiplier';
function safeSellerType(raw: string): SellerTypeStr {
  // 'multiplier' must survive: it routes the prospect to the English
  // partnership pitch in lib/outreachEmail.ts instead of the maker copy.
  return raw === 'brand' ? 'brand' : raw === 'multiplier' ? 'multiplier' : 'individual';
}

function unsub(email: string | null): string {
  return 'https://velorcommerce.store/unsubscribe?u=' + Buffer.from(email || '', 'utf8').toString('base64url');
}

// Prospect shape we need. Kept loose because SellerProspect.country is free-text
// on some scout sources (eBay/Etsy) and an ISO-2 market code on others.
interface ProspectRow {
  id: string;
  name: string;
  platform: string;
  storeUrl: string;
  category: string;
  sellerType: string;
  country: string | null;
  email: string | null;
}

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  if (process.env.OUTREACH_ENABLED === 'false') {
    return NextResponse.json({ ok: true, skipped: 'outreach disabled' });
  }

  let initialSent = 0, followup1Sent = 0, followup2Sent = 0;
  const errors: string[] = [];
  // Distribution of languages actually sent this run, for the director briefing.
  const byLang: Record<string, number> = {};

  async function sendTo(prospect: ProspectRow, emailType: 'initial' | 'followup1' | 'followup2') {
    const { subject, html, lang } = buildOutreachEmail({
      prospect: {
        name: prospect.name,
        platform: prospect.platform,
        storeUrl: prospect.storeUrl,
        category: prospect.category,
        sellerType: safeSellerType(prospect.sellerType),
        country: prospect.country,
      },
      emailType,
      unsubscribeUrl: unsub(prospect.email),
      lang: langForCountry(prospect.country),
    });
    await sendEmail({ from: SELLER_FROM, to: prospect.email as string, subject, html, bcc: MONITOR });
    await prisma.outreachLog.create({ data: { prospectId: prospect.id, emailType, subject } });
    byLang[lang] = (byLang[lang] || 0) + 1;
  }

  // Stage 1: Initial outreach
  // qualified: true is the AI screening gate (lib/prospectQualify.ts, run by
  // /api/cron/qualify-prospects) -- a prospect must pass that check before it
  // is ever allowed to receive the first email. Unscreened (qualified: null)
  // and rejected (qualified: false) prospects are excluded, never guessed in.
  const newProspects = await prisma.sellerProspect.findMany({
    where: { email: { not: null }, status: 'prospected', outreachLogs: { none: {} }, qualified: true },
    orderBy: { score: 'desc' },
    take: MAX_PER_RUN,
  });
  for (const prospect of newProspects) {
    if (!prospect.email) continue;
    try {
      await sendTo(prospect as ProspectRow, 'initial');
      initialSent++;
    } catch (err) { errors.push(`initial -> ${prospect.id}: ${err instanceof Error ? err.message : 'error'}`); }
  }

  // Stage 2: Followup 1 (3+ days after initial)
  const budget1 = MAX_PER_RUN - initialSent;
  if (budget1 > 0) {
    const followup1Due = await prisma.sellerProspect.findMany({
      where: { email: { not: null }, status: 'prospected', qualified: true,
        outreachLogs: {
          some: { emailType: 'initial', sentAt: { lte: new Date(Date.now() - FOLLOWUP1_DELAY_MS) } },
          none: { emailType: 'followup1' },
        } },
      orderBy: { score: 'desc' }, take: budget1,
    });
    for (const prospect of followup1Due) {
      if (!prospect.email) continue;
      try {
        await sendTo(prospect as ProspectRow, 'followup1');
        followup1Sent++;
      } catch (err) { errors.push(`followup1 -> ${prospect.id}: ${err instanceof Error ? err.message : 'error'}`); }
    }
  }

  // Stage 3: Followup 2 (5+ days after followup1) - marks status 'outreached'
  const budget2 = MAX_PER_RUN - initialSent - followup1Sent;
  if (budget2 > 0) {
    const followup2Due = await prisma.sellerProspect.findMany({
      where: { email: { not: null }, status: 'prospected', qualified: true,
        outreachLogs: {
          some: { emailType: 'followup1', sentAt: { lte: new Date(Date.now() - FOLLOWUP2_DELAY_MS) } },
          none: { emailType: 'followup2' },
        } },
      orderBy: { score: 'desc' }, take: budget2,
    });
    for (const prospect of followup2Due) {
      if (!prospect.email) continue;
      try {
        await sendTo(prospect as ProspectRow, 'followup2');
        await prisma.sellerProspect.update({ where: { id: prospect.id }, data: { status: 'outreached' } });
        followup2Sent++;
      } catch (err) { errors.push(`followup2 -> ${prospect.id}: ${err instanceof Error ? err.message : 'error'}`); }
    }
  }

  const totalSent = initialSent + followup1Sent + followup2Sent;
  const details: Record<string, string | number> = {
    initialSent, followup1Sent, followup2Sent, totalSent,
    errorCount: errors.length,
    errors: errors.slice(0, 10).join(' | '),
    languages: Object.entries(byLang).map(([l, n]) => `${l}:${n}`).join(', '),
  };
  await prisma.agentLog.create({
    data: { agentName: 'outreach-auto', action: 'outreach_run',
      status: errors.length === 0 ? 'success' : totalSent > 0 ? 'partial' : 'error',
      details },
  });
  return NextResponse.json({ ok: true, initialSent, followup1Sent, followup2Sent, totalSent, byLang, errors });
}
