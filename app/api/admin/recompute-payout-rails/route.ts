import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { getPayoutRail } from '@/lib/payoutRail'

// One-off (but safe to re-run any time) admin repair endpoint.
//
// Bug: every approved Seller's payoutRail was resolved from
// SellerApplication.country, which stores the full country name (the
// /apply form's <select> uses c.name as the option value, e.g. "United
// States"). getPayoutRail() only matches 2-letter ISO codes, so this
// always missed and silently defaulted every seller to PAYONEER --
// regardless of their actual country -- even Stripe-supported ones like
// the UK and US. Fixed at the source in lib/provisionSeller.ts (now reads
// shippingCountry, which is captured as a proper ISO code on every
// application), but that only affects sellers provisioned after the fix.
// This route recomputes and corrects payoutRail for every already-approved
// seller using their original application's shippingCountry.
//
// No direct FK from Seller to SellerApplication -- matched the same way
// the rest of the codebase links them, via contactEmail === User.email.
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sellers = await prisma.seller.findMany({
    where: { approved: true },
    include: { user: { select: { email: true } } },
  })

  const changes: Array<{ storeName: string; oldRail: string; newRail: string; shippingCountry: string | null }> = []
  let checked = 0
  let skippedNoEmail = 0
  let skippedNoApplication = 0
  let skippedNoShippingCountry = 0

  for (const seller of sellers) {
    const email = seller.user?.email
    if (!email) {
      skippedNoEmail++
      continue
    }

    const application = await prisma.sellerApplication.findFirst({
      where: { contactEmail: email },
      orderBy: { createdAt: 'desc' },
      select: { shippingCountry: true },
    })

    if (!application) {
      skippedNoApplication++
      continue
    }
    if (!application.shippingCountry) {
      skippedNoShippingCountry++
      continue
    }

    checked++
    const correctRail = getPayoutRail(application.shippingCountry)
    if (correctRail !== seller.payoutRail) {
      await prisma.seller.update({
        where: { id: seller.id },
        data: { payoutRail: correctRail },
      })
      changes.push({
        storeName: seller.storeName,
        oldRail: seller.payoutRail,
        newRail: correctRail,
        shippingCountry: application.shippingCountry,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    totalApprovedSellers: sellers.length,
    checked,
    updated: changes.length,
    changes,
    skippedNoEmail,
    skippedNoApplication,
    skippedNoShippingCountry,
  })
}
