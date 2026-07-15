import { redirect } from 'next/navigation'

// /marketplace was a second, older "browse all products" grid running
// alongside /shop -- same underlying Product table (via a separate
// /api/marketplace/products endpoint), separately styled, unlinked from
// GlobalHeader/GlobalFooter or any other real nav. Flagged by the standing
// SEO agent's SEO_LOG.md as backlog item 20 ("live, indexable, unlinked
// duplicate of /shop") and left as a judgment call for William, since
// choosing to delete/redirect/differentiate isn't a fact-based SEO fix.
// William chose redirect (2026-07-15): one indexable browse-all-products
// page, not two competing for the same search intent.
//
// MarketplaceGrid.tsx (this page's old body) is left in place, now
// unimported -- same "flag, don't unilaterally delete" treatment already
// given to the codebase's other stray/unused components (Navigation.tsx,
// Footer.tsx; see SEO_LOG.md items 9/16).
//
// Deliberately NOT touched by this change: /marketplace/[id] (the
// per-product detail page one level down) -- app/search/page.tsx actively
// links search results to /marketplace/${id}, so that route stays live and
// is out of scope for this fix. /api/marketplace/products also stays, since
// ProductDetail.tsx (rendered by /marketplace/[id]) still calls it.
export default function MarketplacePage() {
  redirect('/shop')
}
