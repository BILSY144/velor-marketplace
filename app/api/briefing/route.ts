import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

async function generateAndSend() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 86400000)

  const [
    totalSellers,
    pendingApplications,
    totalOrders,
    ordersLast24h,
    revenueResult,
    disputedOrders,
    pendingReturns,
    approvedProducts,
    pendingProducts,
    totalPayouts,
    agentLogs,
  ] = await Promise.allSettled([
    prisma.seller.count(),
    prisma.sellerApplication.count({ where: { status: 'PENDING' } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: yesterday } } }),
    prisma.order.aggregate({ _sum: { subtotal: true } }),
    prisma.order.count({ where: { status: 'DISPUTED' } }),
    prisma.returnRequest.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { status: 'APPROVED' } }),
    prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.payout.aggregate({ _sum: { amount: true } }),
    prisma.agentLog.findMany({
      where: { createdAt: { gte: yesterday } },
      orderBy: { createdAt: 'asc' },
      select: { agentName: true, action: true, status: true, createdAt: true },
    }),
  ])

  const val = (r: PromiseSettledResult<number>) =>
    r.status === 'fulfilled' ? r.value.toString() : 'ERR'

  const money = (r: PromiseSettledResult<{ _sum: { subtotal: number | null } }>) => {
    if (r.status !== 'fulfilled') return 'ERR'
    const v = r.value._sum.subtotal ?? 0
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
  }

  const payoutMoney = (r: PromiseSettledResult<{ _sum: { amount: number | null } }>) => {
    if (r.status !== 'fulfilled') return 'ERR'
    const v = r.value._sum.amount ?? 0
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v)
  }

  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'unknown'
  const commitMsg = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? 'unknown'
  const env = process.env.VERCEL_ENV ?? 'unknown'
  const shippoKey = process.env.SHIPPO_API_KEY ?? ''
  const shippoMode = shippoKey.startsWith('shippo_test_') ? 'TEST' : shippoKey ? 'LIVE' : 'NOT SET'

  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })

  const flagIssues: string[] = []
  if (pendingApplications.status === 'fulfilled' && pendingApplications.value > 0)
    flagIssues.push(`${pendingApplications.value} seller application(s) awaiting review`)
  if (disputedOrders.status === 'fulfilled' && disputedOrders.value > 0)
    flagIssues.push(`${disputedOrders.value} disputed order(s) require attention`)
  if (pendingReturns.status === 'fulfilled' && pendingReturns.value > 0)
    flagIssues.push(`${pendingReturns.value} return request(s) pending`)
  if (pendingProducts.status === 'fulfilled' && pendingProducts.value > 0)
    flagIssues.push(`${pendingProducts.value} product(s) awaiting approval`)
  if (shippoMode === 'TEST')
    flagIssues.push('Shippo still on TEST key Ã¢ÂÂ request live key via portal Intercom')

  const flagHtml = flagIssues.length > 0
    ? `<h2>Flags Requiring Attention</h2><ul>${flagIssues.map(f => `<li>${f}</li>`).join('')}</ul>`
    : `<h2>Flags</h2><p style="color:#16a34a;font-size:14px">No issues flagged.</p>`


  // Subagent Activity
  const rawLogs = agentLogs.status === 'fulfilled' ? agentLogs.value : [];
  const agentsByName: Record<string, { action: string; status: string; createdAt: Date }[]> = {};
  for (const log of rawLogs) {
    if (!agentsByName[log.agentName]) agentsByName[log.agentName] = [];
    agentsByName[log.agentName].push(log as { action: string; status: string; createdAt: Date });
  }
  const agentLogRows = Object.entries(agentsByName).map(([name, entries]) =>
    `<tr><td colspan="3" style="background:#1a1a2e;color:#a78bfa;font-weight:bold;padding:8px 12px;font-size:13px;">${name.toUpperCase()} AGENT (${entries.length} actions)</td></tr>` +
    entries.map(e =>
      `<tr><td style="padding:6px 12px;color:#e2e8f0;font-size:12px;">${e.action}</td><td style="padding:6px 12px;color:${e.status==='success'?'#4ade80':'#f87171'};font-size:12px;">${e.status}</td><td style="padding:6px 12px;color:#94a3b8;font-size:11px;">${new Date(e.createdAt).toLocaleTimeString('en-GB')}</td></tr>`
    ).join('')
  ).join('') || '<tr><td colspan="3" style="padding:8px 12px;color:#64748b;">No subagent activity in last 24h</td></tr>';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:680px;margin:0 auto;padding:32px 24px}
    h1{font-size:22px;font-weight:700;margin:0 0 4px}
    .sub{font-size:13px;color:#666;margin:0 0 32px}
    h2{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:28px 0 10px;border-bottom:1px solid #e5e5e5;padding-bottom:6px}
    table{width:100%;border-collapse:collapse;font-size:14px}
    td{padding:9px 0;vertical-align:top;border-bottom:1px solid #f0f0f0}
    td:first-child{font-weight:500;width:45%;color:#444}
    .live{display:inline-block;background:#16a34a;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
    .test{display:inline-block;background:#3b82f6;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
    .warn{display:inline-block;background:#d97706;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
    code{font-family:'SF Mono',monospace;font-size:12px;background:#f5f5f5;padding:2px 6px;border-radius:4px;color:#c2410c}
    ul{font-size:14px;padding-left:20px;margin:8px 0}li{margin-bottom:6px}
    .none{color:#16a34a}
  </style></head><body>
  <h1>Velor Marketplace &mdash; Daily Briefing</h1>
  <p class="sub">${dateStr} &middot; ${timeStr} UK time &middot; Live data</p>

  <h2>Business Metrics</h2>
  <table>
    <tr><td>Total Revenue</td><td><strong>${money(revenueResult as any)}</strong></td></tr>
    <tr><td>Total Orders</td><td>${val(totalOrders as any)}</td></tr>
    <tr><td>Orders (Last 24h)</td><td>${val(ordersLast24h as any)}</td></tr>
    <tr><td>Total Payouts</td><td>${payoutMoney(totalPayouts as any)}</td></tr>
    <tr><td>Active Sellers</td><td>${val(totalSellers as any)}</td></tr>
    <tr><td>Pending Applications</td><td>${val(pendingApplications as any)}</td></tr>
    <tr><td>Live Products</td><td>${val(approvedProducts as any)}</td></tr>
    <tr><td>Products Awaiting Approval</td><td>${val(pendingProducts as any)}</td></tr>
    <tr><td>Disputed Orders</td><td>${val(disputedOrders as any)}</td></tr>
    <tr><td>Pending Returns</td><td>${val(pendingReturns as any)}</td></tr>
  </table>

  ${flagHtml}

  <h2>Infrastructure</h2>
  <table>
    <tr><td>Environment</td><td><code>${env}</code></td></tr>
    <tr><td>Deployed Commit</td><td><code>${commitSha}</code> &mdash; ${commitMsg}</td></tr>
    <tr><td>Shippo Key Mode</td><td><span class="${shippoMode === 'LIVE' ? 'live' : 'test'}">${shippoMode}</span></td></tr>
    <tr><td>Email Routing</td><td>Ops &rarr; <code>customerservice@velorcommerce.co.uk</code> &middot; Briefings &rarr; <code>willsinclair144@gmail.com</code></td></tr>
  </table>

  <tr><td colspan="2" style="padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;background:#0d0d1a;">
      <tr><td style="color:#a78bfa;font-size:15px;font-weight:700;padding:14px 20px;letter-spacing:1px;border-top:2px solid #a78bfa;">SUBAGENT ACTIVITY â LAST 24H</td></tr>
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <th style="background:#1e1e3f;color:#94a3b8;font-size:11px;padding:8px 12px;text-align:left;">ACTION</th>
            <th style="background:#1e1e3f;color:#94a3b8;font-size:11px;padding:8px 12px;text-align:left;">STATUS</th>
            <th style="background:#1e1e3f;color:#94a3b8;font-size:11px;padding:8px 12px;text-align:left;">TIME</th>
          </tr>
          ${agentLogRows}
        </table>
      </td></tr>
    </table>
  </td></tr>
  </body></html>`

  return resend.emails.send({
    from: 'Velor AI Director <noreply@velorcommerce.co.uk>',
    to: ['willsinclair144@gmail.com'],
    subject: `Velor Daily Briefing Ã¢ÂÂ ${dateStr}`,
    html,
  })
}

export async function GET() {
  const { data, error } = await generateAndSend()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id })
}

export async function POST() {
  const { data, error } = await generateAndSend()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id })
      }
