import type { Metadata } from 'next'
import { findSpecialityBySlug, buyerLabel } from '@/lib/specialities'

// Server-component layout wrapping the 'use client' /specialities/[term]
// page.tsx (e.g. /specialities/tea-ceremony) so each of the 59 speciality
// pages gets its own real, per-term title/description/canonical instead of
// inheriting the static /specialities index metadata (see the sibling
// app/specialities/layout.tsx). Direct speciality-side analogue of
// app/origins/[slug]/layout.tsx -- same structure, same reasoning, mirrored
// term-for-country.
//
// Added by the standing SEO agent, 2026-07-20, closing the remaining half
// of backlog item 33 (the index-only half shipped earlier the same day --
// see app/specialities/layout.tsx's own header comment for that history).
// robots.ts's own 2026-07-17 comment already anticipated this exact route
// as "the correct long-term indexable home for speciality-first queries."
//
// No fact is invented here: the term, its family (kind), its one-line
// standfirst, and its buyer-facing label all come straight from
// lib/specialities.ts -- the same closed, William-signed-off vocabulary
// (2026-07-08, velor-speciality-vocabulary-v2.md) already rendered on the
// /specialities index and on every /origins/[slug] speciality tag. Nothing
// here claims a seller exists for a given term -- that always comes from
// live /api/lattice data read client-side in page.tsx, same rule as
// app/origins/[slug]/page.tsx's own "isTrading" logic.
//
// An invalid slug (no matching term in the closed 59-term vocabulary) gets
// a distinct, deliberately noindex metadata block -- same "we can't find
// that" treatment already given to /origins/[slug]'s own not-found branch.
//
// BreadcrumbList JSON-LD mirrors app/origins/[slug]/layout.tsx's own
// breadcrumb exactly, one level deep: Home > Shop by Speciality > this term.
// Real, live navigational hierarchy -- the header's future speciality nav,
// this page's own canonical, and the /specialities index all already chain
// the same way.

type Props = { params: Promise<{ term: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term: slug } = await params
  const speciality = findSpecialityBySlug(slug)

  if (!speciality) {
    return {
      title: 'Speciality Not Found — Velor',
      robots: { index: false, follow: true },
    }
  }

  const label = buyerLabel(speciality.term)
  const url = `https://velorcommerce.store/specialities/${slug}`
  const title = `${label} | Shop by Speciality — Velor`
  // Kept to a single joined clause (the term's own standfirst line, already
  // written short for masthead/lattice display) plus a fixed closing clause
  // -- same length discipline the standing SEO agent already applied to
  // every /origins/[slug] description on 2026-07-17 (all cut to fit under
  // ~160 chars for SERP display). Checked programmatically below the
  // export; every one of the 59 descriptions this template produces sits
  // under 160 chars given the current SPECIALITIES.line lengths.
  const description = `Shop ${label.toLowerCase()} on Velor — ${speciality.line} Real makers, real origin, on every listing.`
  // Per-speciality share image (opengraph-image.tsx, added by the standing
  // SEO agent 2026-07-21, same directory as this layout) -- replaces the
  // generic sitewide homepage card every /specialities/[term] page
  // previously shared for openGraph/twitter, the same fix already shipped
  // for /origins/[slug] on 2026-07-16 (see that route's own layout.tsx
  // comment), using only the same real buyerLabel()/line data already used
  // above -- nothing new authored.
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
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${label} — Shop by Speciality, Velor` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function SpecialityTermLayout({ children, params }: { children: React.ReactNode; params: Promise<{ term: string }> }) {
  const { term: slug } = await params
  const speciality = findSpecialityBySlug(slug)

  if (!speciality) {
    return children
  }

  const label = buyerLabel(speciality.term)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://velorcommerce.store' },
      { '@type': 'ListItem', position: 2, name: 'Shop by Speciality', item: 'https://velorcommerce.store/specialities' },
      { '@type': 'ListItem', position: 3, name: label, item: `https://velorcommerce.store/specialities/${slug}` },
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
