'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
PulseShell,
PulseHeader,
PulseFooter,
PulseLoading,
ErrorBanner,
TokenGate,
Badge,
PULSE,
usePulseAuth,
usePulseData,
} from '@/components/pulse/PulseKit'
import { fmtDateTime } from '@/lib/pulseFormat'

type Application = {
id: string
businessName: string
sellerType: string | null
contactName: string
contactEmail: string
website: string | null
storeDescription: string | null
productCategories: string[]
sampleImages: string[]
country: string | null
prospectId: string | null
shippingName: string | null
shippingCompany: string | null
shippingStreet1: string | null
shippingStreet2: string | null
shippingCity: string | null
shippingState: string | null
shippingZip: string | null
shippingCountry: string | null
shippingPhone: string | null
verificationStatus: string
verificationSessionId: string | null
verifiedAt: string | null
verificationNotes: string | null
status: string
reviewedAt: string | null
reviewedBy: string | null
rejectionReason: string | null
createdAt: string
updatedAt: string
}

const labelStyle: React.CSSProperties = { fontSize: 10.5, color: PULSE.mutedDark, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3, fontWeight: 600 }
const valueStyle: React.CSSProperties = { fontSize: 13.5, color: PULSE.text, marginBottom: 14, wordBreak: 'break-word' }

function Field({ label, value }: { label: string; value: React.ReactNode }) {
if (value === null || value === undefined || value === '') return null
return (
<div>
<div style={labelStyle}>{label}</div>
<div style={valueStyle}>{value}</div>
</div>
)
}

function SectionTitle({ children }: { children: React.ReactNode }) {
return <div style={{ fontSize: 12, fontWeight: 700, color: PULSE.accent, textTransform: 'uppercase', letterSpacing: 0.6, margin: '20px 0 10px' }}>{children}</div>
}

export default function ApplicationDetailPage() {
const params = useParams<{ id: string }>()
const id = params?.id as string
const { token, needsToken, unlock, lock } = usePulseAuth()
const [busy, setBusy] = useState(false)
const [actionError, setActionError] = useState('')
const [showRejectBox, setShowRejectBox] = useState(false)
const [rejectReason, setRejectReason] = useState('')

const { data, loading, error } = usePulseData<{ application: Application }>(id ? `/api/agents/applications/${id}` : null, token, { onUnauthorized: lock, intervalMs: 0 })
const app = data?.application

if (needsToken) return <TokenGate onUnlock={unlock} />

if (loading && !app) {
return (
<PulseShell activeNav="applications">
<PulseHeader title="Application" subtitle="Loading..." back="/pulse/applications" />
<PulseLoading label="Loading application..." />
</PulseShell>
)
}

const act = async (action: 'approve' | 'reject') => {
if (!app) return
setActionError('')

if (action === 'reject' && !showRejectBox) {
setShowRejectBox(true)
return
}
if (action === 'reject' && !rejectReason.trim()) {
setActionError('A rejection reason is required -- the applicant will see it.')
return
}

setBusy(true)
try {
const res = await fetch(`/api/agents/applications/${id}`, {
method: 'PATCH',
headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
body: JSON.stringify(action === 'reject' ? { action, reason: rejectReason.trim() } : { action }),
})
const j = await res.json().catch(() => ({}))
if (!res.ok) {
setActionError(j.error || 'Action failed.')
setBusy(false)
return
}
window.location.reload()
} catch {
setActionError('Could not reach the server.')
setBusy(false)
}
}

return (
<PulseShell activeNav="applications">
<PulseHeader title={app ? app.businessName : 'Application'} subtitle="Full application detail" back="/pulse/applications" />
{error && <ErrorBanner>{error}</ErrorBanner>}
{actionError && <ErrorBanner>{actionError}</ErrorBanner>}

{app && (
<>
<div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
<Badge color={app.status === 'APPROVED' ? PULSE.green : app.status === 'REJECTED' ? PULSE.red : PULSE.amber}>{app.status}</Badge>
<Badge color={app.verificationStatus === 'VERIFIED' ? PULSE.green : (app.verificationStatus === 'RESTRICTED' || app.verificationStatus === 'FAILED') ? PULSE.red : PULSE.blue}>
ID: {app.verificationStatus.replace(/_/g, ' ')}
</Badge>
</div>

<SectionTitle>Store</SectionTitle>
<Field label="Store name" value={app.businessName} />
<Field label="Selling as" value={app.sellerType === 'business' ? 'Registered business' : app.sellerType === 'individual' ? 'Individual' : null} />
<Field label="Country" value={app.country} />
<Field label="Website" value={app.website ? <a href={app.website} target="_blank" rel="noreferrer" style={{ color: PULSE.accent2 }}>{app.website}</a> : null} />
<Field label="Description" value={app.storeDescription} />
<Field label="Categories" value={app.productCategories && app.productCategories.length > 0 ? app.productCategories.join(', ') : null} />
<Field label="Sample images" value={`${app.sampleImages ? app.sampleImages.length : 0} submitted`} />
<Field label="Prospect ID" value={app.prospectId} />

<SectionTitle>Contact</SectionTitle>
<Field label="Contact name" value={app.contactName} />
<Field label="Contact email" value={<a href={`mailto:${app.contactEmail}`} style={{ color: PULSE.accent2 }}>{app.contactEmail}</a>} />

<SectionTitle>Ship-from address</SectionTitle>
<Field label="Name" value={app.shippingName} />
<Field label="Company" value={app.shippingCompany} />
<Field label="Address" value={[app.shippingStreet1, app.shippingStreet2].filter(Boolean).join(', ') || null} />
<Field label="City / State" value={[app.shippingCity, app.shippingState].filter(Boolean).join(', ') || null} />
<Field label="Postal code" value={app.shippingZip} />
<Field label="Shipping country" value={app.shippingCountry} />
<Field label="Phone" value={app.shippingPhone} />
{!app.shippingStreet1 && <div style={{ fontSize: 12, color: PULSE.mutedDark, marginBottom: 14 }}>No ship-from address on this application.</div>}

<SectionTitle>Identity verification</SectionTitle>
<Field label="Status" value={app.verificationStatus.replace(/_/g, ' ')} />
<Field label="Verified at" value={app.verifiedAt ? fmtDateTime(app.verifiedAt) : null} />
<Field label="Notes" value={app.verificationNotes} />
{app.verificationStatus !== 'VERIFIED' && (
<div style={{ fontSize: 12, color: PULSE.mutedDark, background: 'rgba(255,255,255,0.03)', border: `1px solid ${PULSE.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 14 }}>
This is expected and does not block approval. Since 2026-07-21, applications are approved on rules screening alone -- identity is verified by the seller&apos;s payout rail (Stripe Connect or Trolley) when they set up payouts after approval, not before.
</div>
)}

<SectionTitle>Review</SectionTitle>
<Field label="Submitted" value={fmtDateTime(app.createdAt)} />
<Field label="Reviewed by" value={app.reviewedBy} />
<Field label="Reviewed at" value={app.reviewedAt ? fmtDateTime(app.reviewedAt) : null} />
<Field label="Rejection reason" value={app.rejectionReason} />

{app.status === 'PENDING' && (
<>
<SectionTitle>Decision</SectionTitle>
{showRejectBox && (
<textarea
value={rejectReason}
onChange={(e) => setRejectReason(e.target.value)}
placeholder="Reason the applicant will see..."
rows={3}
style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${PULSE.border}`, background: PULSE.surface, color: PULSE.text, fontSize: 13.5, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}
/>
)}
<div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
<button
disabled={busy}
onClick={() => act('approve')}
style={{ flex: 1, padding: '14px 10px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${PULSE.green}, #2bb968)`, color: '#04170c', fontSize: 14, fontWeight: 800, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
>
Accept
</button>
<button
disabled={busy}
onClick={() => act('reject')}
style={{ flex: 1, padding: '14px 10px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${PULSE.red}, #c93a52)`, color: '#fff', fontSize: 14, fontWeight: 800, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
>
{showRejectBox ? 'Confirm deny' : 'Deny'}
</button>
</div>
</>
)}

{app.status !== 'PENDING' && (
<div style={{ fontSize: 12.5, color: PULSE.mutedDark, marginTop: 16 }}>
This application has already been {app.status.toLowerCase()} -- no further action available here.
</div>
)}
</>
)}

<PulseFooter />
</PulseShell>
)
}
