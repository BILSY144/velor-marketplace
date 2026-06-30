import Link from 'next/link';
export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#111111', borderTop: '1px solid #2A2A2A', padding: '48px 24px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>VELOR</span>
            <p style={{ color: '#999999', fontSize: '14px', fontFamily: 'Inter, sans-serif', marginTop: '12px', lineHeight: 1.6 }}>The AI-powered global marketplace connecting sellers and buyers worldwide.</p>
          </div>
          <div>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Marketplace</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[{ label: 'Shop', href: '/shop' }, { label: 'Sell', href: '/sell' }].map((link) => (
                <Link key={link.href} href={link.href} style={{ color: '#999999', textDecoration: 'none', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>{link.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }].map((link) => (
                <Link key={link.href} href={link.href} style={{ color: '#999999', textDecoration: 'none', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>{link.label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: '#999999', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>2026 Velor Commerce Ltd. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms', href: '/terms' }].map((link) => (
              <Link key={link.href} href={link.href} style={{ color: '#999999', textDecoration: 'none', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>{link.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
