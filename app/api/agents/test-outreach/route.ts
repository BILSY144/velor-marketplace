import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email'; import { buildOutreachEmail } from '@/lib/outreachEmail';

export const dynamic = 'force-dynamic';

// Internal QA tool only -- lets an admin preview a real outreach email by
// sending it to an address of their choosing. Used to be gated by a secret
// hardcoded directly in this file: readable by anyone with repo access (a
// plain violation of CLAUDE.md's own "never hardcode a PAT, API key or
// secret" rule), and with no rate limit or allowlist on `to`, effectively an
// open relay that could send a real, Velor-branded email to any address on
// request. Now gated the same way /api/admin/set-tier is: a fail-closed
// ADMIN_SECRET query-param check done in the route itself, since this needs
// to work from a plain browser URL for quick previewing and can't rely on a
// custom Authorization header the way /api/admin/* routes do via
// middleware.ts. This route lives under /api/agents, not /api/admin, so
// middleware.ts's blanket ADMIN_SECRET check never covered it -- the check
// below is the only thing protecting it.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const envSecret = process.env.ADMIN_SECRET;
  if (!envSecret || secret !== envSecret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const to = searchParams.get('to');
  if (!to || !to.includes('@')) {
    return NextResponse.json({ ok: false, error: 'missing to' }, { status: 400 });
  }
  const emailType = (searchParams.get('type') as 'initial' | 'followup1' | 'followup2') || 'initial';
  const prospect = {
    name: 'Aurora Home & Living',
    platform: 'Shopify',
    storeUrl: 'https://example.com',
    category: 'Home & Garden',
    sellerType: 'brand' as const,
  };
  const unsubscribeUrl =
    'https://velorcommerce.store/unsubscribe?u=' + Buffer.from(to, 'utf8').toString('base64url');
  try {
    const { subject, html } = buildOutreachEmail({ prospect, emailType, unsubscribeUrl });
    await sendEmail({ from: 'Velor Seller Team <sellers@velorcommerce.store>', to, subject, html });
    return NextResponse.json({ ok: true, to, emailType, subject });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'error' }, { status: 500 });
  }
}
