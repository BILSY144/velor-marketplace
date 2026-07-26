import type { Metadata } from 'next'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'
import { cultureHints } from '@/lib/cultureHints'
import { buyerLabel } from '@/lib/specialities'
import ShopPageClient from './ShopPageClient'

// Server-component wrapper around the 'use client' shop grid (now
// ShopPageClient.tsx) so /shop?origin=CODE gets a real, per-country
// title/description/canonical instead of the generic static metadata in
// app/shop/layout.tsx.
//
// Added 2026-07-26 closing the SEO gap flagged the same day the /origins
// section was removed (app/sitemap.ts's own comment: "there is currently
// no indexable per-country landing page. Flagged, not silently dropped").
// William's question the same day ("how do we get around that") is what
// this file answers: /shop?origin=CODE is the real per-country landing
// page now -- same URL the header dropdown, homepage country strip, and
// /search already send buyers to -- it was just invisible to search
// engines because a 'use client' page can't export generateMetadata and
// robots.ts blanket-disallowed every '/shop?' query. Both fixed alongside
// this file: robots.ts now carves out '/shop?origin=' as an explicit allow
// (Google's robots.txt spec: longest/most-specific match wins regardless
// of order, so '/shop?category=...' etc. with no leading origin= stay
// disallowed), and sitemap.ts now lists a /shop?origin=CODE entry for every
// country that actually has a live APPROVED product -- not all 190, so this
// doesn't recreate the exact thin-content-across-190-mostly-empty-pages
// problem that motivated removing /origins in the first place.
//
// No fact is invented here: country names come from lib/worldCountries.ts
// and the "known for" hints come from lib/cultureHints.ts -- the same two
// sources the deleted /origins/[slug]/layout.tsx used for its own
// per-country metadata, reused here verbatim (the description template
// below is that same file's, carried over rather than reinvented).
//
// speciality is folded into the title/description when present (the raw
// term string, e.g. "Tea ceremony" -- see app/shop/ShopPageClient.tsx's own
// handling of this param, and the `/shop?origin=${code}&speciality=${term}`
// links built in app/search/page.tsx, app/page.tsx, and
// app/specialities/[term]/page.tsx) but the canonical always points at the
// bare origin-only URL. A speciality-filtered origin page is real content
// worth a better title, but not a distinct URL worth indexing on its own --
// canonicalizing it back to the single per-country page avoids diluting
// authority across a combinatorial explosion of origin x speciality
// variants, the same "don't recreate the 190-thin-pages problem" discipline
// as the sitemap change above.
//
// A missing or unrecognised origin returns {} (no override), so bare /shop
// and every other /shop?... query (category, search, page, ...) keep
// inheriting the static title/description/openGraph/twitter already set in
// app/shop/layout.tsx -- unchanged.

type Props = { searchParams: Promise<{ origin?: string; speciality?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { origin, speciality } = await searchParams
  if (!origin) return {}

  const code = origin.trim().toUpperCase()
  const country = WORLD_COUNTRIES.find((c) => c.code === code)
  if (!country) return {}

  const url = `https://velorcommerce.store/shop?origin=${code}`
  const specialityLabel = speciality ? buyerLabel(speciality) : null

  const title = specialityLabel
    ? `${specialityLabel} from ${country.name} | Shop by Origin — Velor`
    : `${country.name} | Shop by Origin — Velor`

  const hints = cultureHints(code)
  const description = specialityLabel
    ? `Shop ${specialityLabel.toLowerCase()} from ${country.name} on Velor — authentic goods from independent sellers, real maker and real origin on every listing.`
    : hints.length > 0
      ? `Shop authentic products from ${country.name} on Velor — known for ${hints.slice(0, 3).join(', ')}, and more.`
      : `Shop authentic products from ${country.name} on Velor, the global marketplace for culture and heritage.`

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
      images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: `${country.name} — Shop by Origin, Velor` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://velorcommerce.store/opengraph-image'],
    },
  }
}

export default function ShopPage() {
  return <ShopPageClient />
}
