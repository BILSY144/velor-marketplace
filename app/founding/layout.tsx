import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /founding page.tsx so
// this route can carry its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. The page's own live copy ("Be the first from
// your country", the per-country founding perks) is the source for this;
// the live trading-country count is dynamic on the page itself and is
// deliberately NOT hardcoded here since it changes as sellers list.

// description trimmed by the standing SEO agent, 2026-07-14 (full audit
// re-run) -- the previous version was 195 characters, past Google's
// practical ~155-160 char SERP display limit (same class of fix already
// applied to /apply and /origins the same run). Kept every concrete fact
// (190 countries, one founding seat each, founding badge, Pro free for
// life, permanent Velor Live access) and only tightened the phrasing --
// "as the seller who opened your country" was cut as restating what "be
// first from yours" already says, not a fact removed.
//
// description corrected by the standing SEO agent, 2026-07-19 22:xx UTC --
// "permanent Velor Live access" was a founding-exclusive claim that went
// stale the same day: commit 000c4c52 ("Go Live record set straight
// site-wide, per William") opened Velor Live broadcasting to every seller
// on every tier, and updated app/founding/page.tsx's own visible body copy
// accordingly ("Velor Live broadcasting is open to every seller, on every
// tier") -- but this file's separate, hand-written meta description was not
// part of that commit's diff and kept the old founding-exclusive framing,
// leaving a canonical, indexed <meta description> actively contradicting
// the page it describes. Swapped the stale claim for a real, still-current
// founding-exclusive perk already on the live page: the showreel slot
// ("The showreel slot. Your film, on the homepage." -- app/founding/page.tsx).
const title = 'Founding Sellers | One Seat Per Country — Velor'
const description =
  '190 countries, one founding seller each. Be first from yours and keep the founding badge, Pro free for life, and the homepage showreel slot.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/founding' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/founding',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale (vercel/next.js#50353: an explicit openGraph
    // object replaces the whole object, dropping the root file-convention
    // image unless listed here).
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function FoundingLayout({ children }: { children: React.ReactNode }) {
  return children
}
