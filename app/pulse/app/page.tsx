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

type Slice = { label: string; count: number }

type AppData = {
  generatedAt: string
  installs: { total: number; today: number; last7d: number; last30d: number }
  active: { today: number; last7d: number; last30d: number }
  installsDaily30: number[]
  byCountry: Slice[]
  byPlatform: Slice[]
  byOsVersion: Slice[]
  byAppVersion: Slice[]
  byLanguage: Slice[]
  byCurrency: Slice[]
  note: string
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.8,
  color: PULSE.muted,
  textTransform: 'uppercase',
  marginBottom: 8,
}

function Breakdown({ title, rows, color }: { title: string; rows: Slice[]; color: string }) {
  const max = rows[0]?.count || 0
  return (
    <>
      <div style={SECTION_LABEL}>{title}</div>
      {rows.length === 0 ? (
        <EmptyState>Nothing reported yet.</EmptyState>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {rows.map((r) => (
            <MiniBar key={r.label} label={r.label} value={r.count} max={max} color={color} />
          ))}
        </div>
      )}
    </>
  )
}

export default function PulseAppPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const { data, loading, error } = usePulseData<AppData>('/api/admin/pulse-app', token, { onUnauthorized: lock })

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="App" subtitle="Installs and active devices" />
        <PulseLoading label="Loading app analytics..." />
      </PulseShell>
    )
  }
  if (!data) {
    return (
      <PulseShell>
        <PulseHeader title="App" subtitle="Installs and active devices" />
        <ErrorBanner>{error || 'No data yet.'}</ErrorBanner>
      </PulseShell>
    )
  }

  return (
    <PulseShell>
      <PulseHeader title="App" subtitle="Installs and active devices" live updatedAt={data.generatedAt} />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <KpiCard label="Installs total" value={compactNumber(data.installs.total)} accent={PULSE.green} />
        <KpiCard label="Installs today" value={compactNumber(data.installs.today)} accent={PULSE.green} />
        <KpiCard label="Installs 7d" value={compactNumber(data.installs.last7d)} accent={PULSE.green} />
        <KpiCard label="Installs 30d" value={compactNumber(data.installs.last30d)} accent={PULSE.green} />
        <KpiCard label="Active today" value={compactNumber(data.active.today)} accent={PULSE.blue} />
        <KpiCard label="Active 7d" value={compactNumber(data.active.last7d)} accent={PULSE.blue} />
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
          Installs, last 30 days
        </div>
        <Sparkline data={data.installsDaily30} width={320} height={64} color={PULSE.green} />
      </div>

      <Breakdown title="By country" rows={data.byCountry} color={PULSE.green} />
      <Breakdown title="By platform" rows={data.byPlatform} color={PULSE.blue} />
      <Breakdown title="By language" rows={data.byLanguage} color={PULSE.purple} />
      <Breakdown title="By currency" rows={data.byCurrency} color={PULSE.amber} />
      <Breakdown title="By app version" rows={data.byAppVersion} color={PULSE.blue} />
      <Breakdown title="By OS version" rows={data.byOsVersion} color={PULSE.muted} />

      <div style={{ fontSize: 11.5, lineHeight: 1.55, color: PULSE.muted, marginBottom: 20 }}>{data.note}</div>

      <PulseFooter />
    </PulseShell>
  )
}
