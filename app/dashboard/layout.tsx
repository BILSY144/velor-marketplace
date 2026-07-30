'use client';

// ============================================================
// VELOR SELLER DASHBOARD shell -- rebuilt 2026-07-30 to William's
// dashboard design (the "Creator Journals" page design, approved via
// "Full shell + journals page" + "Build them all for real"), replacing
// the light Seller Studio shell of 2026-07-21.
//
//  - DARK sidebar per the design: SELLER DASHBOARD kicker, the
//    design's exact item order (Overview, Orders, Products, Live
//    Selling, Creator Journals, Workshop Videos, Questions & Answers,
//    Messages, Followers, Reviews, Analytics, Payments, Shipping,
//    Store Settings, Account Settings), REAL count badges from
//    /api/seller/navstats (genuine figures, start at zero), a LIVE
//    chip on Live Selling, the held balance on Payments, and the
//    maker card at the bottom (avatar, store name, country flag,
//    View Store).
//  - A "More" group preserves every existing destination the design
//    doesn't name (Weekly Drop, Discounts, Returns, Disputes,
//    Support, API Keys) -- nothing reachable before is lost.
//  - PRO EXTRAS in the sidebar (William, 2026-07-30: "add the extras
//    in side bar for pro subscribers and their extra benefits"):
//    Pro sellers see their benefits listed; Starter sellers see the
//    same list as an upgrade card into /dashboard/upgrade.
//  - Light/dark toggle honoured: the shell is CSS-variable driven
//    (--dsh-*), dark by design default, mapped to the site's light
//    tokens under html[data-theme='light'].
//  - Theme handling: journal routes follow the visitor's own site
//    theme (dark design default); every other dashboard page still
//    forces LIGHT while mounted, because those pages remain on the
//    light Studio design until each is redesigned.
//  - Functional parity preserved: rail-aware payout navigation
//    (Stripe Connect vs Payoneer, resolved live by /api/seller/me),
//    API Keys Pro-only, Go Live on every tier, collapsible sidebar
//    remembered per browser, mobile overlay drawer, language +
//    currency pickers, VelorAssistant + LanguageTranslator mounts.
// ============================================================

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import VelorAssistant from '@/components/VelorAssistant';
import GlobalHeader from '@/components/GlobalHeader';
import LanguageTranslator from '@/components/LanguageTranslator';
import { normalizeSellerTier } from '@/lib/tier';
import { countryToCode } from '@/lib/payoutRail';
import { getDisplayCurrency, setStoredCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { getDisplayLanguage, setStoredLanguage, SUPPORTED_LANGUAGES } from '@/lib/language';

type Tier = 'STARTER' | 'PRO';
type Rail = 'STRIPE' | 'PAYONEER';

const SIDEBAR_KEY = 'velor-studio-sidebar';

interface NavStats {
  orders: number;
  products: number;
  questions: number;
  messages: number;
  followers: number;
  balanceGBP: number;
  storeLogo: string | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  special?: 'live' | 'pro-only' | 'payout';
  count?: number;
  money?: number;
  alsoActive?: string[];
}

// Country flag derived at runtime from the ISO code -- never emoji in
// source (standing directive; the 2026-07-08 content-filter incident).
function flagFor(country: string | null): string {
  const code = countryToCode(country);
  if (!code || code.length !== 2) return '';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + code.charCodeAt(0) - 65, A + code.charCodeAt(1) - 65);
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
  video: icon(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m10 9 5 3-5 3V9Z" /></>),
  orders: icon(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18M16 10a4 4 0 0 1-8 0" /></>),
  returns: icon(<path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4" />),
  disputes: icon(<><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>),
  messages: icon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />),
  followers: icon(<><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M2 21c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /><path d="M17 3.5a4 4 0 0 1 0 7.6M22 21c0-3-2-4.8-5-5.4" /></>),
  star: icon(<path d="m12 2 3 6.5 7 .9-5.1 4.8 1.3 6.9L12 17.8 5.8 21l1.3-6.9L2 9.4l7-.9L12 2Z" />),
  payouts: icon(<><rect x="2" y="7" width="20" height="10" rx="1.5" /><circle cx="12" cy="12" r="2.5" /></>),
  shipping: icon(<><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8Z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.6 1.6 0 0 0 15 19.4a1.6 1.6 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.6 1.6 0 0 0 1 1.51 1.6 1.6 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9a1.6 1.6 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.6 1.6 0 0 0-1.51 1Z" /></>),
  apiKeys: icon(<path d="M15 7h3a5 5 0 0 1 0 10h-3M9 17H6A5 5 0 0 1 6 7h3M8 12h8" />),
  journal: icon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M9 7h7M9 11h7" /></>),
  drop: icon(<><path d="M12 2s6 7.4 6 12a6 6 0 0 1-12 0c0-4.6 6-12 6-12Z" /></>),
  support: icon(<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></>),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [tierLoaded, setTierLoaded] = useState(false);
  const [tier, setTier] = useState<Tier>('STARTER');
  const [founding, setFounding] = useState(false);
  const [rail, setRail] = useState<Rail | null>(null);
  const [railLabel, setRailLabel] = useState<string>('');
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const [stats, setStats] = useState<NavStats | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currency, setCurrency] = useState('GBP');
  const [language, setLanguage] = useState('en');
  const [langNote, setLangNote] = useState<string | null>(null);

  // Theme: the dashboard chrome (sidebar + top bar) is ALWAYS dark --
  // that IS William's design ("dasboard still white no dark mode",
  // 2026-07-30) -- via fixed --dsh-* values with no light remap.
  // Journal routes force data-theme dark so the Creator Journals page
  // renders the dark design; every OTHER dashboard page still forces
  // LIGHT while mounted, because those pages remain on the light
  // Studio design until each is redesigned and their form fields read
  // the site vars. Their content area keeps a light canvas below.
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    const isJournal = pathname.startsWith('/dashboard/journal');
    const desired = isJournal ? 'dark' : 'light';
    const force = () => {
      if (document.documentElement.getAttribute('data-theme') !== desired) {
        document.documentElement.setAttribute('data-theme', desired);
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
  }, [pathname]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Seller identity + LIVE payout rail (resolved from country server-side
  // by /api/seller/me -- the shell never guesses the rail). Payout
  // readiness is checked against the seller's OWN rail only.
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
        const r: Rail = d.payoutRail === 'PAYONEER' ? 'PAYONEER' : 'STRIPE';
        setRail(r);
        setRailLabel(d.payoutRailLabel || (r === 'PAYONEER' ? 'Payoneer' : 'Stripe Connect'));
        try {
          if (r === 'STRIPE') {
            const res = await fetch('/api/stripe/connect/account');
            const a = res.ok ? await res.json() : null;
            if (!cancelled) setPayoutReady(!!(a?.chargesEnabled && a?.payoutsEnabled));
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

  // Real sidebar counts. Refreshed on route change so a just-answered
  // question or just-read message clears its badge as the seller moves.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/seller/navstats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && typeof d.orders === 'number') setStats(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);

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
  // Payments is the ONLY rail-dependent link: STRIPE not ready ->
  // /dashboard/stripe-connect; PAYONEER not ready -> /dashboard/payoneer;
  // ready (any rail) -> /dashboard/payouts. Cosmetic only -- the payout
  // gate itself lives in middleware.ts.
  const payoutSetupHref = rail === 'PAYONEER' ? '/dashboard/payoneer' : '/dashboard/stripe-connect';
  const payoutAlsoActive = ['/dashboard/payouts', '/dashboard/stripe-connect', '/dashboard/payoneer'];
  const paymentsItem: NavItem = payoutReady === false
    ? { href: payoutSetupHref, label: 'Set Up Payouts', icon: ICONS.payouts, special: 'payout', alsoActive: payoutAlsoActive }
    : { href: '/dashboard/payouts', label: 'Payments', icon: ICONS.payouts, special: 'payout', money: stats?.balanceGBP, alsoActive: payoutAlsoActive.slice(1) };

  // The design's sidebar, in its exact order. Items the design names
  // without a dashboard page of their own map to the nearest real
  // destination: Workshop Videos -> the public Workshop feed (where a
  // maker's process videos and entries appear), Reviews -> the seller's
  // public storefront, where their reviews render exactly as buyers see
  // them. Followers used to fall back to Analytics -- William, 2026-08-01:
  // "when clicking followers it should take me to a page what lists all my
  // followers or at least show the followers and name of followers" -- so
  // it now goes to its own real page (app/dashboard/followers), listing
  // the actual Follow rows with the same privacy-masked buyer names used
  // everywhere else a seller sees a buyer's identity.
  const mainItems: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: ICONS.home },
    { href: '/dashboard/orders', label: 'Orders', icon: ICONS.orders, count: stats?.orders },
    { href: '/dashboard/products', label: 'Products', icon: ICONS.products, count: stats?.products },
    { href: '/dashboard/live', label: 'Live Selling', icon: ICONS.live, special: 'live' },
    { href: '/dashboard/journal', label: 'Creator Journals', icon: ICONS.journal },
    { href: '/workshop', label: 'Workshop Videos', icon: ICONS.video },
    { href: '/dashboard/questions', label: 'Questions & Answers', icon: ICONS.support, count: stats?.questions },
    { href: '/dashboard/messages', label: 'Messages', icon: ICONS.messages, count: stats?.messages },
    { href: '/dashboard/followers', label: 'Followers', icon: ICONS.followers, count: stats?.followers },
    { href: sellerId ? `/seller/${sellerId}` : '/dashboard/analytics', label: 'Reviews', icon: ICONS.star },
    { href: '/dashboard/analytics', label: 'Analytics', icon: ICONS.analytics },
    paymentsItem,
    { href: '/dashboard/settings/shipping', label: 'Shipping', icon: ICONS.shipping },
    { href: '/dashboard/storefront', label: 'Store Settings', icon: ICONS.storefront },
    { href: '/dashboard/settings', label: 'Account Settings', icon: ICONS.settings, alsoActive: ['/dashboard/terms', '/dashboard/upgrade'] },
  ];

  // Everything reachable before the redesign stays reachable.
  const moreItems: NavItem[] = [
    { href: '/dashboard/drops', label: 'Weekly Drop', icon: ICONS.drop },
    { href: '/dashboard/discount-codes', label: 'Discounts', icon: ICONS.discounts },
    { href: '/dashboard/returns', label: 'Returns', icon: ICONS.returns },
    { href: '/dashboard/disputes', label: 'Disputes', icon: ICONS.disputes },
    { href: '/dashboard/support', label: 'Support', icon: ICONS.support },
    { href: '/dashboard/api-keys', label: 'API Keys', icon: ICONS.apiKeys, special: 'pro-only' },
  ];

  function visible(item: NavItem): boolean {
    if (item.special === 'pro-only' && tier !== 'PRO') return false;
    return true;
  }

  function isActive(item: NavItem): boolean {
    if (item.href === '/dashboard') return pathname === '/dashboard';
    // Followers + Analytics share /dashboard/analytics; Shipping lives
    // under /dashboard/settings -- exact-first matching keeps one lit.
    if (item.label === 'Followers' || item.label === 'Reviews') return false;
    if (item.href === '/dashboard/settings') {
      return (pathname === '/dashboard/settings' || (item.alsoActive || []).some((p) => pathname.startsWith(p)));
    }
    if (pathname.startsWith(item.href)) return true;
    return (item.alsoActive || []).some((p) => pathname.startsWith(p));
  }

  // ---- pieces -----------------------------------------------------------

  const liveChip = (
    <span className="dsh-livechip" aria-hidden>LIVE</span>
  );

  function badge(item: NavItem) {
    if (item.special === 'live') return liveChip;
    if (typeof item.money === 'number') {
      return <span className="dsh-count dsh-money">&pound;{item.money.toFixed(2)}</span>;
    }
    if (typeof item.count === 'number' && item.count > 0) {
      return <span className="dsh-count">{item.count > 999 ? '999+' : item.count}</span>;
    }
    return null;
  }

  function navLink(item: NavItem, inDrawer: boolean) {
    const active = isActive(item);
    const showText = inDrawer || !collapsed;
    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        title={showText ? undefined : item.label}
        className={`dsh-nav ${active ? 'dsh-nav-on' : ''} ${showText ? '' : 'dsh-nav-mini'}`}
      >
        <span className="dsh-nav-ico">{item.icon}</span>
        {showText && <span className="dsh-nav-label">{item.label}</span>}
        {showText && <span className="dsh-nav-badge">{badge(item)}</span>}
        {!showText && item.special === 'live' && <span className="dsh-livedot" style={{ position: 'absolute', top: 7, right: 9 }} />}
      </Link>
    );
  }

  // PRO EXTRAS (William, 2026-07-30). Pro sellers see their benefits in
  // the sidebar; Starter sellers see the same list as the upgrade offer.
  const PRO_BENEFITS: { label: string; href?: string }[] = [
    { label: 'Unlimited listings', href: '/dashboard/products' },
    { label: '4% commission (vs 10%)' },
    { label: 'AI account manager', href: '/dashboard/support' },
    { label: 'Full API access', href: '/dashboard/api-keys' },
    { label: 'Priority support', href: '/dashboard/support' },
    { label: 'Priority search placement' },
  ];

  const proCard = !tierLoaded ? null : tier === 'PRO' ? (
    <div className="dsh-procard">
      <div className="dsh-procard-head">
        <span className="dsh-propill">PRO</span>
        {founding ? 'Founding · free for life' : 'Your extras'}
      </div>
      {founding && <div className="dsh-procard-note">Your extras</div>}
      <ul className="dsh-prolist">
        {PRO_BENEFITS.map((b) => (
          <li key={b.label}>
            <span className="dsh-protick" aria-hidden>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m4 13 5 5L20 6" /></svg>
            </span>
            {b.href ? <Link href={b.href} className="dsh-prolink">{b.label}</Link> : <span>{b.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <Link href="/dashboard/upgrade" className="dsh-procard dsh-procard-upgrade">
      <div className="dsh-procard-head">
        <span className="dsh-propill">PRO</span>
        Go Pro &mdash; &pound;49/mo
      </div>
      <ul className="dsh-prolist">
        {PRO_BENEFITS.map((b) => (
          <li key={b.label}>
            <span className="dsh-protick" aria-hidden>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m4 13 5 5L20 6" /></svg>
            </span>
            <span>{b.label}</span>
          </li>
        ))}
      </ul>
      <span className="dsh-upgradecta">See plans &rarr;</span>
    </Link>
  );

  const flag = flagFor(country);

  const makerCard = (
    <div className="dsh-maker">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {stats?.storeLogo
        ? <img src={stats.storeLogo} alt="" className="dsh-maker-ava" />
        : <span className="dsh-maker-ava dsh-maker-init" aria-hidden>{storeName ? storeName.charAt(0).toUpperCase() : ''}</span>}
      <span className="dsh-maker-meta">
        <span className="dsh-maker-name">
          {storeName || 'Your store'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent, #FF6B00)" aria-hidden style={{ flexShrink: 0 }}><path d="M12 1.5 14.8 4l3.7-.4 1 3.6 3.2 1.9-1.6 3.4 1.6 3.4-3.2 1.9-1 3.6-3.7-.4L12 22.5 9.2 20l-3.7.4-1-3.6-3.2-1.9 1.6-3.4L1.3 8.1l3.2-1.9 1-3.6 3.7.4L12 1.5Z" /><path d="m8.5 12.2 2.4 2.4 4.6-4.9" fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span className="dsh-maker-sub">{flag && <span aria-hidden>{flag} </span>}{country || ''}</span>
        <Link href={sellerId ? `/seller/${sellerId}` : '/'} className="dsh-maker-view">
          View Store
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" /></svg>
        </Link>
      </span>
    </div>
  );

  function navBody(inDrawer: boolean) {
    const showText = inDrawer || !collapsed;
    return (
      <>
        {showText && <div className="dsh-kicker">Seller Dashboard</div>}
        {mainItems.filter(visible).map((i) => navLink(i, inDrawer))}
        {showText && <div className="dsh-kicker" style={{ marginTop: 16 }}>More</div>}
        {!showText && <div className="dsh-minidiv" />}
        {moreItems.filter(visible).map((i) => navLink(i, inDrawer))}
        {showText && <div style={{ marginTop: 16 }}>{proCard}</div>}
      </>
    );
  }

  const langCurrencySwitcher = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
      <select
        title="Velor speaks 19 languages. Pick yours and every page translates as you browse."
        aria-label="Language"
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="dsh-select"
        style={{ maxWidth: 104 }}
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} style={{ color: '#000' }}>{l.native}</option>
        ))}
      </select>
      {langNote && <div className="dsh-langnote">{langNote}</div>}
      <select
        title="Figures are converted live using current exchange rates for your own viewing -- your real payout currency is unchanged."
        aria-label="Display currency"
        value={currency}
        onChange={(e) => changeCurrency(e.target.value)}
        className="dsh-select"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c} style={{ color: '#000' }}>{c}</option>
        ))}
      </select>
    </div>
  );

  const sidebar = !isMobile && (
    <aside className="dsh-side" style={{ padding: collapsed ? '8px 8px 20px' : '8px 12px 20px' }}>
      <div style={{ flex: 1 }}>{navBody(false)}</div>

      <button
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="dsh-collapse"
        style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '8px 12px' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} aria-hidden>
          <path d="m15 6-6 6 6 6" />
        </svg>
        {!collapsed && 'Collapse'}
      </button>

      {!collapsed && makerCard}
    </aside>
  );

  const mobileDrawer = isMobile && mobileOpen && (
    <div
      onClick={() => setMobileOpen(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dsh-drawer"
      >
        {navBody(true)}
        <div style={{ marginTop: 14, padding: '0 12px' }}>{langCurrencySwitcher}</div>
        <div style={{ marginTop: 14 }}>{makerCard}</div>
      </div>
    </div>
  );

  return (
    <div>
      <style>{shellCss}</style>

      {/* The site's own global header sits above the dashboard, exactly
          as William's design shows -- one Velor, one header. */}
      <GlobalHeader />

      <div className="dsh-shell" style={{ gridTemplateColumns: isMobile ? '1fr' : collapsed ? '64px 1fr' : '248px 1fr' }}>
      {sidebar}

      <div style={{ minWidth: 0 }}>
        {isMobile && (
          <div className="dsh-mobilebar">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="dsh-burger"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--dsh-muted, #9a9a9a)' }}>Seller Dashboard</span>
          </div>
        )}

        {mobileDrawer}

        {/* Journal routes are the dark design end to end; the not-yet-
            redesigned Studio pages keep their light canvas so their
            dark-ink text stays readable. */}
        <main style={{ minHeight: '70vh', background: pathname.startsWith('/dashboard/journal') ? 'transparent' : '#F6F6F7', borderRadius: pathname.startsWith('/dashboard/journal') ? 0 : 12, overflow: 'hidden' }}>
          {children}
        </main>
      </div>

      <VelorAssistant />
      {/* Live whole-page translation, same as every public page. */}
      <LanguageTranslator />
      </div>
    </div>
  );
}

// The design's dark palette, fixed -- the dashboard chrome is dark on
// every route (matches the Creator Journals page's dj-* values). No
// light remap: William's design IS the dark mode.
const shellCss = `
.dsh-shell {
  --dsh-bg: #0a0a0a;
  --dsh-side: #141414;
  --dsh-panel: #1c1c1c;
  --dsh-panel2: rgba(255,255,255,0.06);
  --dsh-line: rgba(255,255,255,0.08);
  --dsh-text: #f2f2f2;
  --dsh-muted: #9a9a9a;
  --dsh-green: #46c07a;
  --dsh-red: #e5484d;
  min-height: calc(100vh - 120px);
  display: grid;
  gap: 16px;
  padding: 14px 20px 34px;
  background: var(--dsh-bg);
  color: var(--dsh-text);
  font-family: var(--font-body);
}
.dsh-side { background: var(--dsh-side); border-radius: 12px; position: sticky; top: 14px; align-self: start; max-height: calc(100vh - 28px); overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; }
.dsh-wordmark { font-family: var(--font-display); font-weight: 700; font-size: 19px; letter-spacing: -0.5px; color: var(--dsh-text); text-decoration: none; }
.dsh-kicker { font-family: var(--font-body); font-size: 11px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: var(--dsh-muted); padding: 14px 12px 9px; }
.dsh-nav { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 9px; font-size: 14px; font-weight: 500; color: #e6e6e6; text-decoration: none; position: relative; margin-bottom: 2px; }
.dsh-nav:hover { color: var(--dsh-text); background: var(--dsh-panel2); }
.dsh-nav-on { color: var(--accent, #FF6B00); background: rgba(255,107,0,0.12); font-weight: 600; }
.dsh-nav-on .dsh-nav-ico { color: var(--accent, #FF6B00); }
.dsh-nav-ico { display: inline-flex; color: inherit; }
.dsh-nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.dsh-nav-badge { margin-left: auto; display: inline-flex; }
.dsh-nav-mini { justify-content: center; padding: 10px 0; }
.dsh-minidiv { border-top: 1px solid var(--dsh-line); margin: 8px 4px; }
.dsh-count { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 6px; background: #303030; color: #d6d6d6; }
.dsh-money { color: #d6d6d6; background: #303030; }
.dsh-livechip { display: inline-flex; align-items: center; font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; padding: 3px 9px; border-radius: 6px; background: var(--dsh-red); color: #fff; }
.dsh-livedot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--accent, #FF6B00); animation: dshPulse 1.6s infinite; }
@keyframes dshPulse { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
.dsh-collapse { display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 14px; border: none; border-radius: 0; background: transparent; color: var(--dsh-muted); font-family: var(--font-body); font-size: 12px; font-weight: 500; cursor: pointer; }
.dsh-procard { display: block; background: var(--dsh-panel); border: 1px solid var(--dsh-line); border-radius: 10px; padding: 12px; margin: 0 2px; text-decoration: none; color: var(--dsh-text); }
.dsh-procard-upgrade:hover { border-color: var(--accent, #FF6B00); }
.dsh-procard-head { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--dsh-text); }
.dsh-procard-note { font-size: 11px; color: var(--dsh-muted); margin-top: 4px; }
.dsh-propill { font-size: 9.5px; font-weight: 800; letter-spacing: 0.08em; padding: 2px 7px; border-radius: 5px; background: linear-gradient(135deg, #FF8A2B, #FF6B00); color: #fff; }
.dsh-prolist { list-style: none; margin: 9px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.dsh-prolist li { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--dsh-muted); line-height: 1.4; }
.dsh-protick { display: inline-flex; color: var(--dsh-green); flex-shrink: 0; }
.dsh-prolink { color: var(--dsh-text); text-decoration: none; }
.dsh-prolink:hover { color: var(--accent, #FF6B00); }
.dsh-upgradecta { display: inline-block; margin-top: 10px; font-size: 12px; font-weight: 700; color: var(--accent, #FF6B00); }
.dsh-maker { display: flex; align-items: flex-start; gap: 13px; border-top: 1px solid var(--dsh-line); margin: 12px 4px 0; padding: 16px 8px 16px; }
.dsh-maker-ava { width: 58px; height: 58px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid var(--accent, #FF6B00); }
.dsh-maker-init { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #FF8A2B, #FF6B00); color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 14px; }
.dsh-maker-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.dsh-maker-name { display: flex; align-items: center; gap: 6px; font-size: 14.5px; font-weight: 700; color: var(--dsh-text); white-space: nowrap; overflow: hidden; }
.dsh-maker-sub { font-size: 12.5px; color: var(--dsh-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dsh-maker-view { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 13px; font-weight: 700; color: var(--accent, #FF6B00); text-decoration: none; }
.dsh-topbar { display: flex; align-items: center; gap: 14px; background: var(--dsh-side); border-bottom: 1px solid var(--dsh-line); position: sticky; top: 0; z-index: 20; }
.dsh-mobilebar { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--dsh-side); border-bottom: 1px solid var(--dsh-line); }
.dsh-burger { width: 38px; height: 38px; border-radius: 0; border: 1px solid var(--dsh-line); background: var(--dsh-panel); color: var(--dsh-text); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dsh-storelink { font-size: 12.5px; font-weight: 500; color: var(--dsh-muted); text-decoration: none; display: flex; align-items: center; gap: 6px; }
.dsh-storelink:hover { color: var(--dsh-text); }
.dsh-planpill { display: inline-flex; align-items: center; gap: 6px; background: var(--dsh-panel); border: 1px solid var(--dsh-line); color: var(--dsh-text); border-radius: 0; padding: 5px 12px; font-size: 11px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.dsh-ava { width: 32px; height: 32px; border-radius: 0; background: linear-gradient(135deg, #FF8A2B, #FF6B00); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; font-size: 13px; flex-shrink: 0; }
.dsh-select { background: var(--dsh-panel); border: 1px solid var(--dsh-line); border-radius: 0; padding: 6px 9px; font-size: 12px; font-weight: 500; color: var(--dsh-text); font-family: var(--font-body); cursor: pointer; outline: none; }
.dsh-langnote { position: absolute; top: 40px; right: 0; width: 260px; z-index: 60; background: var(--dsh-panel); border: 1px solid var(--dsh-line); border-radius: 0; padding: 10px 13px; font-size: 12px; line-height: 1.5; color: var(--dsh-text); box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
.dsh-drawer { position: absolute; top: 0; left: 0; bottom: 0; width: min(300px, 84vw); background: var(--dsh-side); border-right: 1px solid var(--dsh-line); padding: 18px 14px 24px; overflow-y: auto; box-shadow: 0 0 60px rgba(0,0,0,0.5); }
`;
