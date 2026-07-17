import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import ConditionalLayout from '@/components/ConditionalLayout'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import ServiceWorkerCleanup from '@/components/ServiceWorkerCleanup'
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
    // locale added by the standing SEO agent, 2026-07-13 -- og:locale was
    // missing from every openGraph object in the codebase (21 files, this
    // one included). 'en_GB' is not invented: lib/currency.ts's own
    // getCurrency() falls back to 'GBP' as the site's real default/base
    // currency (confirmed live in that file, both in its no-navigator
    // fallback and its final return), and app/api/briefing/route.ts already
    // formats those same GBP figures with the 'en-GB' Intl locale elsewhere
    // in this codebase -- both consistent with this UK-registered company's
    // real default, not a second, disconnected locale guess. Applied to all
    // 21 openGraph-defining files the same way the 2026-07-13 15:xx UTC
    // og:image fix was (see SEO_LOG.md), each with a short pointer back here.
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- verified via
    // Next.js's own docs (getting-started/metadata-and-og-images) plus a
    // Next.js GitHub discussion (vercel/next.js#50353, confirmed live) that
    // defining an explicit `openGraph` object on a route replaces the WHOLE
    // object, so the sibling app/opengraph-image.tsx file in this very
    // folder is NOT automatically merged back in for this or any child
    // route -- it must be listed explicitly, the same fix app/sell/layout.tsx
    // already carries. Same generated image URL reused, not duplicated, so
    // it can never drift out of sync with the real file.
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
  // robots.googleBot added by the standing SEO agent, 2026-07-14 -- verified
  // directly against Google's own robots-meta-tag documentation
  // (developers.google.com/search/docs/crawling-indexing/robots-meta-tag,
  // fetched and quoted this run): "If you don't specify the
  // max-image-preview rule, Google may show an image preview of the default
  // size" -- i.e. large image thumbnails in Search are opt-in, not the
  // default, and a repo-wide grep this run confirmed `googleBot` /
  // `max-image-preview` appeared nowhere in the codebase before this change.
  // Velor is an inherently visual, product-photography-led marketplace (per
  // CLAUDE.md's own positioning), so leaving every indexable page on
  // Google's smaller default preview size is a real, if easy to miss, SEO
  // cost once the catalogue and origin pages have real images to show.
  // index: true / follow: true here are explicit restatements of Next.js's
  // own implicit default (no prior `robots` field existed on this file), so
  // this changes nothing about indexability -- only the preview size for
  // pages that are already indexed. `max-snippet: -1` / `max-video-preview:
  // -1` (Google's own documented "no limit" values) are included alongside
  // `max-image-preview: 'large'` since all three live in the same directive
  // family and this is the one place to set them site-wide. This is set on
  // the shared root layout so every route without its own `metadata.robots`
  // export inherits it automatically (confirmed via a repo-wide grep: only
  // 7 files set their own `robots` field -- `/search`, `/apply/invited`,
  // `/unsubscribe`, `not-found.tsx`, `/origins/[slug]`'s invalid-slug case,
  // `/pulse`, and `/live/[room]`, all deliberately `noindex` already -- and
  // Next.js metadata objects are replaced wholesale per key rather than deep
  // -merged, the same behaviour already documented above for `openGraph`, so
  // this addition cannot weaken any of those 7 pages' existing noindex
  // directives; it simply never reaches them).
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
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
      // logo swapped by the standing SEO agent, 2026-07-14 -- Google's own
      // Organization structured-data docs (developers.google.com/search/docs/
      // appearance/structured-data/organization, fetched and quoted directly
      // this run) state the logo image "must be 112x112px, at minimum." The
      // previous value, velor-logo-globe-v2.png, is 206x60px (confirmed via
      // PIL) -- its 60px height is well under that floor, so it was likely
      // ineligible for Google's logo rich result / knowledge-panel logo even
      // though the rest of this Organization node is fully populated.
      // velor-logo.png is 608x118px (also confirmed via PIL, both dimensions
      // clear the 112px minimum) and is not a new or unused asset -- it is
      // already the live brand mark used in app/opengraph-image.tsx's real,
      // shipped Open Graph image, so this is a like-for-like swap to an
      // already-approved asset, not a new design decision. No aspect-ratio
      // requirement exists in Google's docs, so the non-square shape is not
      // a concern. Purely additive: only this one JSON-LD string changed,
      // nothing else in the Organization/WebSite graph touched, and the
      // header/footer's own <img> logo (still velor-logo-globe-v2.png,
      // correctly sized for that 28-34px UI use) is untouched.
      // Swapped to the 2026 brand mark (William, 2026-07-15). 900x300px
      // (confirmed via ImageMagick identify at creation), comfortably above
      // Google's 112x112 minimum in both dimensions.
      logo: 'https://velorcommerce.store/velor-logo-2026.png',
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
      // address added by the standing SEO agent, 2026-07-13 (sixth pass) --
      // a prior pass (2026-07-13, third pass log entry) explicitly
      // considered and ruled OUT an Organization.address, on the stated
      // grounds that "no postal address ... is published anywhere on the
      // live site". That was true of the JSON-LD/metadata surfaces checked
      // at the time, but not of the page body copy: the exact same
      // registered-office address is stated live, word-for-word identical,
      // in three separate places -- app/legal/terms/page.tsx ("Velor
      // Commerce Ltd (company number 17268133), registered office at 49
      // Station Road, Polegate, East Sussex, BN26 6EA"), app/contact/page.tsx,
      // and app/about/page.tsx (both: "Velor Commerce Ltd (company no.
      // 17268133) is registered in England and Wales, registered office 49
      // Station Road, Polegate, East Sussex, BN26 6EA"). Three independent,
      // consistent live citations is a stronger verification bar than this
      // file's own legalName field was added against (a single CLAUDE.md
      // line). An external Companies House lookup (company number 17268133)
      // was attempted for a fourth, independent check but blocked by
      // PROVENANCE_REQUIRED in this unattended run (no one available to
      // approve the fetch) -- logged honestly in SEO_LOG.md rather than
      // treated as a completed check. structured as schema.org's standard
      // PostalAddress shape (streetAddress/addressLocality/addressRegion/
      // postalCode/addressCountry), confirmed via search against schema.org's
      // own PostalAddress and address property pages.
      address: {
        '@type': 'PostalAddress',
        streetAddress: '49 Station Road',
        addressLocality: 'Polegate',
        addressRegion: 'East Sussex',
        postalCode: 'BN26 6EA',
        addressCountry: 'GB',
      },
      sameAs: ['https://www.facebook.com/Velorcommerce', 'https://www.instagram.com/velorcommerce'],
      // email added by the standing SEO agent, 2026-07-13 (fifth pass) --
      // schema.org/email confirms Organization (alongside ContactPoint and
      // Person) is a valid domain for a top-level `email` property, checked
      // against schema.org's own docs before adding rather than assumed.
      // Reuses the exact same address as `contactPoint.email` below rather
      // than a second hand-typed copy, so the two can never drift apart.
      //
      // CORRECTED 2026-07-16 (later same-day SEO-agent run) -- this was
      // support@velorcommerce.store, added 2026-07-13 on the belief it was
      // "the real, live support address" verified against app/contact and
      // app/help. That belief was wrong: CLAUDE.md's own dated checkpoint
      // ("2026-07-13 checkpoint (continued 4)") records the GoDaddy
      // dashboard for velorcommerce.store showing email as an unactivated
      // placeholder, and says outright "do not assume replies to any
      // @velorcommerce.store address reach anyone." Swapped to
      // customerservice@velorcommerce.co.uk, Velor Marketplace's own real,
      // working GoDaddy Microsoft 365 mailbox and already-verified Resend
      // sending domain (confirmed live via app/api/contact/route.ts's own
      // FROM address) -- the same address lib/email.ts's REPLY_TO already
      // uses for this exact reason, and the same fix applied this run to
      // app/press/page.tsx, app/apply/verified/page.tsx, app/contact/*, and
      // app/help/*.
      email: 'customerservice@velorcommerce.co.uk',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'customerservice@velorcommerce.co.uk',
          availableLanguage: ['English'],
        },
        // Second ContactPoint added by the standing SEO agent, 2026-07-16
        // (full-audit cycle) -- schema.org's `contactPoint` property accepts
        // an array of ContactPoint nodes (confirmed against schema.org's own
        // Organization/ContactPoint docs before adding), and this Organization
        // node previously only described the generic support-email channel
        // even though a second, real, live contact channel exists: the
        // Apply-by-WhatsApp link (`https://wa.me/447404014621`) added to
        // app/apply/page.tsx by a separate session 2026-07-16 (commit
        // e466261b) and already reflected in public/llms.txt ("Applicants
        // who prefer not to use the web form can apply by WhatsApp message
        // instead, in any language" -- added by this agent 2026-07-16,
        // commit 9da39b96). `contactType: 'sales'` is used rather than an
        // invented "seller applications" value, since 'sales' is one of
        // Google's documented valid contactType values
        // (developers.google.com/search/docs/appearance/structured-data/organization)
        // and is the closest standard fit for "become a seller" inbound
        // contact. `url` (not `contactOption`, which schema.org restricts
        // to a fixed enum like "TollFree"/"HearingImpairedSupported" -- a
        // wa.me link doesn't fit that enum) links straight to the real,
        // live WhatsApp deep link. `availableLanguage` is deliberately
        // omitted here rather than fabricated: the real, live claim on
        // /apply is "write in any language" over WhatsApp, not an
        // enumerable list of specific languages, and schema.org's
        // `availableLanguage` property expects actual language values, not
        // a vague placeholder -- per LAW #1, a claim structured data can't
        // accurately represent is worse left out than approximated.
        {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: '+447404014621',
          url: 'https://wa.me/447404014621',
        },
      ],
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800&family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@1,400;1,600&display=swap"
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
        {/* Kills the zombie June service worker still cached on visitors'
            devices -- see components/ServiceWorkerCleanup.tsx and public/sw.js. */}
        <ServiceWorkerCleanup />
          <ConditionalLayout>{children}</ConditionalLayout>
          <ThemePreview />
        </Providers>
      </body>
    </html>
  )
}
