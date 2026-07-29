import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /safety page.tsx so
// this route can carry its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-29 --
// found while reviewing commits since the last SEO push: /safety (commit
// 876f1151, "Online safety tooling per the signed OSA policy") shipped the
// same day as a real, linked page (GlobalFooter's "Company" column, see
// components/GlobalFooter.tsx) with no layout.tsx of its own and no entry
// in app/sitemap.ts -- same gap class as /mission (2026-07-23) and /help
// (2026-07-12) before it: a real page inherits the wrong parent metadata
// and is invisible to search engines until it's added here.
//
// Title/description are drawn only from copy already live on page.tsx
// itself (the h1 "Report a problem. We act on every report.", the intro
// paragraph's "you do not need an account" / "reviewed by a person" /
// "24–48 hours" facts, and the Report/Appeal section headings) -- nothing
// paraphrased beyond tightening for SERP length, nothing invented, per
// LAW #1. Indexed (not noindex): unlike /shop/preview or /apply/invited,
// this is not placeholder or token-gated content -- it's a genuine,
// permanent trust-and-safety page a searcher could reasonably look for
// ("how do I report a listing on Velor"), the same reasoning class as the
// already-indexed /help.
const title = 'Safety & Reporting — Velor Marketplace'
const description =
  'Report content or appeal a decision on Velor — no account needed. Every report is reviewed by a person, usually within 24–48 hours.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/safety' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/safety',
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

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return children
}
