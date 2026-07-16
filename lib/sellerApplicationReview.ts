// Seller application service level and automated screening.
//
// Velor promises sellers a decision within 24 hours. That promise is enforced
// here rather than in marketing copy: the review cron (app/api/cron/
// review-applications) runs hourly, decides every clear-cut case immediately,
// and escalates anything it is not certain about to a human WELL BEFORE the
// deadline is breached. The watchdog (app/api/cron/agent-watchdog) independently
// alerts if any application is still PENDING past the SLA.
//
// LAW #1 applies to this file: the screener never guesses. If an application is
// ambiguous it returns 'hold', which escalates to a human. It never auto-approves
// to make a deadline look met.

import { CATEGORY_NAMES } from '@/lib/categories'

/** Velor's published promise to sellers. Change here, and the copy follows. */
export const APPLICATION_SLA_HOURS = 24

/** Escalate to a human at this age, so a person still has time to act. */
export const APPLICATION_ESCALATE_AFTER_HOURS = 12

/** Minimum characters of store description for the listing to be reviewable. */
export const MIN_DESCRIPTION_CHARS = 20

// Hard rejects. These are never a judgement call.
const PROHIBITED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(replica|counterfeit|knock[- ]?off|knockoff|bootleg|fake)\b/i, reason: 'Counterfeit or replica goods are not permitted on Velor.' },
  { pattern: /\b(1:1|aaa\+?\s*quality|mirror\s*quality|super\s*clone)\b/i, reason: 'Counterfeit or replica goods are not permitted on Velor.' },
  { pattern: /\b(firearm|handgun|ammunition|ammo|silencer|suppressor|explosive)\b/i, reason: 'Weapons and ammunition are not permitted on Velor.' },
  { pattern: /\b(cocaine|heroin|methamphetamine|mdma|cannabis|marijuana)\b/i, reason: 'Controlled substances are not permitted on Velor.' },
  { pattern: /\b(ivory|tortoiseshell|rhino\s*horn|pangolin)\b/i, reason: 'Protected wildlife materials are not permitted on Velor (see /legal/seller-rules).' },
  { pattern: /\b(antiquit(y|ies)|archaeological|excavated\s*artifact)\b/i, reason: 'Antiquities and archaeological artifacts are not permitted on Velor (see /legal/seller-rules).' },
]

// Regulated but permitted with a certificate. A human confirms these, because
// the certificate flow (ProductCertificate) is per-listing, not per-application.
const REGULATED_PATTERNS = /\b(coral|python|crocodile|alligator|rosewood|agarwood|fur|feather|bone|horn|shell|snakeskin)\b/i

export type ApplicationVerdict = 'approve' | 'reject' | 'hold'

export interface ScreenResult {
  verdict: ApplicationVerdict
  /** Buyer-safe explanation. Required when the verdict is reject. */
  reason: string
}

export interface ScreenableApplication {
  businessName: string
  contactName: string
  contactEmail: string
  storeDescription: string | null
  website: string | null
  productCategories: string[]
  sampleImages: string[]
  country: string | null
}

function looksLikeEmail(value: string): boolean {
  // Deliberately strict-ish: one @, a dot in the domain, no whitespace.
  return /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(value.trim())
}

/**
 * Decide an application against the published rules in /legal/seller-rules.
 * Pure and synchronous: no network, no database, easy to reason about.
 */
export function screenApplication(app: ScreenableApplication): ScreenResult {
  const haystack = [
    app.businessName,
    app.storeDescription ?? '',
    app.website ?? '',
    app.productCategories.join(' '),
  ].join(' ')

  // 1. Hard rejects first, so prohibited goods can never fall through to a hold.
  for (const { pattern, reason } of PROHIBITED_PATTERNS) {
    if (pattern.test(haystack)) return { verdict: 'reject', reason }
  }

  // 2. Completeness. These are objective and safe to reject on.
  if (!app.businessName?.trim()) {
    return { verdict: 'reject', reason: 'Your application did not include a business or store name.' }
  }
  if (!app.contactName?.trim()) {
    return { verdict: 'reject', reason: 'Your application did not include a contact name.' }
  }
  if (!looksLikeEmail(app.contactEmail ?? '')) {
    return { verdict: 'reject', reason: 'The contact email address on your application was not a valid address.' }
  }
  if (!app.productCategories?.length) {
    return { verdict: 'reject', reason: 'Your application did not select any product categories.' }
  }
  // Sample photos are deliberately NOT required at application time (William,
  // 2026-07-16): the public /apply form does not collect photos, so the old
  // 3-photo check here auto-rejected every real applicant. Photo minimums are
  // a LISTING rule, enforced at product creation (3+ images, see
  // app/api/dashboard/products) -- and every seller passes Stripe Identity
  // verification before approval, which is the actual signup gate.
  if ((app.storeDescription ?? '').trim().length < MIN_DESCRIPTION_CHARS) {
    return {
      verdict: 'reject',
      reason: `Please tell us more about what you make or sell (at least ${MIN_DESCRIPTION_CHARS} characters).`,
    }
  }

  // 3. Anything ambiguous goes to a human. Never auto-approved.
  const unknownCategories = app.productCategories.filter(
    (c) => !(CATEGORY_NAMES as readonly string[]).includes(c)
  )
  if (unknownCategories.length) {
    return {
      verdict: 'hold',
      reason: `Categories not on Velor's list: ${unknownCategories.join(', ')}. Needs a human decision.`,
    }
  }
  if (REGULATED_PATTERNS.test(haystack)) {
    return {
      verdict: 'hold',
      reason: 'Application mentions a regulated material (CITES or similar). A human must confirm the seller understands the per-listing certificate requirement.',
    }
  }

  return { verdict: 'approve', reason: 'Meets all published seller requirements.' }
}

/** Whole hours since a timestamp. */
export function hoursSince(date: Date, now: Date = new Date()): number {
  return (now.getTime() - date.getTime()) / 3_600_000
}
