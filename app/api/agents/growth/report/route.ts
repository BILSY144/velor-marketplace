import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysBack = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '30')));
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const prevSince = new Date(since.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const [newBuyers, prevNewBuyers, newSellers, prevNewSellers, newProducts,
         activeProspects, pendingApplications, recentApplications, topSellers] =
    await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      prisma.seller.count({ where: { createdAt: { gte: since } } }),
      prisma.seller.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      prisma.product.count({ where: { createdAt: { gte: since }, status: 'APPROVED' } }),
      prisma.sellerProspect.count({ where: { status: { in: ['prospected', 'contacted'] } } }),
      prisma.sellerApplication.count({ where: { status: 'PENDING' } }),
      prisma.sellerApplication.count({ where: { createdAt: { gte: since } } }),
      prisma.seller.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, storeName: true, createdAt: true } }),
    ]);

  const buyerGrowth = prevNewBuyers > 0 ? (((newBuyers - prevNewBuyers) / prevNewBuyers) * 100).toFixed(1) + '%' : 'N/A';
  const sellerGrowth = prevNewSellers > 0 ? (((newSellers - prevNewSellers) / prevNewSellers) * 100).toFixed(1) + '%' : 'N/A';

  return NextResponse.json({
    period: `Last ${daysBack} days`,
    since: since.toISOString(),
    buyers: { new: newBuyers, growth: buyerGrowth },
    sellers: { new: newSellers, growth: sellerGrowth, recentlyJoined: topSellers },
    products: { newActive: newProducts },
    pipeline: { activeProspects, pendingApplications, applicationsThisPeriod: recentApplications },
  });
}