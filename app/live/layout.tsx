import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /live page.tsx so this
// route can carry its own metadata instead of inheriting the generic root
// title/description. Added by the standing SEO agent, 2026-07-13 — see
// SEO_LOG.md backlog item 10. Velor Live is a real, live public feature
// (confirmed by reading app/live/page.tsx: it renders real streams from
// /api/live when sellers are on air, and a clearly-labelled "Preview" zero
// state otherwise — not fake liveness), so unlike /shop it is safe to give
// this hub page its own canonical: /live/[room] (the dynamic per-stream
// route) gets its own layout.tsx that explicitly clears `alternates` rather
// than inheriting this canonical, so no per-stream URL is ever wrongly told
// its canonical home is just /live. Title/description are drawn directly
// from the live page's own hero copy ("Velor Live" eyebrow, "Shopping, from
// where things are made." h1, and its supporting paragraph) — nothing
// invented, per LAW #1.

const title = 'Velor Live — Shopping, From Where Things Are Made'
const description =
  'Velor sellers go live from the workshop, the market stall, the kitchen — watch products made in real time and buy without leaving the stream.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/live' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/live',
    siteName: 'Velor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return children
}
