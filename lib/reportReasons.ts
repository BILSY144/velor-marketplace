// Content report reasons + types (2026-07-29), shared by /api/reports, the
// PDP listing/review report forms, the messages report buttons, and the
// public /safety page. Mirrors the live-stream report form's reason list
// (lib/liveReportReasons.ts) so reporting feels the same everywhere.
// Built per the signed online safety policy (docs/osa/online-safety-policy.md):
// report routes exist on EVERY user-generated surface and are usable by
// non-users; reports are reviewed within the policy's 24-48h window.

export const REPORT_REASONS: Record<string, string> = {
  contact: 'Sharing contact details or steering buyers off Velor',
  inappropriate: 'Inappropriate or offensive content',
  prohibited: 'Counterfeit or prohibited items',
  misleading: 'Spam or misleading claims',
  safety: 'Safety concern (including anything involving a child)',
  other: 'Something else',
}

export const REPORT_CONTENT_TYPES: Record<string, string> = {
  LISTING: 'A product listing',
  REVIEW: 'A review',
  MESSAGE: 'A message',
  STREAM: 'A live stream',
  SELLER: 'A seller or storefront',
  JOURNAL: 'A maker journal post',
  QUESTION: 'A question or answer on a listing',
  OTHER: 'Something else',
}

export function isValidReportReason(reason: unknown): reason is string {
  return typeof reason === 'string' && reason in REPORT_REASONS
}

export function isValidReportContentType(t: unknown): t is string {
  return typeof t === 'string' && t in REPORT_CONTENT_TYPES
}
