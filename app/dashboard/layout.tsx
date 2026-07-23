'use client';

// ============================================================
// VELOR SELLER STUDIO shell (2026-07-21) -- total redesign,
// William's direction: "professional fully functioning wired
// up to all routes seller dashboard", Shopify/Stripe style,
// approved from the concept mockup. Replaces the Halo shell.
//
//  - Left sidebar, grouped (Sell / Fulfil / Money / Account),
//    COLLAPSIBLE to an icon rail (William, 2026-07-21),
//    choice remembered per browser.
//  - RAIL-AWARE payout navigation: the seller's payout rail is
//    resolved live from their country by /api/seller/me
//    (lib/payoutRail.ts is the single source of truth). A
//    Stripe-country seller is only ever routed to Stripe
//    Connect setup; a non-Stripe-country seller only ever to
//    Dots setup (the default rail since 2026-07-23, replacing
//    Payoneer -- see lib/payoutRail.ts and lib/dots.ts), or, for
//    a legacy few, Payoneer. No path to the wrong payment system.
//  - Functional parity rules preserved from the old shells:
//    API Keys only for Pro; Go Live visible to every tier
//    (2026-07-15 rule); payout item swaps to "Set Up Payouts"
//    until the seller's own rail reports ready.
//  - Mobile (<900px): sidebar becomes an overlay drawer.
//  - Forces LIGHT theme while mounted (restored on unmount).
// ============================================================

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import VelorAssistant from '@/components/VelorAssistant';
import LanguageTranslator from '@/components/LanguageTranslator';
import { normalizeSellerTier } from '@/lib/tier';
import { STUDIO } from '@/lib/studio';
import { getDisplayCurrency, setStoredCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { getDisplayLanguage, setStoredLanguage, SUPPORTED_LANGUAGES } from '@/lib/language';

type Tier = 'STARTER' | 'PRO';
type Rail = 'STRIPE' | 'DOTS' | 'PAYONEER';

const SIDEBAR_KEY = 'velor-studio-sidebar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  special?: 'live' | 'pro-only' | 'payout';
  // Extra paths that should light this item up (e.g. payout setup pages).
  alsoActive?: string[];
}

function icon(path: React.ReactNode) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      {path}
    </svg>
  );
}

const ICONS = {
  home: icon(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>),
  analytics: icon(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  products: icon(<><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5M12 13v8" /></>),
  storefront: icon(<><path d="M4 4h16v6H4zM4 14h16v6H4z" /></>),
  discounts: icon(<><path d="m5 19 14-14" /><circle cx="7.5" cy="7.5" r="1" /><circle cx="16.5" cy="16.5" r="1" /></>),
  live: icon(<><path d="M23 7 16 12l7 5V7Z" /><rect x="1" y="5" width="15" height="14" rx="2" /></>),
  orders: icon(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18M16 10a4 4 0 0 1-8 0" /></>),
  returns: icon(<path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4" />),
  disputes: icon(<><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>),
  messages: icon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />),
  payouts: icon(<><rect x="2" y="7" width="20" height="10" rx="1.5" /><circle cx="12" cy="12" r="2.5" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.6 1.6 0 0 0 15 19.4a1.6 1.6 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.6 1.6 0 0 0 1 1.51 1.6 1.6 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9a1.6 1.6 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.6 1.6 0 0 0-1.51 1Z" /></>),
  apiKeys: icon(<path d="M15 7h3a5 5 0 0 1 0 10h-3M9 17H6A5 5 0 0 1 6 7h3M8 12h8" />),
  support: icon(<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></>),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  // null until /api/seller/me answers -- the plan pill and avatar initial
  // render nothing until then, so a Pro seller never sees a STARTER flash
  // (wrong information, even for a second, is the thing William is
  // stamping out).
  const [tierLoaded, setTierLoaded] = useState(false);
  const [tier, setTier] = useState<Tier>('STARTER');
  const [founding, setFounding] = useState(false);
  const [rail, setRail] = useState<Rail | null>(null);
  const [railLabel, setRailLabel] = useState<string>('');
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currency, setCurrency] = useState('GBP');
  const [language, setLanguage] = useState('en');
  const [langNote, setLangNote] = useState<string | null>(null);

  // Force LIGHT theme while the dashboard is mounted (public site may be
  // dark). Same MutationObserver pattern as before, restored on unmount.
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
      if (prev) document.documentElement.setAttribute('data-theme', prev);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Remember the seller's sidebar choice per browser.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === 'collapsed');
    } catch { /* private mode */ }
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      try { window.localStorage.setItem(SIDEBAR_KEY, v ? 'open' : 'collapsed'); } catch { /* ignore */ }
      return !v;
    });
  }

  // Close the mobile drawer on route change.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Seller identity + LIVE payout rail (resolved from country server-side by
  // /api/seller/me -- the shell never guesses the rail). Payout readiness is
  // then checked against the seller's OWN rail only: Stripe Connect account
  // status for STRIPE-rail sellers, Payoneer payee linkage for
  // PAYONEER-rail sellers. A seller is never shown, or routed to, the other
  // system's setup.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/seller/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (d) => {
        if (cancelled || !d) return;
        if (d.id) setSellerId(d.id);
        if (d.tier) setTier(normalizeSellerTier(d.tier) as Tier);
        setTierLoaded(true);
        setFounding(Boolean(d.foundingBadge));
        if (d.storeName) setStoreName(d.storeName);
        if (d.country) setCountry(d.country);
        const r: Rail = d.payoutRail === 'DOTS' ? 'DOTS' : d.payoutRail === 'PAYONEER' ? 'PAYONEER' : 'STRIPE';
        setRail(r);
        setRailLabel(d.payoutRailLabel || (r === 'DOTS' ? 'Dots' : r === 'PAYONEER' ? 'Payoneer' : 'Stripe Connect'));
        try {
          if (r === 'STRIPE') {
            const res = await fetch('/api/stripe/connect/account');
            const a = res.ok ? await res.json() : null;
            if (!cancelled) setPayoutReady(!!(a?.chargesEnabled && a?.payoutsEnabled));
          } else if (r === 'DOTS') {
            const res = await fetch('/api/dots/onboard');
            const a = res.ok ? await res.json() : null;
            if (!cancelled) setPayoutReady(Boolean(a?.onboarded));
          } else {
            const res = await fetch('/api/payoneer/onboard');
            const a = res.ok ? await res.json() : null;
            if (!cancelled) setPayoutReady(Boolean(a?.onboarded));
          }
        } catch {
          if (!cancelled) setPayoutReady(false);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Language + currency: same site-wide localStorage keys as GlobalHeader,
  // so a choice made here or on the storefront round-trips both ways.
  useEffect(() => {
    setCurrency(getDisplayCurrency());
    setLanguage(getDisplayLanguage());
    const onCurrencyChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setCurrency(detail);
    };
    window.addEventListener('velor-currency-changed', onCurrencyChange);
    return () => window.removeEventListener('velor-currency-changed', onCurrencyChange);
  }, []);

  function changeLanguage(value: string) {
    setLanguage(value);
    setStoredLanguage(value);
    const l = SUPPORTED_LANGUAGES.find((x) => x.code === value);
    if (l && value !== 'en') {
      setLangNote(`Translating Velor into ${l.native} — a page's first visit takes a few seconds, then it's instant.`);
      window.setTimeout(() => setLangNote(null), 7000);
    } else {
      setLangNote(null);
    }
  }

  function changeCurrency(value: string) {
    setCurrency(value);
    setStoredCurrency(value);
  }

  // ---- navigation model -------------------------------------------------
  // The payout destination is the ONLY rail-dependent link in the app:
  //   STRIPE rail, not ready  -> /dashboard/stripe-connect ("Set Up Payouts")
  //   DOTS rail, not ready    -> /dashboard/dots           ("Set Up Payouts")
  //   PAYONEER rail, not ready-> /dashboard/payoneer       ("Set Up Payouts")
  //   ready (any rail)        -> /dashboard/payouts
  const payoutSetupHref = rail === 'DOTS' ? '/dashboard/dots' : rail === 'PAYONEER' ? '/dashboard/payoneer' : '/dashboard/stripe-connect';
  const payoutAlsoActive = ['/dashboard/payouts', '/dashboard/stripe-connect', '/dashboard/dots', '/dashboard/payoneer'];
  const payoutItem: NavItem = payoutReady === false
    ? { href: payoutSetupHref, label: 'Set Up Payouts', icon: ICONS.payouts, special: 'payout', alsoActive: payoutAlsoActive }
    : { href: '/dashboard/payouts', label: 'Payouts', icon: ICONS.payouts, special: 'payout', alsoActive: payoutAlsoActive.slice(1) };

  const sections: { label: string | null; items: NavItem[] }[] = [
    {
      label: null,
      items: [
        { href: '/dashboard', label: 'Home', icon: ICONS.home },
        { href: '/dashboard/analytics', label: 'Analytics', icon: ICONS.analytics },
      ],
    },
    {
      label: 'Sell',
      items: [
        { href: '/dashboard/products', label: 'Products', icon: ICONS.products },
        { href: '/dashboard/storefront', label: 'Storefront', icon: ICONS.storefront },
        { href: '/dashboard/discount-codes', label: 'Discounts', icon: ICONS.discounts },
        { href: '/dashboard/live', label: 'Go Live', icon: ICONS.live, special: 'live' },
      ],
    },
    {
      label: 'Fulfil',
      items: [
        { href: '/dashboard/orders', label: 'Orders', icon: ICONS.orders },
        { href: '/dashboard/returns', label: 'Returns', icon: ICONS.returns },
        { href: '/dashboard/disputes', label: 'Disputes', icon: ICONS.disputes },
        { href: '/dashboard/messages', label: 'Messages', icon: ICONS.messages },
      ],
    },
    {
      label: 'Money',
      items: [payoutItem],
    },
    {
      label: 'Account',
      items: [
        { href: '/dashboard/settings', label: 'Settings', icon: ICONS.settings, alsoActive: ['/dashboard/terms', '/dashboard/upgrade'] },
        { href: '/dashboard/api-keys', label: 'API Keys', icon: ICONS.apiKeys, special: 'pro-only' },
        { href: '/dashboard/support', label: 'Support', icon: ICONS.support },
      ],
    },
  ];

  function visible(item: NavItem): boolean {
    if (item.special === 'pro-only' && tier !== 'PRO') return false;
    return true;
  }

  function isActive(item: NavItem): boolean {
    if (item.href === '/dashboard') return pathname === '/dashboard';
    if (pathname.startsWith(item.href)) return true;
    return (item.alsoActive || []).some((p) => pathname.startsWith(p));
  }

  // ---- pieces -----------------------------------------------------------

  const liveDot = (
    <span aria-hidden style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: STUDIO.accent, animation: 'studioPulse 1.6s infinite', flexShrink: 0,
    }} />
  );

  const railTag = rail && (
    <span style={{
      fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '2px 6px', borderRadius: 4, flexShrink: 0,
      background: rail === 'STRIPE' ? STUDIO.blueSoft : STUDIO.accentSoft,
      color: rail === 'STRIPE' ? STUDIO.blue : '#B54A00',
    }}>
      {rail === 'STRIPE' ? 'Stripe' : rail === 'DOTS' ? 'Dots' : 'Payoneer'}
    </span>
  );

  function navLink(item: NavItem, inDrawer: boolean) {
    const active = isActive(item);
    const showText = inDrawer || !collapsed;
    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        title={showText ? undefined : item.label}
        style={{
          display: 'flex', alignItems: 'center', gap: showText ? 10 : 0,
          justifyContent: showText ? 'flex-start' : 'center',
          padding: showText ? '8px 12px' : '10px 0',
          borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 500,
          color: active ? STUDIO.ink : STUDIO.ink2,
          background: active ? STUDIO.accentSoft : 'transparent',
          textDecoration: 'none', position: 'relative', marginBottom: 1,
        }}
      >
        <span style={{ color: active ? STUDIO.accent : STUDIO.muted, display: 'inline-flex' }}>{item.icon}</span>
        {showText && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
        {showText && item.special === 'live' && <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>{liveDot}</span>}
        {showText && item.special === 'payout' && <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>{railTag}</span>}
        {!showText && item.special === 'live' && (
          <span style={{ position: 'absolute', top: 7, right: 9 }}>{liveDot}</span>
        )}
      </Link>
    );
  }

  function navSections(inDrawer: boolean) {
    const showText = inDrawer || !collapsed;
    return sections.map((sec, i) => (
      <div key={i} style={{
        marginTop: i === 0 ? 14 : showText ? 18 : 8,
        borderTop: !showText && i > 0 ? `1px solid ${STUDIO.borderSoft}` : 'none',
        paddingTop: !showText && i > 0 ? 8 : 0,
      }}>
        {sec.label && showText && (
          <div style={{
            fontFamily: STUDIO.fontDisplay, fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: STUDIO.faint, padding: '0 12px 6px',
          }}>
            {sec.label}
          </div>
        )}
        {sec.items.filter(visible).map((item) => navLink(item, inDrawer))}
      </div>
    ));
  }

  const planPill = !tierLoaded ? null : (
    <Link
      href="/dashboard/upgrade"
      title={founding ? 'Founding seller — Pro free for life' : tier === 'PRO' ? 'Pro plan' : 'See plans'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, background: STUDIO.ink,
        color: '#FFF4E8', borderRadius: 999, padding: '5px 12px', fontSize: 11,
        fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: STUDIO.accent, fontWeight: 700 }}>{tier}</span>
      {founding ? 'Founding · Free for life' : tier === 'PRO' ? 'Unlimited listings' : 'Upgrade'}
    </Link>
  );

  const langCurrencySwitcher = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
      <select
        title="Velor speaks 19 languages. Pick yours and every page translates as you browse."
        aria-label="Language"
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          background: STUDIO.surface, border: `1px solid ${STUDIO.border}`, borderRadius: 8,
          padding: '6px 9px', fontSize: 12, fontWeight: 500, color: STUDIO.ink2,
          fontFamily: STUDIO.fontBody, cursor: 'pointer', outline: 'none', maxWidth: 104,
        }}
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} style={{ color: '#000' }}>{l.native}</option>
        ))}
      </select>
      {langNote && (
        <div style={{
          position: 'absolute', top: 40, right: 0, width: 260, zIndex: 60,
          background: STUDIO.surface, border: `1px solid ${STUDIO.border}`, borderRadius: 12,
          padding: '10px 13px', fontSize: 12, lineHeight: 1.5, color: STUDIO.ink,
          boxShadow: '0 16px 40px rgba(26,26,29,0.15)',
        }}>
          {langNote}
        </div>
      )}
      <select
        title="Figures are converted live using current exchange rates for your own viewing -- your real payout currency is unchanged."
        aria-label="Display currency"
        value={currency}
        onChange={(e) => changeCurrency(e.target.value)}
        style={{
          background: STUDIO.surface, border: `1px solid ${STUDIO.border}`, borderRadius: 8,
          padding: '6px 9px', fontSize: 12, fontWeight: 500, color: STUDIO.ink2,
          fontFamily: STUDIO.fontBody, cursor: 'pointer', outline: 'none',
        }}
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c} style={{ color: '#000' }}>{c}</option>
        ))}
      </select>
    </div>
  );

  const sidebar = !isMobile && (
    <aside style={{
      background: STUDIO.surface, borderRight: `1px solid ${STUDIO.border}`,
      padding: collapsed ? '0 8px 24px' : '0 12px 24px',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '20px 0 14px' : '20px 12px 14px',
      }}>
        <Link href="/" style={{ fontFamily: STUDIO.fontDisplay, fontWeight: 700, fontSize: collapsed ? 15 : 19, letterSpacing: '-0.5px', color: STUDIO.ink, textDecoration: 'none' }}>
          {collapsed ? 'V' : 'VELOR'}
        </Link>
        {!collapsed && (
          <span style={{ fontFamily: STUDIO.fontSerif, fontStyle: 'italic', fontSize: 12, color: STUDIO.muted }}>
            Seller Studio
          </span>
        )}
      </div>

      <div style={{ flex: 1 }}>{navSections(false)}</div>

      <button
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginTop: 18,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '10px 0' : '8px 12px', border: 'none', borderRadius: 8,
          background: 'transparent', color: STUDIO.faint, fontFamily: STUDIO.fontBody,
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} aria-hidden>
          <path d="m15 6-6 6 6 6" />
        </svg>
        {!collapsed && 'Collapse'}
      </button>

      {!collapsed && (
        <div style={{ padding: 12, borderTop: `1px solid ${STUDIO.borderSoft}`, marginTop: 8 }}>
          {planPill}
          <div style={{ fontSize: 11.5, color: STUDIO.muted, marginTop: 10, lineHeight: 1.5 }}>
            {storeName || 'Your store'}
            {country && railLabel && (
              <>
                <br />
                {country} · payouts via <b style={{ color: STUDIO.ink2 }}>{railLabel}</b>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );

  const mobileDrawer = isMobile && mobileOpen && (
    <div
      onClick={() => setMobileOpen(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(26,26,29,0.4)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(300px, 84vw)',
          background: STUDIO.surface, borderRight: `1px solid ${STUDIO.border}`,
          padding: '18px 14px 24px', overflowY: 'auto',
          boxShadow: '0 0 60px rgba(26,26,29,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 12px 4px' }}>
          <span style={{ fontFamily: STUDIO.fontDisplay, fontWeight: 700, fontSize: 19, letterSpacing: '-0.5px', color: STUDIO.ink }}>VELOR</span>
          <span style={{ fontFamily: STUDIO.fontSerif, fontStyle: 'italic', fontSize: 12, color: STUDIO.muted }}>Seller Studio</span>
        </div>
        {navSections(true)}
        <div style={{ padding: 12, borderTop: `1px solid ${STUDIO.borderSoft}`, marginTop: 16 }}>
          {planPill}
          <div style={{ marginTop: 12 }}>{langCurrencySwitcher}</div>
          {country && railLabel && (
            <div style={{ fontSize: 11.5, color: STUDIO.muted, marginTop: 10, lineHeight: 1.5 }}>
              {country} · payouts via <b style={{ color: STUDIO.ink2 }}>{railLabel}</b>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: STUDIO.bg, color: STUDIO.ink, fontFamily: STUDIO.fontBody,
      display: 'grid', gridTemplateColumns: isMobile ? '1fr' : collapsed ? '64px 1fr' : '236px 1fr',
    }}>
      <style>{`@keyframes studioPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      {sidebar}

      <div style={{ minWidth: 0 }}>
        {/* top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 14, background: STUDIO.surface,
          borderBottom: `1px solid ${STUDIO.border}`, padding: isMobile ? '10px 14px' : '10px 28px',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          {isMobile && (
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{
                width: 38, height: 38, borderRadius: 8, border: `1px solid ${STUDIO.border}`,
                background: STUDIO.surface, color: STUDIO.ink, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          )}
          {isMobile && (
            <span style={{ fontFamily: STUDIO.fontDisplay, fontWeight: 700, fontSize: 16, color: STUDIO.ink }}>VELOR</span>
          )}
          <div style={{ flex: 1 }} />
          {!isMobile && (
            <Link
              href={sellerId ? `/seller/${sellerId}` : '/'}
              style={{ fontSize: 12.5, fontWeight: 500, color: STUDIO.ink2, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
              </svg>
              View my storefront
            </Link>
          )}
          {!isMobile && langCurrencySwitcher}
          {!isMobile && planPill}
          <span aria-hidden style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #FF8A2B, #FF6B00)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: STUDIO.fontDisplay, fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {storeName ? storeName.charAt(0).toUpperCase() : ''}
          </span>
        </header>

        {mobileDrawer}

        <main style={{ minHeight: '70vh' }}>
          {children}
        </main>
      </div>

      <VelorAssistant />
      {/* Live whole-page translation, same as every public page. */}
      <LanguageTranslator />
    </div>
  );
}
