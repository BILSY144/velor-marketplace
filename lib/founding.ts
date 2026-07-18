import { prisma } from '@/lib/prisma'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'

// DEPRECATED (2026-07-18): this grants perks off Seller.foundingEligible,
// which was decided from SellerApplication.country -- the seller's
// self-reported registration country, not the actual origin of anything
// they sell. Nothing calls this anymore (see grantCountryFounderIfFirst
// below for the live mechanism); kept only so it isn't a breaking removal
// for any caller added elsewhere later.
export async function maybeGrantFoundingPerks(sellerId: string): Promise<void> {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { id: true, foundingEligible: true, foundingPerksGrantedAt: true, tier: true },
  })
  if (!seller || !seller.foundingEligible || seller.foundingPerksGrantedAt) return

  const productCount = await prisma.product.count({ where: { sellerId } })
  if (productCount < 1) return

  await prisma.seller.update({
    where: { id: sellerId },
    data: {
      foundingPerksGrantedAt: new Date(),
      foundingBadge: true,
      tier: 'PRO',
    },
  })
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

  // First (and only) country founded also activates the account-wide
  // perks -- Pro tier at no charge. This can only run once per seller: a
  // second call for the same seller would already have failed the create
  // above via the sellerId unique constraint.
  await prisma.seller.update({
    where: { id: sellerId },
    data: { foundingPerksGrantedAt: new Date(), foundingBadge: true, tier: 'PRO' },
  })
}
