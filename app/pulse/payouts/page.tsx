'use client'

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
import { formatMoney, fmtDateTime } from '@/lib/pulseFormat'

type Payout = {
  id: string
  sellerId: string
  orderId: string | null
  amount: number
  currency: string
  stripeTransferId: string | null
  payoneerPayoutId: string | null
  status: string
  createdAt: string
  updatedAt: string
  seller: { storeName: string; country: string | null; payoutRail: string } | null
}

type PayoutsResponse = {
  payouts: Payout[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  byStatus: { status: string; count: number }[]
  pendingGBP: number
  pendingCount: number
  fxNote: string
}

// Payout.status has no fixed enum in the schema -- values are whatever the
// database actually contains (see the API route's groupBy). Colour is
// therefore inferred from the string content rather than looked up in a
// fixed map.
function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('fail') || s.includes('error')) return PULSE.red
  if (s.includes('paid') || s.includes('complete') || s.includes('success')) return PULSE.green
  if (s.includes('pending')) return PULSE.amber
  return PULSE.muted
}

export default function PulsePayoutsPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status !== 'ALL') params.set('status', status)
  params.set('page', String(page))
  params.set('pageSize', '25')

  const { data, loading, error } = usePulseData<PayoutsResponse>(`/api/admin/pulse-payouts?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Payouts" subtitle="Stripe + Payoneer" />
        <PulseLoading label="Loading payouts..." />
      </PulseShell>
    )
  }

  const maxStatusCount = data ? Math.max(1, ...data.byStatus.map((s) => s.count)) : 1

  return (
    <PulseShell>
      <PulseHeader title="Payouts" subtitle="Stripe + Payoneer" live updatedAt={data ? new Date().toISOString() : null} />
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
        <div style={{ fontSize: 11, color: PULSE.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Pending payouts</div>
        <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: PULSE.green, marginBottom: 6 }}>
          {formatMoney(data?.pendingGBP ?? 0)}
        </div>
        <div style={{ fontSize: 12, color: PULSE.muted }}>
          {data ? data.pendingCount : 0} payout{data?.pendingCount === 1 ? '' : 's'} awaiting release
        </div>
      </div>

      {data && data.byStatus.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {data.byStatus.map((s) => (
            <MiniBar key={s.status} label={s.status} value={s.count} max={maxStatusCount} color={statusColor(s.status)} />
          ))}
        </div>
      )}

      <FilterBar>
        <FilterInput
          placeholder="Search seller store name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="ALL">ALL</option>
          {data && data.byStatus.map((s) => (
            <option key={s.status} value={s.status}>{s.status}</option>
          ))}
        </FilterSelect>
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      {data && <ResultsMeta total={data.total} noun="payout" page={data.page} totalPages={data.totalPages} />}
      {data && data.payouts.length === 0 && <EmptyState>No payouts match these filters.</EmptyState>}

      {data && data.payouts.map((p) => {
        const currency = p.currency?.toUpperCase() || 'GBP'
        const transferLabel = p.stripeTransferId
          ? `Stripe transfer ${p.stripeTransferId}`
          : p.payoneerPayoutId
          ? `Payoneer payout ${p.payoneerPayoutId}`
          : 'No transfer ID yet'
        return (
          <ListCard key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: PULSE.green, fontFamily: "'Space Grotesk', sans-serif" }}>{formatMoney(p.amount, currency)}</span>
              <Badge color={statusColor(p.status)}>{p.status}</Badge>
            </div>
            <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>
              {p.seller?.storeName || 'Unknown seller'} &middot; {p.seller?.country || 'Not provided'} &middot; {p.seller?.payoutRail || 'Unknown rail'}
            </div>
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>{transferLabel}</div>
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>{fmtDateTime(p.createdAt)}</div>
          </ListCard>
        )
      })}

      {data && <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />}
      <PulseFooter note={data?.fxNote} />
    </PulseShell>
  )
}
