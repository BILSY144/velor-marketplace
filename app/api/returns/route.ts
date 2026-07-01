import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { orderId: string; reason: string };
  const { orderId, reason } = body;
  if (!orderId || !reason) {
    return NextResponse.json({ error: 'orderId and reason are required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.buyerEmail !== email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const returnRequest = await prisma.returnRequest.create({
    data: { orderId, buyerEmail: email, reason },
  });

  return NextResponse.json({ returnRequest }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') ?? 'buyer';

  if (role === 'seller') {
    const seller = await prisma.seller.findFirst({ where: { user: { email } } });
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

    const returns = await prisma.returnRequest.findMany({
      where: { order: { items: { some: { product: { sellerId: seller.id } } } } },
      include: {
        order: {
          include: {
            items: {
              include: { product: { select: { id: true, title: true, images: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ returns });
  }

  if (role === 'admin') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const returns = await prisma.returnRequest.findMany({
      include: { order: { include: { items: { include: { product: { select: { id: true, title: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ returns });
  }

  // buyer
  const returns = await prisma.returnRequest.findMany({
    where: { buyerEmail: email },
    include: { order: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ returns });
}
