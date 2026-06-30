'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'OV' },
  { href: '/dashboard/products', label: 'Products', icon: 'PR' },
  { href: '/dashboard/orders', label: 'Orders', icon: 'OR' },
  { href: '/dashboard/payouts', label: 'Payouts', icon: 'PY' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'AN' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'ST' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: 64 }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        position: 'sticky',
        top: 64,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Store info */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'rgba(255,107,0,0.15)',
            border: '1px solid rgba(255,107,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontWeight: 800, fontSize: 14, color: 'var(--accent)',
            marginBottom: 10,
          }}>
            MY
          </div>
          <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
            My Store
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Active</span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 2,
                  background: active ? 'rgba(255,107,0,0.12)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  textDecoration: 'none',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.15s',
                  borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: active ? 'rgba(255,107,0,0.2)' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: active ? 'var(--accent)' : 'var(--muted)',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <Link href="/shop" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 800 }}>VP</span>
            View Public Store
          </Link>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'var(--muted)', fontSize: 13, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 11, fontWeight: 800 }}>LO</span>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, background: 'var(--bg)', padding: '40px 40px' }}>
        {children}
      </main>
    </div>
  );
}
