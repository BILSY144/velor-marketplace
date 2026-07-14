import type { Metadata } from 'next'
import { WORLD_COUNTRIES, countrySlug } from '@/lib/worldCountries'
import { cultureHints } from '@/lib/cultureHints'

// Server-component layout wrapping the 'use client' /origins page.tsx (the
// buyer-facing, shopping-oriented index of all 190 countries -- companion to
// /founding, which is seller-recruitment-facing) so this route carries its
// own metadata instead of inheriting the generic root title/description.
//
// Added by the standing SEO agent, 2026-07-13. /origins and /origins/[slug]
// (see app/origins/[slug]/layout.tsx, added in the same pass) were built by
// a separate interactive session earlier the same day (commit a62357e,
// "Build /origins and /origins/[slug] buyer-facing lattice pages") and
// shipped with zero metadata of their own -- confirmed via `find app/origins
// -type f` returning only the two 'use client' page.tsx files, no layout.
//
// Canonical is safe to set here (unlike /shop/layout.tsx, which deliberately
// omits one -- see backlog item 2): /origins/[slug] gets its own
// generateMetadata with its own per-country canonical in the sibling layout,
// so there is no inheritance leak the way there would be for /shop/[productId]
// (which still has no metadata of its own).
//
// ItemList JSON-LD added by the standing SEO agent, 2026-07-14. /origins
// lists all 190 countries but had no structured data describing that list --
// a real, previously-unflagged gap distinct from the BreadcrumbList work
// shipped the same day on /origins/[slug] (SEO_LOG.md backlog item 17). This
// reuses the exact same 145-country filter (cultureHints(code).length > 0)
// that app/sitemap.ts already uses for its own /origins/[slug] entries (see
// that file's 2026-07-13 night comment for the full reasoning and the named
// list of the 46 excluded countries) -- not a new judgment call, just
// reusing an already-shipped, already-reasoned-through threshold so the
// schema and the sitemap never disagree about which country pages count as
// real content. Every listed item is a URL that already exists, already has
// its own metadata (app/origins/[slug]/layout.tsx), and is already
// indexable per the sitemap -- nothing here asserts a seller trades from any
// country, only that the page exists, matching cultureHints.ts's own
// "recruitment copy only, never a claim sellers exist" rule. Helps both
// classic search (list-rich results) and AI answer engines, which favour
// structured, citable lists over prose for "which countries can I shop on
// Velor" style questions -- explicitly on this agent's standing audit
// checklist under AI-visibility/answer-engine readiness.
const originListCountries = WORLD_COUNTRIES.filter((c) => cultureHints(c.code).length > 0)

const title = 'Shop by Origin | 190 Countries — Velor'
const description =
  'Browse Velor by country of origin. Every listing carries its maker and its origin — shop authentic culture and heritage goods, or see which of 190 countries are still an open seat for a founding seller.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/origins' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/origins',
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

export default function OriginsLayout({ children }: { children: React.ReactNode }) {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Shop by Origin — Countries on Velor',
    description,
    numberOfItems: originListCountries.length,
    itemListElement: originListCountries.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      url: `https://velorcommerce.store/origins/${countrySlug(c)}`,
    })),
  }

  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  )
}
