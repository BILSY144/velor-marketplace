'use client'

// Certificate review queue for regulated-material listings (CITES export/
// import permits, phytosanitary certs, etc -- see prisma/schema.prisma's
// ProductCertificate model). Reuses the existing GET/PATCH
// /api/admin/certificates route rather than adding a new one -- that route
// already does exactly what this page needs, it just never had a mobile
// surface before. Actionable from here: verify or reject a certificate
// directly from Pulse, same as the desktop admin flow.

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
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { fmtDate } from '@/lib/pulseFormat'

type Certificate = {
  id: string
  type: string
  fileName: string | null
  destinationCountry: string | null
  issuedBy: string | null
  expiresAt: string | null
  status: string
  reviewNotes: string | null
  createdAt: string
  product: {
    id: string
    title: string
    category: string
    materials: string | null
    originCountry: string | null
    status: string
    seller: { id: string; storeName: string; country: string | null }
  }
}

type CertResponse = { count: number; certificates: Certificate[] }

const TABS = ['PENDING', 'VERIFIED', 'REJECTED'] as const

export default function PulseCompliancePage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]>('PENDING')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [actionError, setActionError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const { data, loading, error } = usePulseData<CertResponse>(`/api/admin/certificates?status=${tab}&r=${refreshKey}`, token, { onUnauthorized: lock })

  const act = useCallback(
    async (id: string, action: 'verify' | 'reject', reviewNotes?: string) => {
      setBusyId(id)
      setActionError('')
      try {
        const res = await fetch('/api/admin/certificates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ id, action, reviewNotes }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Action failed')
        }
        setRejectingId(null)
        setNotes('')
        setRefreshKey((k) => k + 1)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Action failed')
      } finally {
        setBusyId(null)
      }
    },
    [token]
  )

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Compliance" subtitle="Certificate review queue" />
        <PulseLoading label="Loading certificates..." />
      </PulseShell>
    )
  }

  return (
    <PulseShell>
      <PulseHeader title="Compliance" subtitle="Certificate review queue" live />
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {actionError && <ErrorBanner>{actionError}</ErrorBanner>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {data && <div style={{ fontSize: 12, color: PULSE.mutedDark, marginBottom: 12 }}>{data.count} certificate{data.count === 1 ? '' : 's'}</div>}
      {data && data.certificates.length === 0 && <EmptyState>Nothing in this queue.</EmptyState>}

      {data && data.certificates.map((c) => {
        const expired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false
        return (
          <ListCard key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13.5, fontWeight: 650, color: PULSE.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.product.title}</span>
              <Badge color={c.status === 'VERIFIED' ? PULSE.green : c.status === 'REJECTED' ? PULSE.red : PULSE.amber}>{c.status}</Badge>
            </div>
            <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>
              {c.type.replace(/_/g, ' ')} &middot; {c.product.category} &middot; {c.product.seller.storeName}
            </div>
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginBottom: 2 }}>
              Origin {c.product.originCountry || 'unknown'} &rarr; destination {c.destinationCountry || 'any'}
              {c.issuedBy && <> &middot; issued by {c.issuedBy}</>}
            </div>
            <div style={{ fontSize: 11.5, color: expired ? PULSE.red : PULSE.mutedDark, marginBottom: 2 }}>
              {c.expiresAt ? `Expires ${fmtDate(c.expiresAt)}${expired ? ' (EXPIRED)' : ''}` : 'No expiry on record'} &middot; {c.fileName || 'No file name on record'}
            </div>
            {c.reviewNotes && <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>Notes: {c.reviewNotes}</div>}

            {c.status === 'PENDING' && (
              <div style={{ marginTop: 10 }}>
                {rejectingId === c.id ? (
                  <div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Reason for rejection..."
                      rows={2}
                      style={{ width: '100%', boxSizing: 'border-box', background: PULSE.surfaceRaised, border: `1px solid ${PULSE.border}`, borderRadius: 8, color: PULSE.text, fontSize: 12, padding: 8, marginBottom: 6, fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionButton color={PULSE.red} disabled={busyId === c.id} onClick={() => act(c.id, 'reject', notes)}>Confirm reject</ActionButton>
                      <ActionButton color={PULSE.mutedDark} disabled={busyId === c.id} onClick={() => { setRejectingId(null); setNotes('') }}>Cancel</ActionButton>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <ActionButton color={PULSE.green} disabled={busyId === c.id || expired} onClick={() => act(c.id, 'verify')}>
                      {busyId === c.id ? 'Working...' : expired ? 'Expired' : 'Verify'}
                    </ActionButton>
                    <ActionButton color={PULSE.red} disabled={busyId === c.id} onClick={() => setRejectingId(c.id)}>Reject</ActionButton>
                  </div>
                )}
              </div>
            )}
          </ListCard>
        )
      })}

      <PulseFooter />
    </PulseShell>
  )
}

function ActionButton({ children, color, onClick, disabled }: { children: React.ReactNode; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
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
