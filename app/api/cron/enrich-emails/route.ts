import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 24;
const TIME_BUDGET_MS = 50000;
const ROLE_PRIORITY = ['hello', 'info', 'contact', 'sales', 'support', 'team', 'shop', 'enquiries', 'hi', 'orders', 'admin'];

function extractEmails(html: string): string[] {
  const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  const found = html.match(re) || [];
  return Array.from(new Set(found.map((e) => e.toLowerCase())));
}

function pickBest(emails: string[], host: string): string | null {
  const rootHost = host.replace(/^www\./, '');
  const valid = emails.filter((e) => {
    if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(e)) return false;
    if (e.includes('@sentry') || e.includes('.wixpress') || e.includes('example.') || e.includes('@shopify') || e.includes('godaddy')) return false;
    return true;
  });
  const dom = (e: string) => (e.split('@')[1] || '');
  const sameDomain = valid.filter((e) => dom(e) === rootHost || dom(e).endsWith('.' + rootHost) || rootHost.endsWith('.' + dom(e)));
  const pool = sameDomain.length ? sameDomain : valid;
  for (const role of ROLE_PRIORITY) {
    const m = pool.find((e) => e.startsWith(role + '@'));
    if (m) return m;
  }
  return pool[0] || null;
}

async function fetchText(url: string, ms: number): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VelorBot/1.0; +https://velorcommerce.store)' } });
    clearTimeout(t);
    if (!res.ok) return '';
    return (await res.text()).slice(0, 400000);
  } catch {
    clearTimeout(t);
    return '';
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const prospects = await prisma.sellerProspect.findMany({
    where: { email: null, status: 'prospected' },
    orderBy: { score: 'desc' },
    take: BATCH,
  });
  const started = Date.now();
  let found = 0, none = 0, errors = 0, skipped = 0;
  for (const p of prospects) {
    if (Date.now() - started > TIME_BUDGET_MS) { skipped++; continue; }
    try {
      let host = '';
      try { host = new URL(p.storeUrl).hostname.replace(/^www\./, ''); } catch {}
      const b = p.storeUrl.replace(/\/$/, '');
      const pages = [p.storeUrl, b + '/pages/contact', b + '/contact'];
      let email: string | null = null;
      for (const page of pages) {
        const html = await fetchText(page, 5000);
        if (!html) continue;
        email = pickBest(extractEmails(html), host);
        if (email) break;
      }
      if (email) {
        await prisma.sellerProspect.update({ where: { id: p.id }, data: { email } });
        found++;
      } else {
        await prisma.sellerProspect.update({ where: { id: p.id }, data: { status: 'no_email' } });
        none++;
      }
    } catch {
      errors++;
    }
  }
  await prisma.agentLog.create({ data: { agentName: 'email-enrich', action: 'enrich_run', status: 'success', details: { found, none, errors, skipped, processed: prospects.length } } });
  return NextResponse.json({ ok: true, found, none, errors, skipped, processed: prospects.length });
}
