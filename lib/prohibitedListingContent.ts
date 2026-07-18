// Hard-reject listing content per /legal/seller-rules section 3: genuine
// antiques/artifacts and the handful of CITES-adjacent materials our policy
// treats as an outright ban, never a certificate-gated review (that's a
// separate flow -- see Product.requiresCertificate / containsRegulatedMaterial
// in app/api/dashboard/products/route.ts, for materials that ARE legitimate
// to sell with the right paperwork).
//
// Shared by TWO callers so there is only ever one list to keep current:
//   1. app/api/dashboard/products/route.ts -- blocks at submission time, so
//      a seller gets an immediate, specific reason instead of finding out
//      up to 5 minutes later that their listing silently disappeared.
//   2. app/api/admin/products/auto-moderate/route.ts -- the safety net that
//      catches anything that reaches PENDING_REVIEW some other way.
//
// Prompted by a real case: Aadya Bazaar (approved 2026-07-18) had listings
// like "Vintage Oxchuc Mexican Huipil" and "5 Old Mayan Crystal Necklaces
// from Guatemala" that the auto-moderate cron's original antique regex
// (antique|artifact|archaeological only) would NOT have caught -- it only
// matched the literal word "antique". This list is deliberately wider.

export type ProhibitedListingCategory = 'antique' | 'ivory' | 'tortoiseshell' | 'protected-feather'

export interface ProhibitedContentCheck {
  blocked: boolean
  category: ProhibitedListingCategory | null
  matchedTerm: string | null
}

const PROHIBITED_PATTERNS: Array<{ category: ProhibitedListingCategory; pattern: RegExp }> = [
  // Antiques / artifacts / cultural-heritage items -- see seller-rules
  // section 3: newly made cultural/artisan goods are welcome, genuine
  // antiquities are not, regardless of how they were acquired.
  { category: 'antique', pattern: /\bantiques?\b/i },
  { category: 'antique', pattern: /\bvintage\b/i },
  { category: 'antique', pattern: /\bancient\b/i },
  { category: 'antique', pattern: /\bartifacts?\b/i },
  { category: 'antique', pattern: /archaeolog(?:y|ical)|archeolog(?:y|ical)/i },
  { category: 'antique', pattern: /\brelics?\b/i },
  { category: 'antique', pattern: /pre[- ]?columbian/i },
  { category: 'antique', pattern: /\bexcavated\b|\bunearthed\b/i },
  { category: 'antique', pattern: /\d+\s*(?:years?|centuries?)\s*old/i },
  // "old" alone is too broad (false-positives generic marketing copy), so
  // this is scoped to "old + [culture/civilization]" -- the exact pattern
  // behind "5 Old Mayan Crystal Necklaces" and "Old African Trade Dogon...".
  { category: 'antique', pattern: /\bold\s+(?:mayan|aztec|incan?|roman|egyptian|african\s+trade|world)\b/i },
  // CITES-adjacent hard rejects -- no certificate makes these acceptable.
  { category: 'ivory', pattern: /\bivory\b/i },
  { category: 'tortoiseshell', pattern: /tortoise\s*shell/i },
  { category: 'protected-feather', pattern: /eagle\s+feather|migratory\s+bird/i },
]

export function checkProhibitedListingContent(
  ...fields: Array<string | null | undefined>
): ProhibitedContentCheck {
  const text = fields.filter(Boolean).join(' ')
  for (const { category, pattern } of PROHIBITED_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      return { blocked: true, category, matchedTerm: match[0] }
    }
  }
  return { blocked: false, category: null, matchedTerm: null }
}

export function prohibitedListingReason(check: ProhibitedContentCheck): string {
  if (!check.blocked || !check.category) return ''

  if (check.category === 'antique') {
    return (
      `This listing can't include the word "${check.matchedTerm}". Velor only allows newly made cultural ` +
      `and artisan goods -- genuine antiques, artifacts, and items presented as historically or ` +
      `archaeologically significant are a hard reject under our Seller Rules (see /legal/seller-rules, ` +
      `section 3), because their export is commonly barred by national heritage law regardless of how ` +
      `they were acquired. If this is a new, handmade piece in a traditional or vintage-inspired style, ` +
      `reword the listing to describe the craft technique or design tradition instead of calling the item ` +
      `itself old, vintage, or antique.`
    )
  }

  const materialLabel =
    check.category === 'protected-feather' ? 'protected bird feathers' : check.category

  return (
    `This listing can't include ${materialLabel} ("${check.matchedTerm}"). This material is a hard reject ` +
    `under our Seller Rules (see /legal/seller-rules, section 3) -- there is no certificate that makes it ` +
    `acceptable to sell on Velor.`
  )
}
