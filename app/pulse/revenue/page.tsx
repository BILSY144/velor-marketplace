'use client'

import {
  PulseShell,
  PulseHeader,
  PulseFooter,
  PulseLoading,
  ErrorBanner,
  TokenGate,
  KpiCard,
  ListCard,
  EmptyState,
  Sparkline,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { formatMoney, pct } from '@/lib/pulseFormat'

type RevenueData = {
  generatedAt: string
  windowDays: number
  gmvGBP: number
  feeGBP: number
  sellerEarningsGBP: number
  takeRatePct: number
  aovGBP: number
  cancelRefundRatePct: number
  disputeRatePct: number
  ordersCounted: number
  ordersTotal: number
  dailyGmvGBP: number[]
  topSellers: { sellerId: string; storeName: string; country: string | null; tier: string; revenueGBP: number; orders: number }[]
  topProducts: { productId: string; title: string; image: string | null; category: string; revenueGBP: number; units: number }[]
  fxNote: string
}

export default function PulseRevenuePage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const { data, loading, error } = usePulseData<RevenueData>('/api/admin/pulse-revenue', token, { onUnauthorized: lock })

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell activeNav="revenue">
        <PulseHeader title="Revenue" subtitle="Last 30 days" />
        <PulseLoading label="Loading revenue..." />
      </PulseShell>
    )
  }
  if (!data) {
    return (
      <PulseShell activeNav="revenue">
        <PulseHeader title="Revenue" subtitle="Last 30 days" />
        <ErrorBanner>{error || 'No data yet.'}</ErrorBanner>
      </PulseShell>
    )
  }

  return (
    <PulseShell activeNav="revenue">
      <PulseHeader title="Revenue" subtitle="Last 30 days, converted to GBP" live updatedAt={data.generatedAt} />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div
        style={{
          background: PULSE.surface,
          border: `1px solid ${PULSE.border}`,
          borderRadius: 16,
          padding: '18px 18px 14px',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 11, color: PULSE.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Gross merchandise value</div>
        <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: PULSE.green, marginBottom: 10 }}>{formatMoney(data.gmvGBP)}</div>
        <Sparkline data={data.dailyGmvGBP} width={320} height={64} color={PULSE.green} />
        <div style={{ fontSize: 10.5, color: PULSE.mutedDark, marginTop: 6 }}>{data.fxNote}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <KpiCard label="Platform fee" value={formatMoney(data.feeGBP)} accent={PULSE.accent} />
        <KpiCard label="Take rate" value={pct(data.takeRatePct, 1)} accent={PULSE.accent} />
        <KpiCard label="Seller earnings" value={formatMoney(data.sellerEarningsGBP)} accent={PULSE.purple} />
        <KpiCard label="Avg order value" value={formatMoney(data.aovGBP)} accent={PULSE.blue} />
        <KpiCard
          label="Cancel / refund rate"
          value={pct(data.cancelRefundRatePct, 1)}
          accent={data.cancelRefundRatePct > 10 ? PULSE.red : PULSE.green}
          deltaGood={data.cancelRefundRatePct <= 10}
        />
        <KpiCard
          label="Dispute rate"
          value={pct(data.disputeRatePct, 1)}
          accent={data.disputeRatePct > 2 ? PULSE.red : PULSE.green}
          deltaGood={data.disputeRatePct <= 2}
        />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', marginBottom: 8 }}>Top sellers by revenue</div>
      {data.topSellers.length === 0 ? (
        <EmptyState>No revenue in this window yet.</EmptyState>
      ) : (
        data.topSellers.map((s, i) => (
          <ListCard key={s.sellerId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: PULSE.text }}>
                  #{i + 1} {s.storeName}
                </div>
                <div style={{ fontSize: 11.5, color: PULSE.muted, marginTop: 2 }}>
                  {s.country || 'Unknown'} &middot; {s.tier} &middot; {s.orders} order{s.orders === 1 ? '' : 's'}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: PULSE.green, fontFamily: "'Space Grotesk', sans-serif", flex: '0 0 auto' }}>{formatMoney(s.revenueGBP)}</div>
            </div>
          </ListCard>
        ))
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', margin: '20px 0 8px' }}>Top products by revenue</div>
      {data.topProducts.length === 0 ? (
        <EmptyState>No product sales in this window yet.</EmptyState>
      ) : (
        data.topProducts.map((p, i) => (
          <ListCard key={p.productId}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {p.image ? (
                <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flex: '0 0 auto' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: PULSE.surfaceRaised, flex: '0 0 auto' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: PULSE.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  #{i + 1} {p.title}
                </div>
                <div style={{ fontSize: 11.5, color: PULSE.muted, marginTop: 2 }}>
                  {p.category} &middot; {p.units} unit{p.units === 1 ? '' : 's'} sold
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: PULSE.green, fontFamily: "'Space Grotesk', sans-serif", flex: '0 0 auto' }}>{formatMoney(p.revenueGBP)}</div>
            </div>
          </ListCard>
        ))
      )}

      <PulseFooter />
    </PulseShell>
  )
}
