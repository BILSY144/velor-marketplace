'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import VelorAssistant from '@/components/VelorAssistant';
import { normalizeSellerTier } from '@/lib/tier';

const baseNavItems = [
  { href: '/dashboard', label: 'Overview', icon: 'OV' },
  { href: '/dashboard/products', label: 'Products', icon: 'PR' },
  { href: '/dashboard/storefront', label: 'Storefront', icon: 'SF' },
  { href: '/dashboard/orders', label: 'Orders', icon: 'OR' },
  { href: '/dashboard/returns', label: 'Returns', icon: 'RT' },
  { href: '/dashboard/disputes', label: 'Disputes', icon: 'DS' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'MS' },
  { href: '/dashboard/discount-codes', label: 'Discounts', icon: 'DC' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'AN' },
  { href: '/dashboard/live', label: 'Go Live', icon: 'GL', special: 'live' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'ST' },
  { href: '/dashboard/support', label: 'Support', icon: 'SP' },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: 'AK', special: 'enterprise' },
];

type Tier = 'STARTER' | 'PRO';

// NOTE: ENTERPRISE was retired 2026-07-15. There is intentionally no
// ENTERPRISE entry below — any legacy 'ENTERPRISE' value coming back from
// the API is normalized to 'PRO' via normalizeSellerTier() before it ever
// reaches this map, so every seller always resolves to a real theme.
const TIER_THEME: Record<Tier, {
  label: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  sidebarGradient: string;
  glow: string;
  activeGlow: string;
  avatarRing: string;
}> = {
  STARTER: {
    label: 'Starter',
    badgeColor: '#999999',
    badgeBg: 'rgba(153,153,153,0.12)',
    badgeBorder: 'rgba(153,153,153,0.4)',
    sidebarGradient: 'none',
    glow: 'rgba(255,255,255,0.10)',
    activeGlow: 'none',
    avatarRing: 'none',
  },
  PRO: {
    label: 'Pro',
    badgeColor: '#4FC3F7',
    badgeBg: 'rgba(79,195,247,0.12)',
    badgeBorder: 'rgba(79,195,247,0.45)',
    sidebarGradient: 'linear-gradient(180deg, rgba(79,195,247,0.08), transparent 45%)',
    glow: 'rgba(79,195,247,0.35)',
    activeGlow: '0 0 14px rgba(79,195,247,0.30)',
    avatarRing: '0 0 0 2px rgba(79,195,247,0.6)',
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>('STARTER');
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null); useEffect(() => { const prev = document.documentElement.getAttribute('data-theme'); const force = () => { if (document.documentElement.getAttribute('data-theme') !== 'dark') { document.documentElement.setAttribute('data-theme', 'dark') } }; force(); const observer = new MutationObserver(force); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); return () => { observer.disconnect(); if (prev) { document.documentElement.setAttribute('data-theme', prev) } else { document.documentElement.removeAttribute('data-theme') } } }, [])

  useEffect(() => {
    fetch('/api/seller/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.id) setSellerId(d.id);
        // /api/seller/me already normalizes ENTERPRISE -> PRO server-side,
        // but normalize again here defensively in case this layout is ever
        // fed tier data from another, unnormalized source.
        if (d?.tier) setTier(normalizeSellerTier(d.tier) as Tier);
      })
      .catch(() => {});

    fetch('/api/stripe/connect/account')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPayoutReady(!!(d?.chargesEnabled && d?.payoutsEnabled)))
      .catch(() => setPayoutReady(false));
  }, []);

  const theme = TIER_THEME[tier] || TIER_THEME.STARTER;

  const payoutItem = payoutReady
    ? { href: '/dashboard/payouts', label: 'Payouts', icon: 'PY' as const }
    : { href: '/dashboard/stripe-connect', label: 'Set Up Payout', icon: 'PY' as const };

  // Insert the single consolidated payout entry right before Analytics
  const analyticsIdx = baseNavItems.findIndex((i) => i.href === '/dashboard/analytics');
  const finalNavItems = [
    ...baseNavItems.slice(0, analyticsIdx),
    payoutItem,
    ...baseNavItems.slice(analyticsIdx),
  ].filter((i) => {
    const special = (i as { special?: string }).special;
    if (special === 'live') return true; // live shopping: every tier (2026-07-15)
    if (special === 'enterprise') return tier === 'PRO'; // legacy flag name — now means Pro features
    return true;
  });

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
        backgroundImage: theme.sidebarGradient,
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
          <p style={{ color: '#999999', fontSize: '12px', marginTop: '4px', marginBottom: '10px' }}>Seller Dashboard</p>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: theme.badgeColor,
            background: theme.badgeBg,
            border: `1px solid ${theme.badgeBorder}`,
          }}>
            {theme.label} plan
          </span>
        </div>

        <nav style={{ padding: '16px 0' }}>
          {finalNavItems.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
            const isLive = (item as { special?: string }).special === 'live';

            return (
              <Link
                key={item.href}
                href={item.href}
                className="sidebar-nav-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  textDecoration: 'none',
                  borderLeft: isActive && !isLive ? '3px solid #FF6B00' : '3px solid transparent',
                  background: isLive
                    ? 'rgba(255,107,0,0.14)'
                    : isActive ? 'rgba(255,107,0,0.08)' : 'transparent',
                  color: isLive ? '#FF6B00' : isActive ? '#FFFFFF' : '#999999',
                  fontSize: '14px',
                  fontWeight: isActive || isLive ? 600 : 400,
                  transition: 'all 0.15s',
                  boxShadow: isActive ? theme.activeGlow : 'none',
                }}
              >
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: isLive ? '#FF6B00' : isActive ? '#FF6B00' : '#2A2A2A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: isLive ? '#111111' : isActive ? '#FFFFFF' : '#666666',
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
      </aside>

      <style jsx>{`
        .sidebar-nav-link:hover {
          background: rgba(255, 255, 255, 0.04) !important;
          box-shadow: 0 0 14px ${theme.glow};
          color: #ffffff !important;
        }
      `}</style>

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
          <Link href={sellerId ? `/seller/${sellerId}` : '/'} style={{ color: '#999999', fontSize: '13px', textDecoration: 'none' }}>
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
            boxShadow: theme.avatarRing,
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
        {children}
      </main>
      <VelorAssistant />
    </div>
  );
}
