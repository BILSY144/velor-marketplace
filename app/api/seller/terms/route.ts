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

  return NextResponse.json({
    accepted: !!seller.termsAcceptedAt,
    acceptedAt: seller.termsAcceptedAt,
    version: seller.termsVersion,
    currentVersion: CURRENT_TERMS_VERSION,
    needsReAcceptance: seller.termsVersion !== CURRENT_TERMS_VERSION,
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

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
