import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const CURRENT_TERMS_VERSION = 'v1.0-2026-07';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    select: { termsAcceptedAt: true, termsVersion: true },
  });

  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

  const accepted = !!seller.termsAcceptedAt;
  const needsReAcceptance = seller.termsVersion !== CURRENT_TERMS_VERSION;

  const response = NextResponse.json({
    accepted,
    acceptedAt: seller.termsAcceptedAt,
    version: seller.termsVersion,
    currentVersion: CURRENT_TERMS_VERSION,
    needsReAcceptance,
  });

  // Self-heal (William, 2026-08-07: "terms and conditions keeps popping up
  // for editing a listing" -- the middleware.ts dashboard gate only ever
  // checks the velor_terms COOKIE, never the DB. A seller who genuinely
  // accepted once at signup but later loses that cookie for any reason
  // (cleared cookies, a new device/browser, browser cookie-lifetime
  // limits, incognito) was permanently bounced back to /dashboard/terms on
  // every single dashboard visit thereafter -- DB truth never had a way to
  // re-arm the cookie. Same self-heal shape already used for the payout
  // gate (lib/payoutGate.ts's setPayoutGateCookie, refreshed on every
  // /api/stripe/connect/account or /api/payoneer/onboard call): whenever
  // this endpoint confirms DB-accepted-at-the-current-version, it re-issues
  // the cookie as a side effect so the NEXT middleware check passes without
  // making the seller click through the agreement again. Only heals when
  // the accepted version still matches CURRENT_TERMS_VERSION -- a real
  // future version bump (needsReAcceptance true) still correctly sends them
  // back through the form once for the new version, which is intended.
  if (accepted && !needsReAcceptance) {
    response.cookies.set('velor_terms', CURRENT_TERMS_VERSION, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  }

  return response;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) return NextResponse.json({ error: 'No seller profile is linked to this account. Sign in with your seller account to accept these terms.' }, { status: 404 });

  await prisma.seller.update({
    where: { id: seller.id },
    data: { termsAcceptedAt: new Date(), termsVersion: CURRENT_TERMS_VERSION },
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set('velor_terms', CURRENT_TERMS_VERSION, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return response;
}
