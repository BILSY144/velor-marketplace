import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    // Yesterday: midnight to midnight UTC
    const yesterdayStart = new Date(now);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
    yesterdayStart.setUTCHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setUTCHours(23, 59, 59, 999);

    // Day before yesterday
    const dayBeforeStart = new Date(yesterdayStart);
    dayBeforeStart.setUTCDate(dayBeforeStart.getUTCDate() - 1);
    const dayBeforeEnd = new Date(dayBeforeStart);
    dayBeforeEnd.setUTCHours(23, 59, 59, 999);

    // Count pageviews for each day
    const [yesterdayViews, dayBeforeViews] = await Promise.all([
      prisma.pageView.count({
        where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      }),
      prisma.pageView.count({
        where: { createdAt: { gte: dayBeforeStart, lte: dayBeforeEnd } },
      }),
    ]);

    // Unique paths hit yesterday
    const topPagesRaw = await prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 5,
    });

    const topPages = topPagesRaw.map(p => ({ path: p.path, views: p._count.path }));

    const delta = yesterdayViews - dayBeforeViews;
    const deltaPercent = dayBeforeViews > 0
      ? Math.round((delta / dayBeforeViews) * 100)
      : null;

    const growing = yesterdayViews > dayBeforeViews;
    const status = growing ? 'success' : yesterdayViews === dayBeforeViews ? 'warning' : 'warning';

    // Always log to AgentLog for director briefing
    await prisma.agentLog.create({
      data: {
        agentName: 'TrafficMonitor',
        action: 'daily_traffic_check',
        status,
        details: {
          date: yesterdayStart.toISOString().slice(0, 10),
          yesterdayViews,
          dayBeforeViews,
          delta,
          deltaPercent,
          growing,
          topPages,
          alert: growing
            ? null
            : `Traffic did NOT increase: ${yesterdayViews} views yesterday vs ${dayBeforeViews} the day before (${delta < 0 ? delta : '+' + delta}). Agents need to drive more outreach.`,
        },
      },
    });

    // If traffic dropped — log a separate alert entry
    if (!growing && dayBeforeViews > 0) {
      await prisma.agentLog.create({
        data: {
          agentName: 'TrafficMonitor',
          action: 'traffic_no_growth_alert',
          status: 'warning',
          details: {
            message: `ALERT: Daily traffic did not grow. Yesterday: ${yesterdayViews} vs prior day: ${dayBeforeViews} (${deltaPercent !== null ? deltaPercent + '%' : 'N/A'} change). Scout and outreach agents must intensify activity.`,
            yesterdayViews,
            dayBeforeViews,
            delta,
          },
        },
      });
    }

    return NextResponse.json({
      ok: true,
      date: yesterdayStart.toISOString().slice(0, 10),
      yesterdayViews,
      dayBeforeViews,
      delta,
      deltaPercent,
      growing,
      topPages,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
