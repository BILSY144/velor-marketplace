import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /help page.tsx so this
// route can carry its own metadata instead of inheriting the generic root
// title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. Category list (Buying, Watching/Live, Selling,
// Account) matches the FAQ categories already on the live page.

const title = 'Help Centre — Velor Marketplace Support'
const description =
  'Answers on buying, tracking orders and returns, watching and buying on Velor Live, becoming a seller, payouts, and your account — or contact us for a reply within a day.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/help',
    siteName: 'Velor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
