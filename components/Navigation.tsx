import Link from 'next/link';
export default function Navigation() {
  return (
    <nav style={{ backgroundColor: '#0D0D0D', borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>VELOR</span>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', fontWeight: 700, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '2px' }}>Marketplace</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {[{ label: 'Shop', href: '/shop' }, { label: 'Sell', href: '/sell' }].map((link) => (
            <Link key={link.href} href={link.href} style={{ color: '#999999', textDecoration: 'none', fontSize: '15px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{link.label}</Link>
          ))}
          <Link href="/sell" style={{ backgroundColor: '#FF6B00', color: '#FFFFFF', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>Start Selling</Link>
        </div>
      </div>
    </nav>
  );
}
