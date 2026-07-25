'use client';

// ============================================================
// SELLER STUDIO Home / Overview (2026-07-21) -- rebuilt in the
// William-approved Shopify-style Studio design, replacing the
// Halo orbital page. EVERY figure is live (LAW #1):
//   /api/seller/me           -> store name, live payout rail
//   /api/dashboard/analytics -> revenue (30d chart + all time),
//                               orders, net earnings, avg order
//   /api/dashboard/orders    -> recent orders table, dispatch count
//   /api/dashboard/payouts   -> escrow held, hold window label,
//                               lifetime paid out, setup state
//   /api/dashboard/products  -> catalogue count, sold-out count
// Escrow copy states the real rule: released after delivery is
// confirmed plus the hold window; returns/disputes freeze it.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSellerTier } from '@/lib/dashboard-theme';
import {
  STUDIO, StudioPageHead, StudioButton, StudioChip, StudioKpi,
  cardStyle, cardHeadStyle, pageStyle, tableThStyle, tableTdStyle, ChipTone,
} from '@/lib/studio';
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay';

interface OrderRow {
  id: string;
  buyerName: string;
  status: string;
  createdAt: string;
  items: { product: { name: string; images?: string[] } }[];
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
const DASH = '—';

function statusChip(status: string): { text: string; tone: ChipTone } {
  switch (status) {
    case 'PAID': return { text: 'In escrow', tone: 'escrow' };
    case 'PROCESSING': return { text: 'Packing', tone: 'blue' };
    case 'SHIPPED': return { text: 'Shipped', tone: 'blue' };
    case 'DELIVERED': return { text: 'Delivered', tone: 'good' };
    case 'REFUNDED': return { text: 'Refunded', tone: 'bad' };
    case 'CANCELLED': return { text: 'Cancelled', tone: 'neutral' };
    case 'DISPUTED': return { text: 'Disputed', tone: 'bad' };
    default: return { text: status.toLowerCase(), tone: 'neutral' };
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

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardOverview() {
  const { tier } = useSellerTier();
  const isPro = tier === 'PRO';

  // Money figures are computed server-side in GBP; conversion here is for
  // DISPLAY ONLY, using the same stored preference as the whole site.
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

  const [storeName, setStoreName] = useState<string | null>(null);
  const [railLabel, setRailLabel] = useState<string | null>(null);
  const [rail, setRail] = useState<'STRIPE' | 'PAYONEER' | null>(null);
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

  // Payout readiness is checked LIVE against the seller's own rail --
  // never the stored stripeOnboarded flag, which lags real Stripe state
  // (the exact bug William caught on the old Payouts page, 2026-07-21:
  // "Payout Settings said Connected, Payouts page said no account
  // connected"). Same pattern as the dashboard shell.
  const [payoutLive, setPayoutLive] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/seller/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (d) => {
        if (cancelled || !d) return;
        if (d.storeName) setStoreName(d.storeName);
        if (d.payoutRailLabel) setRailLabel(d.payoutRailLabel);
        const r: 'STRIPE' | 'PAYONEER' = d.payoutRail === 'PAYONEER' ? 'PAYONEER' : 'STRIPE';
        setRail(r);
        try {
          if (r === 'STRIPE') {
            const res = await fetch('/api/stripe/connect/account');
            const a = res.ok ? await res.json() : null;
            if (!cancelled) setPayoutLive(!!(a?.chargesEnabled && a?.payoutsEnabled));
          } else {
            const res = await fetch('/api/payoneer/onboard');
            const a = res.ok ? await res.json() : null;
            if (!cancelled) setPayoutLive(Boolean(a?.onboarded));
          }
        } catch {
          if (!cancelled) setPayoutLive(null);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
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
        // Headline figures nest under `summary`; dailyRevenue is top-level.
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

  const payoutReady = payoutLive;
  const payoutSetupHref = rail === 'PAYONEER' ? '/dashboard/payoneer' : '/dashboard/stripe-connect';

  return (
    <div style={pageStyle()}>
      <StudioPageHead
        kicker="Seller Studio"
        title={`${greeting()}, ${storeName || 'seller'}`}
        sub="Here is how your store is trading."
        actions={
          <>
            <StudioButton variant="ghost" href="/dashboard/live">Go Live</StudioButton>
            <StudioButton href="/dashboard/products">Add product</StudioButton>
          </>
        }
      />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <StudioKpi
          label="Revenue · 30 days"
          value={revenue30 === null ? DASH : fmtMoney(revenue30)}
          delta={analytics ? `All time ${fmtMoney(analytics.totalRevenue)}` : 'loading'}
        />
        <StudioKpi
          label="Orders · all time"
          value={analytics ? analytics.totalOrders : DASH}
          delta={orders ? (dispatchCount > 0 ? `${dispatchCount} awaiting dispatch` : 'Nothing awaiting dispatch') : 'loading'}
        />
        <StudioKpi
          label="Held in escrow"
          value={payouts ? fmtMoney(payouts.pendingEscrow) : DASH}
          delta={payouts ? `${payouts.pendingOrderCount} order${payouts.pendingOrderCount === 1 ? '' : 's'} · releases after delivery + ${payouts.holdLabel} hold` : 'loading'}
        />
        <StudioKpi
          label="Paid out to date"
          value={payouts ? fmtMoney(payouts.lifetimePaidOut) : DASH}
          delta={railLabel ? `via ${railLabel}` : 'loading'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 320px', gap: 14, alignItems: 'start' }}>
        {/* left column */}
        <div style={{ display: 'grid', gap: 14 }}>
          <RevenueChart
            daily={analytics?.dailyRevenue ?? null}
            fmtMoney={fmtMoney}
            convert={(n) => convert(n, 'GBP')}
          />

          <div style={cardStyle()}>
            <div style={cardHeadStyle()}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Recent orders</h3>
              <a href="/dashboard/orders" style={{ fontSize: 12, fontWeight: 500, color: STUDIO.accent, textDecoration: 'none' }}>View all orders</a>
            </div>
            {orders === null ? (
              <div style={{ padding: '18px', color: STUDIO.muted, fontSize: 13 }}>Loading orders {DASH}</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '26px 18px', textAlign: 'center', color: STUDIO.muted, fontSize: 13 }}>
                No orders yet — they will appear here the moment a buyer checks out.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={tableThStyle}>Order</th>
                      <th style={tableThStyle}>Product</th>
                      <th style={tableThStyle}>Buyer</th>
                      <th style={tableThStyle}>Total</th>
                      <th style={tableThStyle}>Status</th>
                      <th style={tableThStyle}>Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 6).map((o, idx, arr) => {
                      const st = statusChip(o.status);
                      const img = o.items[0]?.product?.images?.[0];
                      const last = idx === arr.length - 1;
                      const td = last ? { ...tableTdStyle, borderBottom: 'none' } : tableTdStyle;
                      return (
                        <tr key={o.id}>
                          <td style={{ ...td, fontWeight: 600, whiteSpace: 'nowrap' }}>#{o.id.slice(0, 6).toUpperCase()}</td>
                          <td style={td}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt="" style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'cover', border: `1px solid ${STUDIO.border}`, flexShrink: 0 }} />
                              ) : (
                                <span style={{ width: 32, height: 32, borderRadius: 7, background: STUDIO.bg, border: `1px solid ${STUDIO.border}`, flexShrink: 0 }} />
                              )}
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                                {o.items[0]?.product?.name ?? 'Order'}
                                {o.items.length > 1 && <span style={{ color: STUDIO.muted }}> +{o.items.length - 1} more</span>}
                              </span>
                            </span>
                          </td>
                          <td style={{ ...td, whiteSpace: 'nowrap' }}>{o.buyerName || DASH}</td>
                          <td style={{ ...td, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoney(o.total, true)}</td>
                          <td style={td}><StudioChip tone={st.tone}>{st.text}</StudioChip></td>
                          <td style={{ ...td, color: STUDIO.muted, whiteSpace: 'nowrap' }}>{timeAgo(o.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* right column */}
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={cardStyle()}>
            <div style={cardHeadStyle()}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Payouts</h3>
              <a href={payoutReady === false ? payoutSetupHref : '/dashboard/payouts'} style={{ fontSize: 12, fontWeight: 500, color: STUDIO.accent, textDecoration: 'none' }}>
                {payoutReady === false ? 'Set up' : 'Manage'}
              </a>
            </div>
            <div style={{ padding: '14px 18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span aria-hidden style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: rail === 'PAYONEER' ? '#FF4800' : '#635BFF', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: STUDIO.fontDisplay, fontWeight: 700, fontSize: 13,
                }}>
                  {rail === 'PAYONEER' ? 'P' : 'S'}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 13.5 }}>{railLabel || DASH}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: STUDIO.muted }}>Set automatically from your country</span>
                </span>
              </div>
              <PayoutRow label="Setup" value={
                payoutReady === null ? DASH : payoutReady
                  ? <span style={{ color: STUDIO.green }}>Active</span>
                  : <a href={payoutSetupHref} style={{ color: STUDIO.accent, textDecoration: 'none' }}>Finish setup</a>
              } />
              <PayoutRow label="In escrow" value={payouts ? fmtMoney(payouts.pendingEscrow, true) : DASH} />
              <PayoutRow label="Hold window" value={payouts ? `${payouts.holdLabel} (${payouts.isTrusted ? 'trusted' : 'building trust'})` : DASH} last />
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={cardHeadStyle()}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Store health</h3>
            </div>
            <div style={{ padding: '6px 18px 12px' }}>
              <HealthItem
                done={payoutReady === true}
                text={payoutReady ? 'Payouts active' : 'Set up payouts'}
                sub={railLabel ? `${railLabel}` : ''}
                href={payoutReady ? undefined : payoutSetupHref}
              />
              <HealthItem
                done={(productCount ?? 0) > 0}
                text={(productCount ?? 0) > 0 ? `${productCount} product${productCount === 1 ? '' : 's'} listed` : 'List your first product'}
                sub={soldOutCount > 0 ? `${soldOutCount} sold out — restock to keep selling` : 'Live on your storefront'}
                href={(productCount ?? 0) > 0 ? undefined : '/dashboard/products'}
              />
              <HealthItem
                done={dispatchCount === 0}
                text={dispatchCount > 0 ? `Dispatch ${dispatchCount} order${dispatchCount === 1 ? '' : 's'}` : 'All orders dispatched'}
                sub={dispatchCount > 0 ? 'Add tracking to start the payout clock' : 'Nothing waiting on you'}
                href={dispatchCount > 0 ? '/dashboard/orders' : undefined}
                last
              />
            </div>
          </div>

          {isPro && (
            <div style={cardStyle({ padding: '16px 18px' })}>
              <div style={{ fontFamily: STUDIO.fontSerif, fontStyle: 'italic', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                Pro Concierge
              </div>
              <p style={{ fontSize: 12.8, color: STUDIO.ink2, lineHeight: 1.55, margin: '0 0 12px' }}>
                You have a dedicated account manager and priority support — response times under 2 hours.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StudioButton variant="ghost" href="/dashboard/support">Contact your manager</StudioButton>
                <StudioButton variant="ghost" href="/dashboard/analytics">View analytics</StudioButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PayoutRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0',
      borderBottom: last ? 'none' : `1px solid ${STUDIO.borderSoft}`, fontSize: 12.8,
    }}>
      <span style={{ color: STUDIO.muted }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function HealthItem({ done, text, sub, href, last }: { done: boolean; text: string; sub?: string; href?: string; last?: boolean }) {
  const body = (
    <div style={{
      display: 'flex', gap: 10, padding: '9px 0', alignItems: 'flex-start',
      borderBottom: last ? 'none' : `1px solid ${STUDIO.borderSoft}`,
    }}>
      <span style={{
        width: 17, height: 17, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? STUDIO.greenSoft : 'transparent',
        border: done ? 'none' : `1.5px dashed ${STUDIO.faint}`,
      }}>
        {done && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={STUDIO.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: 12.8, lineHeight: 1.45, minWidth: 0 }}>
        <span style={{ fontWeight: 600, color: href ? STUDIO.accent : STUDIO.ink }}>{text}</span>
        {sub && <span style={{ display: 'block', color: STUDIO.muted, fontSize: 11.5 }}>{sub}</span>}
      </span>
    </div>
  );
  if (href) return <a href={href} style={{ textDecoration: 'none', display: 'block' }}>{body}</a>;
  return body;
}

// Single-series 30-day revenue chart. One hue (brand orange), recessive
// grid, text in ink tokens, per-day hover tooltip; the orders table below
// doubles as the accessible table view of the same period's activity.
function RevenueChart({ daily, fmtMoney, convert }: {
  daily: { date: string; revenue: number }[] | null;
  fmtMoney: (n: number, penceAlways?: boolean) => string;
  convert: (n: number) => number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 640, H = 170, L = 46, R = 16, T = 14, B = 26;
  const days = daily ?? [];
  const max = Math.max(...days.map((d) => d.revenue), 1);
  const total = days.reduce((s, d) => s + d.revenue, 0);
  const peakIdx = days.length ? days.reduce((best, d, i) => (d.revenue > days[best].revenue ? i : best), 0) : -1;

  const x = (i: number) => (days.length <= 1 ? L : L + (i * (W - L - R)) / (days.length - 1));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);

  const linePath = days.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.revenue).toFixed(1)}`).join(' ');
  const areaPath = days.length
    ? `${linePath} L ${x(days.length - 1).toFixed(1)} ${(H - B).toFixed(1)} L ${L} ${(H - B).toFixed(1)} Z`
    : '';

  function fmtAxisDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <div style={cardStyle()}>
      <div style={cardHeadStyle()}>
        <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Revenue</h3>
        <span style={{ fontSize: 12, fontWeight: 500, color: STUDIO.muted }}>Last 30 days</span>
      </div>
      <div ref={wrapRef} style={{ padding: '14px 18px 8px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: STUDIO.fontDisplay, fontSize: 19, fontWeight: 700 }}>
            {daily === null ? '—' : fmtMoney(total)}
          </span>
          <span style={{ fontSize: 12, color: STUDIO.muted }}>
            {daily === null ? 'loading' : days.length ? `total · peak day ${fmtMoney(days[peakIdx]?.revenue ?? 0)}` : 'no sales in this period yet'}
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Daily revenue, last 30 days" style={{ display: 'block' }}>
          {[0, 0.5, 1].map((f) => (
            <line key={f} x1={L} y1={y(max * f)} x2={W - R} y2={y(max * f)} stroke={STUDIO.borderSoft} strokeWidth="1" />
          ))}
          {[1, 0.5].map((f) => (
            <text key={f} x={L - 6} y={y(max * f) + 4} textAnchor="end" fontSize="10" fill={STUDIO.faint} fontFamily="Inter">
              {fmtMoney(max * f)}
            </text>
          ))}
          {days.length > 0 && (
            <>
              <text x={L} y={H - 8} fontSize="10" fill={STUDIO.faint} fontFamily="Inter">{fmtAxisDate(days[0].date)}</text>
              <text x={W - R} y={H - 8} textAnchor="end" fontSize="10" fill={STUDIO.faint} fontFamily="Inter">{fmtAxisDate(days[days.length - 1].date)}</text>
            </>
          )}
          {days.length > 0 && (
            <>
              <defs>
                <linearGradient id="studioRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STUDIO.accent} stopOpacity="0.16" />
                  <stop offset="100%" stopColor={STUDIO.accent} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#studioRev)" />
              <path d={linePath} fill="none" stroke={STUDIO.accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {peakIdx >= 0 && days[peakIdx].revenue > 0 && (
                <>
                  <circle cx={x(peakIdx)} cy={y(days[peakIdx].revenue)} r="3.5" fill={STUDIO.accent} stroke="#fff" strokeWidth="2" />
                  <text
                    x={Math.min(Math.max(x(peakIdx), L + 24), W - R - 24)}
                    y={Math.max(y(days[peakIdx].revenue) - 8, 11)}
                    textAnchor="middle" fontSize="10.5" fontWeight="600" fill={STUDIO.ink2} fontFamily="Inter"
                  >
                    {fmtMoney(days[peakIdx].revenue, true)}
                  </text>
                </>
              )}
              {hover !== null && days[hover] && (
                <line x1={x(hover)} y1={T} x2={x(hover)} y2={H - B} stroke={STUDIO.faint} strokeWidth="1" strokeDasharray="3 3" />
              )}
              {hover !== null && days[hover] && (
                <circle cx={x(hover)} cy={y(days[hover].revenue)} r="4" fill={STUDIO.accent} stroke="#fff" strokeWidth="2" />
              )}
              {/* invisible hover targets, one per day, wider than the mark */}
              {days.map((d, i) => (
                <rect
                  key={d.date}
                  x={i === 0 ? L : (x(i) + x(i - 1)) / 2}
                  y={T}
                  width={days.length <= 1 ? W - L - R : (W - L - R) / (days.length - 1)}
                  height={H - T - B}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </>
          )}
        </svg>
        {hover !== null && days[hover] && (
          <div style={{
            position: 'absolute',
            left: `calc(${((x(hover) / W) * 100).toFixed(1)}% )`,
            top: 46,
            transform: x(hover) > W * 0.7 ? 'translateX(-105%)' : 'translateX(8px)',
            background: STUDIO.ink, color: '#fff', borderRadius: 8, padding: '6px 10px',
            fontSize: 11.5, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 5,
          }}>
            <b>{fmtAxisDate(days[hover].date)}</b> · {fmtMoney(days[hover].revenue, true)}
          </div>
        )}
      </div>
    </div>
  );
}
