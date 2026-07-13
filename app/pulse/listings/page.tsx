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

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (status !== 'ALL') params.set('status', status)
  if (stock) params.set('stock', stock)
  params.set('page', String(page))
  params.set('pageSize', '25')

  const { data, loading, error } = usePulseData<ListingsResponse>(`/api/admin/pulse-listings?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

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
