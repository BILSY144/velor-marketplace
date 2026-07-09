import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { qualifyProspect } from '@/lib/prospectQualify';

// AI screening gate. Runs after scout-sellers, before outreach-auto.
//
// Every scouted prospect starts with qualified: null (unscreened). This job
// judges each one with qualifyProspect() and records the verdict. Only
// qualified: true prospects are ever eligible for Stage 1 of outreach-auto
// (see the where clause there) -- factory/wholesale/service/unrelated
// prospects are marked qualified: false and never emailed.
//
// LAW #1: on API/parse failure, leave the prospect unscreened (qualified
// stays null) so the next run retries it. Never default to qualified: true
// on error just to keep the outreach pipeline fed.

const MAX_PER_RUN = Number(process.env.QUALIFY_MAX_PER_RUN) || 40;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prospects = await prisma.sellerProspect.findMany({
    where: { status: 'prospected', qualified: null, email: { not: null } },
    orderBy: { score: 'desc' },
    take: MAX_PER_RUN,
  });

  let qualified = 0;
  let rejected = 0;
  const errors: string[] = [];

  for (const p of prospects) {
    try {
      const result = await qualifyProspect({
        name: p.name,
        platform: p.platform,
        storeUrl: p.storeUrl,
        category: p.category,
        sellerType: p.sellerType,
        country: p.country,
        notes: p.notes,
      });

      await prisma.sellerProspect.update({
        where: { id: p.id },
        data: {
          qualified: result.verdict === 'qualify',
          qualificationNotes: result.reason,
          qualifiedAt: new Date(),
        },
      });

      if (result.verdict === 'qualify') qualified++;
      else rejected++;
    } catch (err) {
      // Leave qualified: null -- retried automatically next run.
      errors.push(`${p.id}: ${err instanceof Error ? err.message : 'error'}`);
    }
  }

  return NextResponse.json({
    ok: true,
    screened: prospects.length,
    qualified,
    rejected,
    errors,
  });
}
