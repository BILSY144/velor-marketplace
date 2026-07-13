import type { Metadata } from 'next'

// Server-component layout wrapping the 'use client' /contact page.tsx so
// this route can carry its own metadata instead of inheriting the generic
// root title/description. Added by the standing SEO agent, 2026-07-12 — see
// SEO_LOG.md backlog item 3 follow-up ("audit /search, /legal/*, /contact,
// /terms for their own metadata + canonical before ever adding one to root
// app/layout.tsx"). Copy is drawn directly from the live page's own hero
// ("Talk to Velor.") and reply-time line already on the page — nothing here
// invents a claim the page itself doesn't already make.

const title = 'Contact Velor — Talk to Us'
const description =
  'Get in touch with Velor Marketplace. Send a message through the contact form or email support@velorcommerce.store — we reply within one business day.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://velorcommerce.store/contact' },
  openGraph: {
    title,
    description,
    url: 'https://velorcommerce.store/contact',
    siteName: 'Velor',
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

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
