import Link from 'next/link'

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Browse all', href: '/shop' },
      { label: 'Electronics', href: '/shop?category=Electronics' },
      { label: 'Fashion', href: '/shop?category=Fashion' },
      { label: 'Home & Garden', href: '/shop?category=Home%20%26%20Garden' },
      { label: 'Search', href: '/search' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Sell on Velor', href: '/sell' },
      { label: 'Apply to sell', href: '/apply' },
      { label: 'Seller dashboard', href: '/dashboard' },
      { label: 'Pricing & tiers', href: '/sell#pricing' },
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
        background: '#0A0A0A',
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
            ['Buyer protection', 'Your payment is held safely until you confirm your order arrived.'],
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
              fontSize: 22,
              letterSpacing: '0.14em',
              color: 'var(--accent)',
              marginBottom: 12,
            }}
          >
            VELOR
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 300 }}>
            The first fully AI-run marketplace. Independent sellers, protected buyers,
            and a platform that operates itself — 24/7.
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
          <span>© {new Date().getFullYear()} Velor Commerce Ltd. All rights reserved.</span>
          <span>Payments secured by Stripe · Built and operated by AI</span>
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
