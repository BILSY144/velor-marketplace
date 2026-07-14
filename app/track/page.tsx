// title brand suffix fixed by the standing SEO agent, 2026-07-14 -- was
// "Velor Commerce", the brand name of the separate, unrelated
// velorcommerce.co.uk dropshipping business (see CLAUDE.md's standing
// instruction to never conflate the two). This site's real brand suffix,
// already used by /legal/terms, /legal/privacy, /about, and
// /seller-agreement, is "Velor Marketplace" -- `siteName: 'Velor'` below was
// already correct and untouched; only the three literal `title` strings
// (metadata/openGraph/twitter) changed, plus the hyphen normalized to the
// em dash used by every one of those sibling pages.
//
// description added by the standing SEO agent, 2026-07-14 (full audit
// re-run) -- this page previously had no meta description at all (title,
// canonical, openGraph and twitter were all set, but no description field
// existed anywhere in this file), so search engines had to auto-generate a
// snippet instead of Velor controlling it. Copy is drawn directly from the
// page's own live body text below ("sign in and open Your Orders... current
// status and, once shipped, a tracking link") -- nothing invented.
const description =
  'Sign in and open Your Orders to track a Velor order — see its current status and, once shipped, its tracking link.'

export const metadata = {
  title: 'Track Your Order — Velor Marketplace',
  description,
  alternates: { canonical: 'https://velorcommerce.store/track' },
  openGraph: {
    title: 'Track Your Order — Velor Marketplace',
    description,
    url: 'https://velorcommerce.store/track',
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
    title: 'Track Your Order — Velor Marketplace',
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function Page() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '72vh', padding: '72px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 800, color: 'var(--text)', margin: '0 0 20px', letterSpacing: '-1px' }}>Track your order</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>To track an order, sign in and open <a href="/orders" style={{ color: 'var(--accent)' }}>Your Orders</a>. Each order shows its current status and, once shipped, a tracking link.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>If a tracking number has not appeared yet, the seller may still be preparing your item for dispatch.</p>
      </div>
    </main>
  )
}
