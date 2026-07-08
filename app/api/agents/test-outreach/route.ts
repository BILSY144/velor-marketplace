import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email'; import { buildOutreachEmail } from '@/lib/outreachEmail';

const TEST_KEY = 'velor-test-9f3k2p7q8w1z4x6m0b5n';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('key') !== TEST_KEY) {
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
