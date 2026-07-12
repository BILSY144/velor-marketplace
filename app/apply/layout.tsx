import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /apply page.tsx so this
// route can carry its own metadata instead of inheriting the generic root
// title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. Copy is drawn directly from the live page copy
// (the "Be the first from your country" hero, the founding-seller perks
// list, and the 24-hour decision line already on the page) — nothing here
// invents a claim the page itself doesn't already make.

const title = 'Apply to Sell on Velor | Founding Seller Programme'
const description =
  "Be the first seller from your country on Velor, the global marketplace for authentic cultural and heritage goods. Free to list, a decision within 24 hours of verification, and Pro free for life for founding sellers."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/apply' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/apply',
    siteName: 'Velor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children
}
