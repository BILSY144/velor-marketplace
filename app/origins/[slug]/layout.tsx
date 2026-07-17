import type { Metadata } from 'next'
import { findCountryBySlug } from '@/lib/worldCountries'
import { cultureHints } from '@/lib/cultureHints'

// Server-component layout wrapping the 'use client' /origins/[slug] page.tsx
// (e.g. /origins/japan) so each of the 190 country pages gets its own real,
// per-country title/description/canonical instead of inheriting the static
// /origins index metadata (see the sibling app/origins/layout.tsx).
//
// Added by the standing SEO agent, 2026-07-13, alongside app/origins/layout.tsx
// -- both routes were built by a separate session earlier the same day
// (commit a62357e) with zero metadata of their own.
//
// No fact is invented here: country names come from lib/worldCountries.ts
// (the same list the page itself renders from), and the "known for" hints
// come from lib/cultureHints.ts -- the exact same editorial list already
// live on this page and on /founding, not a new claim authored for SEO. Per
// that file's own header comment, hints are curated, product-level, and
// explicitly "never rendered as a claim that sellers exist" -- the
// description text below follows the same rule (it describes what the
// country is known for and invites shopping/applying, it never states a
// seller already trades from there).
//
// An invalid slug (no matching country) gets a distinct, deliberately
// noindex metadata block -- same treatment already given to other
// no-real-content states in this codebase (/search, /unsubscribe,
// /apply/invited) -- since it is a "we can't find that country" error state,
// not a real page worth a search engine indexing.
//
// BreadcrumbList JSON-LD added by the standing SEO agent, 2026-07-14 (see
// SEO_LOG.md backlog). This is a real, live, three-level navigational
// hierarchy, not an invented one: the header logo links Home
// (components/GlobalHeader.tsx), the "Origins" nav dropdown's "All 190
// countries" link and this page's own metadata canonical both point at
// /origins (app/origins/layout.tsx), and this exact page is the third,
// current level -- the same Home > Section > Entity shape Google's own
// BreadcrumbList documentation shows, and the direct country-page analogue
// of the FAQPage markup already shipped on /help (app/help/layout.tsx). Only
// rendered for a valid slug -- an invalid slug renders no breadcrumb, same
// "no schema for a non-content error state" rule already applied to the
// metadata block below.

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const country = findCountryBySlug(slug)

  if (!country) {
    return {
      title: 'Country Not Found — Velor',
      robots: { index: false, follow: true },
    }
  }

  const hints = cultureHints(country.code)
  const url = `https://velorcommerce.store/origins/${slug}`
  const title = `${country.name} | Shop by Origin — Velor`
  // Description shortened by the standing SEO agent, 2026-07-17 -- a
  // programmatic length check across all 190 real WORLD_COUNTRIES x
  // lib/cultureHints.ts entries (not eyeballed) found every single one of
  // the 190 live /origins/[slug] descriptions exceeded Google's practical
  // ~155-160 char SERP display limit (min 178, max 219 chars, worst case
  // "St Vincent and the Grenadines" at 219 -- the previous template used
  // 4 joined hints plus a closing "Every listing carries its maker and its
  // origin." clause). That closing clause is also redundant here: the
  // parent /origins index page (app/origins/layout.tsx) already states
  // "every listing carries its maker and origin" once for the whole
  // section, the same redundant-clause-cutting reasoning already applied
  // to /shop's description (2026-07-14 full audit). Cut to 3 joined hints
  // (still the same real, already-verified cultureHints.ts data, nothing
  // new invented) and dropped the redundant closing clause. Re-checked
  // programmatically after the edit: max is now 158 chars (same country),
  // min 109 -- all 190 now sit under the 160-char limit. The zero-hints
  // fallback branch below (currently unreachable -- all 190 real countries
  // have a cultureHints.ts entry per backlog item 25/22 -- but fixed too
  // for consistency and in case a future country is ever added without
  // hints yet) was also over the limit for the longest country names (165
  // chars for the same worst-case name) and is shortened the same way.
  const description =
    hints.length > 0
      ? `Shop authentic products from ${country.name} on Velor — known for ${hints.slice(0, 3).join(', ')}, and more.`
      : `Shop authentic products from ${country.name} on Velor, the global marketplace for culture and heritage.`
  // Per-country share image (opengraph-image.tsx, added by the standing SEO
  // agent 2026-07-16, same directory as this layout) -- replaces the
  // generic sitewide homepage card every /origins/[slug] page previously
  // shared for openGraph/twitter, using only the same real country name +
  // cultureHints data already used above, nothing new authored.
  const ogImageUrl = `${url}/opengraph-image`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Velor',
      locale: 'en_GB',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${country.name} — Shop by Origin, Velor` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function OriginCountryLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const country = findCountryBySlug(slug)

  if (!country) {
    return children
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://velorcommerce.store' },
      { '@type': 'ListItem', position: 2, name: 'Shop by Origin', item: 'https://velorcommerce.store/origins' },
      { '@type': 'ListItem', position: 3, name: country.name, item: `https://velorcommerce.store/origins/${slug}` },
    ],
  }

  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  )
}
