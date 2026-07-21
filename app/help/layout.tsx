import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /help page.tsx so this
// route can carry its own metadata instead of inheriting the generic root
// title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 1. Category list (Buying, Watching/Live, Selling,
// Account) matches the FAQ categories already on the live page.
//
// FAQPage JSON-LD added 2026-07-12 (SEO_LOG.md backlog item 1, second half).
// Every question/answer pair below is copied verbatim from the FAQS array in
// app/help/page.tsx -- nothing paraphrased or invented, so the markup never
// claims content that isn't literally already rendered on the page. If the
// FAQS array on page.tsx changes, this list must be updated to match or
// removed -- do not let it drift out of sync with the live page.

// description trimmed by the standing SEO agent, 2026-07-14 (full audit
// re-run) -- the previous version was 169 characters, past Google's
// practical ~155-160 char SERP display limit (same class of fix already
// applied to /apply, /origins, /founding and /sell the same run). Kept
// every category named (buying, orders/returns, Velor Live, selling,
// account) and the reply-time fact, only tightened the phrasing.
const title = 'Help Centre — Velor Marketplace Support'
const description =
  'Answers on buying, orders and returns, Velor Live, becoming a seller, payouts and your account — or contact us for a reply within a day.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/help' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/help',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale (vercel/next.js#50353: an explicit openGraph
    // object replaces the whole object, dropping the root file-convention
    // image unless listed here).
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

const faqEntries: { q: string; a: string }[] = [
  { q: 'Where do the products come from?', a: 'Everything on Velor carries its origin — the country it comes from and the maker who made or sourced it. You can shop by country, by speciality, or straight from a live broadcast.' },
  { q: 'Is my money safe?', a: 'Yes. You pay Velor, not the seller, through Stripe. The money is held until delivery is confirmed — and if anything is wrong, opening a dispute freezes the funds immediately.' },
  { q: 'How do I place an order?', a: 'Browse the shop, add items to your basket, and check out. Prices convert live into 20 currencies and are reconfirmed at checkout.' },
  { q: 'What payment methods are accepted?', a: 'Visa, Mastercard, American Express and other major cards, processed securely by Stripe. Velor never sees your card details.' },
  { q: 'Can I track my order?', a: 'Yes. Tracking is issued the moment the parcel is collected, and you can watch it the whole way from your orders page.' },
  { q: 'What is the returns policy?', a: 'Most items can be returned within 15 days of confirmed delivery. Start a return from the order page and the seller takes it from there.' },
  { q: 'My item arrived damaged — what do I do?', a: 'Open a dispute from your order page within 7 days. The funds freeze immediately while our team reviews the case and ensures a fair resolution.' },
  { q: 'What is Velor Live?', a: 'The live side of the channel. Sellers broadcast from the workshop, the market stall, the kitchen — you watch things being made, ask questions in real time, and buy without leaving the stream.' },
  { q: 'How do I buy from a stream?', a: 'The products a seller is showing sit right below the broadcast. Tap one, check out as normal, and keep watching — your money is protected the same way as any other order.' },
  { q: 'Is a LIVE badge always real?', a: 'Always. A LIVE badge on Velor means a real person is on air right now — we never fake liveness, ever. Anything labelled Preview is exactly that.' },
  { q: 'Can any seller broadcast?', a: 'Yes — every verified seller on every tier can go on air on Velor Live, Starter included. Founding sellers additionally keep the whole Pro tier free for life.' },
  { q: 'How do I start selling on Velor?', a: 'Apply on the Sell on Velor page — anyone can sell, individuals and businesses alike, with no documents to upload. You get a decision within 2 hours. Your identity is confirmed by Stripe or Payoneer when you set up payouts.' },
  { q: 'What does it cost?', a: 'Nothing to list — ever. You pay commission when you sell: 10% on the free Starter tier, 4% on Pro. The earnings calculator on the Sell page shows the honest maths for your numbers.' },
  { q: 'How do payouts work?', a: 'Buyers pay into escrow, and once delivery is confirmed your earnings are queued for payout on the schedule in your seller agreement — to Stripe Connect, or Payoneer where Stripe is unavailable.' },
  { q: 'What do founding sellers get?', a: 'The first verified seller from each country keeps the full Pro tier free for life — unlimited listings, 4% commission, the dedicated AI account manager — plus the permanent founding badge and the first store on their country’s page.' },
  { q: 'Can I sell internationally?', a: 'Yes — that is the point. Your listings are visible worldwide by default, prices convert into the buyer’s currency, and you can sell and get support in your own language.' },
  { q: 'How do listings get approved?', a: 'Submit a listing and it is reviewed within 1 to 2 business days. You get an email either way.' },
  { q: 'How do I create an account?', a: 'Click Sign in at the top of any page and follow the prompts — an email address is all you need to start.' },
  { q: 'I forgot my password — how do I reset it?', a: 'Click Sign in, then Forgot password, and a reset link goes to your email.' },
  { q: 'How do I contact Velor?', a: 'Use the contact page or email customerservice@velorcommerce.co.uk — we reply within one business day.' },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqEntries.map(entry => ({
    '@type': 'Question',
    name: entry.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: entry.a,
    },
  })),
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  )
}
