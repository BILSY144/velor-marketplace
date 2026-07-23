import Link from 'next/link'

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Watch & shop',
    links: [
      { label: 'Velor Live', href: '/live' },
      { label: 'Browse the shop', href: '/shop' },
      { label: 'Shop by country', href: '/origins' },
      { label: 'Search', href: '/search' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Sell on Velor', href: '/sell' },
      { label: 'Apply to sell', href: '/apply' },
      { label: 'Founding sellers', href: '/founding' },
      { label: 'Seller dashboard', href: '/dashboard' },
      { label: 'Seller agreement', href: '/legal/seller-agreement' },
    ],
  },
  {
    title: 'Your orders',
    links: [
      { label: 'My orders', href: '/orders' },
      { label: 'Track an order', href: '/track' },
      { label: 'Messages', href: '/messages' },
      { label: 'Returns', href: '/returns' },
      { label: 'Wishlist', href: '/account/wishlist' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'How it works', href: '/about' },
      { label: 'Our Mission', href: '/mission' },
      { label: 'Press', href: '/press' },
      { label: 'Help centre', href: '/help' },
      { label: 'Contact us', href: '/contact' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
]

export default function GlobalFooter() {
  const link: React.CSSProperties = {
    color: 'var(--muted)',
    textDecoration: 'none',
    fontSize: 13.5,
    fontFamily: 'var(--font-body)',
    lineHeight: 2,
  }

  return (
    <footer
      style={{
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text)',
      }}
    >
      {/* Trust band */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '26px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 18,
          }}
        >
          {[
            ['Buyer protection', 'Your payment is held safely until delivery is confirmed.'],
            ['Verified & ranked sellers', 'Every seller is checked and scored on real delivery performance.'],
            ['Secure Stripe checkout · Payouts by Stripe & Payoneer', 'Card details are handled by Stripe — Velor never sees them. Seller earnings are paid out via Stripe, or Payoneer where Stripe is unavailable.'],
            ['A global marketplace', 'One account to buy from independent sellers worldwide.'],
          ].map(([t, d]) => (
            <div key={t}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Accreditations — more to join this row over time */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 20,
          }}
        >
          <a
            href="https://goodbusinesscharter.com/what-good-business-charter-accreditation-means-and-why-it-matters/"
            target="_blank"
            rel="noopener noreferrer"
            title="Velor Commerce Ltd is Good Business Charter accredited — find out what that means"
            style={{ display: 'inline-flex' }}
          >
            <img
              src="/gbc-accredited.jpg"
              alt="Good Business Charter Accredited"
              style={{ height: 174, width: 'auto', display: 'block' }}
            />
          </a>
        </div>
      </div>

      {/* Sitemap */}
      <div
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '44px 24px 30px',
          display: 'grid',
          gridTemplateColumns: '1.4fr repeat(4, 1fr)',
          gap: 32,
        }}
        className="velor-footer-grid"
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: '0.12em',
              color: 'var(--accent)',
              marginBottom: 12,
            }}
          >
            <img src="/velor-logo-2026.png" alt="Velor — Global Marketplace" style={{ height: 32, width: 'auto' }} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 300 }}>
            The world&apos;s shopping channel. Real makers broadcasting and listing from 190
            countries — with the origin on every listing and your money held until delivery
            is confirmed.
          </p>
          <Link
            href="/sell"
            style={{
              display: 'inline-block',
              marginTop: 16,
              background: 'var(--accent)',
              color: '#000',
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
              padding: '10px 18px',
              borderRadius: 999,
            }}
          >
            Start selling
          </Link>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{col.title}</div>
            {col.links.map((l) => (
              <Link key={l.href + l.label} href={l.href} style={link}>
                {l.label}
                <br />
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Base */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '18px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--muted)',
            fontSize: 12.5,
          }}
        >
          <span>© {new Date().getFullYear()} Velor Commerce Ltd, 49 Station Road, Polegate, East Sussex, BN26 6EA · Company No. 17268133. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="https://www.facebook.com/Velorcommerce" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.53 17.52 2.04 12 2.04S2 6.53 2 12.06c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34v6.99C18.34 21.19 22 17.05 22 12.06Z"/></svg>Facebook</a>
            <a href="https://www.instagram.com/velorcommerce" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>Instagram</a>
            <span>Payments secured by Stripe · Payoneer payouts coming soon</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .velor-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
