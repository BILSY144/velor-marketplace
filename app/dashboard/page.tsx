'use client';

import Link from 'next/link';
import { useSellerTier, PlanBadge, tierCardStyle } from '@/lib/dashboard-theme';

const stats = [
  { label: 'Total Revenue', value: '£0.00', sub: 'All time', color: 'var(--accent)' },
  { label: 'Orders', value: '0', sub: 'All time', color: 'var(--text)' },
  { label: 'Products', value: '0', sub: 'Listed', color: 'var(--text)' },
  { label: 'Pending Payout', value: '£0.00', sub: 'Available to withdraw', color: 'var(--green)' },
];

const recentOrders: { id: string; customer: string; product: string; amount: string; status: string; date: string }[] = [];

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    fulfilled: 'var(--green)',
    pending: 'var(--accent)',
    cancelled: 'var(--red)',
  };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: `${colours[status] ?? 'var(--muted)'}22`,
      color: colours[status] ?? 'var(--muted)',
      border: `1px solid ${colours[status] ?? 'var(--muted)'}44`,
    }}>
      {status}
    </span>
  );
}

export default function DashboardOverview() {
  const { tier, theme, founding } = useSellerTier();
  // Only two tiers exist now (Enterprise retired 2026-07-15, collapsed into
  // Pro everywhere upstream) — isPro/isElevated used to be two separate
  // checks (isPro strictly PRO, isElevated PRO-or-ENTERPRISE) but since
  // ENTERPRISE can never reach the client anymore they are identical.
  const isPro = tier === 'PRO';
  const isElevated = isPro;

  return (
    <div style={{ position: 'relative' }}>
      {/* Pro gets a soft ambient wash behind the whole page — Starter doesn't */}
      {isPro && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            right: -20,
            height: 260,
            background: theme.sectionGradient,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0,
              }}>
                Overview
              </h1>
              <PlanBadge tier={tier} founding={founding} />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
              {isPro
                ? 'Welcome back. Your Pro concierge dashboard is live.'
                : 'Welcome back. Here is what is happening with your store.'}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: isElevated ? 20 : 32 }}>
          {stats.map((stat, i) => (
            <div key={stat.label} style={tierCardStyle(theme, {
              padding: '20px 24px',
              position: 'relative',
              overflow: 'hidden',
            })}>
              {isPro && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FFD54A, #FF6B00)' }} />
              )}
              <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 28,
                fontWeight: 800,
                color: i === 0 && isElevated ? theme.statValueColor : stat.color,
              }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Pro concierge strip */}
        {isPro && (
          <div style={tierCardStyle(theme, {
            padding: '18px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          })}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFD54A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Pro Concierge
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                You have a dedicated account manager and priority support — response times under 2 hours.
              </div>
            </div>
            <Link href="/dashboard/support" style={{
              flexShrink: 0,
              background: 'linear-gradient(90deg, #FFD54A, #FF6B00)',
              color: '#111',
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
              padding: '10px 18px',
              borderRadius: 999,
            }}>
              Contact your manager
            </Link>
          </div>
        )}

        {/* Pro growth tip strip */}
        {isPro && (
          <div style={tierCardStyle(theme, {
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          })}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#4FC3F7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pro Insight
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>
              Check Analytics for growth trends and your top opportunity this week.
            </span>
            <Link href="/dashboard/analytics" style={{ marginLeft: 'auto', color: '#4FC3F7', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              View Analytics →
            </Link>
          </div>
        )}

        {/* Recent orders */}
        <div style={tierCardStyle(theme, { overflow: 'hidden', marginBottom: 24 })}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Recent Orders
            </h2>
            <Link href="/dashboard/orders" style={{ color: theme.headingAccent === 'var(--text)' ? 'var(--accent)' : theme.headingAccent, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--border)' }}>--</div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>No orders yet</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>Orders will appear here once customers start buying</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Order', 'Customer', 'Product', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 24px', color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>{order.id}</td>
                    <td style={{ padding: '14px 24px', color: 'var(--text)', fontSize: 13 }}>{order.customer}</td>
                    <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13 }}>{order.product}</td>
                    <td style={{ padding: '14px 24px', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{order.amount}</td>
                    <td style={{ padding: '14px 24px' }}><StatusBadge status={order.status} /></td>
                    <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13 }}>{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Link href="/dashboard/products" style={{
            ...tierCardStyle(theme, { padding: '20px 24px' }),
            display: 'block',
            textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}>
            <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Add Products
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>List your first products to start selling</div>
          </Link>
          <Link href="/dashboard/payouts" style={{
            ...tierCardStyle(theme, { padding: '20px 24px' }),
            display: 'block',
            textDecoration: 'none',
          }}>
            <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Set Up Payouts
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Connect your bank to receive earnings</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
