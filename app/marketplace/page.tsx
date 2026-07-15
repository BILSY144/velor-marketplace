import { permanentRedirect } from 'next/navigation'

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
// SEO agent follow-up (2026-07-15): swapped next/navigation's redirect()
// for permanentRedirect(). redirect() serves a 307 (temporary) HTTP status
// by default -- see https://nextjs.org/docs/app/api-reference/functions/redirect
// ("If you'd like to return a 308 (Permanent) HTTP redirect instead of 307
// (Temporary), you can use the permanentRedirect function instead").
// William's decision here is permanent (kill the duplicate page, keep one
// browse-all-products URL), so the HTTP signal search engines see should
// say the same thing: a 307 tells crawlers to keep re-checking /marketplace
// indefinitely and keeps any of its existing link equity/ranking signals
// parked on the old URL, while a 308 tells them to consolidate to /shop and
// stop indexing /marketplace going forward. Functionally identical redirect
// for real users and for MarketplaceGrid.tsx (still unimported, unchanged);
// only the HTTP status code sent to crawlers changes.
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
  permanentRedirect('/shop')
}
