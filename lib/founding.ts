import { prisma } from '@/lib/prisma'

// Founding-seller perks (Pro tier at no charge, the founding badge, and the
// "first store on your country's page" credit) are a promise, not an
// automatic grant. William's standing rule (2026-07-09): a seller must
// actually list at least one product before the perks activate -- being
// approved and eligible is not enough on its own.
//
// Call this after any successful product creation. It is cheap to call
// repeatedly: it no-ops once foundingPerksGrantedAt is set, and no-ops for
// any seller who was never marked foundingEligible at approval time.
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
      // "Pro, free for life" -- move them onto the Pro tier's commission and
      // listing limit. This does NOT create a Stripe subscription or charge
      // them: no stripeSubscriptionId is set, so TIER_CONFIG's monthlyFee
      // for Pro is never actually billed. (Enterprise tier retired
      // 2026-07-15 — Pro carries all its benefits.)
      tier: 'PRO',
    },
  })
}
