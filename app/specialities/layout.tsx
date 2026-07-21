import type { Metadata } from 'next'
import { SPECIALITIES, specialitySlug } from '@/lib/specialities'

// Server-component layout wrapping the 'use client' /specialities page.tsx
// (the buyer-facing index of Velor's closed 59-term speciality vocabulary,
// grouped by its six families -- companion to /origins, the country-side of
// the same origins x specialities lattice) so this route carries its own
// metadata instead of inheriting the generic root title/description.
//
// Added by the standing SEO agent, 2026-07-20. SEO_LOG.md backlog item 33
// ("no dedicated /specialities index or per-speciality landing pages exist")
// flagged this gap 2026-07-17 but deliberately did not build it in that
// cycle, reasoning 59 new template-driven pages was too large a change for
// one unattended cycle. This run scopes down to just the index page (one
// new route, mirroring app/origins/layout.tsx's own pattern exactly) --
// the per-speciality /specialities/[term] pages backlog item 33 also
// described remain a separate, still-open follow-up (see updated backlog
// entry in SEO_LOG.md). This closes half of the asymmetry app/robots.ts's
// own 2026-07-17 comment already anticipated ("/specialities/[term] ...
// the correct long-term indexable home for speciality-first queries").
//
// Every value below is drawn from lib/specialities.ts, a closed vocabulary
// William signed off 2026-07-08 (velor-speciality-vocabulary-v2.md) --
// nothing invented. Live per-speciality trading counts come from
// /api/lattice at request time in page.tsx, the same source /origins and
// /founding already use -- this layout only describes the vocabulary itself
// (59 terms, 6 families), which is static and real regardless of catalogue
// state.
const title = 'Specialities | Shop by Craft — Velor'
const description =
  'Browse Velor by craft and material — 59 specialities across six families, from silk to skincare. Every listing carries its maker and its origin.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/specialities' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/specialities',
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

export default function SpecialitiesLayout({ children }: { children: React.ReactNode }) {
  // ItemList JSON-LD, mirroring app/origins/layout.tsx's own ItemList block
  // for the country side of the same lattice. Lists the vocabulary itself
  // (not live per-speciality product counts, which change with the
  // catalogue and are rendered client-side only in page.tsx) -- same
  // "structured, citable list for classic search and AI answer engines"
  // reasoning as the /origins ItemList.
  //
  // `url` per item added by the standing SEO agent, 2026-07-21. When this
  // block was first written (2026-07-20), no per-speciality page existed
  // yet to link to -- app/specialities/[term]/layout.tsx (the direct
  // analogue of app/origins/[slug]/layout.tsx) didn't ship until later the
  // same day (backlog item 33's second half). app/origins/layout.tsx's own
  // ItemList has always included a `url` per country (its per-country page
  // already existed when that ItemList was written); this one was missing
  // the same field for its own now-existing per-term pages -- a real,
  // verified asymmetry, not a stray omission never meant to be filled.
  // `specialitySlug()` is the exact same slugifier app/sitemap.ts already
  // uses to build every live `/specialities/[term]` sitemap URL (see that
  // file's own `specialitySlug(s)` call), so this cannot disagree with what
  // is actually indexable.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Shop by Speciality — Crafts and Materials on Velor',
    description,
    numberOfItems: SPECIALITIES.length,
    itemListElement: SPECIALITIES.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.term,
      url: `https://velorcommerce.store/specialities/${specialitySlug(s)}`,
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
