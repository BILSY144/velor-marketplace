import type { Metadata } from 'next'
import { WORLD_COUNTRIES, countrySlug } from '@/lib/worldCountries'

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

// ItemList JSON-LD added by the standing SEO agent, 2026-07-21. /founding is
// this project's current highest-priority page per CLAUDE.md's own standing
// directive (seller-recruitment terms outweigh buyer terms while the
// catalogue is near-empty), yet unlike its buyer-facing sibling /origins
// (app/origins/layout.tsx, ItemList shipped 2026-07-14) and /specialities
// (app/specialities/[term]/layout.tsx, per-term ItemList/BreadcrumbList
// shipped 2026-07-20 -- the index page that also carried an ItemList,
// app/specialities/layout.tsx, was later removed by William, 2026-07-21
// evening, along with its route), this page had
// no structured data describing the one thing it actually is: a list of 190
// founding-seller opportunities, one per country. Confirmed by direct read
// of app/founding/page.tsx before writing this -- the page already renders
// exactly this list client-side (`for (const c of WORLD_COUNTRIES)`, each
// tile linking to `/origins/${countrySlug(c)}`, the identical URL used
// below), so this schema describes real, already-live, already-indexable
// content, not a new claim. Deliberately NOT filtered by cultureHints (the
// way originListCountries in app/origins/layout.tsx is) -- /founding's own
// live grid shows all 190 WORLD_COUNTRIES regardless of cultureHints depth,
// since the founding-seat offer itself applies to every country equally;
// filtering this list would make the schema disagree with the page it
// describes. Each ListItem's live claimed/unclaimed status is intentionally
// omitted here (that is real-time data the page fetches client-side and
// which changes as sellers apply -- baking a snapshot into static JSON-LD
// would go stale immediately and risk asserting a seat is open/taken when
// it no longer is); the schema only asserts that a founding-seller page
// exists for each country, matching the same "page exists, not a live-
// seller claim" boundary lib/cultureHints.ts's own header comment already
// establishes for /origins. Helps both classic search and AI answer
// engines surface "sell on Velor from my country" style seller-recruitment
// queries with a structured, citable list rather than prose alone --
// explicitly the framing CLAUDE.md's standing directive calls for right now.
const foundingItemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Founding Seller Seats — One Per Country on Velor',
  description,
  numberOfItems: WORLD_COUNTRIES.length,
  itemListElement: WORLD_COUNTRIES.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    url: `https://velorcommerce.store/origins/${countrySlug(c)}`,
  })),
}

export default function FoundingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(foundingItemListJsonLd) }}
      />
    </>
  )
}
