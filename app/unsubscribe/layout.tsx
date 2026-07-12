import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /unsubscribe page.tsx so
// this route can carry its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-12 --
// this route was found during a re-audit of backlog item 3's stated
// follow-up ("audit any other public routes not yet covered for their own
// metadata + canonical before ever adding one to root app/layout.tsx").
//
// Deliberately set to noindex, nofollow rather than given a canonical: this
// is a transactional, token-driven page (?u=<subscriber token>) reached only
// via a one-time link in an outbound email, not a page anyone should land on
// via search. It carries no reusable canonical URL (each visit is tied to a
// specific recipient token) and the page itself (read directly, see
// page.tsx) has no outbound links to other site content for a crawler to
// follow -- just an unsubscribe confirm button that posts to an API route.
// Same category of fix as the /search noindex added in the same backlog
// item: avoid falsely telling search engines this is indexable, shareable
// content.

const title = 'Unsubscribe — Velor Marketplace'
const description = 'Unsubscribe from Velor Marketplace seller invitation emails.'

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
}

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children
}
