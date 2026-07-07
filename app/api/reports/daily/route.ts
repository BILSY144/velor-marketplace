import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const REPORT_RECIPIENT = 'willsinclair144@gmail.com';

function stat(label: string, value: string | number, sub?: string) {
  return `
    <div style="text-align:center;flex:1;padding:12px 8px">
      <div style="font-size:32px;font-weight:700;color:#1a1a1a;line-height:1">${value}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:.05em">${label}</div>
      ${sub ? `<div style="font-size:11px;color:#10b981;margin-top:2px">${sub}</div>` : ''}
    </div>`;
}

function section(title: string, body: string) {
  return `
    <div style="margin-bottom:28px">
      <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:8px">${title}</h2>
      ${body}
    </div>`;
}

function pill(text: string, color: string) {
  const colors: Record<string, string> = {
    green: 'background:#d1fae5;color:#065f46',
    yellow: 'background:#fef3c7;color:#92400e',
    red: 'background:#fee2e2;color:#991b1b',
    blue: 'background:#dbeafe;color:#1e40af',
    gray: 'background:#f3f4f6;color:#374151',
  };
  return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:500;${colors[color] ?? colors.gray}">${text}</span>`;
}

function statusPill(status: string) {
  const map: Record<string, [string, string]> = {
    PENDING: ['Pending', 'yellow'],
    APPROVED: ['Approved', 'green'],
    REJECTED: ['Rejected', 'red'],
    DISCOVERED: ['Discovered', 'blue'],
    CONTACTED: ['Contacted', 'yellow'],
    RESPONDED: ['Responded', 'green'],
    CONVERTED: ['Converted', 'green'],
    ARCHIVED: ['Archived', 'gray'],
  };
  const [label, color] = map[status] ?? [status, 'gray'];
  return pill(label, color);
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:5px 12px;color:#6b7280;font-size:12px;white-space:nowrap;width:110px">${label}</td>
    <td style="padding:5px 12px;color:#1a1a1a;font-size:12px">${value}</td>
  </tr>`;
}

function appCard(a: {
  businessName: string; contactName: string; contactEmail: string;
  status: string; country: string | null; productCategories: string[]; createdAt: Date;
}) {
  return `
    <table style="width:100%;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:10px;border-collapse:collapse">
      <thead><tr><td colspan="2" style="padding:8px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600">${a.businessName} &nbsp;${statusPill(a.status)}</td></tr></thead>
      <tbody>
        ${row('Contact', `${a.contactName} &lt;${a.contactEmail}&gt;`)}
        ${row('Country', a.country ?? 'Unknown')}
        ${row('Categories', a.productCategories.join(', ') || ' - ')}
        ${row('Received', new Date(a.createdAt).toLocaleDateString('en-GB', { day:'numeric',month:'short',year:'numeric' }))}
      </tbody>
    </table>`;
}

function prospectCard(p: {
  name: string; platform: string; storeUrl: string; email: string | null;
  category: string; score: number; status: string; sellerType: string; country: string | null; createdAt: Date;
}) {
  return `
    <table style="width:100%;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:10px;border-collapse:collapse">
      <thead><tr><td colspan="2" style="padding:8px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600">${p.name} &nbsp;${statusPill(p.status)}</td></tr></thead>
      <tbody>
        ${row('Platform', p.platform)}
        ${row('Store', `<a href="${p.storeUrl}" style="color:#2563eb">${p.storeUrl}</a>`)}
        ${row('Email', 'Not captured')}
        ${row('Category', p.category)}
        ${row('Type', p.sellerType)}
        ${row('Score', String(p.score))}
        ${row('Country', p.country ?? 'Unknown')}
        ${row('Discovered', new Date(p.createdAt).toLocaleDateString('en-GB', { day:'numeric',month:'short',year:'numeric' }))}
      </tbody>
    </table>`;
}

function funnelBar(label: string, value: number, total: number, color: string) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="color:#374151">${label}</span>
        <span style="color:#6b7280">${value} &nbsp;<span style="color:#9ca3af">(${pct}%)</span></span>
      </div>
      <div style="background:#f3f4f6;border-radius:4px;height:8px">
        <div style="background:${color};height:8px;border-radius:4px;width:${pct}%"></div>
      </div>
    </div>`;
}

function buildDailyReportHtml(d: {
  date: string;
  // Pipeline funnel - all time
  totalProspects: number;
  totalContacted: number;
  totalResponded: number;
  totalApplications: number;
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
  // Last 7 days
  newProspects7d: { id: string; name: string; platform: string; storeUrl: string; email: string | null; category: string; score: number; status: string; sellerType: string; country: string | null; createdAt: Date }[];
  newApplications7d: { id: string; businessName: string; contactEmail: string; contactName: string; status: string; country: string | null; productCategories: string[]; createdAt: Date }[];
  outreachLogs7d: { id: string; prospectId: string; emailType: string; subject: string; sentAt: Date }[];
  // Pending actions
  pendingApplications: { id: string; businessName: string; contactEmail: string; contactName: string; status: string; country: string | null; productCategories: string[]; createdAt: Date }[];
  uncontactedProspects: { id: string; name: string; platform: string; storeUrl: string; email: string | null; category: string; score: number; status: string; sellerType: string; country: string | null; createdAt: Date }[];
  // Agent activity
  agentLogs: { agentName: string; action: string; status: string; details: unknown; createdAt: Date }[];
  // Website traffic
  yesterdayViews: number;
  dayBeforeViews: number;
  topPagesRaw: { path: string; _count: { path: number } }[];
  // Business snapshot (other information)
  totalSellersCount: number;
  ordersLast24hCount: number;
  revenueLast24hResult: { _sum: { subtotal: number | null } };
  pendingReturnsCount: number;
  disputedOrdersCount: number;
}): string {

  // Pipeline funnel
  const funnelHtml = `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px">
      ${funnelBar('Prospects Discovered', d.totalProspects, d.totalProspects, '#6366f1')}
      ${funnelBar('Contacted via Outreach', d.totalContacted, d.totalProspects, '#3b82f6')}
      ${funnelBar('Responded / Engaged (not tracked yet)', d.totalResponded, d.totalProspects, '#10b981')}
      ${funnelBar('Applications Submitted', d.totalApplications, d.totalProspects, '#f59e0b')}
      ${funnelBar('Approved as Sellers', d.totalApproved, d.totalApplications || 1, '#10b981')}
    </div>`;

  // Stats bar
  const statsHtml = `
    <div style="display:flex;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;flex-wrap:wrap">
      ${stat('Total Prospects', d.totalProspects)}
      ${stat('Contacted', d.totalContacted)}
      ${stat('Applied', d.totalApplications)}
      ${stat('Approved', d.totalApproved, d.totalApplications > 0 ? `${Math.round((d.totalApproved/d.totalApplications)*100)}% rate` : undefined)}
      ${stat('Pending Review', d.totalPending, d.totalPending > 0 ? 'Needs action' : undefined)}
    </div>`;

  // 7-day activity
  const newAppsHtml = d.newApplications7d.length > 0
    ? d.newApplications7d.map(appCard).join('')
    : `<p style="color:#6b7280;font-size:13px;margin:0;padding:12px 0">No new applications in the last 7 days.</p>`;

  const newProspectsHtml = d.newProspects7d.length > 0
    ? d.newProspects7d.map(prospectCard).join('')
    : `<p style="color:#6b7280;font-size:13px;margin:0;padding:12px 0">No new prospects discovered in the last 7 days.</p>`;

  const outreachHtml = d.outreachLogs7d.length > 0
    ? `<table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#f9fafb">
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Type</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Subject</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Sent</th>
        </tr></thead>
        <tbody>
          ${d.outreachLogs7d.map(l => `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">${pill(l.emailType, 'blue')}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#374151">${l.subject}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280">${new Date(l.sentAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
    : `<p style="color:#6b7280;font-size:13px;margin:0;padding:12px 0">No outreach sent in the last 7 days.</p>`;

  // Pending actions
  const pendingAppsHtml = d.pendingApplications.length > 0
    ? `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:12px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#92400e">${d.pendingApplications.length} application${d.pendingApplications.length > 1 ? 's' : ''} awaiting your review</p>
        ${d.pendingApplications.map(a => `<div style="font-size:12px;color:#92400e;padding:2px 0">- ${a.businessName}  -  ${a.contactEmail}</div>`).join('')}
      </div>`
    : '';

  const uncontactedHtml = d.uncontactedProspects.length > 0
    ? `<div style="background:#dbeafe;border:1px solid #3b82f6;border-radius:8px;padding:12px 16px;margin-bottom:12px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1e40af">${d.uncontactedProspects.length} prospect${d.uncontactedProspects.length > 1 ? 's' : ''} discovered but not yet contacted</p>
        ${d.uncontactedProspects.slice(0, 5).map(p => `<div style="font-size:12px;color:#1e40af;padding:2px 0">- ${p.name}  -  ${p.platform} (score: ${p.score})</div>`).join('')}
        ${d.uncontactedProspects.length > 5 ? `<div style="font-size:12px;color:#1e40af;padding:2px 0">... and ${d.uncontactedProspects.length - 5} more</div>` : ''}
      </div>`
    : '';

  const pendingActionsHtml = (pendingAppsHtml || uncontactedHtml)
    ? (pendingAppsHtml + uncontactedHtml)
    : `<p style="color:#6b7280;font-size:13px;margin:0;padding:12px 0">No pending actions. Pipeline is clear.</p>`;

  // Agent activity
  const agentHtml = d.agentLogs.length > 0
    ? `<table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#f9fafb">
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Agent</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Action</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Result</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Time</th>
        </tr></thead>
        <tbody>
          ${d.agentLogs.map(l => `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-weight:500;color:#374151">${l.agentName}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#374151">${l.action}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">${pill(l.status, l.status === 'SUCCESS' ? 'green' : l.status === 'FAILURE' ? 'red' : 'yellow')}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280">${new Date(l.createdAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
    : `<p style="color:#6b7280;font-size:13px;margin:0;padding:12px 0">No agent activity in the last 24 hours.</p>`;

  // Website traffic - yesterday vs day before
  const viewsDelta = d.yesterdayViews - d.dayBeforeViews;
  const viewsDeltaPercent = d.dayBeforeViews > 0 ? Math.round((viewsDelta / d.dayBeforeViews) * 100) : null;
  const viewsGrowing = d.yesterdayViews > d.dayBeforeViews;
  const topPages = d.topPagesRaw.map(p => ({ path: p.path, views: p._count.path }));
  const trafficHtml = `
    <div style="display:flex;margin:0 0 16px">
      ${stat('Views Yesterday', d.yesterdayViews)}
      ${stat('Views Day Before', d.dayBeforeViews)}
      ${stat(viewsGrowing ? 'Up' : 'Down', viewsDeltaPercent !== null ? `${viewsDeltaPercent}%` : 'n/a')}
    </div>
    ${topPages.length > 0 ? `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#f9fafb">
        <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Page</th>
        <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb">Views</th>
      </tr></thead>
      <tbody>
        ${topPages.map(p => `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#374151">${p.path}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#374151">${p.views}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : `<p style="color:#6b7280;font-size:13px;margin:0;padding:12px 0">No pageviews recorded yesterday.</p>`}`;

  // Business snapshot - other information
  const revenueLast24h = ((d.revenueLast24hResult._sum.subtotal || 0) / 100).toFixed(2);
  const businessHtml = `
    <div style="display:flex;flex-wrap:wrap;margin:0 0 4px">
      ${stat('Total Sellers', d.totalSellersCount)}
      ${stat('Orders (24h)', d.ordersLast24hCount)}
      ${stat('Revenue (24h)', `GBP ${revenueLast24h}`)}
      ${stat('Pending Returns', d.pendingReturnsCount)}
      ${stat('Disputed Orders', d.disputedOrdersCount)}
    </div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#fff;color:#1a1a1a">

  <div style="background:#1a1a1a;padding:20px 24px;border-radius:8px;margin-bottom:28px">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">Velor Marketplace</h1>
    <p style="margin:4px 0 0;color:#9ca3af;font-size:13px">Daily Report - ${d.date} - Live Data</p>
  </div>

  ${statsHtml}

  ${section('Pipeline Funnel (All Time)', funnelHtml)}
  ${section('Pending Actions', pendingActionsHtml)}
  ${section('New Applications  -  Last 7 Days', newAppsHtml)}
  ${section('New Prospects Discovered  -  Last 7 Days', newProspectsHtml)}
  ${section('Outreach Sent  -  Last 7 Days', outreachHtml)}
  ${section('Agent Activity  -  Last 24 Hours', agentHtml)}
  ${section('Website Traffic  -  Yesterday', trafficHtml)}
  ${section('Business Snapshot  -  Other Information', businessHtml)}

  <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:8px">
    <p style="font-size:11px;color:#9ca3af;margin:0">Velor Marketplace - Automated Report - ${d.date}</p>
  </div>

</body></html>`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // DST-safe gate: only actually generate + send once it is truly 08:00 in the UK.
  // Vercel Cron runs in UTC and does not shift for BST/GMT, so this route is
  // invoked hourly (06:00-09:00 UTC) and self-selects the correct hour year-round.
  const forceRun = req.nextUrl.searchParams.get('force') === 'true';
  const londonHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hour12: false }).format(new Date()));
  if (!forceRun && londonHour !== 8) {
    return NextResponse.json({ ok: true, skipped: 'not 08:00 Europe/London yet', londonHour });
  }

  try {
    const now = new Date();
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(now);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
    yesterdayStart.setUTCHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setUTCHours(23, 59, 59, 999);
    const dayBeforeStart = new Date(yesterdayStart);
    dayBeforeStart.setUTCDate(dayBeforeStart.getUTCDate() - 1);
    const dayBeforeEnd = new Date(dayBeforeStart);
    dayBeforeEnd.setUTCHours(23, 59, 59, 999);

    const [
      totalProspectsCount,
      totalContactedCount,
      totalRespondedCount,
      totalApplicationsCount,
      totalApprovedCount,
      totalRejectedCount,
      totalPendingCount,
      newProspects7d,
      newApplications7d,
      outreachLogs7d,
      pendingApplications,
      uncontactedProspects,
      agentLogs,
      yesterdayViews,
      dayBeforeViews,
      topPagesRaw,
      totalSellersCount,
      ordersLast24hCount,
      revenueLast24hResult,
      pendingReturnsCount,
      disputedOrdersCount,
    ] = await Promise.all([
      // All-time funnel counts
      prisma.sellerProspect.count(),
      prisma.sellerProspect.count({ where: { outreachLogs: { some: {} } } }), // real signal: has received at least one outreach email (status enum values below were never actually written by any code path)
      prisma.sellerProspect.count({ where: { status: { in: ['RESPONDED', 'CONVERTED'] } } }), // NOTE: no code path ever sets these values -- there is no reply-tracking system yet, so this is always 0. Labelled as 'not tracked' in the email rather than faked.
      prisma.sellerApplication.count(),
      prisma.sellerApplication.count({ where: { status: 'APPROVED' } }),
      prisma.sellerApplication.count({ where: { status: 'REJECTED' } }),
      prisma.sellerApplication.count({ where: { status: 'PENDING' } }),

      // Last 7 days activity
      prisma.sellerProspect.findMany({
        where: { createdAt: { gte: since7d } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, platform: true, storeUrl: true, email: true, category: true, score: true, status: true, sellerType: true, country: true, createdAt: true },
      }),
      prisma.sellerApplication.findMany({
        where: { createdAt: { gte: since7d } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, businessName: true, contactEmail: true, contactName: true, status: true, country: true, productCategories: true, createdAt: true },
      }),
      prisma.outreachLog.findMany({
        where: { sentAt: { gte: since7d } },
        orderBy: { sentAt: 'desc' },
        select: { id: true, prospectId: true, emailType: true, subject: true, sentAt: true },
      }),

      // Pending actions
      prisma.sellerApplication.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, businessName: true, contactEmail: true, contactName: true, status: true, country: true, productCategories: true, createdAt: true },
      }),
      prisma.sellerProspect.findMany({
        where: { status: 'prospected', outreachLogs: { none: {} } }, // real 'never contacted' signal, matching the exact predicate outreach-auto uses to pick who to email next ('DISCOVERED' status is never actually written anywhere)
        orderBy: { score: 'desc' },
        take: 20,
        select: { id: true, name: true, platform: true, storeUrl: true, email: true, category: true, score: true, status: true, sellerType: true, country: true, createdAt: true },
      }),

      // Agent activity last 24h
      prisma.agentLog.findMany({
        where: { createdAt: { gte: since24h } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { agentName: true, action: true, status: true, details: true, createdAt: true },
      }),

      // Website traffic - yesterday vs day before (UTC calendar days)
      prisma.pageView.count({ where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
      prisma.pageView.count({ where: { createdAt: { gte: dayBeforeStart, lte: dayBeforeEnd } } }),
      prisma.pageView.groupBy({
        by: ['path'],
        where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 5,
      }),

      // Business snapshot (other information)
      prisma.seller.count(),
      prisma.order.count({ where: { createdAt: { gte: since24h } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: since24h } }, _sum: { subtotal: true } }),
      prisma.returnRequest.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'DISPUTED' } }),
    ]);

    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const html = buildDailyReportHtml({
      date: dateStr,
      totalProspects: totalProspectsCount,
      totalContacted: totalContactedCount,
      totalResponded: totalRespondedCount,
      totalApplications: totalApplicationsCount,
      totalApproved: totalApprovedCount,
      totalRejected: totalRejectedCount,
      totalPending: totalPendingCount,
      newProspects7d,
      newApplications7d,
      outreachLogs7d,
      pendingApplications,
      uncontactedProspects,
      agentLogs,
      yesterdayViews,
      dayBeforeViews,
      topPagesRaw,
      totalSellersCount,
      ordersLast24hCount,
      revenueLast24hResult,
      pendingReturnsCount,
      disputedOrdersCount,
    });

    await sendEmail({
      to: REPORT_RECIPIENT,
      subject: `Velor Daily Report - ${dateStr}`,
      html,
    });

    return NextResponse.json({
      ok: true,
      sent: REPORT_RECIPIENT,
      stats: {
        totalProspects: totalProspectsCount,
        totalContacted: totalContactedCount,
        totalApplications: totalApplicationsCount,
        totalApproved: totalApprovedCount,
        totalPending: totalPendingCount,
        newProspects7d: newProspects7d.length,
        newApplications7d: newApplications7d.length,
        outreach7d: outreachLogs7d.length,
        agentActions24h: agentLogs.length,
        pendingApplications: pendingApplications.length,
        uncontactedProspects: uncontactedProspects.length,
      },
    });
  } catch (err) {
    console.error('[daily-report] error:', err);
    return NextResponse.json({ error: 'Internal error', detail: String(err) }, { status: 500 });
  }
}
