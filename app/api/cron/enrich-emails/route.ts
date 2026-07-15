import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCronSecret } from '@/lib/cronAuth';

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

// Contact/about paths tried after the homepage, in order. Expanded 2026-07-15
// (William): 356 prospects had died at no_email when only the homepage,
// /pages/contact and /contact were checked -- about pages and the -us
// variants are where many independent stores actually publish an address.
const EXTRA_PATHS = [
  '/pages/contact', '/contact', '/contact-us', '/pages/contact-us',
  '/about', '/pages/about', '/about-us', '/pages/about-us',
];
const PER_PROSPECT_BUDGET_MS = 15000;

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  // Fresh prospects first; any leftover batch slots give previous no_email
  // rows exactly ONE more chance against the expanded page list. A retry that
  // finds an email returns the row to 'prospected' so the qualify gate picks
  // it up; a retry that still finds nothing becomes 'no_email_final' and is
  // never fetched again.
  const fresh = await prisma.sellerProspect.findMany({
    where: { email: null, status: 'prospected' },
    orderBy: { score: 'desc' },
    take: BATCH,
  });
  const retryBudget = BATCH - fresh.length;
  const retries = retryBudget > 0
    ? await prisma.sellerProspect.findMany({
        where: { email: null, status: 'no_email' },
        orderBy: { score: 'desc' },
        take: retryBudget,
      })
    : [];

  const started = Date.now();
  let found = 0, none = 0, errors = 0, skipped = 0, retriedFound = 0, retriedFinal = 0;

  for (const p of [...fresh, ...retries]) {
    if (Date.now() - started > TIME_BUDGET_MS) { skipped++; continue; }
    const isRetry = p.status === 'no_email';
    const prospectStarted = Date.now();
    try {
      let host = '';
      try { host = new URL(p.storeUrl).hostname.replace(/^www\./, ''); } catch {}
      const b = p.storeUrl.replace(/\/$/, '');
      const pages = [p.storeUrl, ...EXTRA_PATHS.map((path) => b + path)];
      let email: string | null = null;
      for (const page of pages) {
        if (Date.now() - prospectStarted > PER_PROSPECT_BUDGET_MS) break;
        if (Date.now() - started > TIME_BUDGET_MS) break;
        const html = await fetchText(page, 5000);
        if (!html) continue;
        email = pickBest(extractEmails(html), host);
        if (email) break;
      }
      if (email) {
        await prisma.sellerProspect.update({
          where: { id: p.id },
          data: { email, status: 'prospected' },
        });
        found++;
        if (isRetry) retriedFound++;
      } else {
        await prisma.sellerProspect.update({
          where: { id: p.id },
          data: { status: isRetry ? 'no_email_final' : 'no_email' },
        });
        none++;
        if (isRetry) retriedFinal++;
      }
    } catch {
      errors++;
    }
  }
  const processed = fresh.length + retries.length;
  await prisma.agentLog.create({ data: { agentName: 'email-enrich', action: 'enrich_run', status: 'success', details: { found, none, errors, skipped, processed, freshCount: fresh.length, retryCount: retries.length, retriedFound, retriedFinal } } });
  return NextResponse.json({ ok: true, found, none, errors, skipped, processed, retriedFound, retriedFinal });
}
