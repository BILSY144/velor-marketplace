import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /live/[room] page.tsx
// so this route can carry its own metadata instead of inheriting the parent
// /live layout's canonical. Added by the standing SEO agent, 2026-07-13 —
// see SEO_LOG.md backlog item 10.
//
// Deliberately set to noindex, nofollow rather than given a canonical: a
// live stream's room URL is ephemeral and session-specific (confirmed by
// reading app/live/[room]/page.tsx — it renders "This stream has ended." or
// "Stream not found." once the broadcast is over, so the URL has no stable,
// evergreen content worth ranking). `follow: false` because the page has no
// crawlable outbound links — "Report this stream" is a button, not an
// anchor, and the checkout hand-off after "Buy now" is a programmatic
// router.push, not a link a crawler could follow (confirmed by reading the
// full file). This is the same reasoning class as the /unsubscribe noindex
// fix (2026-07-12 23:xx UTC entry in this log).
//
// `alternates` is explicitly set here (to an empty object, i.e. no
// canonical) rather than left unset, specifically so this route does NOT
// inherit the parent /live/layout.tsx's `alternates.canonical` of
// https://velorcommerce.store/live — Next.js metadata inherits any
// top-level field a child segment does not itself define, and leaving
// `alternates` unset here would wrongly tell search engines every dynamic
// room's canonical home is just /live. This is exactly the inheritance risk
// already flagged in SEO_LOG.md backlog items 2 and 3 for /shop and
// /shop/[productId] — handled correctly here from the start rather than
// left as a follow-up.

const title = 'Live Stream — Velor Live'
const description =
  'Watch a live product stream on Velor Live, where sellers broadcast and sell in real time.'

export const metadata: Metadata = {
  title,
  description,
  alternates: {},
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/live',
    siteName: 'Velor',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale (vercel/next.js#50353: an explicit openGraph
    // object replaces the whole object, dropping the root file-convention
    // image unless listed here). Same generic image as every other route --
    // this file already deliberately clears `alternates` so this route's
    // canonical isn't wrongly inherited from /live; an og:image fallback
    // carries no such per-URL claim, so no equivalent care is needed here.
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function LiveRoomLayout({ children }: { children: React.ReactNode }) {
  return children
}
