import Link from 'next/link';

const footerLinks = {
  Marketplace: [
    { label: 'Browse Products', href: '/shop' },
    { label: 'Start Selling', href: '/sell' },
    { label: 'Seller Dashboard', href: '/dashboard' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Support: [
    { label: 'Help Centre', href: '/help' },
    { label: 'Track Order', href: '/track' },
    { label: 'Returns', href: '/returns' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Company: [
    { label: 'About Velor', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
  ],
};

export default function Footer() {
  return (
    <footer style={{
      background: '#111111',
      borderTop: '1px solid var(--border)',
      paddingTop: 64,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 48,
          marginBottom: 56,
        }}>
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.03em',
              }}>
                VELOR
              </span>
              <span style={{
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '3px 7px',
                borderRadius: 4,
              }}>
                MARKETPLACE
              </span>
            </div>
            <p style={{
              color: 'var(--muted)',
              fontSize: 14,
              lineHeight: 1.7,
              marginBottom: 24,
              maxWidth: 280,
            }}>
              The global marketplace connecting independent sellers with buyers in 180+ countries.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Twitter', 'Instagram', 'LinkedIn'].map(s => (
                <a key={s} href="#" style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <div style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                color: 'var(--text)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}>
                {heading}
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} style={{
                      color: 'var(--muted)',
                      fontSize: 14,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            2026 Velor Commerce Ltd. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <Link key={item} href="#" style={{
                color: 'var(--muted)',
                fontSize: 13,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
