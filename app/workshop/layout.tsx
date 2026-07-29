import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /workshop page.tsx so
// this route can carry its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-29 --
// found while reviewing commits since the last SEO push: /workshop (commit
// 7b520baa, "Workshop Feed (Velor Social stage 5): chronological view over
// all maker journals") shipped with no layout.tsx of its own and no entry
// in app/sitemap.ts, and the same day (commit c6ee186a, "William approved
// 2026-07-29") joined the main nav (desktop + mobile panel, see
// components/GlobalHeader.tsx) -- a real, publicly linked, prominent page,
// same gap class and fix as /safety (2026-07-29) and /mission (2026-07-23)
// before it. Confirmed not auth-gated: middleware.ts's protected-route
// matcher covers /dashboard/:path*, /api/admin/:path*, /api/chat/:path*,
// /api/contact/:path*, and /api/stripe/payment-intent only -- /workshop is
// not in that list, and the page's own client code treats a 401 from
// /api/social/feed as "show nothing," not a redirect, so it renders for a
// logged-out visitor.
//
// Title/description are drawn only from copy already live on page.tsx
// itself (the h1 "Fresh from the workshop", the eyebrow label "The
// Workshop Feed", and the intro paragraph "Real makers, documenting real
// work — newest first, every time. No algorithm decides what you see
// here.") -- nothing paraphrased beyond tightening for SERP length,
// nothing invented, per LAW #1. Indexed (not noindex): this is permanent,
// real content a searcher could reasonably look for ("velor workshop
// feed", "velor maker journal"), the same reasoning class as the
// already-indexed /help and /safety -- not placeholder or token-gated
// content like /shop/preview or /apply/invited.
const title = 'The Workshop Feed — Velor Marketplace'
const description =
  'Real makers, documenting real work — newest first, every time. No algorithm decides what you see here.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/workshop' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/workshop',
    siteName: 'Velor',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function WorkshopLayout({ children }: { children: React.ReactNode }) {
  return children
}
