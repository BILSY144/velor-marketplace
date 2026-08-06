// Shared category-activity ordering — used everywhere a page presents a
// list of categories (homepage culture reels, /shop category filter pills,
// /marketplace category buttons, /search category matches) so real seller
// listings earn visibility over the still stock-photo/empty categories.
//
// (William, 2026-07-26: "as soon as a seller lists an item that category
// reel on homepage climbs to the top" -- then, same message thread,
// "that is the same for every product page, the same system, until at
// least half of pages full, then revert to ranking climbing.")
//
// Two phases, driven by how much of the 24-category taxonomy (lib/
// categories.ts) has any real listing yet:
//
//   COLD START (fewer than half the categories have >=1 approved listing):
//     binary boost only -- any category with real listings moves ahead of
//     every category with none, but categories are NOT reshuffled by count
//     magnitude within that "has listings" bucket. This is deliberate: in
//     the early catalogue a handful of bulk-listed products from one
//     seller could otherwise permanently dominate a category that just
//     landed its first, equally real, listing. Ties keep the curated
//     default order from lib/categories.ts / CULTURE_REELS.
//
//   MATURE (at least half -- 12 of 24 -- categories have >=1 listing):
//     switch to pure count ranking -- every category sorts by its live
//     approved-product count, descending, ties keep the original order.
//     By this point there's enough real signal that count is a meaningful
//     ranking rather than noise from one early bulk-lister.
//
// Both phases are a STABLE sort (explicit index tiebreak, not relying only
// on the engine's stable-sort guarantee) so untouched categories never
// visibly jitter between renders.
//
// HOMEPAGE OVERRIDE (William, 2026-08-06: "on the homepage the most filled
// rail with most listings brought to the top and then followed by the
// second most filled rail and so on") -- the homepage reel call now passes
// { forceCountRanking: true } to skip the cold-start binary-boost phase
// entirely and always rank by live count, even before the taxonomy is half
// full. /shop, /marketplace and /search callers are unchanged and still
// respect the maturity gate described above.

import { CATEGORY_NAMES } from './categories'

export type CategoryCounts = Record<string, number>

const MATURITY_FRACTION = 0.5

function countFor(name: string, countsLower: Map<string, number>): number {
  return countsLower.get(name.toLowerCase()) ?? 0
}

// True once at least half the sitewide category taxonomy has a real,
// approved listing -- independent of which subset of categories a given
// page happens to be displaying.
export function isCategoryOrderingMature(categoryCounts: CategoryCounts): boolean {
  const countsLower = new Map(Object.entries(categoryCounts).map(([k, v]) => [k.toLowerCase(), v]))
  const populated = CATEGORY_NAMES.filter((name) => countFor(name, countsLower) > 0).length
  return populated >= Math.ceil(CATEGORY_NAMES.length * MATURITY_FRACTION)
}

// Reorders `items` (anything with a category name attached via
// `getCategoryName`) according to the phase above. Matches category names
// case-insensitively since some callers (CULTURE_REELS) use editorial
// casing while Product.category stores the canonical lib/categories.ts
// casing -- confirmed 1:1 by name across all 24 categories.
export function orderByCategoryActivity<T>(
  items: T[],
  getCategoryName: (item: T) => string,
  categoryCounts: CategoryCounts,
  opts?: { forceCountRanking?: boolean },
): T[] {
  const countsLower = new Map(Object.entries(categoryCounts).map(([k, v]) => [k.toLowerCase(), v]))
  const mature = opts?.forceCountRanking || isCategoryOrderingMature(categoryCounts)

  return items
    .map((item, index) => ({ item, index, count: countFor(getCategoryName(item), countsLower) }))
    .sort((a, b) => {
      const rank = mature ? b.count - a.count : (b.count > 0 ? 1 : 0) - (a.count > 0 ? 1 : 0)
      return rank !== 0 ? rank : a.index - b.index
    })
    .map((x) => x.item)
}
