// Shared instant-listing moderation rules (William, 2026-07-26: "i want
// every listing to be approved automatically. so they dont wait for
// approval. then once listed we will review for banned products or
// something that should not be listed. that is how ebay do it" --
// followed up, when asked specifically about regulated/CITES-type
// materials, with: keep those held for a human check before going live,
// everything else lists instantly).
//
// So there are now three places a listing's fate gets decided, and all
// three must use the SAME two pattern lists below or they will quietly
// drift apart:
//   1. app/api/dashboard/products/route.ts (POST) -- runs this synchronously
//      at creation. FORBIDDEN_PATTERNS is a hard reject (400, listing is
//      never created). REGULATED_SIGNALS (or a seller-declared
//      containsRegulatedMaterial) keeps status PENDING_REVIEW instead of
//      auto-approving -- everything else goes straight to APPROVED with
//      zero wait.
//   2. app/api/admin/products/auto-moderate/route.ts -- the pre-existing
//      cron. With (1) in place this now only ever sees the narrow set of
//      listings that stayed in PENDING_REVIEW (certificate track, an
//      undeclared regulated-material signal, or any legacy row from
//      before this change) -- it is the backstop that eventually resolves
//      those, not the normal path any more.
//   3. Anywhere that needs to explain to a seller why a listing didn't go
//      live instantly.
//
// checkProhibitedListingContent (lib/prohibitedListingContent.ts) is a
// SEPARATE, stricter list -- antiques/artifacts/CITES-adjacent items Velor
// never allows at all, regardless of certificates. That one was already
// enforced synchronously before this change and is unaffected by it.

export const FORBIDDEN_PATTERNS = [
  /weapon|gun|knife|blade|explosive|bomb/i,
  /adult|porn|xxx/i,
  /drug|narcotic|steroid/i,
  /counterfeit|fake|replica|knockoff/i,
  /tobacco|cigarette|vape|nicotine/i,
  /alcohol|liquor|spirits|wine|beer/i,
]

// Regulated-material signals: if these appear and the seller did NOT
// declare the product as regulated (containsRegulatedMaterial /
// requiresCertificate), hold it for human review rather than approving --
// publishing a possibly-protected-species item live, even briefly, without
// proof of legal sourcing is a real legal risk, not just a quality issue.
export const REGULATED_SIGNALS = [
  /\bcoral\b/i,
  /python|crocodile|alligator|snakeskin|lizard\s*skin/i,
  /\brosewood\b|\bagarwood\b/i,
  /\bfur\b|\bfeather/i,
  /\bbone\b|\bhorn\b|\bshell\b/i,
]

// Returns the first forbidden pattern that matches title/description/materials,
// or null if none do. A match means: never create the listing (hard reject),
// same as checkProhibitedListingContent.
export function checkForbiddenPatterns(
  title: string,
  description?: string | null,
  materials?: string | null
): RegExp | null {
  const text = [title, description || '', materials || ''].join(' ')
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) return pattern
  }
  return null
}

// Returns the first undeclared regulated-material signal that matches, or
// null if none do -- used both to decide whether an otherwise-clean
// listing still needs to hold in PENDING_REVIEW rather than auto-approve
// instantly, AND as the evidence in the review-needed alert email sent to
// William (buildListingNeedsReviewAlertEmail in lib/email.ts) so he can see
// exactly what triggered the hold.
export function detectRegulatedSignal(
  title: string,
  description?: string | null,
  materials?: string | null
): RegExp | null {
  const text = [title, description || '', materials || ''].join(' ')
  for (const pattern of REGULATED_SIGNALS) {
    if (pattern.test(text)) return pattern
  }
  return null
}

// Convenience boolean wrapper around detectRegulatedSignal.
export function hasRegulatedSignal(
  title: string,
  description?: string | null,
  materials?: string | null
): boolean {
  return detectRegulatedSignal(title, description, materials) !== null
}
