import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { approveApplication } from '@/lib/provisionSeller'

// One-off admin endpoint: reopens and approves the Wasizo deco application
// (id cmrh3jw5t0001dmkse6q035ux -- Santoz nugroz, nugrahamedia@gmail.com,
// Indonesia), which the automated "seller-onboarding" agent auto-rejected in
// 5 minutes for having 0 photos, before William reviewed it himself.
//
// William's instruction (2026-07-18): approve this seller now. The priority
// right now is getting sellers onboard and listing to get the marketplace's
// momentum going -- identity verification can finish later. Verification is
// enforced separately and automatically at payout time by the
// identityVerified gate in app/api/cron/release-payouts/route.ts: a seller
// can list and sell before verifying, but no payout is ever released to an
// unverified seller on either payout rail.
//
// approveApplication() in lib/provisionSeller.ts refuses to touch anything
// that isn't currently PENDING, by design (see its own doc comment) -- there
// is deliberately no fast path that skips real provisioning. Rather than
// bypass that guard, this endpoint satisfies it for real: the application's
// status is reset to PENDING first, then run through the exact same
// approval path any normal PENDING application takes (Seller row creation,
// approval + new-seller-alert emails, founding-eligibility calc, shipping
// profile provisioning). No shortcut, no duplicate-provisioning risk, and
// the review trail (reviewedAt/reviewedBy) still ends up accurate.
const APPLICATION_ID = 'cmrh3jw5t0001dmkse6q035ux'

export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const application = await prisma.sellerApplication.findUnique({ where: { id: APPLICATION_ID } })
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }
  if (application.status !== 'REJECTED') {
    return NextResponse.json(
      { error: `Refusing to touch this application -- expected status REJECTED, found ${application.status}` },
      { status: 400 }
    )
  }

  const reopened = await prisma.sellerApplication.update({
    where: { id: APPLICATION_ID },
    data: { status: 'PENDING', reviewedAt: null, reviewedBy: null },
  })

  const result = await approveApplication(
    reopened,
    'admin (pulse) -- William, reopened from REJECTED (0-photos auto-reject overridden) 2026-07-18'
  )

  return NextResponse.json({ ok: true, application: result })
}
