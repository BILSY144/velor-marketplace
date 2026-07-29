'use client'

// Shared "Report" button for every UGC surface (2026-07-29), per the signed
// online safety policy: listings, reviews and messages each carry their own
// report route (live streams already had one). Renders a quiet text link
// that opens a small centered form and POSTs to /api/reports. Works signed
// in (session email used server-side) or signed out (asks for an email).
//
// The modal renders via createPortal(document.body) -- lesson from the
// listing-preview overlay (2026-07-29): fixed overlays inside /dashboard/*
// get trapped under the shell chrome by the page's stacking context unless
// they portal to body.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import { REPORT_REASONS } from '@/lib/reportReasons'

export default function ReportContentButton({
  contentType,
  contentId,
  label = 'Report',
  style,
}: {
  contentType: 'LISTING' | 'REVIEW' | 'MESSAGE' | 'SELLER'
  contentId: string
  label?: string
  style?: React.CSSProperties
}) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          reason,
          details,
          email: session ? undefined : email,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setState('error')
        return
      }
      setState('sent')
    } catch {
      setError('Something went wrong. Please try again.')
      setState('error')
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    fontSize: '14px',
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: '11.5px',
          color: 'var(--muted)',
          textDecoration: 'underline',
          cursor: 'pointer',
          ...style,
        }}
      >
        {label}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Report this</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--muted)', cursor: 'pointer', minWidth: '44px', minHeight: '44px' }}>×</button>
            </div>
            {state === 'sent' ? (
              <p style={{ fontSize: '14.5px', color: 'var(--green)', margin: '10px 0 0' }}>
                Thank you — your report is in. Reports are reviewed within 24–48 hours.
              </p>
            ) : (
              <form onSubmit={submit}>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.55 }}>
                  Reports are confidential — the person you report is never told who reported them.
                </p>
                <select style={fieldStyle} required value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason">
                  <option value="" disabled>Pick a reason…</option>
                  {Object.entries(REPORT_REASONS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <textarea
                  style={{ ...fieldStyle, marginTop: '10px', minHeight: '72px', resize: 'vertical' }}
                  placeholder={reason === 'other' ? 'Describe the problem (required)' : 'Details (optional)'}
                  required={reason === 'other'}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
                {!session && (
                  <input
                    style={{ ...fieldStyle, marginTop: '10px' }}
                    type="email"
                    required
                    placeholder="Your email (so we can follow up)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
                {error && <p style={{ color: 'var(--red)', fontSize: '13.5px', margin: '10px 0 0' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={state === 'sending'}
                  style={{ marginTop: '14px', width: '100%', minHeight: '44px', borderRadius: '999px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer', opacity: state === 'sending' ? 0.6 : 1 }}
                >
                  {state === 'sending' ? 'Sending…' : 'Send report'}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
