'use client'

import { useState, useCallback } from 'react'
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
  Badge,
  FunnelChart,
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
import { timeAgo } from '@/lib/pulseFormat'

type Prospect = {
  id: string
  name: string
  platform: string
  storeUrl: string
  email: string | null
  category: string
  score: number
  country: string | null
  sellerType: string
  notes: string | null
  status: string
  qualified: boolean | null
  qualificationNotes: string | null
  qualifiedAt: string | null
  createdAt: string
  updatedAt: string
}

type RecentOutreach = {
  id: string
  prospectId: string
  emailType: string
  subject: string
  sentAt: string
  prospect: { name: string; country: string | null; sellerType: string } | null
}

type PipelineData = {
  funnel: { label: string; value: number }[]
  byStatus: { status: string; count: number }[]
  qualified: number
  disqualified: number
  unscreened: number
  outreachSent7d: number
  outreachSent30d: number
  recentOutreach: RecentOutreach[]
  prospects: Prospect[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function PulsePipelinePage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState('')
  const [qualifiedFilter, setQualifiedFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (country) params.set('country', country)
  if (status) params.set('status', status)
  if (qualifiedFilter !== 'ALL') params.set('qualified', qualifiedFilter)
  params.set('page', String(page))
  params.set('pageSize', '20')

  const { data, loading, error } = usePulseData<PipelineData>(`/api/admin/pulse-pipeline?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Seller Pipeline" subtitle="Scouting -> qualification -> outreach -> application" />
        <PulseLoading label="Loading pipeline..." />
      </PulseShell>
    )
  }
  if (!data) {
    return (
      <PulseShell>
        <PulseHeader title="Seller Pipeline" subtitle="Scouting -> qualification -> outreach -> application" />
        <ErrorBanner>{error || 'No data yet.'}</ErrorBanner>
      </PulseShell>
    )
  }

  return (
    <PulseShell>
      <PulseHeader title="Seller Pipeline" subtitle="Scouting -> qualification -> outreach -> application" live />
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
        <div style={{ fontSize: 11, color: PULSE.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Scouting funnel</div>
        <FunnelChart stages={data.funnel} color={PULSE.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <KpiCard label="Qualified" value={data.qualified} accent={PULSE.purple} />
        <KpiCard label="Disqualified" value={data.disqualified} accent={PULSE.purple} />
        <KpiCard label="Not screened" value={data.unscreened} accent={PULSE.purple} />
        <KpiCard label="Outreach sent (7d)" value={data.outreachSent7d} accent={PULSE.purple} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', marginBottom: 8 }}>Recent outreach</div>
      {data.recentOutreach.length === 0 ? (
        <EmptyState>No outreach sent yet.</EmptyState>
      ) : (
        data.recentOutreach.map((o) => (
          <ListCard key={o.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: PULSE.text }}>{o.prospect?.name || 'Unknown prospect'}</span>
              <span style={{ fontSize: 11, color: PULSE.mutedDark, flex: '0 0 auto' }}>{timeAgo(o.sentAt)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: PULSE.muted, marginBottom: 2 }}>
              {o.prospect?.country || 'Unknown country'} &middot; {o.prospect?.sellerType || 'Unknown type'}
            </div>
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark }}>
              {o.emailType}: {o.subject}
            </div>
          </ListCard>
        ))
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', margin: '20px 0 8px' }}>Prospects</div>

      <FilterBar>
        <FilterInput
          placeholder="Search name, store URL, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterInput
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
          style={{ flex: '1 1 100px' }}
        />
        <FilterInput
          placeholder="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
          style={{ flex: '1 1 100px' }}
        />
        <FilterSelect value={qualifiedFilter} onChange={(e) => { setQualifiedFilter(e.target.value); setPage(1) }}>
          <option value="ALL">All</option>
          <option value="true">Qualified</option>
          <option value="false">Disqualified</option>
          <option value="unscreened">Unscreened</option>
        </FilterSelect>
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      <ResultsMeta total={data.total} noun="prospect" page={data.page} totalPages={data.totalPages} />
      {data.prospects.length === 0 && <EmptyState>No prospects match these filters.</EmptyState>}

      {data.prospects.map((p) => {
        const qualifiedLabel = p.qualified === true ? 'Qualified' : p.qualified === false ? 'Disqualified' : 'Unscreened'
        const qualifiedColor = p.qualified === true ? PULSE.green : p.qualified === false ? PULSE.red : PULSE.muted
        return (
          <ListCard key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
              <span style={{ fontSize: 14.5, fontWeight: 650, color: PULSE.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <Badge color={PULSE.accent}>{p.status}</Badge>
            </div>
            <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>
              {p.platform} &middot;{' '}
              <a href={p.storeUrl} target="_blank" rel="noreferrer" style={{ color: PULSE.blue, textDecoration: 'none' }}>
                {p.storeUrl}
              </a>
            </div>
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginBottom: 2 }}>
              {p.category} &middot; {p.sellerType} &middot; {p.country || 'Unknown country'} &middot; score {p.score}
            </div>
            <div style={{ fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Badge color={qualifiedColor}>{qualifiedLabel}</Badge>
            </div>
            {p.notes && <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>{p.notes}</div>}
          </ListCard>
        )
      })}

      <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />
      <PulseFooter />
    </PulseShell>
  )
}
