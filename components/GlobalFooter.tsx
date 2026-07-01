'use client'
import Link from 'next/link'

export default function GlobalFooter() {
  return (
    <footer style={{ background: '#111111', borderTop: '1px solid #2A2A2A', marginTop: '80px', padding: '48px 24px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 800, color: '#FF6B00', marginBottom: '12px' }}>VELOR</div>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>A global marketplace connecting buyers and sellers worldwide.</p>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontFamily: 'Space Grotesk, sans-serif' }}>Marketplace</div>
            {[['Browse Products', '/shop'], ['Sell on Velor', '/sell'], ['Seller Dashboard', '/dashboard'], ['Categories', '/shop']].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: 'block', fontSize: '14px', color: '#666', textDecoration: 'none', marginBottom: '10px', fontFamily: 'Inter, sans-serif' }}>{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontFamily: 'Space Grotesk, sans-serif' }}>Support</div>
            {[['Help Centre', '/help'], ['Contact Us', '/contact'], ['Returns', '/returns'], ['Track Order', '/track']].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: 'block', fontSize: '14px', color: '#666', textDecoration: 'none', marginBottom: '10px', fontFamily: 'Inter, sans-serif' }}>{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontFamily: 'Space Grotesk, sans-serif' }}>Company</div>
            {[['About Velor', '/about'], ['Seller Agreement', '/seller-agreement'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: 'block', fontSize: '14px', color: '#666', textDecoration: 'none', marginBottom: '10px', fontFamily: 'Inter, sans-serif' }}>{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #222', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: '#555', fontFamily: 'Inter, sans-serif' }}>2026 Velor Marketplace. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies']].map(([label, href]) => (
              <Link key={label} href={href} style={{ fontSize: '13px', color: '#555', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}