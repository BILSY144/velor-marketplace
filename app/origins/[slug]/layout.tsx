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
  const description =
    hints.length > 0
      ? `Shop authentic products from ${country.name} on Velor — known for ${hints.slice(0, 4).join(', ')}. Every listing carries its maker and its origin.`
      : `Shop authentic products from ${country.name} on Velor, the global marketplace for culture and heritage. Every listing carries its maker and its origin.`

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
      images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://velorcommerce.store/opengraph-image'],
    },
  }
}

export default function OriginCountryLayout({ children }: { children: React.ReactNode }) {
  return children
}
