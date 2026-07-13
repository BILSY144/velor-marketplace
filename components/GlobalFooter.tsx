import Link from 'next/link'

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Watch & shop',
    links: [
      { label: 'Velor Live', href: '/live' },
      { label: 'Browse the shop', href: '/shop' },
      { label: 'Shop by country', href: '/founding' },
      { label: 'Specialities', href: '/#specialities' },
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
      { label: 'Help centre', href: '/help' },
      { label: 'Contact us', href: '/contact' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
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
            ['Secure Stripe checkout', 'Card details are handled by Stripe — Velor never sees them.'],
            ['A global marketplace', 'One account to buy from independent sellers worldwide.'],
          ].map(([t, d]) => (
            <div key={t}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
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
            <img src="/velor-logo-globe-v2.png" alt="Velor" style={{ height: 28, width: 'auto' }} />
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
            <a href="https://www.facebook.com/Velorcommerce" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Facebook</a>
            <a href="https://www.instagram.com/velorcommerce" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Instagram</a>
            <span>Payments secured by Stripe</span>
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
