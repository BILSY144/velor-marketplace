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
// page's own live body text below (each seller sets their own returns
// policy, shown on the product page; contact the seller via Your Orders)
// -- nothing invented.
const description =
  'Each Velor seller sets their own returns and refunds policy, shown on the product page before you buy. Contact the seller via Your Orders for help.'

export const metadata = {
  title: 'Returns and Refunds — Velor Marketplace',
  description,
  alternates: { canonical: 'https://velorcommerce.store/returns' },
  openGraph: {
    title: 'Returns and Refunds — Velor Marketplace',
    description,
    url: 'https://velorcommerce.store/returns',
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
    title: 'Returns and Refunds — Velor Marketplace',
    description,
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function Page() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '72vh', padding: '72px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 800, color: 'var(--text)', margin: '0 0 20px', letterSpacing: '-1px' }}>Returns and refunds</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>Each seller on Velor sets and manages their own returns and refunds policy, shown on the goods page before you buy.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>If you need to return an item, contact the seller through your order in Your Orders, or reach our team and we will help coordinate.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>Need a hand? Email <a href='mailto:hello@velorcommerce.store' style={{ color: 'var(--accent)' }}>hello@velorcommerce.store</a>.</p>
      </div>
    </main>
  )
}
