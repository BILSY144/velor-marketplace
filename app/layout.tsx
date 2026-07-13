import type { Metadata } from 'next'
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
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
      name: 'Velor',
      url: 'https://velorcommerce.store',
      // inLanguage added 2026-07-13 -- matches the real <html lang="en">
      // attribute below; the site has no other live locale to verify.
      inLanguage: 'en',
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
