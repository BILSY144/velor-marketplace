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
  FilterButton,
  PageNav,
  ResultsMeta,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { fmtDateTime, fmtSpan } from '@/lib/pulseFormat'

type Application = {
  id: string
  businessName: string
  contactName: string
  contactEmail: string
  website: string | null
  storeDescription: string | null
  productCategories: string[]
  sampleImages: string[]
  country: string | null
  status: string
  verificationStatus: string
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  verifiedAt: string | null
  verificationNotes: string | null
  prospectId: string | null
  createdAt: string
  updatedAt: string
}

type ApplicationsResponse = { applications: Application[]; total: number; page: number; pageSize: number; totalPages: number }

export default function ApplicationsPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  if (country) params.set('country', country)
  params.set('page', String(page))
  params.set('pageSize', '25')

  const { data, loading, error } = usePulseData<ApplicationsResponse>(`/api/admin/applications?${params.toString()}`, token, { onUnauthorized: lock })
  const runFilters = useCallback(() => setPage(1), [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell activeNav="applications">
        <PulseHeader title="Applications" subtitle="Every seller application" />
        <PulseLoading label="Loading applications..." />
      </PulseShell>
    )
  }

  return (
    <PulseShell activeNav="applications">
      <PulseHeader title="Applications" subtitle="Every seller application" live />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <FilterBar>
        <FilterInput placeholder="Search name, contact, email..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }} />
        <FilterInput placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }} />
        <FilterInput placeholder="Status (PENDING, APPROVED, REJECTED)" value={status} onChange={(e) => setStatus(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }} />
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      {data && <ResultsMeta total={data.total} noun="application" page={data.page} totalPages={data.totalPages} />}
      {data && data.applications.length === 0 && <EmptyState>No applications match these filters.</EmptyState>}

      {data && data.applications.map((a) => {
        const createdMs = new Date(a.createdAt).getTime()
        let badgeLabel = ''
        let badgeColor = PULSE.green
        let timescaleLabel = ''
        if (a.status === 'APPROVED') {
          badgeLabel = 'APPROVED'
          badgeColor = PULSE.green
          timescaleLabel = a.reviewedAt ? 'Approved in ' + fmtSpan((new Date(a.reviewedAt).getTime() - createdMs) / (1000 * 60 * 60)) : 'Approved'
        } else if (a.status === 'REJECTED') {
          badgeLabel = 'REJECTED'
          badgeColor = PULSE.red
          timescaleLabel = a.reviewedAt ? 'Decided in ' + fmtSpan((new Date(a.reviewedAt).getTime() - createdMs) / (1000 * 60 * 60)) : 'Rejected'
        } else {
          const hoursPending = (Date.now() - createdMs) / (1000 * 60 * 60)
          const overdue = hoursPending > 24
          const escalated = !overdue && hoursPending > 12
          badgeLabel = overdue ? 'OVERDUE' : escalated ? 'ESCALATED' : 'PENDING'
          badgeColor = overdue ? PULSE.red : escalated ? PULSE.accent : PULSE.amber
          timescaleLabel = fmtSpan(hoursPending) + ' pending (24h SLA)'
        }
        return (
          <ListCard key={a.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 650, color: PULSE.text }}>{a.businessName}</span>
              <Badge color={badgeColor}>{badgeLabel}</Badge>
            </div>
            <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>{a.country || 'Unknown country'} &middot; verification: {a.verificationStatus.replace(/_/g, ' ')}</div>
            <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>{a.contactName} &middot; {a.contactEmail}</div>
            {a.website && (
              <div style={{ fontSize: 12, marginBottom: 2 }}>
                <a href={a.website} target="_blank" rel="noreferrer" style={{ color: PULSE.accent2 }}>{a.website}</a>
              </div>
            )}
            {a.storeDescription && <div style={{ fontSize: 12, color: '#ccc', marginTop: 4, marginBottom: 4 }}>{a.storeDescription}</div>}
            {a.productCategories.length > 0 && <div style={{ fontSize: 11, color: PULSE.mutedDark, marginTop: 4 }}>Categories: {a.productCategories.join(', ')}</div>}
            <div style={{ fontSize: 11, color: PULSE.mutedDark, marginTop: 4 }}>{a.sampleImages.length} sample image{a.sampleImages.length === 1 ? '' : 's'}</div>
            {a.rejectionReason && (
              <div style={{ fontSize: 12, color: '#ffb0bd', background: 'rgba(255,84,112,0.1)', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>Rejected: {a.rejectionReason}</div>
            )}
            <div style={{ fontSize: 11, color: PULSE.mutedDark, marginTop: 4 }}>
              Submitted {fmtDateTime(a.createdAt)} &middot; {timescaleLabel}
            </div>
            {a.verificationNotes && <div style={{ fontSize: 11, color: PULSE.mutedDark, marginTop: 4 }}>Verification notes: {a.verificationNotes}</div>}
            {a.prospectId && <div style={{ fontSize: 11, color: PULSE.mutedDark, marginTop: 4 }}>Prospect: {a.prospectId}</div>}
          </ListCard>
        )
      })}

      {data && <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />}
      <PulseFooter />
    </PulseShell>
  )
}
