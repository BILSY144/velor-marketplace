import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { resolvePayoutGate, setPayoutGateCookie } from '@/lib/payoutGate';

export const dynamic = 'force-dynamic';

// Payout-verification dashboard gate status. Called by app/dashboard/layout.tsx
// on every dashboard load so the velor_payout_setup cookie middleware.ts checks
// stays fresh (self-heals if a seller finishes onboarding, disconnects, or their
// country's rail changes) without adding a Prisma dependency to Edge middleware.
// See lib/payoutGateCookie.ts for what "satisfied" means per rail.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gate = await resolvePayoutGate(session.user.id);
  if (!gate) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

  const res = NextResponse.json(gate);
  setPayoutGateCookie(res, gate.satisfied, session.user.id);
  return res;
}
