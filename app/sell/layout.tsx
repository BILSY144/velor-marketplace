import type { Metadata } from 'next'
import { APPLICATION_SLA_HOURS } from '@/lib/sellerApplicationReview'

// Server-component layout wrapping the 'use client' /sell page.tsx so this
// route can carry its own metadata instead of inheriting the generic root
// title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. Copy is drawn from the page's own live stats
// row (190 countries, 0% listing fees, live broadcasting on every tier
// sellers) — see the copy-honesty rule at the top of app/sell/page.tsx.

// HowTo JSON-LD added by the standing SEO agent, 2026-07-17 (23:xx UTC
// cycle) -- a repo-wide grep confirmed no HowTo schema existed anywhere in
// the codebase (the full schema.org inventory to date was Organization,
// WebSite, FAQPage, BreadcrumbList, ItemList -- see the 2026-07-17 22:xx
// full-audit log entry), even though /sell's own "From application to
// first sale" section (app/sell/page.tsx, ~line 230) is a real, live,
// exactly-3-step process -- textbook HowTo content. Every step name and
// description below is copied verbatim from that live section, not
// paraphrased or invented, so the schema and the visible page copy can
// never drift apart. Step one's duration reuses APPLICATION_SLA_HOURS (the
// same real, enforced constant app/sell/page.tsx itself displays, imported
// here rather than a second hardcoded "24" so the two can never disagree),
// formatted as an ISO 8601 duration per schema.org/HowToStep's own docs.
// Seller recruitment is this project's current standing priority while the
// catalogue is still near-empty (CLAUDE.md STANDING DIRECTIVES), and
// structured, factual, step-by-step content like this is exactly what this
// agent's own AI-visibility/answer-engine audit criterion favours for
// "how do I sell on Velor" -style queries. Purely additive: one new
// <script type="application/ld+json"> tag, nothing existing removed or
// altered.
//
// Separately worth logging (see SEO_LOG.md): this same research pass
// confirmed, directly against Google's own developer documentation
// (developers.google.com/search/docs/appearance/structured-data/faqpage,
// fetched live this run), that Google deprecated FAQ rich results in
// Search as of 2026-05-07, with Rich Results Test / rich-result-report
// support dropping in June 2026 and Search Console API support ending
// August 2026 -- this directly touches /help's FAQPage schema (added
// 2026-07-12, referenced throughout this log since as a shipped win). No
// code change made to that schema this run: the deprecation only affects
// Google's own SERP rich-result surface, not schema.org's FAQPage type
// itself or any other search engine/AI system that still parses it, and
// removing valid, accurate structured data on the strength of one surface
// losing a UI treatment would cost more (any residual value elsewhere)
// than it protects against (none -- inert markup carries no penalty risk).
// Logged as an informational finding for awareness, not an action item.
const sellHowToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'From application to first sale on Velor',
  description:
    "Three steps, and the slowest one is the post office: apply and verify, list with your origin on it, then sell in your own language.",
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Apply and verify',
      text:
        'Tell us what you make and where. Verify your identity with a government ID — hosted by Stripe, never stored by Velor.',
      // ISO 8601 duration -- reuses the real, enforced APPLICATION_SLA_HOURS
      // constant (imported above) rather than a second hand-typed "24", so
      // this can never drift out of sync with the page's own displayed SLA.
      totalTime: `PT${APPLICATION_SLA_HOURS}H`,
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'List with your origin on it',
      text:
        'Your country, your city, your specialities, your words — on every listing and every product card.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Sell in your language',
      text:
        'Buyers write in theirs, you write in yours — Velor translates both ways and always shows the original. Support answers you in your language too.',
    },
  ],
}

// description trimmed by the standing SEO agent, 2026-07-14 (full audit
// re-run) -- the previous version was 180 characters, past Google's
// practical ~155-160 char SERP display limit (same class of fix already
// applied to /apply, /origins and /founding the same run). Kept every
// concrete fact (free to list, live or anytime selling, 190 countries,
// maker + origin on every listing) and only tightened the phrasing.
const title = "Sell on Velor — Your Country's Shopping Channel"
const description =
  'List free and sell live or anytime. Velor connects buyers worldwide with sellers from 190 countries, each listing carrying its maker and origin.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/sell' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/sell',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website', images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image', images: ['https://velorcommerce.store/opengraph-image'],
    title,
    description,
  },
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sellHowToJsonLd) }}
      />
    </>
  )
}
