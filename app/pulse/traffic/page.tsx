'use client'

import {
  PulseShell,
  PulseHeader,
  PulseFooter,
  PulseLoading,
  ErrorBanner,
  TokenGate,
  KpiCard,
  Sparkline,
  MiniBar,
  EmptyState,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { compactNumber } from '@/lib/pulseFormat'

type TrafficData = {
  generatedAt: string
  totals: { lastHour: number; today: number; last7d: number; last30d: number }
  hourly24h: number[]
  daily30d: { date: string; views: number }[]
  topPaths: { path: string; views: number }[]
  topCountries: { country: string; views: number }[]
  topReferrers: { referrer: string; views: number }[]
}

export default function PulseTrafficPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const { data, loading, error } = usePulseData<TrafficData>('/api/admin/pulse-traffic', token, { onUnauthorized: lock })

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Traffic" subtitle="Last 30 days" />
        <PulseLoading label="Loading traffic..." />
      </PulseShell>
    )
  }
  if (!data) {
    return (
      <PulseShell>
        <PulseHeader title="Traffic" subtitle="Last 30 days" />
        <ErrorBanner>{error || 'No data yet.'}</ErrorBanner>
      </PulseShell>
    )
  }

  const topPathsMax = data.topPaths[0]?.views || 0
  const topCountriesMax = data.topCountries[0]?.views || 0
  const topReferrersMax = data.topReferrers[0]?.views || 0

  return (
    <PulseShell>
      <PulseHeader title="Traffic" subtitle="Last 30 days" live updatedAt={data.generatedAt} />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <KpiCard label="Last hour" value={compactNumber(data.totals.lastHour)} accent={PULSE.blue} />
        <KpiCard label="Today" value={compactNumber(data.totals.today)} accent={PULSE.blue} />
        <KpiCard label="Last 7 days" value={compactNumber(data.totals.last7d)} accent={PULSE.blue} />
        <KpiCard label="Last 30 days" value={compactNumber(data.totals.last30d)} accent={PULSE.blue} />
      </div>

      <div
        style={{
          background: PULSE.surface,
          border: `1px solid ${PULSE.border}`,
          borderRadius: 16,
          padding: '18px 18px 14px',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 11, color: PULSE.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
          Last 24 hours, by hour
        </div>
        <Sparkline data={data.hourly24h} width={320} height={64} color={PULSE.blue} />
      </div>

      <div
        style={{
          background: PULSE.surface,
          border: `1px solid ${PULSE.border}`,
          borderRadius: 16,
          padding: '18px 18px 14px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 11, color: PULSE.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
          Last 30 days, by day
        </div>
        <Sparkline data={data.daily30d.map((d) => d.views)} width={320} height={64} color={PULSE.blue} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', marginBottom: 8 }}>
        Top pages (7d)
      </div>
      {data.topPaths.length === 0 ? (
        <EmptyState>No pageviews in this window yet.</EmptyState>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {data.topPaths.map((p) => (
            <MiniBar key={p.path} label={p.path} value={p.views} max={topPathsMax} color={PULSE.blue} />
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', marginBottom: 8 }}>
        Top countries (30d)
      </div>
      {data.topCountries.length === 0 ? (
        <EmptyState>No pageviews in this window yet.</EmptyState>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {data.topCountries.map((c) => (
            <MiniBar key={c.country} label={c.country} value={c.views} max={topCountriesMax} color={PULSE.blue} />
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', marginBottom: 8 }}>
        Top referrers (30d)
      </div>
      {data.topReferrers.length === 0 ? (
        <EmptyState>No pageviews in this window yet.</EmptyState>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {data.topReferrers.map((r) => (
            <MiniBar key={r.referrer} label={r.referrer} value={r.views} max={topReferrersMax} color={PULSE.blue} />
          ))}
        </div>
      )}

      <PulseFooter />
    </PulseShell>
  )
}
