'use client'

import { useState, useCallback } from 'react'
import {
  PulseShell,
  PulseHeader,
  PulseFooter,
  PulseLoading,
  ErrorBanner,
  TokenGate,
  ListCard,
  EmptyState,
  StatusBadge,
  KpiCard,
  MiniBar,
  FilterBar,
  FilterInput,
  FilterSelect,
  FilterButton,
  PageNav,
  ResultsMeta,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { compactNumber, fmtDateTime } from '@/lib/pulseFormat'

type LiveStreamRow = {
  id: string
  title: string
  description: string | null
  roomName: string
  status: string
  sellerStoreName: string | null
  sellerCountry: string | null
  scheduledFor: string | null
  startedAt: string | null
  endedAt: string | null
  peakViewers: number
  reportCount: number
  viewerSessionCount: number
  recordingUrl: string | null
  createdAt: string
}

type ByStatus = { status: string; count: number }

type LiveData = {
  streams: LiveStreamRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  liveNow: number
  totalStreams: number
  totalPeakViewersSum: number
  avgPeakViewers: number
  byStatus: ByStatus[]
  totalReports: number
}

export default function PulseLivePage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status !== 'ALL') params.set('status', status)
  params.set('page', String(page))
  params.set('pageSize', '20')

  const { data, loading, error } = usePulseData<LiveData>(`/api/admin/pulse-live?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Velor Live" subtitle="Streaming activity" />
        <PulseLoading label="Loading live streams..." />
      </PulseShell>
    )
  }

  const maxByStatus = data ? Math.max(1, ...data.byStatus.map((b) => b.count)) : 1

  return (
    <PulseShell>
      <PulseHeader title="Velor Live" subtitle="Streaming activity" live updatedAt={data?.streams ? new Date().toISOString() : null} />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {data && data.liveNow > 0 && (
        <div
          style={{
            background: 'rgba(255,84,112,0.12)',
            border: `1px solid ${PULSE.red}55`,
            borderRadius: 12,
            padding: '11px 14px',
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 700,
            color: PULSE.red,
          }}
        >
          &#128308; {data.liveNow} stream{data.liveNow === 1 ? '' : 's'} live right now
        </div>
      )}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <KpiCard label="Live now" value={data.liveNow} accent={PULSE.red} />
          <KpiCard label="Total streams" value={compactNumber(data.totalStreams)} accent={PULSE.blue} />
          <KpiCard label="Avg peak viewers" value={data.avgPeakViewers} accent={PULSE.blue} />
          <KpiCard
            label="Total reports"
            value={data.totalReports}
            accent={PULSE.blue}
            delta={data.totalReports > 0 ? 'Trust signal' : undefined}
            deltaGood={data.totalReports > 0 ? false : true}
          />
        </div>
      )}

      {data && data.byStatus.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {data.byStatus.map((b) => (
            <MiniBar key={b.status} label={b.status} value={b.count} max={maxByStatus} color={PULSE.accent} />
          ))}
        </div>
      )}

      <FilterBar>
        <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {['ALL', 'SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </FilterSelect>
        <FilterInput
          placeholder="Search title or seller..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      {data && <ResultsMeta total={data.total} noun="stream" page={data.page} totalPages={data.totalPages} />}
      {data && data.streams.length === 0 && <EmptyState>No streams match these filters.</EmptyState>}

      {data && data.streams.map((s) => (
        <ListCard key={s.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: PULSE.text, fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</span>
            <StatusBadge status={s.status} />
          </div>
          <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>
            {s.sellerStoreName || 'Unknown seller'}{s.sellerCountry ? ` · ${s.sellerCountry}` : ''}
          </div>
          <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
            Peak viewers {s.peakViewers} &middot; {s.viewerSessionCount} viewer session{s.viewerSessionCount === 1 ? '' : 's'} &middot;{' '}
            <span style={{ color: s.reportCount > 0 ? PULSE.red : PULSE.mutedDark, fontWeight: s.reportCount > 0 ? 700 : 400 }}>
              {s.reportCount} report{s.reportCount === 1 ? '' : 's'}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
            {s.scheduledFor && <>Scheduled {fmtDateTime(s.scheduledFor)} &middot; </>}
            {s.startedAt && <>Started {fmtDateTime(s.startedAt)} &middot; </>}
            {s.endedAt && <>Ended {fmtDateTime(s.endedAt)}</>}
            {!s.scheduledFor && !s.startedAt && !s.endedAt && <>Created {fmtDateTime(s.createdAt)}</>}
          </div>
          {s.recordingUrl && (
            <div style={{ fontSize: 11.5, marginTop: 4 }}>
              <a href={s.recordingUrl} target="_blank" rel="noreferrer" style={{ color: PULSE.accent2 }}>
                Watch recording
              </a>
            </div>
          )}
        </ListCard>
      ))}

      {data && <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />}
      <PulseFooter />
    </PulseShell>
  )
}
