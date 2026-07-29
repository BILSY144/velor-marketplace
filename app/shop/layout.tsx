import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /shop page.tsx (and its
// /shop/[productId] child route) so this section carries its own metadata
// instead of inheriting the generic root title/description. Added by the
// standing SEO agent, 2026-07-12 — see SEO_LOG.md backlog item 1.

// Canonical added by the standing SEO agent, 2026-07-29 (full audit cycle),
// closing backlog item 3's remaining piece. Deliberately withheld until
// now (see the removed comment this replaces, and backlog item 2) because
// /shop/[productId] used to have no generateMetadata of its own and would
// have inherited this layout's canonical, wrongly claiming every product
// page's canonical URL was bare /shop. That's no longer a risk: commit
// (Velor Social stage 3, "Share cards", 2026-07-29) gave
// app/shop/[productId]/page.tsx its own generateMetadata with an explicit
// per-product alternates.canonical, which always wins over anything set
// here regardless of Next.js metadata-merging order. With that dependency
// resolved, a self-referencing canonical here now correctly consolidates
// every filtered/paginated /shop?... variant with no more specific
// canonical of its own (category, search, page) back to the base /shop
// URL — the exact same "fold query-string variants back to one indexable
// URL" pattern app/shop/page.tsx's own generateMetadata already applies to
// /shop?origin&speciality combinations, just extended to cover the
// remaining untagged cases instead of leaving them with no canonical
// guidance at all.

// description trimmed by the standing SEO agent, 2026-07-14 (full audit
// re-run) -- the previous version was 203 characters, past Google's
// practical ~155-160 char SERP display limit (same class of fix already
// applied to /apply, /origins, /founding, /sell and /help the same run).
// Kept every category named (ceramics, textiles, food, adornment, craft),
// "independent sellers worldwide", and the country/speciality filter --
// cut only the closing "every listing carries its maker and origin" clause,
// which is redundant with the root layout's own description and with
// /origins's description already carrying the same fact.
const title = 'Shop Velor — Authentic Goods from Sellers Worldwide'
const description =
  "Browse Velor's catalogue — ceramics, textiles, food, adornment and craft from independent sellers worldwide, filterable by country or speciality."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/shop' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/shop',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale (vercel/next.js#50353: an explicit openGraph
    // object replaces the whole object, dropping the root file-convention
    // image unless listed here). This field (and, since 2026-07-29, the
    // canonical above) is safe to let /shop/[productId] inherit too --
    // /shop/[productId]/page.tsx's own generateMetadata always overrides
    // both with real per-product values when a product actually exists.
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
