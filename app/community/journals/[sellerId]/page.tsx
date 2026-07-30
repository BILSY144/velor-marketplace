import { redirect } from 'next/navigation'

// Legacy URL (Velor Social stage 4, pre-2026-07-30): this used to be the
// real per-seller journal page. William, 2026-07-30 ("get rid of the
// storefront and have the journal replace it"): that page and the seller
// storefront are now one page, living at /seller/[sellerId] -- so the
// storefront IS the journal for any seller who has published an entry, with
// a genuine Shop section built in. This route just forwards old links
// (shared journal URLs, bookmarks, anything not yet updated) to the new
// canonical address rather than 404ing them.
export default async function LegacySellerJournalRedirect({
  params,
}: {
  params: Promise<{ sellerId: string }>
}) {
  const { sellerId } = await params
  redirect(`/seller/${sellerId}`)
}
