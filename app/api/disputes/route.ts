import { NextResponse } from 'next/server';
import { checkMessageContent } from '@/lib/messageFilter';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { orderId: string; reason: string; evidence?: string };
  const { orderId, reason, evidence } = body;
  if (!orderId || !reason) {
    return NextResponse.json({ error: 'orderId and reason are required' }, { status: 400 });
  }
  // Both parties and the admin read these -- same no-contact-details rule
  // as messages (William, 2026-07-21).
  if (checkMessageContent(`${reason} ${evidence || ''}`).blocked) {
    return NextResponse.json({ error: "Dispute text can't include email addresses, phone numbers, website links, or social/messaging handles -- keep everything on Velor." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.customerEmail !== email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const dispute = await prisma.dispute.create({
    data: {
      orderId,
      raisedBy: email,
      reason,
      ...(evidence && { evidence }),
    },
  });

  return NextResponse.json({ dispute }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') ?? 'buyer';

  if (role === 'admin') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const disputes = await prisma.dispute.findMany({
      include: { order: { include: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ disputes });
  }

  if (role === 'seller') {
    const seller = await prisma.seller.findFirst({ where: { user: { email } } });
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

    const disputes = await prisma.dispute.findMany({
      where: { order: { sellerId: seller.id } },
      include: { order: { include: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ disputes });
  }

  const disputes = await prisma.dispute.findMany({
    where: { raisedBy: email },
    include: { order: { include: { items: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ disputes });
}
