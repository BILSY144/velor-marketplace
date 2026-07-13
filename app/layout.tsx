import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import ConditionalLayout from '@/components/ConditionalLayout'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import ThemePreview from '@/components/ThemePreview'

// Homepage title/description rewritten by the standing SEO agent,
// 2026-07-13 -- see SEO_LOG.md backlog item 5. Every other public route
// (apply/sell/founding/shop/help/about) already carries cultural-heritage
// -forward copy of its own; the root layout -- which the homepage and every
// route without its own metadata export inherits from -- was the one
// remaining page still using the original generic "Global Marketplace" /
// "unique products from sellers around the world" copy from before that
// positioning existed. Wording below is drawn directly from language
// already live elsewhere in the app, not invented: "authentic cultural and
// heritage goods" (app/apply/layout.tsx), "independent sellers ... from 190
// countries" and "its maker and its country of origin" (app/sell/layout.tsx,
// near-verbatim), "190 countries" (app/founding/layout.tsx, app/page.tsx
// swipe hint, app/live/page.tsx). No canonical/robots change here -- adding
// a homepage canonical to this shared root layout would leak onto every
// route that has no metadata export of its own (see backlog item 3).
const title = 'Velor — Global Marketplace for Culture & Heritage'
const description =
  'Shop live or browse authentic cultural and heritage goods from independent sellers in 190 countries — each listing carries its maker and origin.'

export const metadata: Metadata = {
  metadataBase: new URL('https://velorcommerce.store'),
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store',
    siteName: 'Velor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

// Added by the standing SEO agent, 2026-07-13 -- the root layout had no
// `viewport` export at all, so mobile browsers fell back to Next.js's bare
// default (width=device-width, initialScale=1 only, no theme-color). The
// only other place in this codebase that sets `themeColor` is
// app/pulse/layout.tsx (a private dashboard), which uses '#0d0d0d'. This
// value instead comes directly from this app's own real default background:
// app/globals.css's `:root` block sets `--bg: #0d0d0f` (dark, unqualified,
// i.e. the actual default before any theme toggle -- `html[data-theme=
// 'light']` is the override, applied by a JS-driven `data-theme` attribute,
// not a `prefers-color-scheme` media query), so a single static color
// matching that real default is accurate, not a `light`/`dark`
// media-query split that could mismatch what a user manually toggled to.
// Purely additive -- affects mobile browser chrome (address bar) color and
// PWA/add-to-home-screen presentation only; no existing metadata touched.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d0d0f',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      // '@id' added by the standing SEO agent, 2026-07-13 (fourth pass) --
      // this is a stable, dereferenceable node identifier (the '#organization'
      // fragment convention Google's own structured-data docs use), not a new
      // factual claim -- it lets the WebSite entity below reference this exact
      // Organization node instead of duplicating an unlinked, anonymous copy
      // of the same entity. Purely structural graph-linking, nothing invented.
      '@id': 'https://velorcommerce.store/#organization',
      name: 'Velor',
      // legalName added by the standing SEO agent, 2026-07-13 (second pass) --
      // this marketplace's own Stripe account (acct_1TlcWCDB5eA3Wfmu) is
      // registered to "VELOR COMMERCE LTD", per CLAUDE.md's own SCOPE section
      // (line 28), which is scoped to Velor Marketplace only -- not a guess
      // and not borrowed from the separate velorcommerce.co.uk business.
      legalName: 'VELOR COMMERCE LTD',
      // description reuses the exact, already-verified root-layout copy
      // (the `description` const above) rather than a second hand-written
      // string, so the two can never drift out of sync.
      description,
      url: 'https://velorcommerce.store',
      logo: 'https://velorcommerce.store/velor-logo-globe-v2.png',
      // areaServed added by the standing SEO agent, 2026-07-13 (third pass) --
      // "Worldwide"/"global marketplace" is an already-established, verified
      // live claim repeated across the codebase, not a new assertion:
      // app/seller-agreement/page.tsx ("Velor is a global marketplace, open
      // to sellers worldwide"), app/sell/layout.tsx ("Velor connects buyers
      // worldwide with independent sellers from 190 countries"),
      // app/shop/layout.tsx title ("Authentic Goods from Sellers
      // Worldwide"), and components/GlobalFooter.tsx ("A global
      // marketplace... buy from independent sellers worldwide"). schema.org
      // confirms Organization is a valid domain for areaServed.
      areaServed: 'Worldwide',
      sameAs: ['https://www.facebook.com/Velorcommerce'],
      // Added by the standing SEO agent, 2026-07-13 -- contactPoint email is
      // the real, live support address, verified directly against
      // app/contact/page.tsx ("support@velorcommerce.store" reaches the
      // team) and app/contact/layout.tsx's metadata description. Not
      // invented; no phone number or hoursAvailable added since neither is
      // published anywhere on the live site to verify against.
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@velorcommerce.store',
        availableLanguage: ['English'],
      },
    },
    {
      '@type': 'WebSite',
      // '@id' added by the standing SEO agent, 2026-07-13 (fourth pass) --
      // same stable-node-identifier convention as Organization's '@id' above.
      '@id': 'https://velorcommerce.store/#website',
      name: 'Velor',
      url: 'https://velorcommerce.store',
      // inLanguage added 2026-07-13 -- matches the real <html lang="en">
      // attribute below; the site has no other live locale to verify.
      inLanguage: 'en',
      // publisher added 2026-07-13 (fourth pass) -- references the
      // Organization node above by its '@id' rather than repeating a second,
      // disconnected copy of the same name/url/logo facts. This is the
      // standard schema.org/Google pattern for tying a WebSite to the
      // Organization that publishes it, turning two previously-anonymous,
      // unlinked '@graph' entries into one connected entity graph. No new
      // fact asserted -- purely a structural reference to data already in
      // this same object.
      publisher: { '@id': 'https://velorcommerce.store/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://velorcommerce.store/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>
        <AnalyticsTracker />
          <ConditionalLayout>{children}</ConditionalLayout>
          <ThemePreview />
        </Providers>
      </body>
    </html>
  )
}
