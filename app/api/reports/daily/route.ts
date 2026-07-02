import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const REPORT_RECIPIENT = 'willsinclair144@gmail.com';

function buildDailyReportHtml(d: {
  date: string;
  applications: { id: string; businessName: string; contactEmail: string; contactName: string; status: string; country: string | null; productCategories: string[]; createdAt: Date }[];
  prospects: { id: string; name: string; platform: string; storeUrl: string; email: string | null; category: string; score: number; status: string; sellerType: string; country: string | null; createdAt: Date }[];
  outreachLogs: { id: string; prospectId: string; emailType: string; subject: string; sentAt: Date }[];
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px;color:#666;font-size:13px;white-space:nowrap">${label}</td><td style="padding:6px 12px;font-size:13px">${value}</td></tr>`;

  const sectionHeader = (title: string, count: number) =>
    `<h2 style="margin:32px 0 8px;font-size:16px;color:#1a1a1a;border-bottom:2px solid #e5e7eb;padding-bottom:8px">${title} <span style="font-size:13px;color:#6b7280;font-weight:400">(${count} today)</span></h2>`;

  const applicationRows = d.applications.length
    ? d.applications.map(a => `
      <table style="width:100%;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:12px;border-collapse:collapse">
        <tbody>
          ${row('ID', a.id)}
          ${row('Business', a.businessName)}
          ${row('Contact', `${a.contactName} &lt;${a.contactEmail}&gt;`)}
          ${row('Status', a.status)}
          ${row('Country', a.country ?? 'Unknown')}
          ${row('Categories', a.productCategories.join(', '))}
          ${row('Received', a.createdAt.toISOString())}
        </tbody>
      </table>`).join('')
    : '<p style="color:#6b7280;font-size:13px">No new applications in the last 24 hours.</p>';

  const prospectRows = d.prospects.length
    ? d.prospects.map(p => `
      <table style="width:100%;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:12px;border-collapse:collapse">
        <tbody>
          ${row('ID', p.id)}
          ${row('Name', p.name)}
          ${row('Platform', p.platform)}
          ${row('Store', `<a href="${p.storeUrl}" style="color:#2563eb">${p.storeUrl}</a>`)}
          ${row('Email', p.email ?? 'Not captured')}
          ${row('Category', p.category)}
          ${row('Score', String(p.score))}
          ${row('Type', p.sellerType)}
          ${row('Status', p.status)}
          ${row('Country', p.country ?? 'Unknown')}
          ${row('Found', p.createdAt.toISOString())}
        </tbody>
      </table>`).join('')
    : '<p style="color:#6b7280;font-size:13px">No new prospects found in the last 24 hours.</p>';

  const outreachRows = d.outreachLogs.length
    ? d.outreachLogs.map(o => `
      <table style="width:100%;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:12px;border-collapse:collapse">
        <tbody>
          ${row('ID', o.id)}
          ${row('Prospect ID', o.prospectId)}
          ${row('Type', o.emailType)}
          ${row('Subject', o.subject)}
          ${row('Sent', o.sentAt.toISOString())}
        </tbody>
      </table>`).join('')
    : '<p style="color:#6b7280;font-size:13px">No outreach sent in the last 24 hours.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Velor Daily Agent Report</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#fff;color:#1a1a1a">
  <div style="background:#1a1a1a;padding:20px 24px;border-radius:8px;margin-bottom:28px">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">Velor Marketplace</h1>
    <p style="margin:4px 0 0;color:#9ca3af;font-size:13px">Daily Agent Report — ${d.date}</p>
  </div>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:flex;gap:24px">
    <div style="text-align:center;flex:1">
      <div style="font-size:28px;font-weight:700;color:#1a1a1a">${d.applications.length}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px">Applications</div>
    </div>
    <div style="text-align:center;flex:1">
      <div style="font-size:28px;font-weight:700;color:#1a1a1a">${d.prospects.length}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px">Prospects</div>
    </div>
    <div style="text-align:center;flex:1">
      <div style="font-size:28px;font-weight:700;color:#1a1a1a">${d.outreachLogs.length}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px">Outreach Sent</div>
    </div>
  </div>

  ${sectionHeader('Seller Applications', d.applications.length)}
  ${applicationRows}

  ${sectionHeader('New Prospects', d.prospects.length)}
  ${prospectRows}

  ${sectionHeader('Outreach Activity', d.outreachLogs.length)}
  ${outreachRows}

  <p style="margin-top:40px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px">
    Sent automatically at 07:00 UTC by Velor Marketplace agent system. Do not reply to this email.
  </p>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [applications, prospects, outreachLogs] = await Promise.all([
      prisma.sellerApplication.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          businessName: true,
          contactEmail: true,
          contactName: true,
          status: true,
          country: true,
          productCategories: true,
          createdAt: true,
        },
      }),
      prisma.sellerProspect.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          platform: true,
          storeUrl: true,
          email: true,
          category: true,
          score: true,
          status: true,
          sellerType: true,
          country: true,
          createdAt: true,
        },
      }),
      prisma.outreachLog.findMany({
        where: { sentAt: { gte: since } },
        orderBy: { sentAt: 'desc' },
        select: {
          id: true,
          prospectId: true,
          emailType: true,
          subject: true,
          sentAt: true,
        },
      }),
    ]);

    const date = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = buildDailyReportHtml({ date, applications, prospects, outreachLogs });
    const subject = `Velor Marketplace — Daily Agent Report (${date})`;

    await sendEmail({ to: REPORT_RECIPIENT, subject, html });

    return NextResponse.json({
      success: true,
      date,
      summary: {
        applications: applications.length,
        prospects: prospects.length,
        outreachLogs: outreachLogs.length,
      },
    });
  } catch (error) {
    console.error('[reports/daily]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}