import Link from 'next/link'
import type { Metadata } from 'next'

// Added by the standing SEO agent, 2026-07-14 -- app/not-found.tsx had no
// metadata export at all, so it inherited the root layout's title/
// description ("Velor — Global Marketplace for Culture & Heritage" / the
// homepage's own description) on a page that is not the homepage and, per
// Google's own guidance on soft-404s, should carry an explicit noindex
// signal rather than rely solely on the HTTP 404 status Next.js already
// sends for this file. Description text is not invented -- it is a
// trimmed, near-verbatim reuse of this same file's own visible body copy
// two paragraphs below ("The product or page you're looking for may have
// been removed, sold out, or the link might be out of date. Try browsing
// the shop for similar items, or head back home."), shortened to fit
// within Google's ~155-160 char SERP display limit (the same length rule
// already applied to the /legal/* pages, see SEO_LOG.md backlog item 18).
// robots.index: false is additive and narrowly scoped to this one file --
// no other route's indexing directive is touched.
export const metadata: Metadata = {
  title: 'Page Not Found — Velor',
  description:
    "The product or page you're looking for may have been removed, sold out, or the link is out of date. Browse the shop for similar items.",
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '18px',
          color: 'var(--accent)',
          letterSpacing: '0.1em',
          marginBottom: '28px',
        }}
      >
        VELOR
      </div>

      <h1
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: '28px',
          margin: '0 0 12px',
        }}
      >
        We can&apos;t find that page
      </h1>

      <p
        style={{
          color: 'var(--muted)',
          fontSize: '15px',
          lineHeight: 1.6,
          maxWidth: '460px',
          margin: '0 0 32px',
        }}
      >
        The product or page you&apos;re looking for may have been removed, sold out, or the link
        might be out of date. Try browsing the shop for similar items, or head back home.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
        <Link
          href="/shop"
          style={{
            background: 'var(--accent)',
            color: '#000',
            fontWeight: 800,
            fontSize: '15px',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 999,
          }}
        >
          Browse the shop
        </Link>
        <Link
          href="/"
          style={{
            background: 'transparent',
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 999,
            border: '1px solid var(--border)',
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
