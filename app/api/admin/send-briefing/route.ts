import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:680px;margin:0 auto;padding:32px 24px}h1{font-size:22px;font-weight:700;margin:0 0 4px}.sub{font-size:14px;color:#555;margin:0 0 32px}h2{font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#555;margin:32px 0 12px;border-bottom:1px solid #e5e5e5;padding-bottom:6px}table{width:100%;border-collapse:collapse;font-size:14px}td{padding:8px 0;vertical-align:top;border-bottom:1px solid #f0f0f0}td:first-child{font-weight:500;width:45%;color:#333}.live{display:inline-block;background:#16a34a;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}.pend{display:inline-block;background:#d97706;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}.test{display:inline-block;background:#3b82f6;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}.done{display:inline-block;background:#6366f1;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}code{font-family:'SF Mono',monospace;font-size:12px;background:#f5f5f5;padding:2px 6px;border-radius:4px;color:#c2410c}ul{font-size:14px;padding-left:20px;margin:8px 0}li{margin-bottom:6px}</style></head><body><h1>Velor Marketplace - Operations Briefing</h1><p class="sub">2 July 2026 - AI Director Update</p><h2>Platform Status</h2><table><tr><td>Live URL</td><td><code>velorcommerce.store</code></td></tr><tr><td>Repo</td><td>BILSY144/velor-marketplace</td></tr><tr><td>Authentication</td><td><span class="live">LIVE</span> AUTH_SECRET fixed - Seller login operational</td></tr><tr><td>Base URL</td><td><span class="live">LIVE</span> NEXT_PUBLIC_BASE_URL set correctly</td></tr><tr><td>Shipping</td><td><span class="live">LIVE</span> Global architecture deployed (commit a36120b0)</td></tr><tr><td>Payments</td><td><span class="live">LIVE</span> Stripe Connect wired</td></tr></table><h2>Shippo</h2><table><tr><td>API Key</td><td><span class="test">TEST</span> SHIPPO_API_KEY in Vercel (all envs)</td></tr><tr><td>Webhook Secret</td><td><span class="done">DONE</span> SHIPPO_WEBHOOK_SECRET in Vercel (all envs)</td></tr><tr><td>Webhook</td><td><code>velorcommerce.store/api/webhooks/shippo</code></td></tr><tr><td>Plan</td><td>Free - 30 labels/month - Rate quotes unlimited</td></tr><tr><td>Live key</td><td><span class="pend">PENDING</span> Request via Shippo portal Intercom chat</td></tr></table><h2>Security</h2><table><tr><td>Admin routes</td><td><span class="done">DONE</span> ADMIN_SECRET bearer auth</td></tr><tr><td>CVE-2025-29927</td><td><span class="done">DONE</span> Middleware scope tightened</td></tr><tr><td>Rate limiting</td><td><span class="done">DONE</span> /api/chat /api/contact /api/checkout</td></tr><tr><td>Stripe webhook</td><td><span class="done">DONE</span> stripeOnboarded flag set</td></tr></table><h2>Autonomous Rules</h2><ul><li><strong>At 20 orders:</strong> Upgrade Shippo to Pro ($19/month, 10k labels) without being asked. URL: portal.goshippo.com/settings/billing</li></ul><h2>Next Actions</h2><table><tr><td>1. Shippo live key</td><td>Portal - Request live key - Intercom chat</td></tr><tr><td>2. Swap test key</td><td>Update SHIPPO_API_KEY in Vercel</td></tr><tr><td>3. First seller test</td><td>Signup - Stripe Connect - rate quote - checkout</td></tr></table></body></html>`

  const { data, error } = await resend.emails.send({
    from: 'Velor AI Director <noreply@velorcommerce.co.uk>',
    to: ['willsinclair144@gmail.com'],
    subject: 'Velor Marketplace - Operations Briefing (2 July 2026)',
    html,
  })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id })
}
