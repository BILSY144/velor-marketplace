import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { ProductStatus } from '@prisma/client';
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

  const [approvedProducts, recentOrders] = await Promise.all([
    prisma.product.count({ where: { sellerId: seller.id, status: ProductStatus.APPROVED } }),
    prisma.order.findMany({
      where: { sellerId: seller.id, createdAt: { gte: weekAgo } },
      include: { items: { include: { product: { select: { title: true } } } } },
    }),
  ]);

  const weeklyRevenue = recentOrders.reduce((s, o) => s + o.subtotal, 0);

  const productSalesMap: Record<string, { name: string; sales: number }> = {};
  for (const order of recentOrders) {
    for (const item of order.items) {
      const pid = item.productId;
      if (!productSalesMap[pid]) {
        productSalesMap[pid] = { name: item.product.title, sales: 0 };
      }
      productSalesMap[pid].sales += item.quantity;
    }
  }

  const topProduct =
    Object.values(productSalesMap).sort((a, b) => b.sales - a.sales)[0] ?? null;

  await prisma.agentLog.create({
    data: {
      agentName: 'seller-success',
      action: 'health_check',
      status: 'success',
      details: {
        storeName: seller.storeName,
        approvedProducts,
        weeklyOrders: recentOrders.length,
        weeklyRevenue,
      },
    },
  });

  return NextResponse.json({
    seller: { id: seller.id, storeName: seller.storeName, email: seller.user?.email },
    stats: {
      approvedProducts,
      weeklyOrders: recentOrders.length,
      weeklyRevenue,
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
        details: {
          to: seller.user.email,
          weeklyRevenue: weeklyRevenue ?? 0,
          weeklySales: weeklySales ?? 0,
        },
      },
    });
    return NextResponse.json({ success: true, action, to: seller.user.email });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
