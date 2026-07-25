import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { getPayoutRail } from '@/lib/payoutRail'
import { codeToCountryName } from '@/lib/worldCountries'

// One-off (but safe to re-run any time) admin repair endpoint.
//
// Original bug (fixed 2026-07-21): every approved Seller's payoutRail was
// resolved from SellerApplication.country, which stores the full country
// name. getPayoutRail() only matched 2-letter ISO codes, so this always
// missed and silently defaulted every seller to PAYONEER. Fixed at the
// source in lib/provisionSeller.ts.
//
// Second, related bug (fixed 2026-07-25): Seller.country itself -- not just
// payoutRail -- could be flat-out wrong. It was populated from
// SellerApplication.country, a field the /apply form let a seller type
// completely independently of their real ship-from address (and, until
// today, a seller could keep re-typing it forever afterward, from
// Settings). A China-based, China-shipping seller could -- and did --
// select "United States" there, which then silently misrouted their
// payouts to Stripe and misrepresented their country on Pulse and anywhere
// else Seller.country is shown. /apply and Settings can no longer diverge
// (see app/api/seller/apply/route.ts and app/api/dashboard/settings/
// shipping/route.ts), but that only affects sellers provisioned or edited
// after today. This route corrects both Seller.country AND payoutRail for
// every already-approved seller, using their original application's real
// shippingCountry as the single source of truth.
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

  const changes: Array<{
    storeName: string
    oldCountry: string | null
    newCountry: string
    oldRail: string
    newRail: string
    shippingCountry: string
  }> = []
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
    const correctCountry = codeToCountryName(application.shippingCountry) ?? application.shippingCountry
    const railChanged = correctRail !== seller.payoutRail
    const countryChanged = correctCountry !== seller.country

    if (railChanged || countryChanged) {
      await prisma.seller.update({
        where: { id: seller.id },
        data: { payoutRail: correctRail, country: correctCountry },
      })
      changes.push({
        storeName: seller.storeName,
        oldCountry: seller.country,
        newCountry: correctCountry,
        oldRail: seller.payoutRail,
        newRail: correctRail,
        shippingCountry: application.shippingCountry,
      })
    }
  }

  // Same correction, applied directly to SellerApplication rows that are
  // still PENDING review -- so an admin looking at /pulse/applications
  // never sees a mismatched country for an application that hasn't been
  // approved yet either. Uses the applicant's own shippingCountry, not a
  // guess -- this corrects an internal inconsistency in what they already
  // submitted, not a change to their answers.
  const pendingApplications = await prisma.sellerApplication.findMany({
    where: { status: 'PENDING', shippingCountry: { not: null } },
    select: { id: true, businessName: true, country: true, shippingCountry: true },
  })

  const applicationChanges: Array<{ businessName: string; oldCountry: string | null; newCountry: string }> = []
  for (const app of pendingApplications) {
    if (!app.shippingCountry) continue
    const correctCountry = codeToCountryName(app.shippingCountry) ?? app.shippingCountry
    if (correctCountry !== app.country) {
      await prisma.sellerApplication.update({
        where: { id: app.id },
        data: { country: correctCountry },
      })
      applicationChanges.push({ businessName: app.businessName, oldCountry: app.country, newCountry: correctCountry })
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
    pendingApplicationsChecked: pendingApplications.length,
    pendingApplicationsUpdated: applicationChanges.length,
    pendingApplicationChanges: applicationChanges,
  })
}
