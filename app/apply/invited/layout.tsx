import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /apply/invited page.tsx
// so this route can carry its own metadata instead of inheriting
// app/apply/layout.tsx's metadata (title/description/canonical for /apply
// itself, which would otherwise apply here too since Next.js metadata
// inherits down the segment tree unless overridden). Added by the standing
// SEO agent, 2026-07-13 -- see SEO_LOG.md backlog item 9, flagged by the
// 2026-07-12 23:xx UTC full public-route re-audit and left for the next run
// to verify and implement.
//
// Deliberately set to noindex, nofollow rather than given a canonical: this
// is a personalized landing page reached only via the country-coded CTA
// link in outreach emails (?country=XX), congratulating the specific
// recipient on being "personally found and emailed" (read directly in
// page.tsx: "you were personally invited" / "We looked at what you make and
// chose to invite you directly -- this page is only for sellers we reach
// out to, not the general application"). That framing would be actively
// misleading for an organic visitor who was not personally invited, so this
// is not a page that should ever surface in search -- same reasoning class,
// and same treatment, as the /unsubscribe noindex fix from the prior run.
// nofollow (not follow, unlike /search) because the page's one outbound
// link just carries the visitor on to /apply with a prefilled country code
// -- /apply itself is already indexed and canonical at its own URL, so
// there is no new destination for a crawler to discover by following this
// link.

const title = 'You are invited — Velor Marketplace'
const description = 'A personal invitation to become a founding seller on Velor Marketplace.'

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
}

export default function InvitedLayout({ children }: { children: React.ReactNode }) {
  return children
}
