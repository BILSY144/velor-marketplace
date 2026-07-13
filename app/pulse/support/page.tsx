'use client'

// Support & Trust -- a combined view of support tickets, disputes, and
// return requests, backed by /api/admin/pulse-support. Not a bottom-nav tab
// (accessed from the Pulse home grid like Compliance), so PulseShell renders
// with no activeNav. Tab-pill switcher pattern copied from
// app/pulse/compliance/page.tsx; filter bar / pagination pattern copied from
// app/pulse/orders/page.tsx.

import { useCallback, useState } from 'react'
import {
  PulseShell,
  PulseHeader,
  PulseFooter,
  PulseLoading,
  ErrorBanner,
  TokenGate,
  ListCard,
  EmptyState,
  Badge,
  StatusBadge,
  KpiCard,
  FilterBar,
  FilterInput,
  FilterButton,
  PageNav,
  ResultsMeta,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { fmtDateTime } from '@/lib/pulseFormat'

type TicketItem = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  priority: string
  status: string
  sellerStoreName: string | null
  createdAt: string
}

type DisputeItem = {
  id: string
  orderId: string
  raisedBy: string
  reason: string
  evidence: string | null
  status: string
  resolution: string | null
  customerEmail: string | null
  sellerStoreName: string | null
  createdAt: string
}

type ReturnItem = {
  id: string
  orderId: string
  customerEmail: string
  reason: string
  status: string
  sellerStoreName: string | null
  createdAt: string
}

type SupportCounts = { openTickets: number; priorityOpenTickets: number; openDisputes: number; pendingReturns: number }

type SupportData = {
  tab: 'tickets' | 'disputes' | 'returns'
  items: TicketItem[] | DisputeItem[] | ReturnItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  counts: SupportCounts
}

const TABS = ['tickets', 'disputes', 'returns'] as const

export default function PulseSupportPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]>('tickets')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const switchTab = useCallback((t: (typeof TABS)[number]) => {
    setTab(t)
    setPage(1)
  }, [])

  const runFilters = useCallback(() => setPage(1), [])

  const params = new URLSearchParams()
  params.set('tab', tab)
  if (status) params.set('status', status)
  params.set('page', String(page))
  params.set('pageSize', '20')

  const { data, loading, error } = usePulseData<SupportData>(`/api/admin/pulse-support?${params.toString()}`, token, { onUnauthorized: lock })

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Support & Trust" subtitle="Tickets, disputes, returns" />
        <PulseLoading label="Loading support queue..." />
      </PulseShell>
    )
  }

  const counts = data?.counts

  return (
    <PulseShell>
      <PulseHeader title="Support & Trust" subtitle="Tickets, disputes, returns" live />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <KpiCard label="Open tickets" value={counts ? counts.openTickets : '—'} accent={PULSE.amber} />
        <KpiCard label="Priority open" value={counts ? counts.priorityOpenTickets : '—'} accent={PULSE.red} />
        <KpiCard label="Open disputes" value={counts ? counts.openDisputes : '—'} accent={PULSE.red} />
        <KpiCard label="Pending returns" value={counts ? counts.pendingReturns : '—'} accent={PULSE.amber} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            style={{
              flex: 1,
              padding: '9px 8px',
              borderRadius: 9,
              border: `1px solid ${tab === t ? PULSE.accent : PULSE.border}`,
              background: tab === t ? PULSE.accent + '1a' : PULSE.surface,
              color: tab === t ? PULSE.accent : PULSE.muted,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <FilterBar>
        <FilterInput
          placeholder="Filter by status..."
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterButton onClick={runFilters}>Filter</FilterButton>
      </FilterBar>

      {data && <ResultsMeta total={data.total} noun={tab === 'tickets' ? 'ticket' : tab === 'disputes' ? 'dispute' : 'return'} page={data.page} totalPages={data.totalPages} />}
      {data && data.items.length === 0 && <EmptyState>Nothing in this queue.</EmptyState>}

      {data && tab === 'tickets' && (data.items as TicketItem[]).map((t) => (
        <ListCard key={t.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: PULSE.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</span>
            <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
              <Badge color={t.priority === 'PRIORITY' ? PULSE.red : PULSE.muted}>{t.priority}</Badge>
              <StatusBadge status={t.status} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>{t.name} &middot; {t.email}</div>
          {t.sellerStoreName && <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>Seller: {t.sellerStoreName}</div>}
          <div
            style={{
              fontSize: 12,
              color: PULSE.mutedDark,
              marginTop: 6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {t.message}
          </div>
          <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 6 }}>{fmtDateTime(t.createdAt)}</div>
        </ListCard>
      ))}

      {data && tab === 'disputes' && (data.items as DisputeItem[]).map((d) => (
        <ListCard key={d.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: PULSE.accent }}>#{d.orderId}</span>
            <StatusBadge status={d.status} />
          </div>
          <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>Raised by {d.raisedBy} &middot; {d.customerEmail || 'No email on record'}</div>
          {d.sellerStoreName && <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>Seller: {d.sellerStoreName}</div>}
          <div style={{ fontSize: 12, color: PULSE.mutedDark, marginTop: 4 }}>{d.reason}</div>
          {d.evidence && <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>Evidence: {d.evidence}</div>}
          {d.resolution && <div style={{ fontSize: 11.5, color: PULSE.green, marginTop: 4 }}>Resolution: {d.resolution}</div>}
          <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 6 }}>{fmtDateTime(d.createdAt)}</div>
        </ListCard>
      ))}

      {data && tab === 'returns' && (data.items as ReturnItem[]).map((r) => (
        <ListCard key={r.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: PULSE.accent }}>#{r.orderId}</span>
            <StatusBadge status={r.status} />
          </div>
          <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>{r.customerEmail}</div>
          {r.sellerStoreName && <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>Seller: {r.sellerStoreName}</div>}
          <div style={{ fontSize: 12, color: PULSE.mutedDark, marginTop: 4 }}>{r.reason}</div>
          <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 6 }}>{fmtDateTime(r.createdAt)}</div>
        </ListCard>
      ))}

      {data && <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />}
      <PulseFooter />
    </PulseShell>
  )
}
