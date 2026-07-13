import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /sell page.tsx so this
// route can carry its own metadata instead of inheriting the generic root
// title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. Copy is drawn from the page's own live stats
// row (190 countries, 0% listing fees, live broadcasting for founding
// sellers) — see the copy-honesty rule at the top of app/sell/page.tsx.

const title = "Sell on Velor — Your Country's Shopping Channel"
const description =
  'List free and sell live or around the clock. Velor connects buyers worldwide with independent sellers from 190 countries, each listing carrying its maker and its country of origin.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/sell' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/sell',
    siteName: 'Velor',
    type: 'website', images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image', images: ['https://velorcommerce.store/opengraph-image'],
    title,
    description,
  },
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children
}
