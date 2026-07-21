'use client';

// ============================================================
// HALO Overview (2026-07-20) — the orbital command page approved
// from the Halo mockup. EVERY figure is live:
//   /api/dashboard/analytics -> revenue (30d + all time), orders,
//                               net earnings, avg order value
//   /api/dashboard/orders    -> recent orders belt, dispatch count
//   /api/dashboard/products  -> catalogue count, sold-out count
//   /api/dashboard/payouts   -> escrow held, hold window label,
//                               lifetime paid out, payout rail
// No fabricated numbers anywhere (LAW #1). Escrow copy states the
// real rule: released after delivery plus the hold window.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useSellerTier } from '@/lib/dashboard-theme';
import { HALO, Satellite, BeltLabel, HaloButton, glassStyle } from '@/lib/halo';
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay';

interface OrderRow {
  id: string;
  buyerName: string;
  status: string;
  createdAt: string;
  items: { product: { name: string } }[];
  total: number;
}

interface PayoutsData {
  pendingEscrow: number;
  pendingOrderCount: number;
  lifetimePaidOut: number;
  isTrusted: boolean;
  holdLabel: string;
  payoutRail: string | null;
  stripeOnboarded: boolean;
  payoneerLinked: boolean;
}

interface AnalyticsData {
  totalRevenue: number;
  totalEarnings: number;
  totalOrders: number;
  avgOrderValue: number;
  dailyRevenue: { date: string; revenue: number }[];
}

const DISPATCH_STATUSES = new Set(['PAID', 'PROCESSING']);

function statusLabel(status: string): { text: string; color: string; bg: string } {
  switch (status) {
    case 'PAID': return { text: 'In escrow', color: '#7A5A14', bg: 'rgba(239,159,39,0.16)' };
    case 'PROCESSING': return { text: 'Packing', color: HALO.proBlue, bg: 'rgba(75,147,231,0.14)' };
    case 'SHIPPED': return { text: 'Shipped', color: HALO.proBlue, bg: 'rgba(75,147,231,0.14)' };
    case 'DELIVERED': return { text: 'Delivered', color: HALO.green, bg: 'rgba(31,160,92,0.12)' };
    case 'REFUNDED': return { text: 'Refunded', color: HALO.red, bg: 'rgba(226,75,74,0.1)' };
    case 'CANCELLED': return { text: 'Cancelled', color: HALO.muted, bg: 'rgba(107,107,118,0.1)' };
    default: return { text: status.toLowerCase(), color: HALO.muted, bg: 'rgba(107,107,118,0.1)' };
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const DASH = '—';

export default function DashboardOverview() {
  const { tier } = useSellerTier();
  const isPro = tier === 'PRO';

  // Every money figure on this page is computed server-side in GBP (Order/
  // Payout rows are always GBP-denominated -- see lib/orders.ts). This
  // converts for DISPLAY ONLY, live, using the same mechanism and the same
  // stored preference as the buyer-facing site (William, 2026-07-21: "if
  // the seller sets their language on the website, the whole website needs
  // to change language, that's our business model. the same for currency").
  // No underlying figure or business logic changes -- a seller's real
  // payout is always in GBP regardless of what they've chosen to view here.
  const { displayCurrency, symbol, convert } = useCurrencyDisplay();
  function fmtMoney(gbpAmount: number, penceAlways = false): string {
    const converted = convert(gbpAmount, 'GBP');
    try {
      const opts: Intl.NumberFormatOptions = { style: 'currency', currency: displayCurrency };
      if (!penceAlways && Math.abs(converted) >= 1000) {
        opts.maximumFractionDigits = 0;
        opts.minimumFractionDigits = 0;
      }
      return new Intl.NumberFormat(undefined, opts).format(converted);
    } catch {
      return `${symbol}${converted.toFixed(2)}`;
    }
  }

  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [payouts, setPayouts] = useState<PayoutsData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [soldOutCount, setSoldOutCount] = useState<number>(0);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 1080);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch('/api/dashboard/orders')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOrders(Array.isArray(d?.orders) ? d.orders : []))
      .catch(() => setOrders([]));

    fetch('/api/dashboard/payouts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPayouts(d))
      .catch(() => {});

    fetch('/api/dashboard/analytics')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // The analytics route nests the headline figures under `summary`;
        // only dailyRevenue is top-level. Normalize here once.
        if (d?.summary) {
          setAnalytics({
            totalRevenue: d.summary.totalRevenue ?? 0,
            totalEarnings: d.summary.totalEarnings ?? 0,
            totalOrders: d.summary.totalOrders ?? 0,
            avgOrderValue: d.summary.avgOrderValue ?? 0,
            dailyRevenue: Array.isArray(d.dailyRevenue) ? d.dailyRevenue : [],
          });
        }
      })
      .catch(() => {});

    fetch('/api/dashboard/products')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.products)) {
          setProductCount(d.products.length);
          setSoldOutCount(d.products.filter((p: { stock: number }) => p.stock === 0).length);
        }
      })
      .catch(() => {});
  }, []);

  const dispatchCount = useMemo(
    () => (orders ? orders.filter((o) => DISPATCH_STATUSES.has(o.status)).length : 0),
    [orders]
  );
  const revenue30 = useMemo(
    () => (analytics ? analytics.dailyRevenue.reduce((s, d) => s + d.revenue, 0) : null),
    [analytics]
  );

  const payoutReady = payouts ? payouts.stripeOnboarded || payouts.payoneerLinked : null;
  const railLabel = payouts?.payoutRail === 'PAYONEER' ? 'Payoneer' : 'Stripe';
  const hasOrders = (orders?.length ?? 0) > 0;

  // ---------- satellites (live data) ----------
  const satellites = (
    <>
      <Satellite
        label="Orders"
        value={analytics ? analytics.totalOrders : DASH}
        sub={orders ? `${dispatchCount} awaiting dispatch` : 'loading'}
        tint="rgba(255,107,0,0.30)"
        size="lg"
        actionLabel={dispatchCount > 0 ? 'Dispatch now' : 'View orders'}
        actionHref="/dashboard/orders"
        style={isNarrow ? undefined : { position: 'absolute', left: '3%', top: '14%' }}
      />
      <Satellite
        label="In escrow"
        value={payouts ? fmtMoney(payouts.pendingEscrow) : DASH}
        valueColor={HALO.amber}
        sub={payouts ? `releases after delivery + ${payouts.holdLabel} hold` : 'loading'}
        tint="rgba(239,159,39,0.42)"
        size="lg"
        style={isNarrow ? undefined : { position: 'absolute', right: '3%', top: '12%' }}
      />
      <Satellite
        label="Paid out"
        value={payouts ? fmtMoney(payouts.lifetimePaidOut) : DASH}
        valueColor={HALO.green}
        sub={payouts ? `to date via ${railLabel}` : 'loading'}
        tint="rgba(31,160,92,0.30)"
        size="lg"
        actionLabel="Payout timeline"
        actionHref="/dashboard/payouts"
        style={isNarrow ? undefined : { position: 'absolute', right: '7.5%', bottom: '6%' }}
      />
      <Satellite
        label="Products"
        value={productCount ?? DASH}
        sub={productCount !== null ? (soldOutCount > 0 ? `listed · ${soldOutCount} sold out` : 'listed') : 'loading'}
        tint="rgba(255,138,43,0.35)"
        size="md"
        actionLabel="Add product"
        actionHref="/dashboard/products"
        style={isNarrow ? undefined : { position: 'absolute', left: '8%', bottom: '8%' }}
      />
      <Satellite
        label="Net earnings"
        value={analytics ? fmtMoney(analytics.totalEarnings) : DASH}
        sub="after commission"
        tint="rgba(239,159,39,0.32)"
        size="sm"
        style={isNarrow ? undefined : { position: 'absolute', left: '26%', top: '0%' }}
      />
      <Satellite
        label="Avg order"
        value={analytics ? fmtMoney(analytics.avgOrderValue) : DASH}
        sub="all time"
        tint="rgba(255,107,0,0.24)"
        size="sm"
        style={isNarrow ? undefined : { position: 'absolute', right: '26%', top: '0%' }}
      />
    </>
  );

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ---------- orbital stage ---------- */}
      {isNarrow ? (
        <div style={{ padding: '10px 16px 0' }}>
          <Hub revenue30={revenue30} allTime={analytics?.totalRevenue ?? null} hasOrders={hasOrders} fmtMoney={fmtMoney} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 20 }}>
            {satellites}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 3, width: 'min(1720px, 98vw)', height: 560, margin: '0 auto' }}>
          <svg
            aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            viewBox="0 0 1600 560"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="haloOrb" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#EF9F27" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <ellipse cx="800" cy="280" rx="520" ry="215" fill="none" stroke="rgba(26,26,29,0.10)" strokeWidth="1" strokeDasharray="1 7" strokeLinecap="round" />
            <ellipse cx="800" cy="280" rx="700" ry="258" fill="none" stroke="rgba(26,26,29,0.06)" strokeWidth="1" />
            <path d="M 800 65 A 520 215 0 0 1 1289 353" fill="none" stroke="url(#haloOrb)" strokeWidth="5" strokeLinecap="round" />
            <circle cx="1289" cy="353" r="6" fill="#FF6B00" />
            <circle r="4" fill="#EF9F27">
              <animateMotion dur="16s" repeatCount="indefinite" path="M 800 22 A 700 258 0 1 1 799 22" />
            </circle>
          </svg>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 310, height: 310, zIndex: 4 }}>
            <Hub revenue30={revenue30} allTime={analytics?.totalRevenue ?? null} hasOrders={hasOrders} fmtMoney={fmtMoney} inOrbit />
          </div>
          {satellites}
        </div>
      )}

      {/* ---------- Pro concierge (unchanged rule/copy) ---------- */}
      {isPro && (
        <div
          style={{
            ...glassStyle('capsule'),
            position: 'relative', zIndex: 5, width: 'min(1680px, 96vw)', margin: '18px auto 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18,
            padding: '14px 16px 14px 26px', flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 13, color: HALO.inkSoft }}>
            <b style={{ color: HALO.ink, fontWeight: 700, fontFamily: HALO.fontSerif, fontStyle: 'italic', fontSize: 15, marginRight: 8 }}>
              Pro Concierge
            </b>
            You have a dedicated account manager and priority support {DASH} response times under 2 hours.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <HaloButton variant="ink" href="/dashboard/support">Contact your manager</HaloButton>
            <HaloButton variant="soft" href="/dashboard/analytics">View analytics</HaloButton>
          </div>
        </div>
      )}

      {/* ---------- orders belt ---------- */}
      <div style={{ position: 'relative', zIndex: 5, width: 'min(1720px, 97vw)', margin: '26px auto 0' }}>
        <BeltLabel title="Orders in motion" actionLabel="All orders" actionHref="/dashboard/orders" />
        {orders === null ? (
          <div style={{ padding: '10px 20px', color: HALO.muted, fontSize: 13 }}>Loading orders {DASH}</div>
        ) : orders.length === 0 ? (
          <div style={{ ...glassStyle('capsule'), margin: '0 20px', padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontSize: 16, color: HALO.inkSoft }}>
              No orders yet {DASH} they will appear here, in motion, the moment a buyer checks out.
            </span>
          </div>
        ) : (
          <div className="halo-scroll-x" style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '6px 20px 20px' }}>
            {orders.slice(0, 8).map((o) => {
              const st = statusLabel(o.status);
              const initial = (o.buyerName || 'C').trim().charAt(0).toUpperCase();
              return (
                <a
                  key={o.id}
                  href="/dashboard/orders"
                  className="halo-hover-lift"
                  style={{
                    ...glassStyle('capsule'),
                    flex: '0 0 272px', padding: '12px 22px 12px 12px',
                    display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none', color: HALO.ink,
                  }}
                >
                  <span
                    style={{
                      width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: HALO.fontDisplay, fontWeight: 800, fontSize: 15, color: '#fff',
                      background: 'linear-gradient(135deg, #FF8A2B, #FF6B00)',
                    }}
                  >
                    {initial}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 175 }}>
                      {o.items[0]?.product?.name ?? 'Order'}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: HALO.muted, marginTop: 2 }}>
                      {o.buyerName} · {fmtMoney(o.total, true)} · <b style={{ color: st.color }}>{st.text}</b> · {timeAgo(o.createdAt)}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------- quick actions ---------- */}
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', justifyContent: 'center', gap: 14, padding: '10px 20px 0', flexWrap: 'wrap' }}>
        <QuickChip href="/dashboard/products" title="Add a product" sub="list a new piece in minutes" />
        {dispatchCount > 0 && (
          <QuickChip href="/dashboard/orders" title={`Dispatch ${dispatchCount} order${dispatchCount === 1 ? '' : 's'}`} sub="confirm shipment and tracking" />
        )}
        {payoutReady === false ? (
          <QuickChip href="/dashboard/stripe-connect" title="Set up payouts" sub="connect your account to receive earnings" />
        ) : (
          <QuickChip href="/dashboard/payouts" title="Payout settings" sub={payouts ? `${railLabel} · ${payouts.isTrusted ? 'trusted seller' : 'building trust'}` : 'view your payout timeline'} />
        )}
        <QuickChip href="/dashboard/live" title="Go Live" sub="sell face to face, on air" />
      </div>
    </div>
  );
}

function Hub({ revenue30, allTime, hasOrders, fmtMoney, inOrbit }: { revenue30: number | null; allTime: number | null; hasOrders: boolean; fmtMoney: (n: number, penceAlways?: boolean) => string; inOrbit?: boolean }) {
  const disc = (
    <div
      style={{
        position: inOrbit ? 'absolute' : 'relative',
        inset: inOrbit ? 27 : undefined,
        width: inOrbit ? undefined : 256,
        height: inOrbit ? undefined : 256,
        margin: inOrbit ? undefined : '0 auto',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 32% 26%, #FFFDF9, #FBEEDC 55%, #F3DBBB)',
        boxShadow: '0 30px 70px rgba(120,80,30,0.28), inset 0 2px 10px rgba(255,255,255,0.9), inset 0 -14px 32px rgba(239,159,39,0.18)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 34,
      }}
    >
      <div style={{ fontFamily: HALO.fontDisplay, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C98A2E', marginBottom: 7 }}>
        Last 30 days
      </div>
      <h1 style={{ fontFamily: HALO.fontSerif, fontWeight: 500, fontStyle: 'italic', fontSize: 24, lineHeight: 1.12, color: HALO.ink, margin: 0 }}>
        {hasOrders ? 'Your craft is travelling.' : 'Ready for your first order.'}
      </h1>
      <div style={{ fontFamily: HALO.fontSerif, fontWeight: 600, fontSize: 34, color: HALO.accent, marginTop: 10, letterSpacing: '-0.02em' }}>
        {revenue30 === null ? DASH : fmtMoney(revenue30)}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: HALO.muted, marginTop: 3, fontFamily: HALO.fontDisplay }}>
        Revenue {allTime !== null ? `· all time ${fmtMoney(allTime)}` : ''}
      </div>
      <HaloButton variant="accent" href="/dashboard/live" style={{ marginTop: 12, padding: '9px 20px', fontSize: 12 }}>
        Go Live
      </HaloButton>
    </div>
  );

  if (!inOrbit) return disc;
  return (
    <>
      <svg aria-hidden style={{ position: 'absolute', inset: 0, animation: 'haloSpin 40s linear infinite' }} viewBox="0 0 310 310">
        <defs>
          <path id="haloCirc" d="M155,155 m-132,0 a132,132 0 1,1 264,0 a132,132 0 1,1 -264,0" />
        </defs>
        <text style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, letterSpacing: '0.34em', fill: '#C98A2E', textTransform: 'uppercase' }}>
          <textPath href="#haloCirc">VELOR SELLER STUDIO · YOUR SHOP IN ORBIT · VELOR SELLER STUDIO ·</textPath>
        </text>
      </svg>
      {disc}
    </>
  );
}

function QuickChip({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <a
      href={href}
      className="halo-hover-lift"
      style={{
        ...glassStyle('capsule'),
        display: 'flex', alignItems: 'center', gap: 11, padding: '12px 22px 12px 13px',
        fontSize: 13, fontWeight: 700, textDecoration: 'none', color: HALO.ink,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.3)',
          fontFamily: HALO.fontDisplay, fontWeight: 800, color: HALO.accent, fontSize: 15,
        }}
      >
        +
      </span>
      <span>
        {title}
        <small style={{ display: 'block', fontSize: 10.5, fontWeight: 500, color: HALO.muted, marginTop: 1 }}>{sub}</small>
      </span>
    </a>
  );
}
