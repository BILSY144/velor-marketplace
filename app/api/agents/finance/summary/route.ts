import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysBack = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '7')));

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const prevSince = new Date(since.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const [currentOrders, previousOrders, currentPayouts, returnRequests] =
    await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
        select: { id: true, subtotal: true, status: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: prevSince, lt: since }, status: { not: 'CANCELLED' } },
        select: { subtotal: true },
      }),
      prisma.payout.findMany({
        where: { createdAt: { gte: since } },
        select: { amount: true, status: true },
      }),
      prisma.returnRequest.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, status: true },
      }),
    ]);

  const gmv = currentOrders.reduce((s, o) => s + Number(o.subtotal), 0);
  const prevGmv = previousOrders.reduce((s, o) => s + Number(o.subtotal), 0);
  const platformRevenue = gmv * 0.15;
  const payoutsTotal = currentPayouts.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayouts = currentPayouts.filter(p => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0);
  const gmvChange = prevGmv > 0 ? (((gmv - prevGmv) / prevGmv) * 100).toFixed(1) + '%' : 'N/A';

  await prisma.agentLog.create({
    data: {
      agentName: 'finance',
      action: 'summary_generated',
      status: 'success',
      details: {
        ordersCount: currentOrders.length,
        payoutsCount: currentPayouts.length,
        returnsCount: returnRequests.length,
      },
    },
  });

  return NextResponse.json({
    period: `Last ${daysBack} days`,
    since: since.toISOString(),
    gmv, gmvChange, platformRevenue,
    orderCount: currentOrders.length,
    payoutsTotal, pendingPayouts,
    openReturns: returnRequests.filter(r => r.status === 'PENDING').length,
    totalReturns: returnRequests.length,
  });
}
