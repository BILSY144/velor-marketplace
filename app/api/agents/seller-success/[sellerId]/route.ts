import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { sendEmail, buildSellerCoachingEmail, buildSellerPerformanceEmail } from '@/lib/email';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const seller = await prisma.seller.findUnique({
    where: { id: (await params).sellerId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [activeProducts, recentOrders] = await Promise.all([
    prisma.product.count({ where: { sellerId: seller.id, status: 'ACTIVE' } }),
    prisma.order.findMany({
      where: { sellerId: seller.id, createdAt: { gte: weekAgo } },
      include: { items: { include: { product: { select: { name: true, viewCount: true } } } } },
    }),
  ]);

  const weeklyRevenue = recentOrders.reduce((s, o) => s + o.total, 0);

  const productViewMap: Record<string, { name: string; viewCount: number; sales: number }> = {};
  for (const order of recentOrders) {
    for (const item of order.items) {
      const pid = item.productId;
      if (!productViewMap[pid]) {
        productViewMap[pid] = { name: item.product.name, viewCount: item.product.viewCount ?? 0, sales: 0 };
      }
      productViewMap[pid].sales += item.quantity;
    }
  }

  const topProduct = Object.values(productViewMap).sort((a, b) => b.sales - a.sales)[0] ?? null;
  const weeklyViews = Object.values(productViewMap).reduce((s, p) => s + p.viewCount, 0);
  const conversionRate =
    weeklyViews > 0 ? ((recentOrders.length / weeklyViews) * 100).toFixed(1) + '%' : '0%';

  await prisma.agentLog.create({
    data: {
      agentName: 'seller-success',
      action: 'health_check',
      status: 'success',
      targetId: seller.id,
      details: {
        sellerId: seller.id,
        storeName: seller.storeName,
        activeProducts,
        weeklyOrders: recentOrders.length,
        weeklyRevenue,
      },
    },
  });

  return NextResponse.json({
    seller: { id: seller.id, storeName: seller.storeName, email: seller.user?.email },
    stats: {
      activeProducts,
      weeklyOrders: recentOrders.length,
      weeklyRevenue,
      weeklyViews,
      conversionRate,
      topProduct: topProduct ? topProduct.name : null,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as {
    action: string;
    weeklyViews?: number;
    weeklySales?: number;
    weeklyRevenue?: number;
    conversionRate?: string;
    topProduct?: string;
  };
  const { action } = body;

  const seller = await prisma.seller.findUnique({
    where: { id: (await params).sellerId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
  }

  if (!seller.user?.email) {
    return NextResponse.json({ error: 'Seller has no email address' }, { status: 400 });
  }

  const sellerName = seller.user.name ?? seller.storeName;

  if (action === 'send_coaching') {
    const { subject, html } = buildSellerCoachingEmail({ sellerName });
    await sendEmail({ to: seller.user.email, subject, html });
    await prisma.agentLog.create({
      data: {
        agentName: 'seller-success',
        action: 'send_coaching',
        status: 'success',
        targetId: seller.id,
        details: { to: seller.user.email, sellerId: seller.id },
      },
    });
    return NextResponse.json({ success: true, action, to: seller.user.email });
  }

  if (action === 'send_performance_report') {
    const { weeklyViews, weeklySales, weeklyRevenue, conversionRate, topProduct } = body;
    const { subject, html } = buildSellerPerformanceEmail({
      sellerName,
      weeklyViews: weeklyViews ?? 0,
      weeklySales: weeklySales ?? 0,
      weeklyRevenue: weeklyRevenue ?? 0,
      conversionRate: conversionRate ?? '0%',
      topProduct: topProduct ?? 'N/A',
    });
    await sendEmail({ to: seller.user.email, subject, html });
    await prisma.agentLog.create({
      data: {
        agentName: 'seller-success',
        action: 'send_performance_report',
        status: 'success',
        targetId: seller.id,
        details: {
          to: seller.user.email,
          sellerId: seller.id,
          weeklyRevenue: weeklyRevenue ?? 0,
          weeklySales: weeklySales ?? 0,
        },
      },
    });
    return NextResponse.json({ success: true, action, to: seller.user.email });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
