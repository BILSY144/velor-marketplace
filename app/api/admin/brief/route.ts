import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const now = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
body { font-family: Georgia, serif; background: #0c0a07; color: #f5f0e8; margin: 0; padding: 0; }
.wrapper { max-width: 640px; margin: 0 auto; padding: 32px 24px; }
h1 { color: #c9a84c; font-size: 24px; margin-bottom: 4px; letter-spacing: 0.05em; }
h2 { color: #c9a84c; font-size: 16px; margin: 28px 0 10px; border-bottom: 1px solid #333; padding-bottom: 6px; }
p, li { font-size: 14px; line-height: 1.7; color: #f5f0e8; }
ul { padding-left: 18px; margin: 8px 0; }
.meta { color: #888; font-size: 12px; margin-bottom: 32px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
th { text-align: left; color: #c9a84c; font-weight: normal; padding: 6px 8px; border-bottom: 1px solid #333; }
td { padding: 6px 8px; border-bottom: 1px solid #1c1a16; vertical-align: top; }
.tag { display: inline-block; background: #1c1a16; border: 1px solid #333; border-radius: 3px; padding: 2px 6px; font-size: 11px; color: #c9a84c; }
.done { color: #2ecc71; }
.pending { color: #e67e22; }
.critical { color: #e74c3c; }
.footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #333; color: #555; font-size: 11px; }
</style>
</head>
<body>
<div class="wrapper">
  <h1>VELOR COMMERCE</h1>
  <p class="meta">Business Briefing — ${now}</p>

  <h2>Business Model</h2>
  <p>
    Velor is a UK-first luxury dropshipping store at <strong>velorcommerce.co.uk</strong>.
    We source products exclusively via CJ Dropshipping and sell at a 30% gross margin.
    Payments process via Stripe. Zero inventory — orders flow automatically from Stripe webhook to CJ fulfilment.
  </p>
  <table>
    <tr><th>Model</th><th>Detail</th></tr>
    <tr><td>Supplier</td><td>CJ Dropshipping (single supplier policy)</td></tr>
    <tr><td>Margin</td><td>30% minimum gross (selling price = CJ cost x 1.30)</td></tr>
    <tr><td>Payment</td><td>Stripe — 2.9% + 30p per transaction</td></tr>
    <tr><td>Net target</td><td>15–20% after Stripe fees (vs 10–15% industry avg)</td></tr>
    <tr><td>Fixed costs</td><td>Vercel Pro (~£20/mo) + domain — near-zero</td></tr>
    <tr><td>Break-even</td><td>First paid order</td></tr>
    <tr><td>VAT threshold</td><td>Register when turnover exceeds £90,000/yr rolling 12mo</td></tr>
  </table>

  <h2>Current Build Status</h2>
  <table>
    <tr><th>Component</th><th>Status</th></tr>
    <tr><td>Storefront (velorcommerce.co.uk)</td><td><span class="done">LIVE</span> — Next.js 14, App Router, Stripe, CJ integrated</td></tr>
    <tr><td>Stripe to CJ auto-fulfilment</td><td><span class="done">LIVE</span> — order placed on CJ on every successful payment</td></tr>
    <tr><td>AI customer chat (VelorChat)</td><td><span class="done">LIVE</span></td></tr>
    <tr><td>Product importer (/admin/import)</td><td><span class="done">LIVE</span> — <span class="critical">UNPROTECTED — no auth yet</span></td></tr>
    <tr><td>Marketplace (velorcommerce.store)</td><td><span class="pending">IN BUILD</span> — 9-agent OS under construction</td></tr>
    <tr><td>Seller application route</td><td><span class="done">BUILT</span> — saves to DB, sends confirmation email</td></tr>
    <tr><td>Daily agent report (07:00 UTC)</td><td><span class="done">LIVE</span> — cron active, emails willsinclair144@gmail.com</td></tr>
    <tr><td>Seller prospecting agent</td><td><span class="pending">PENDING BUILD</span></td></tr>
    <tr><td>Seller outreach agent</td><td><span class="pending">PENDING BUILD</span></td></tr>
    <tr><td>Returns / refund flow</td><td><span class="pending">PENDING BUILD</span></td></tr>
    <tr><td>Rate limiting (chat, contact, checkout)</td><td><span class="critical">NOT DONE — build soon</span></td></tr>
    <tr><td>Next.js CVE-2025-29927 patch</td><td><span class="critical">NOT DONE — upgrade to 14.2.25+</span></td></tr>
  </table>

  <h2>Agent Daily Tasks — 9-Agent OS</h2>
  <table>
    <tr><th>Agent</th><th>Daily Task</th></tr>
    <tr>
      <td><strong>1 — Seller Prospecting</strong></td>
      <td>Search Etsy, Amazon, TikTok Shop, Instagram, LinkedIn for sellers scoring 7+/10 (quality, reviews, volume, category fit). Output to SellerProspect DB. Never fabricate data. Only publicly available contact info.</td>
    </tr>
    <tr>
      <td><strong>2 — Seller Outreach</strong></td>
      <td>Email all prospected sellers (score 7+) not yet contacted. Follow-up sequence: Day 0 initial, Day 3 check-in, Day 7 final. Max 3 emails per seller. Log every send to OutreachLog.</td>
    </tr>
    <tr>
      <td><strong>3 — Seller Onboarding</strong></td>
      <td>Review all pending SellerApplications within 1 hour. Approve if: valid business, 3+ images, real email, no prohibited items. Reject otherwise with reason. Send decision email immediately.</td>
    </tr>
    <tr>
      <td><strong>4 — Seller Success</strong></td>
      <td>Monitor all active sellers: flag 0 sales in 14 days, flag no login in 7 days. Send weekly performance report to each seller. Never share one seller's data with another.</td>
    </tr>
    <tr>
      <td><strong>5 — Buyer Acquisition</strong></td>
      <td>Publish content: 2x TikTok, 1x Instagram post, 3x stories, 1x blog/week. Once revenue reaches threshold: run Meta retargeting at £5/day CAC target under £8. Never scale below 2x ROAS.</td>
    </tr>
    <tr>
      <td><strong>6 — Buyer Experience</strong></td>
      <td>Resolve: payment failures within 1hr, missing orders within 4hr, refunds within 24hr, general queries within 2hr. Side with buyer on first dispute under £50. Escalate fraud immediately.</td>
    </tr>
    <tr>
      <td><strong>7 — Listings Quality</strong></td>
      <td>Review all new listings within 6 hours. Reject if: under 3 images, title over 80 chars, description under 100 words, wrong category, or prohibited items. Approve and make live if compliant.</td>
    </tr>
    <tr>
      <td><strong>8 — Finance and Ops</strong></td>
      <td>Process weekly payouts: sellers 85%, Velor 15%. Never release payouts for disputed orders. Flag any order over £500 for manual review. Maintain daily reconciliation vs Stripe.</td>
    </tr>
    <tr>
      <td><strong>9 — Growth and Analytics</strong></td>
      <td>Report daily KPIs: seller signups, D1/D7/D30 buyer retention, GMV, commission, traffic by channel, fulfilment rate. Run minimum 2 A/B tests/week. Kill losing tests within 7 days.</td>
    </tr>
  </table>

  <h2>Immediate Priorities</h2>
  <ul>
    <li><span class="critical">CRITICAL</span> — Protect /admin/import with ADMIN_SECRET env var</li>
    <li><span class="critical">HIGH</span> — Patch Next.js to 14.2.25+ (CVE-2025-29927, CVSS 9.1)</li>
    <li><span class="critical">HIGH</span> — Add rate limiting to /api/chat, /api/contact, /api/checkout</li>
    <li><span class="pending">NEXT</span> — Build Seller Prospecting agent (Agent 1)</li>
    <li><span class="pending">NEXT</span> — Build Seller Outreach agent (Agent 2)</li>
    <li><span class="pending">NEXT</span> — Set CRON_SECRET in Vercel env vars</li>
  </ul>

  <h2>China Trip (CJ HQ — Shenzhen)</h2>
  <p>
    Goal: request VIP tier in person, negotiate lower costs for fitness/home/tech categories,
    explore OEM/white-label packaging, secure priority UK warehouse slot.
    Address: ShangLiLiang Industrial District, NanWan Block, Buji Town, LongGang District, Shenzhen.
  </p>

  <div class="footer">
    Sent by the Velor Agent OS &mdash; velorcommerce.co.uk &mdash; ${now}
  </div>
</div>
</body>
</html>`;

  try {
    await sendEmail({
      to: 'willsinclair144@gmail.com',
      subject: 'Velor Commerce — Business Briefing & Agent Daily Tasks',
      html,
    });
    return NextResponse.json({ sent: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[brief]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
