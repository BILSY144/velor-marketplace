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
.done { color: #2ecc71; }
.pending { color: #e67e22; }
.critical { color: #e74c3c; }
.footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #333; color: #555; font-size: 11px; }
</style>
</head>
<body>
<div class="wrapper">
<h1>VELOR GLOBAL MARKETPLACE</h1>
<p class="meta">Director Briefing — ${now}</p>

<h2>Platform Status</h2>
<table>
<tr><th>Agent</th><th>Status</th><th>Notes</th></tr>
<tr><td>Seller Applications</td><td class="done">Live</td><td>Form to DB with auto-review</td></tr>
<tr><td>AI Product Moderation</td><td class="done">Live</td><td>Claude reviews each submission</td></tr>
<tr><td>Director Briefing</td><td class="done">Live</td><td>This email, triggered by cron</td></tr>
<tr><td>Chat Concierge</td><td class="done">Live</td><td>/api/chat powered by Claude</td></tr>
<tr><td>Contact Form</td><td class="done">Live</td><td>Routed to willsinclair144@gmail.com</td></tr>
<tr><td>Checkout</td><td class="done">Live</td><td>Stripe integration active</td></tr>
<tr><td>Order Tracking</td><td class="pending">Pending</td><td>Not yet implemented</td></tr>
<tr><td>Seller Dashboard</td><td class="pending">Pending</td><td>UI in progress</td></tr>
<tr><td>Payout Engine</td><td class="pending">Pending</td><td>Stripe Connect pending</td></tr>
</table>

<h2>Revenue Model</h2>
<ul>
<li>Commission: 10% Starter / 4% Pro / 0% Enterprise per sale</li>
<li>Seller subscription: Free (Starter) / £49 (Pro) / £99 (Enterprise) per month</li>
<li>Promoted listings: TBD</li>
</ul>

<h2>Security Tasks</h2>
<ul>
<li class="pending">ADMIN_SECRET auth on /api/admin/* routes - in progress</li>
<li class="pending">Rate limiting on /api/chat, /api/contact, /api/checkout - pending</li>
<li class="done">CVE-2025-29927 - Next.js 16.2.9 unaffected</li>
</ul>

<h2>Next Steps</h2>
<ul>
<li>Complete ADMIN_SECRET middleware for all admin routes</li>
<li>Add rate limiting via edge middleware</li>
<li>Build seller dashboard UI</li>
<li>Launch seller onboarding</li>
</ul>

<div class="footer">
Sent by the Velor Agent OS — velorcommerce.store — ${now}
</div>
</div>
</body>
</html>`;

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