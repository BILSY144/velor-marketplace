import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail, buildSellerCoachingEmail, buildSellerPerformanceEmail } from '@/lib/email';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const seller = await prisma.seller.findUnique({
    where: { id: params.sellerId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [activeProducts, recentOrders] = await Promise.all([
    prisma.product.count({
      where: { sellerId: params.sellerId, status: 'ACTIVE' },
    }),
    prisma.order.findMany({
      where: {
        items: { some: { product: { sellerId: params.sellerId } } },
        createdAt: { gte: weekAgo },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          where: { product: { sellerId: params.sellerId } },
          include: { product: { select: { id: true, name: true, views: true } } },
        },
      },
    }),
  ]);

  const weeklyRevenue = recentOrders.reduce(
    (sum, order) => sum + order.items.reduce((s, item) => s + Number(item.price) * item.quantity, 0),
    0
  );

  const productViewMap: Record<string, { name: string; views: number; sales: number }> = {};
  for (const order of recentOrders) {
    for (const item of order.items) {
      const pid = item.product.id;
      if (!productViewMap[pid]) {
        productViewMap[pid] = { name: item.product.name, views: item.product.views ?? 0, sales: 0 };
      }
      productViewMap[pid].sales += item.quantity;
    }
  }

  const topProduct = Object.values(productViewMap).sort((a, b) => b.sales - a.sales)[0] ?? null;
  const weeklyViews = Object.values(productViewMap).reduce((s, p) => s + p.views, 0);
  const conversionRate =
    weeklyViews > 0 ? ((recentOrders.length / weeklyViews) * 100).toFixed(1) + '%' : '0%';

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
  { params }: { params: { sellerId: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (!action || !['send_coaching', 'send_performance_report'].includes(action)) {
    return NextResponse.json(
      { error: 'action must be send_coaching or send_performance_report' },
      { status: 400 }
    );
  }

  const seller = await prisma.seller.findUnique({
    where: { id: params.sellerId },
    include: { user: { select: { email: true, name: true } } },
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
    return NextResponse.json({ success: true, action, to: seller.user.email });
  }
}