import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { getPayoutRail } from '@/lib/payoutRail'

// One-off admin repair endpoint (William, 2026-07-26, "automatically switch
// them to their countries rail so they can start listing immediatly...
// please fix this immediately without them having to do it their selfs or
// resign in").
//
// Built for the hushlume / 17580690095@163.com seller row specifically, but
// kept generic (explicit sellerId + country in the request body, no
// inference) since app/api/admin/recompute-payout-rails only repairs
// sellers it can match to a SellerApplication row via contactEmail -- this
// covers the sellers it skips (skippedNoApplication / skippedNoShippingCountry),
// e.g. a Seller row with country: null created outside the normal /apply
// flow (the two hushlume duplicate accounts from the Stripe/Payoneer
// consolidation). A null Seller.country makes getPayoutRail() fall through
// to its "unparseable country" default of STRIPE (see lib/payoutRail.ts) --
// which is exactly wrong for a real China-based seller who can never
// complete Stripe Connect onboarding (Stripe does not support China), so
// the payout-verification gate (lib/payoutGateCookie.ts) permanently
// blocked their whole dashboard except the payout setup page.
//
// Sets Seller.country to the given value and recomputes payoutRail from
// it -- same derivation recompute-payout-rails already uses, just driven
// by an admin-supplied country instead of an application record. Once
// payoutRail is PAYONEER, the gate is unconditionally satisfied (Payoneer
// verification is exempted while its partner API isn't live yet -- see
// lib/payoutGateCookie.ts), so this alone unblocks the dashboard: no
// sign-out, no seller-side action, next dashboard page load self-heals the
// gate cookie via the same resolver every dashboard mount already calls.
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const sellerId = typeof body?.sellerId === 'string' ? body.sellerId : null
  const country = typeof body?.country === 'string' ? body.country.trim() : null

  if (!sellerId || !country) {
    return NextResponse.json({ error: 'sellerId and country are both required' }, { status: 400 })
  }

  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: { user: { select: { email: true } } },
  })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
  }

  const newRail = getPayoutRail(country)

  const updated = await prisma.seller.update({
    where: { id: sellerId },
    data: { country, payoutRail: newRail },
  })

  return NextResponse.json({
    ok: true,
    sellerId,
    email: seller.user?.email ?? null,
    before: { country: seller.country, payoutRail: seller.payoutRail },
    after: { country: updated.country, payoutRail: updated.payoutRail },
  })
}
