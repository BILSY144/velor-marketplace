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
// Not touched by this change: /marketplace/[id] (the per-product detail
// page one level down) still exists and still works -- at the time this
// redirect shipped, app/search/page.tsx actively linked search results to
// /marketplace/${id}, so that route stayed live and was out of scope here.
// CORRECTION (standing SEO agent, 2026-07-17): that premise is no longer
// true. A later, unrelated commit changed both of app/search/page.tsx's
// result-card branches to link to /shop/${item.id} instead, so
// /marketplace/[id] is now fully orphaned -- confirmed via a repo-wide grep
// finding zero remaining internal links to it anywhere outside its own
// unimported sibling (MarketplaceGrid.tsx) and its own self-referential
// "Back to Marketplace" links (which point at this now-redirecting page).
// The route itself is untouched and still works if hit directly, but is
// now noindex/nofollow (see app/marketplace/[id]/page.tsx's own header
// comment for the full reasoning) rather than left silently indexable
// under the wrong, inherited root metadata. /api/marketplace/products also
// stays, since ProductDetail.tsx (rendered by /marketplace/[id]) still
// calls it.
export default function MarketplacePage() {
  permanentRedirect('/shop')
}
