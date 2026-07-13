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
  Badge,
  FilterBar,
  FilterInput,
  FilterSelect,
  FilterButton,
  PageNav,
  ResultsMeta,
  MiniBar,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { fmtDate } from '@/lib/pulseFormat'

type Seller = {
  id: string
  storeName: string
  country: string | null
  currency: string
  approved: boolean
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE'
  sellerScore: number
  sellerBadge: string | null
  rankingScore: number
  foundingEligible: boolean
  foundingBadge: boolean
  payoutRail: string
  productCount: number
  contactName: string | null
  contactEmail: string | null
  createdAt: string
}

type TierCount = { tier: string; count: number }
type CountryCount = { country: string; count: number }

type SellersResponse = {
  sellers: Seller[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  byTier: TierCount[]
  byCountry: CountryCount[]
}

const TIER_COLOR: Record<string, string> = {
  STARTER: PULSE.muted,
  PRO: PULSE.accent,
  ENTERPRISE: PULSE.purple,
}

export default function PulseSellersPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('')
  const [tier, setTier] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (country) params.set('country', country)
  if (tier) params.set('tier', tier)
  if (status !== 'all') params.set('status', status)
  params.set('page', String(page))
  params.set('pageSize', '25')

  const { data, loading, error } = usePulseData<SellersResponse>(`/api/admin/pulse-sellers?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell activeNav="sellers">
        <PulseHeader title="Sellers" subtitle="Every seller, searchable" />
        <PulseLoading label="Loading sellers..." />
      </PulseShell>
    )
  }

  const maxTierCount = data?.byTier?.length ? Math.max(...data.byTier.map((t) => t.count)) : 0

  return (
    <PulseShell activeNav="sellers">
      <PulseHeader title="Sellers" subtitle="Every seller, searchable" live updatedAt={data?.sellers ? new Date().toISOString() : null} />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <FilterBar>
        <FilterInput
          placeholder="Search store, contact, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterInput
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterSelect value={tier} onChange={(e) => { setTier(e.target.value); setPage(1) }}>
          <option value="">ALL TIERS</option>
          <option value="STARTER">STARTER</option>
          <option value="PRO">PRO</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </FilterSelect>
        <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </FilterSelect>
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      {data && data.byTier.length > 0 && (
        <div style={{ background: PULSE.surface, border: `1px solid ${PULSE.border}`, borderRadius: 14, padding: '14px 15px', marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, color: PULSE.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, fontWeight: 600 }}>Sellers by tier</div>
          {data.byTier.map((t) => (
            <MiniBar key={t.tier} label={t.tier} value={t.count} max={maxTierCount} color={TIER_COLOR[t.tier] || PULSE.accent} />
          ))}
        </div>
      )}

      {data && <ResultsMeta total={data.total} noun="seller" page={data.page} totalPages={data.totalPages} />}
      {data && data.sellers.length === 0 && <EmptyState>No sellers match these filters.</EmptyState>}

      {data && data.sellers.map((s) => (
        <ListCard key={s.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: PULSE.text, fontFamily: "'Space Grotesk', sans-serif" }}>{s.storeName}</span>
            <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
              <Badge color={TIER_COLOR[s.tier] || PULSE.muted}>{s.tier}</Badge>
              {!s.approved && <Badge color={PULSE.amber}>PENDING</Badge>}
            </div>
          </div>
          {s.foundingBadge && (
            <div style={{ fontSize: 10.5, fontWeight: 700, color: PULSE.amber, marginBottom: 4 }}>&#9733; FOUNDING</div>
          )}
          <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>
            {s.country || 'Country not provided'} &middot; {s.currency} &middot; {s.payoutRail}
          </div>
          <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>
            {s.contactName || 'Not provided'} &middot; {s.contactEmail || 'No email on record'}
          </div>
          <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
            {s.productCount} product{s.productCount === 1 ? '' : 's'} &middot; ranking {s.rankingScore.toFixed(1)} &middot; seller score {s.sellerScore.toFixed(1)}
            {s.sellerBadge ? ` · ${s.sellerBadge}` : ''}
          </div>
          <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
            Joined {fmtDate(s.createdAt)}
          </div>
        </ListCard>
      ))}

      {data && <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />}
      <PulseFooter />
    </PulseShell>
  )
}
