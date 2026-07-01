'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SellerAgreementGate from '@/components/SellerAgreementGate';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'OV' },
  { href: '/dashboard/products', label: 'Products', icon: 'PR' },
  { href: '/dashboard/orders', label: 'Orders', icon: 'OR' },
  { href: '/dashboard/returns', label: 'Returns', icon: 'RT' },
  { href: '/dashboard/disputes', label: 'Disputes', icon: 'DS' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'MS' },
  { href: '/dashboard/discount-codes', label: 'Discounts', icon: 'DC' },
  { href: '/dashboard/payouts', label: 'Payouts', icon: 'PY' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'AN' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'ST' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0D0D0D',
      fontFamily: 'Inter, sans-serif',
      color: '#FFFFFF',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: '#111111',
        borderRight: '1px solid #2A2A2A',
        position: 'fixed',
        top: '64px',
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 40,
      }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #2A2A2A' }}>
          <Link href="/" style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800,
            fontSize: '20px',
            color: '#FF6B00',
            textDecoration: 'none',
            letterSpacing: '-0.5px',
          }}>
            VELOR
          </Link>
          <p style={{ color: '#999999', fontSize: '12px', marginTop: '4px' }}>Seller Dashboard</p>
        </div>

        <nav style={{ padding: '16px 0' }}>
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid #FF6B00' : '3px solid transparent',
                  background: isActive ? 'rgba(255,107,0,0.08)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#999999',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: isActive ? '#FF6B00' : '#2A2A2A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: isActive ? '#FFFFFF' : '#666666',
                  flexShrink: 0,
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          borderTop: '1px solid #2A2A2A',
        }}>
          <Link
            href="/dashboard/stripe-connect"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#999999',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: pathname.startsWith('/dashboard/stripe-connect') ? '#00E676' : '#444444',
              flexShrink: 0,
            }} />
            Payout Setup
          </Link>
        </div>
      </aside>

      {/* Top header bar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: '#111111',
        borderBottom: '1px solid #2A2A2A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 50,
      }}>
        <div style={{ width: '200px' }} />
        <p style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: '15px',
          color: '#FFFFFF',
        }}>
          Seller Portal
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ color: '#999999', fontSize: '13px', textDecoration: 'none' }}>
            View Store
          </Link>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#FF6B00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            color: '#FFFFFF',
          }}>
            S
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        marginLeft: '240px',
        marginTop: '64px',
        flex: 1,
        minWidth: 0,
      }}>
        <SellerAgreementGate>
          {children}
        </SellerAgreementGate>
      </main>
    </div>
  );
}
