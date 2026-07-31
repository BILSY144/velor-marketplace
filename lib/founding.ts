import { prisma } from '@/lib/prisma'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'

// DEPRECATED (2026-07-18): this grants perks off Seller.foundingEligible,
// which was decided from SellerApplication.country -- the seller's
// self-reported registration country, not the actual origin of anything
// they sell. Nothing calls this anymore (see grantCountryFounderIfFirst
// below for the live mechanism); kept only so it isn't a breaking removal
// for any caller added elsewhere later.
//
// 2026-07-31 FROZEN (William's decision, via Claude session): even if
// something does start calling this again, it must not grant the Pro-tier
// perk anymore -- see the note on grantCountryFounderIfFirst below. Left as
// a no-op rather than deleted so a future caller gets an obvious empty
// result instead of a silent tier grant.
export async function maybeGrantFoundingPerks(_sellerId: string): Promise<void> {
  return
}

// Founding credit, decoupled from Seller.country -- see the CountryFounder
// comment in prisma/schema.prisma. Call this every time a product actually
// transitions to APPROVED with an originCountry set (the auto-moderate cron
// and the manual admin approval route are the only two places that
// happens). originCountry may be stored as either a country name or an ISO
// code, so it's resolved against WORLD_COUNTRIES before use.
//
// Two unique constraints do the real enforcement, not this function:
// countryCode unique means only the first approved product from a given
// culture wins that country; sellerId unique means a seller who already
// founded a country can never found a second one (William, 2026-07-18) --
// they can still sell on as many origin pages as their listings genuinely
// span, they just can't collect more than one founding credit. A P2002
// here just means someone else got there first (or this seller already
// holds a country), which is expected and not an error.
//
// 2026-07-31 REVISED (William's decision, via Claude session): the founding
// programme no longer grants the Pro-tier commission perk (4% + unlimited
// listings + AI account manager + API access + custom storefront) to new
// sellers. Velor now runs a single flat 10% commission for everyone going
// forward -- "no tiers at all" on commission. Exactly one pre-existing
// seller keeps the 4% rate already promised to them (a manual, one-time
// grandfather, not driven by this function); William's own seller account
// was moved off Pro/founding back to the flat rate in the same change.
//
// What a new country-founder DOES still get (William's follow-up decision,
// same session): the permanent "Founding Seller" badge and the priority
// search-placement boost that comes with it (see FOUNDING_BOOST in
// lib/seller-ranking.ts) -- pure recognition/visibility, zero commission
// impact, costs Velor nothing. That's why foundingBadge is still granted
// below; tier is deliberately NOT touched (stays whatever it already was --
// STARTER for a brand-new seller).
// See docs/SUBSCRIPTION_AND_TIERS.md for the full decision record, and
// app/founding/page.tsx + app/sell/page.tsx for the corresponding copy.
export async function grantCountryFounderIfFirst(
  sellerId: string,
  productId: string,
  originCountry: string | null | undefined
): Promise<void> {
  if (!originCountry) return
  const match = WORLD_COUNTRIES.find(
    (c) => c.name === originCountry || c.code === originCountry.toUpperCase()
  )
  if (!match) return

  try {
    await prisma.countryFounder.create({
      data: { countryCode: match.code, countryName: match.name, sellerId, productId },
    })
  } catch (err: any) {
    if (err?.code === 'P2002') return
    throw err
  }

  // Badge + priority placement only -- NOT tier. A second call for the same
  // seller can't happen (the sellerId unique constraint on CountryFounder
  // already threw above), so this always runs at most once per seller.
  await prisma.seller.update({
    where: { id: sellerId },
    data: { foundingPerksGrantedAt: new Date(), foundingBadge: true },
  })
}
