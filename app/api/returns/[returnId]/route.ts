import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { returnId } = await params;

  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: true },
  });
  if (!returnRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email } });
  const isAdmin = user?.role === 'ADMIN';
  const isBuyer = returnRequest.buyerEmail === email;

  if (!isBuyer && !isAdmin) {
    const seller = await prisma.seller.findFirst({ where: { user: { email } } });
    if (!seller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const hasItem = await prisma.orderItem.findFirst({
      where: { orderId: returnRequest.orderId, product: { sellerId: seller.id } },
    });
    if (!hasItem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ returnRequest });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { returnId } = await params;
  const body = await req.json() as { status?: string; notes?: string };

  const returnRequest = await prisma.returnRequest.findUnique({ where: { id: returnId } });
  if (!returnRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email } });
  const isAdmin = user?.role === 'ADMIN';

  if (!isAdmin) {
    const seller = await prisma.seller.findFirst({ where: { user: { email } } });
    if (!seller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const hasItem = await prisma.orderItem.findFirst({
      where: { orderId: returnRequest.orderId, product: { sellerId: seller.id } },
    });
    if (!hasItem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return NextResponse.json({ returnRequest: updated });
}
