export const metadata = {
  title: 'Cookie Policy - Velor Commerce',
  alternates: { canonical: 'https://velorcommerce.store/cookies' },
  openGraph: {
    title: 'Cookie Policy - Velor Commerce',
    url: 'https://velorcommerce.store/cookies',
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
    title: 'Cookie Policy - Velor Commerce',
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function Page() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '72vh', padding: '72px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 800, color: 'var(--text)', margin: '0 0 20px', letterSpacing: '-1px' }}>Cookie policy</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>Velor uses essential cookies to keep you signed in, remember your cart, and run core marketplace features. These are required for the site to work.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>We also use limited analytics to understand how the site is used so we can improve it. You can control cookies through your browser settings.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>For more detail on how we handle your data, see our <a href='/legal/privacy' style={{ color: 'var(--accent)' }}>Privacy Policy</a>.</p>
      </div>
    </main>
  )
}
