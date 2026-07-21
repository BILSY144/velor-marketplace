import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronSecret } from '@/lib/cronAuth'

export const maxDuration = 60

// RETIRED 2026-07-21 (William: identity works "like payouts" -- no separate
// photo-ID step). This cron used to escalate pressure on approved sellers to
// complete a Stripe Identity photo-ID session. That step no longer exists:
// identity assurance is the payout rail's own KYC (Stripe Connect account
// enabled / Payoneer payee ACTIVE), enforced live by
// app/api/cron/release-payouts before any money moves, and self-healing
// Seller.identityVerified when the rail confirms.
//
// Kept as a harmless no-op (rather than deleted) so the vercel.json cron
// entry and any dashboards referencing the route stay valid. FOLLOW-UP
// CANDIDATE, not yet built: repurpose this slot as a payout-SETUP reminder
// ladder (sellers with earnings accruing in escrow but no completed payout
// onboarding), which under the new model is the gap actually worth nudging.
export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  await prisma.agentLog
    .create({
      data: {
        agentName: 'verification-reminders',
        action: 'noop',
        status: 'success',
        details: {
          note: 'Photo-ID reminder ladder retired 2026-07-21 -- identity is verified by the payout rail (Stripe/Payoneer KYC). See release-payouts.',
        },
      },
    })
    .catch(() => {})

  return NextResponse.json({
    ok: true,
    retired: true,
    note: 'Identity is verified via payout-rail KYC; no photo-ID reminders are sent.',
  })
}
