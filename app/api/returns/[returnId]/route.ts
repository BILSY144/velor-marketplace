import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { returnId } = await params;

  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: { include: { items: true } } },
  });
  if (!returnRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email } });
  const isAdmin = user?.role === 'ADMIN';
  const isBuyer = returnRequest.customerEmail === email;

  if (!isBuyer && !isAdmin) {
    const seller = await prisma.seller.findFirst({ where: { user: { email } } });
    if (!seller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (returnRequest.order.sellerId !== seller.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(returnRequest);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { returnId } = await params;
  const body = await req.json() as { status?: string; notes?: string };

  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: true },
  });
  if (!returnRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email } });
  const isAdmin = user?.role === 'ADMIN';

  if (!isAdmin) {
    const seller = await prisma.seller.findFirst({ where: { user: { email } } });
    if (!seller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (returnRequest.order.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  let stripeRefundId: string | undefined;
  if (body.status === 'APPROVED' && returnRequest.status !== 'APPROVED') {
    const order = returnRequest.order;
    if (order.stripePaymentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentId,
        });
        stripeRefundId = refund.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Stripe refund failed';
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }
  }

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  await prisma.agentLog.create({
    data: {
      agentName: 'returns',
      action: body.status === 'APPROVED' ? 'refund_issued' : 'status_updated',
      status: 'success',
      details: {
        returnId,
        orderId: returnRequest.orderId,
        newStatus: body.status ?? null,
        stripeRefundId: stripeRefundId ?? null,
      },
    },
  });

  return NextResponse.json({ ...updated, stripeRefundId });
}
