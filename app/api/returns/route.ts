import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { orderId: string; reason: string };
  const { orderId, reason } = body;
  if (!orderId || !reason) {
    return NextResponse.json({ error: 'orderId and reason are required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.customerEmail !== email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const returnRequest = await prisma.returnRequest.create({
    data: { orderId, customerEmail: email, reason },
  });

  return NextResponse.json({ returnRequest }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') ?? 'buyer';

  if (role === 'seller') {
    const seller = await prisma.seller.findFirst({ where: { user: { email } } });
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

    const returns = await prisma.returnRequest.findMany({
      where: { order: { sellerId: seller.id } },
      include: {
        order: { include: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ returns });
  }

  if (role === 'admin') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const returns = await prisma.returnRequest.findMany({
      include: { order: { include: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ returns });
  }

  const returns = await prisma.returnRequest.findMany({
    where: { customerEmail: email },
    include: { order: { include: { items: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ returns });
}
