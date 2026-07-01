import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { disputeId } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { order: { include: { items: true } } },
  });
  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email } });
  const isAdmin = user?.role === 'ADMIN';
  const isBuyer = dispute.raisedBy === email;

  if (!isBuyer && !isAdmin) {
    const seller = await prisma.seller.findFirst({ where: { user: { email } } });
    if (!seller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (dispute.order.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json({ dispute });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { disputeId } = await params;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { status?: string; resolution?: string };

  const updated = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.resolution !== undefined && { resolution: body.resolution }),
    },
  });

  return NextResponse.json({ dispute: updated });
}
