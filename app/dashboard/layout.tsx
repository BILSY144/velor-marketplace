'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'OV' },
  { href: '/dashboard/products', label: 'Products', icon: 'PR' },
  { href: '/dashboard/orders', label: 'Orders', icon: 'OR' },
  { href: '/dashboard/payouts', label: 'Payouts', icon: 'PY' },
  { href: '/dashboard/stripe-connect', label: 'Stripe Connect', icon: 'SC' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'AN' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'ST' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: '#0D0D0D',
        borderRight: '1px solid #2A2A2A',
        position: 'fixed',
        top: '64px',
        left: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}>
        {/* Seller badge */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #2A2A2A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>S</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Seller Dashboard</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#999999' }}>Velor Marketplace</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid #FF6B00' : '3px solid transparent',
                  background: isActive ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
                  color: isActive ? '#FF6B00' : '#999999',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(255, 107, 0, 0.15)' : '#1A1A1A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: isActive ? '#FF6B00' : '#666666',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #2A2A2A' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#666666',
              fontSize: '13px',
            }}
          >
            Back to marketplace
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', marginTop: '64px', flex: 1, minHeight: 'calc(100vh - 64px)', background: '#0D0D0D' }}>
        {children}
      </main>
    </div>
  );
}
