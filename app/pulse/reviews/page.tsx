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
import { timeAgo } from '@/lib/pulseFormat'

type Review = {
  id: string
  productId: string
  userId: string
  rating: number
  comment: string
  createdAt: string
  product: { title: string; images: string[]; category: string } | null
  user: { name: string | null; email: string } | null
}

type ReviewsResponse = {
  reviews: Review[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  distribution: { rating: number; count: number }[]
  averageRating: number | null
  totalReviews: number
  last7d: number
  last30d: number
}

const MIN_RATING_OPTIONS = [
  { value: '0', label: 'Any rating' },
  { value: '5', label: '5★+' },
  { value: '4', label: '4★+' },
  { value: '3', label: '3★+' },
  { value: '2', label: '2★+' },
  { value: '1', label: '1★+' },
]

export default function PulseReviewsPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [minRating, setMinRating] = useState('0')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (minRating !== '0') params.set('minRating', minRating)
  if (q) params.set('q', q)
  params.set('page', String(page))
  params.set('pageSize', '25')

  const { data, loading, error } = usePulseData<ReviewsResponse>(`/api/admin/pulse-reviews?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Reviews" subtitle="What buyers are saying" />
        <PulseLoading label="Loading reviews..." />
      </PulseShell>
    )
  }

  const distribution = data?.distribution || []
  const maxDistribution = Math.max(1, ...distribution.map((d) => d.count))

  return (
    <PulseShell>
      <PulseHeader title="Reviews" subtitle="What buyers are saying" live updatedAt={data?.reviews ? new Date().toISOString() : null} />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <KpiCard
          label="Average rating"
          value={data && data.averageRating !== null ? data.averageRating.toFixed(1) : 'No ratings yet'}
          accent={PULSE.amber}
        />
        <KpiCard label="Total reviews" value={data ? data.totalReviews : 0} accent={PULSE.amber} />
        <KpiCard label="New (7d)" value={data ? data.last7d : 0} accent={PULSE.amber} />
        <KpiCard label="New (30d)" value={data ? data.last30d : 0} accent={PULSE.amber} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', marginBottom: 8 }}>Rating distribution</div>
      <div style={{ marginBottom: 20 }}>
        {[5, 4, 3, 2, 1].map((level) => {
          const entry = distribution.find((d) => d.rating === level)
          const count = entry ? entry.count : 0
          return (
            <MiniBar
              key={level}
              label={'★'.repeat(level) + '☆'.repeat(5 - level) + ` (${level})`}
              value={count}
              max={maxDistribution}
              color={PULSE.amber}
            />
          )
        })}
      </div>

      <FilterBar>
        <FilterSelect value={minRating} onChange={(e) => { setMinRating(e.target.value); setPage(1) }}>
          {MIN_RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </FilterSelect>
        <FilterInput
          placeholder="Search comment or product..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      {data && <ResultsMeta total={data.total} noun="review" page={data.page} totalPages={data.totalPages} />}
      {data && data.reviews.length === 0 && <EmptyState>No reviews match these filters.</EmptyState>}

      {data && data.reviews.map((r) => {
        const image = r.product?.images?.[0]
        return (
          <ListCard key={r.id}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {image ? (
                <img src={image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flex: '0 0 auto' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: PULSE.surfaceRaised, flex: '0 0 auto' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: PULSE.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.product?.title || 'Deleted product'}
                </div>
                <div style={{ fontSize: 14, color: PULSE.amber, marginTop: 3, letterSpacing: 1 }}>
                  {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                </div>
                <div style={{ fontSize: 12, color: PULSE.muted, marginTop: 3 }}>
                  {r.user?.name || 'Anonymous'} &middot; {r.user?.email || 'No email on record'}
                </div>
                {r.comment && (
                  <div style={{ fontSize: 12.5, color: PULSE.text, marginTop: 6, lineHeight: 1.4 }}>{r.comment}</div>
                )}
                <div style={{ fontSize: 11, color: PULSE.mutedDark, marginTop: 6 }}>{timeAgo(r.createdAt)}</div>
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
