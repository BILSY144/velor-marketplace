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
  StatusBadge,
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
import { formatMoney } from '@/lib/pulseFormat'

type Listing = {
  id: string
  title: string
  price: number
  compareAt: number | null
  images: string[]
  category: string
  tags: string[]
  stock: number
  status: string
  featured: boolean
  originCountry: string | null
  specialities: string[]
  isHandmade: boolean
  requiresCertificate: boolean
  createdAt: string
  updatedAt: string
  seller: { storeName: string; country: string | null } | null
}

type ListingsResponse = {
  products: Listing[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  byStatus: { status: string; count: number }[]
  lowStockCount: number
  outOfStockCount: number
  certificateGatedPendingCount: number
}

const STATUS_OPTIONS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DELISTED']
const STOCK_OPTIONS = [
  { value: '', label: 'All stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
]

export default function PulseListingsPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('ALL')
  const [stock, setStock] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [reasonFor, setReasonFor] = useState<{ id: string; action: 'reject' | 'override_approve' } | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (status !== 'ALL') params.set('status', status)
  if (stock) params.set('stock', stock)
  params.set('page', String(page))
  params.set('pageSize', '25')
  params.set('r', String(refreshKey))

  const { data, loading, error } = usePulseData<ListingsResponse>(`/api/admin/pulse-listings?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

  // Mirrors the desktop /admin/products PATCH action -- lets William approve,
  // reject, or (for certificate-gated listings) override-approve a pending
  // listing on his own judgement straight from his phone. The certificate
  // compliance gate itself lives server-side and is untouched; 'override_approve'
  // always requires a written reason, enforced both here and by the API.
  const act = useCallback(async (id: string, action: 'approve' | 'reject' | 'override_approve', note?: string) => {
    setBusyId(id)
    setActionError('')
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ productId: id, action, note }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Action failed')
      }
      setReasonFor(null)
      setReasonText('')
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusyId(null)
    }
  }, [token])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Listings & Catalogue" subtitle="Every product on Velor" />
        <PulseLoading label="Loading listings..." />
      </PulseShell>
    )
  }

  const liveCount = data?.byStatus.find((s) => s.status === 'APPROVED')?.count ?? 0
  const pendingCount = data?.byStatus.find((s) => s.status === 'PENDING_REVIEW')?.count ?? 0

  return (
    <PulseShell>
      <PulseHeader title="Listings & Catalogue" subtitle="Every product on Velor" live />
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {actionError && <ErrorBanner>{actionError}</ErrorBanner>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <KpiCard label="Live listings" value={liveCount} accent={PULSE.green} />
          <KpiCard label="Pending review" value={pendingCount} accent={PULSE.amber} />
          <KpiCard label="Low stock" value={data.lowStockCount} accent={PULSE.accent2} />
          <KpiCard label="Out of stock" value={data.outOfStockCount} accent={PULSE.accent2} />
        </div>
      )}

      <FilterBar>
        <FilterInput
          placeholder="Search title..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterInput
          placeholder="Category..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={stock} onChange={(e) => { setStock(e.target.value); setPage(1) }}>
          {STOCK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </FilterSelect>
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      {data && <ResultsMeta total={data.total} noun="listing" page={data.page} totalPages={data.totalPages} />}
      {data && data.products.length === 0 && <EmptyState>No listings match these filters.</EmptyState>}

      {data && data.products.map((p) => {
        const thumb = p.images && p.images.length > 0 ? p.images[0] : null
        const stockColor = p.stock === 0 ? PULSE.red : p.stock < 5 ? PULSE.amber : PULSE.muted
        const showingReason = reasonFor && reasonFor.id === p.id
        return (
          <ListCard key={p.id}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {thumb ? (
                <img src={thumb} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flex: '0 0 auto' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 8, background: PULSE.surfaceRaised, flex: '0 0 auto' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: PULSE.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                    {p.title}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ fontSize: 11.5, color: PULSE.muted, marginTop: 3 }}>
                  {p.seller?.storeName || 'Unknown seller'} &middot; {p.seller?.country || 'Unknown'} &middot; {p.category}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: PULSE.text, fontFamily: "'Space Grotesk', sans-serif" }}>{formatMoney(p.price)}</span>
                  <span style={{ fontSize: 11.5, color: stockColor, fontWeight: 600 }}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                  </span>
                </div>
                {(p.requiresCertificate || p.isHandmade) && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {p.requiresCertificate && <Badge color={PULSE.red}>Certificate required</Badge>}
                    {p.isHandmade && <Badge color={PULSE.green}>Handmade</Badge>}
                  </div>
                )}
                {p.status === 'PENDING_REVIEW' && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${PULSE.border}` }}>
                    {showingReason ? (
                      <div>
                        <textarea
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          placeholder={reasonFor!.action === 'override_approve' ? 'Reason for overriding the certificate gate (required)...' : 'Reason for rejection (optional)...'}
                          rows={3}
                          style={{ width: '100%', background: PULSE.surface, border: `1px solid ${PULSE.border}`, borderRadius: 8, color: PULSE.text, padding: 8, fontSize: 12.5, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <ActionButton
                            color={reasonFor!.action === 'override_approve' ? PULSE.accent : PULSE.red}
                            disabled={busyId === p.id || (reasonFor!.action === 'override_approve' && !reasonText.trim())}
                            onClick={() => act(p.id, reasonFor!.action, reasonText)}
                          >
                            {busyId === p.id ? 'Working...' : reasonFor!.action === 'override_approve' ? 'Confirm override' : 'Confirm reject'}
                          </ActionButton>
                          <ActionButton color={PULSE.muted} disabled={busyId === p.id} onClick={() => { setReasonFor(null); setReasonText('') }}>
                            Cancel
                          </ActionButton>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <ActionButton color={PULSE.green} disabled={busyId === p.id} onClick={() => act(p.id, 'approve')}>
                          {busyId === p.id ? 'Working...' : 'Approve'}
                        </ActionButton>
                        <ActionButton color={PULSE.red} disabled={busyId === p.id} onClick={() => { setReasonFor({ id: p.id, action: 'reject' }); setReasonText('') }}>
                          Reject
                        </ActionButton>
                        {p.requiresCertificate && (
                          <ActionButton color={PULSE.accent} disabled={busyId === p.id} onClick={() => { setReasonFor({ id: p.id, action: 'override_approve' }); setReasonText('') }}>
                            Override & Approve
                          </ActionButton>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ListCard>
        )
      })}

      {data && <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />}
      <PulseFooter />
    </PulseShell>
  )
}

function ActionButton({ children, color, onClick, disabled }: { children: any; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        minWidth: 100,
        padding: '9px 10px',
        borderRadius: 8,
        border: `1px solid ${color}`,
        background: color + '1a',
        color,
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}
