import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { u } = await req.json();
    if (!u || typeof u !== 'string') {
      return NextResponse.json({ ok: false, error: 'missing token' }, { status: 400 });
    }
    const email = Buffer.from(u, 'base64url').toString('utf8').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'invalid token' }, { status: 400 });
    }
    await prisma.sellerProspect.updateMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      data: { status: 'unsubscribed' },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
