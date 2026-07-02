import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const now = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });

  const html = \`<!DOCTYPE html>
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
.done { color: #2ecc71; }
.pending { color: #e67e22; }
.critical { color: #e74c3c; }
.footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #333; color: #555; font-size: 11px; }
</style>
</head>
<body>
<div class="wrapper">
<h1>VELOR GLOBAL MARKETPLACE</h1>
<p class="meta">Director Briefing — \${now}</p>

<h2>Business Overview</h2>
<p>
Velor is the world's first 100% AI-operated global commerce marketplace.
Every function that Amazon, eBay, and Etsy pay thousands of employees to perform —
seller acquisition, product onboarding, customer service, fraud detection, pricing intelligence,
and marketing — is executed by a coordinated team of specialised AI agents operating
around the clock, in every language, across every country.
</p>
<table>
<tr><th>Detail</th><th>Value</th></tr>
<tr><td>Entity</td><td>Velor Commerce Ltd (UK limited company)</td></tr>
<tr><td>Domain</td><td>velorcommerce.store</td></tr>
<tr><td>Model</td><td>Multi-seller global marketplace, open to any seller in any country</td></tr>
<tr><td>Operating model</td><td>100% AI agents — zero human operations team</td></tr>
<tr><td>Payments</td><td>Stripe Connect — multi-currency, 135+ countries, automated commission splits</td></tr>
<tr><td>Target GMV (Month 24)</td><td>$15.2M/month</td></tr>
<tr><td>Target revenue (Month 24)</td><td>$1.67M/month</td></tr>
<tr><td>Gross margin target</td><td>95% (AI cost model)</td></tr>
</table>

<h2>Seller Tier Revenue Model</h2>
<table>
<tr><th>Tier</th><th>Monthly Fee</th><th>Commission</th><th>Listings</th></tr>
<tr><td>STARTER</td><td>Free</td><td>15%</td><td>50 products</td></tr>
<tr><td>PRO</td><td>$59/month</td><td>8%</td><td>Unlimited</td></tr>
<tr><td>ENTERPRISE</td><td>Custom</td><td>3–5%</td><td>Unlimited + API access</td></tr>
</table>

<h2>Current Build Status</h2>
<table>
<tr><th>Component</th><th>Status</th></tr>
<tr><td>Marketplace scaffold (velorcommerce.store)</td><td><span class="done">LIVE</span> — Next.js 15, App Router, Vercel, dark design system</td></tr>
<tr><td>Seller application route (/api/seller/apply)</td><td><span class="done">BUILT</span> — saves to DB, sends confirmation email</td></tr>
<tr><td>Daily agent report (07:00 UTC cron)</td><td><span class="done">LIVE</span> — emails director daily</td></tr>
<tr><td>Admin brief endpoint (/api/admin/brief)</td><td><span class="done">LIVE</span></td></tr>
<tr><td>Multi-seller product catalogue (PostgreSQL)</td><td><span class="pending">IN BUILD</span></td></tr>
<tr><td>Seller dashboard and storefronts</td><td><span class="pending">IN BUILD</span></td></tr>
<tr><td>Stripe Connect commission engine</td><td><span class="pending">IN BUILD</span></td></tr>
<tr><td>HUNTER agent (seller prospecting)</td><td><span class="pending">PENDING BUILD</span></td></tr>
<tr><td>HERALD agent (buyer support)</td><td><span class="pending">PENDING BUILD</span></td></tr>
<tr><td>ORACLE agent (listing optimisation)</td><td><span class="pending">PENDING BUILD</span></td></tr>
<tr><td>SENTINEL agent (fraud detection)</td><td><span class="pending">PENDING BUILD</span></td></tr>
<tr><td>Rate limiting (chat, contact, checkout)</td><td><span class="critical">NOT DONE — build soon</span></td></tr>
<tr><td>Next.js CVE-2025-29927 patch</td><td><span class="critical">NOT DONE — upgrade to 14.2.25+</span></td></tr>
<tr><td>Admin route auth (ADMIN_SECRET)</td><td><span class="critical">NOT DONE — critical security gap</span></td></tr>
</table>

<h2>The Nine AI Agents</h2>
<table>
<tr><th>Agent</th><th>Role</th></tr>
<tr><td><strong>HUNTER</strong></td><td>Global seller prospecting and personalised outreach across 190+ countries in every language.</td></tr>
<tr><td><strong>CURATOR</strong></td><td>Seller onboarding — registration to first live listing in under 24 hours. Verifies legitimacy, requests compliance documentation.</td></tr>
<tr><td><strong>ORACLE</strong></td><td>AI-powered listing optimisation. SEO titles, descriptions, category assignments, pricing recommendations — in any language, for any product.</td></tr>
<tr><td><strong>SCOUT</strong></td><td>Real-time competitive pricing intelligence across Amazon, eBay, Google Shopping, and regional platforms in every market.</td></tr>
<tr><td><strong>SENTINEL</strong></td><td>Fraud detection and platform integrity. Monitors every transaction, listing, and seller account. Automated holds applied instantly.</td></tr>
<tr><td><strong>HERALD</strong></td><td>Full-spectrum buyer customer service. Sub-60-second response time, 24/7/365, in every major language. No ticket queue.</td></tr>
<tr><td><strong>LEDGER</strong></td><td>Seller SLA enforcement and performance scoring. Automated coaching for underperforming sellers. Escalates persistent violations.</td></tr>
<tr><td><strong>ARBITER</strong></td><td>Omnichannel marketing — SEO, email campaigns, paid search, social media, influencer outreach in every market. A/B tests creative.</td></tr>
<tr><td><strong>COMPASS</strong></td><td>Business intelligence and analytics. Aggregates data across all agents. Daily KPI report for the director in natural language.</td></tr>
</table>

<h2>CEO Agent (Claude / Anthropic)</h2>
<p>The orchestrating intelligence. Cross-domain decisions, high-priority escalations, weekly business summary for the director. Operational leadership — not a chatbot.</p>

<h2>Immediate Priorities</h2>
<ul>
<li><span class="critical">CRITICAL</span> — Add ADMIN_SECRET check to all /admin/* routes</li>
<li><span class="critical">HIGH</span> — Patch Next.js to 14.2.25+ (CVE-2025-29927, CVSS 9.1)</li>
<li><span class="critical">HIGH</span> — Rate limiting on /api/chat, /api/contact, /api/checkout</li>
<li><span class="pending">NEXT</span> — Build multi-seller PostgreSQL catalogue</li>
<li><span class="pending">NEXT</span> — Build HUNTER agent</li>
<li><span class="pending">NEXT</span> — Build HERALD agent</li>
<li><span class="pending">NEXT</span> — Build Stripe Connect commission engine</li>
<li><span class="pending">NEXT</span> — Set CRON_SECRET and ANTHROPIC_API_KEY in Vercel</li>
</ul>

<div class="footer">
Sent by the Velor Agent OS — velorcommerce.store — \${now}
</div>
</div>
</body>
</html>\`;

  try {
    await sendEmail({
      to: 'willsinclair144@gmail.com',
      subject: 'Velor Global Marketplace — Director Briefing',
      html,
    });
    return NextResponse.json({ sent: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[brief]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
