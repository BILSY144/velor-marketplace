'use client';

// ============================================================
// HALO dashboard shell (2026-07-20) — replaces the dark fixed
// sidebar with the light, full-width Halo layout William approved
// from the mockup: warm aurora backdrop, top constellation nav
// (every destination of the old sidebar preserved, grouped into
// four constellations), plan pills, storefront link.
//
// The old layout FORCED dark mode; Halo forces LIGHT for the
// dashboard only (restored on unmount), so inner pages built on
// CSS variables pick up the light tokens.
//
// Functional parity with the old sidebar, unchanged rules:
//  - Payouts item swaps to "Set Up Payout" (stripe-connect) until
//    the Stripe account is charges+payouts enabled.
//  - API Keys only for Pro.
//  - Go Live visible to every tier (2026-07-15 rule).
//  - Mobile (<900px): nav collapses into an opt-in overlay drawer
//    so content is full-screen by default (William, 2026-07-20).
// ============================================================

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import VelorAssistant from '@/components/VelorAssistant';
import { normalizeSellerTier } from '@/lib/tier';
import { HALO, HaloBackdrop, HaloPlanPills } from '@/lib/halo';

type Tier = 'STARTER' | 'PRO';

interface NavItem {
  href: string;
  label: string;
  special?: 'live' | 'pro-only' | 'payout';
}

interface Constellation {
  label: string | null;
  items: NavItem[];
}

const CONSTELLATIONS: Constellation[] = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Overview' },
      { href: '/dashboard/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'Sell',
    items: [
      { href: '/dashboard/products', label: 'Products' },
      { href: '/dashboard/storefront', label: 'Storefront' },
      { href: '/dashboard/discount-codes', label: 'Discounts' },
      { href: '/dashboard/live', label: 'Go Live', special: 'live' },
    ],
  },
  {
    label: 'Fulfil',
    items: [
      { href: '/dashboard/orders', label: 'Orders' },
      { href: '/dashboard/returns', label: 'Returns' },
      { href: '/dashboard/disputes', label: 'Disputes' },
      { href: '/dashboard/messages', label: 'Messages' },
    ],
  },
  {
    label: 'Studio',
    items: [
      { href: '/dashboard/payouts', label: 'Payouts', special: 'payout' },
      { href: '/dashboard/api-keys', label: 'API Keys', special: 'pro-only' },
      { href: '/dashboard/settings', label: 'Settings' },
      { href: '/dashboard/support', label: 'Support' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>('STARTER');
  const [founding, setFounding] = useState(false);
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Force LIGHT theme while the dashboard is mounted (the public site
  // may be in dark mode). Same MutationObserver pattern the old layout
  // used for dark, restored faithfully on unmount.
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    const force = () => {
      if (document.documentElement.getAttribute('data-theme') !== 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };
    force();
    const observer = new MutationObserver(force);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      observer.disconnect();
      if (prev) {
        document.documentElement.setAttribute('data-theme', prev);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close the mobile drawer on route change so the new page is seen
  // full-screen, not under the drawer.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch('/api/seller/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.id) setSellerId(d.id);
        if (d?.tier) setTier(normalizeSellerTier(d.tier) as Tier);
        setFounding(Boolean(d?.foundingBadge));
      })
      .catch(() => {});

    fetch('/api/stripe/connect/account')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPayoutReady(!!(d?.chargesEnabled && d?.payoutsEnabled)))
      .catch(() => setPayoutReady(false));
  }, []);

  function resolveItem(item: NavItem): NavItem | null {
    if (item.special === 'pro-only' && tier !== 'PRO') return null;
    if (item.special === 'payout' && payoutReady === false) {
      return { href: '/dashboard/stripe-connect', label: 'Set Up Payout', special: 'payout' };
    }
    return item;
  }

  function isActive(href: string): boolean {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
  }

  const navLinkStyle = (active: boolean, live: boolean): React.CSSProperties => ({
    padding: '7px 13px',
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: live ? 800 : 600,
    color: live ? HALO.accent : active ? '#FFF4E8' : HALO.inkSoft,
    background: active && !live ? HALO.ink : 'transparent',
    boxShadow: active && !live ? '0 6px 16px rgba(26,26,29,0.3)' : 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.25s',
    display: 'inline-flex',
    alignItems: 'center',
  });

  const liveDot = (
    <span
      aria-hidden
      style={{
        display: 'inline-block', width: 6, height: 6, marginRight: 6, borderRadius: '50%',
        background: HALO.accent, animation: 'haloPulse 1.6s infinite',
      }}
    />
  );

  const constellationNav = (
    <nav
      style={{
        position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between',
        gap: 18, padding: '16px 0 6px', flexWrap: 'wrap',
        width: 'min(1680px, 96vw)', margin: '0 auto',
      }}
    >
      {CONSTELLATIONS.map((c, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 2, padding: '5px 6px 5px 14px',
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.95)', borderRadius: 999,
            boxShadow: '0 10px 30px rgba(90,60,20,0.1)',
          }}
        >
          {c.label && (
            <span style={{ fontFamily: HALO.fontDisplay, fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: HALO.amber, marginRight: 8 }}>
              {c.label}
            </span>
          )}
          {c.items.map((raw) => {
            const item = resolveItem(raw);
            if (!item) return null;
            const live = raw.special === 'live';
            return (
              <Link key={raw.href} href={item.href} style={navLinkStyle(isActive(item.href), live)}>
                {live && liveDot}
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const mobileDrawer = mobileOpen && (
    <div
      onClick={() => setMobileOpen(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(26,26,29,0.35)', backdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 12, left: 12, right: 12, borderRadius: 28, padding: '22px 20px',
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,1)', boxShadow: '0 30px 80px rgba(90,60,20,0.3)',
          maxHeight: 'calc(100vh - 24px)', overflowY: 'auto',
        }}
      >
        {CONSTELLATIONS.map((c, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            {c.label && (
              <div style={{ fontFamily: HALO.fontDisplay, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: HALO.amber, margin: '0 0 6px 12px' }}>
                {c.label}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.items.map((raw) => {
                const item = resolveItem(raw);
                if (!item) return null;
                const live = raw.special === 'live';
                const active = isActive(item.href);
                return (
                  <Link
                    key={raw.href}
                    href={item.href}
                    style={{
                      padding: '10px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: live || active ? 800 : 600,
                      color: live ? HALO.accent : active ? '#FFF4E8' : HALO.ink,
                      background: active && !live ? HALO.ink : 'rgba(26,26,29,0.05)',
                      textDecoration: 'none',
                    }}
                  >
                    {live && liveDot}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: HALO.paper, color: HALO.ink, fontFamily: HALO.fontBody }}>
      <HaloBackdrop />

      {/* top bar */}
      <header
        style={{
          position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 18,
          width: 'min(1680px, 96vw)', margin: '0 auto', padding: '20px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
          <Link href="/" style={{ fontFamily: HALO.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', color: HALO.ink, textDecoration: 'none' }}>
            VELOR
          </Link>
          <span style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 400, fontSize: 13, color: HALO.muted }}>
            Seller Halo
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {!isMobile && (
            <Link
              href={sellerId ? `/seller/${sellerId}` : '/'}
              style={{ fontSize: 12, fontWeight: 600, color: HALO.muted, textDecoration: 'none', borderBottom: `1px dotted ${HALO.muted}`, paddingBottom: 1 }}
            >
              View my storefront
            </Link>
          )}
          <HaloPlanPills tier={tier} founding={founding} />
          <span
            aria-hidden
            style={{
              width: 40, height: 40, borderRadius: '46% 54% 52% 48% / 54% 46% 54% 46%',
              background: 'linear-gradient(135deg, #FF8A2B, #FF6B00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              fontFamily: HALO.fontDisplay, fontWeight: 800, fontSize: 14,
              boxShadow: '0 8px 20px rgba(255,107,0,0.35)', flexShrink: 0,
            }}
          >
            S
          </span>
          {isMobile && (
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{
                width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(26,26,29,0.14)',
                background: 'rgba(255,255,255,0.7)', color: HALO.ink, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              )}
            </button>
          )}
        </div>
      </header>

      {!isMobile && constellationNav}
      {isMobile && mobileDrawer}

      <main style={{ position: 'relative', zIndex: 3, minHeight: '70vh' }}>
        {children}
      </main>

      <VelorAssistant />
    </div>
  );
}
