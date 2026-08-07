'use client'

// Public safety page (2026-07-29), built per the SIGNED online safety
// policy (docs/osa/online-safety-policy.md): the reporting and complaints
// routes must be usable by ANYONE -- signed in or not, account or none.
// Reports and appeals posted here go to /api/reports and /api/appeals,
// which record them, raise ops tickets, and email customer service so the
// policy's 24-48 hour review window is real.

import { useState } from 'react'
import { REPORT_REASONS, REPORT_CONTENT_TYPES } from '@/lib/reportReasons'

type FormState = 'idle' | 'sending' | 'sent' | 'error'

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '28px',
  marginBottom: '28px',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  margin: '16px 0 6px',
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontSize: '14.5px',
}

const button: React.CSSProperties = {
  marginTop: '18px',
  padding: '12px 26px',
  minHeight: '44px',
  borderRadius: '999px',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: '14.5px',
  fontWeight: 600,
  cursor: 'pointer',
}

export default function SafetyPage() {
  // Report form
  const [rType, setRType] = useState('LISTING')
  const [rUrl, setRUrl] = useState('')
  const [rReason, setRReason] = useState('')
  const [rDetails, setRDetails] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rState, setRState] = useState<FormState>('idle')
  const [rError, setRError] = useState('')

  // Appeal form
  const [aDecision, setADecision] = useState('')
  const [aGrounds, setAGrounds] = useState('')
  const [aEmail, setAEmail] = useState('')
  const [aName, setAName] = useState('')
  const [aState, setAState] = useState<FormState>('idle')
  const [aError, setAError] = useState('')

  async function submitReport(e: React.FormEvent) {
    e.preventDefault()
    setRState('sending')
    setRError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: rType,
          contentUrl: rUrl,
          reason: rReason,
          details: rDetails,
          email: rEmail || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRError(data.error || 'Something went wrong. Please try again.')
        setRState('error')
        return
      }
      setRState('sent')
    } catch {
      setRError('Something went wrong. Please try again.')
      setRState('error')
    }
  }

  async function submitAppeal(e: React.FormEvent) {
    e.preventDefault()
    setAState('sending')
    setAError('')
    try {
      const res = await fetch('/api/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: aDecision,
          grounds: aGrounds,
          email: aEmail || undefined,
          name: aName || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAError(data.error || 'Something went wrong. Please try again.')
        setAState('error')
        return
      }
      setAState('sent')
    } catch {
      setAError('Something went wrong. Please try again.')
      setAState('error')
    }
  }

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 20px 80px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 10px' }}>
        Safety on Velor
      </p>
      <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', margin: '0 0 14px', lineHeight: 1.1 }}>
        Report a problem. We act on every report.
      </h1>
      <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.65, maxWidth: '640px', margin: '0 0 36px' }}>
        Anyone can report content on Velor — you do not need an account. Every report is
        reviewed by a person, and content that breaks our rules is removed, normally
        within 24–48 hours of your report. Reports are confidential: the person you
        report is never told who reported them.
      </p>

      <div style={card}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px' }}>What we act on</h2>
        <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
          Counterfeit or prohibited items, attempts to move a sale off Velor or share
          personal contact details, spam and misleading claims, abusive or inappropriate
          content, and anything that raises a safety concern — above all, anything
          involving a child, which is escalated immediately. The full rules sellers agree
          to are published in our{' '}
          <a href="/legal/seller-rules" style={{ color: 'var(--accent)' }}>seller rules</a> and{' '}
          <a href="/legal/terms" style={{ color: 'var(--accent)' }}>terms</a>. You can also
          report from the page itself: every listing, review, message and live stream on
          Velor carries its own report link.
        </p>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '20px', margin: '0 0 4px' }}>Report content</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '0 0 4px' }}>
          Works with or without a Velor account.
        </p>
        {rState === 'sent' ? (
          <p style={{ fontSize: '15px', color: 'var(--green)', marginTop: '16px' }}>
            Thank you — your report is in. We review reports within 24–48 hours and will
            email you if we need anything more.
          </p>
        ) : (
          <form onSubmit={submitReport}>
            <label style={label} htmlFor="r-type">What are you reporting?</label>
            <select id="r-type" style={input} value={rType} onChange={(e) => setRType(e.target.value)}>
              {Object.entries(REPORT_CONTENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <label style={label} htmlFor="r-url">Link to the page (paste the address)</label>
            <input id="r-url" style={input} type="url" required placeholder="https://velorcommerce.store/..." value={rUrl} onChange={(e) => setRUrl(e.target.value)} />

            <label style={label} htmlFor="r-reason">Reason</label>
            <select id="r-reason" style={input} required value={rReason} onChange={(e) => setRReason(e.target.value)}>
              <option value="" disabled>Pick a reason…</option>
              {Object.entries(REPORT_REASONS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <label style={label} htmlFor="r-details">Details {rReason === 'other' ? '(required)' : '(optional)'}</label>
            <textarea id="r-details" style={{ ...input, minHeight: '90px', resize: 'vertical' }} required={rReason === 'other'} value={rDetails} onChange={(e) => setRDetails(e.target.value)} />

            <label style={label} htmlFor="r-email">Your email (so we can follow up)</label>
            <input id="r-email" style={input} type="email" required placeholder="you@example.com" value={rEmail} onChange={(e) => setREmail(e.target.value)} />

            {rError && <p style={{ color: 'var(--red)', fontSize: '14px', marginTop: '12px' }}>{rError}</p>}
            <button type="submit" style={{ ...button, opacity: rState === 'sending' ? 0.6 : 1 }} disabled={rState === 'sending'}>
              {rState === 'sending' ? 'Sending…' : 'Send report'}
            </button>
          </form>
        )}
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '20px', margin: '0 0 4px' }}>Appeal a decision</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 4px' }}>
          If your content was removed, your listing rejected, your stream ended, or your
          account restricted and you believe we got it wrong, tell us here. Appeals are
          decided by Velor&apos;s named safety owner — not by the automated system that made
          the original decision — and you&apos;ll get the outcome by email.
        </p>
        {aState === 'sent' ? (
          <p style={{ fontSize: '15px', color: 'var(--green)', marginTop: '16px' }}>
            Thank you — your appeal is in. You&apos;ll hear back by email once it has been
            reviewed.
          </p>
        ) : (
          <form onSubmit={submitAppeal}>
            <label style={label} htmlFor="a-name">Your name (optional)</label>
            <input id="a-name" style={input} type="text" value={aName} onChange={(e) => setAName(e.target.value)} />

            <label style={label} htmlFor="a-decision">Which decision are you appealing?</label>
            <input id="a-decision" style={input} type="text" required placeholder="e.g. My listing 'Handwoven scarf' was rejected on 28 July" value={aDecision} onChange={(e) => setADecision(e.target.value)} />

            <label style={label} htmlFor="a-grounds">Why should it be reconsidered?</label>
            <textarea id="a-grounds" style={{ ...input, minHeight: '110px', resize: 'vertical' }} required value={aGrounds} onChange={(e) => setAGrounds(e.target.value)} />

            <label style={label} htmlFor="a-email">Your email (for the outcome)</label>
            <input id="a-email" style={input} type="email" required placeholder="you@example.com" value={aEmail} onChange={(e) => setAEmail(e.target.value)} />

            {aError && <p style={{ color: 'var(--red)', fontSize: '14px', marginTop: '12px' }}>{aError}</p>}
            <button type="submit" style={{ ...button, opacity: aState === 'sending' ? 0.6 : 1 }} disabled={aState === 'sending'}>
              {aState === 'sending' ? 'Sending…' : 'Send appeal'}
            </button>
          </form>
        )}
      </div>

      <div style={{ ...card, marginBottom: 0 }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px' }}>Urgent or offline</h2>
        <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
          For anything urgent, email{' '}
          <a href="mailto:customerservice@velorglobalmarket.com" style={{ color: 'var(--accent)' }}>
            customerservice@velorglobalmarket.com
          </a>
          . If a child is at immediate risk anywhere, contact your local police first.
          Safety on Velor is owned by a named director of Velor Commerce Ltd (Company
          No. 17268133) and reporting routes are reviewed regularly as part of our UK
          Online Safety Act compliance.
        </p>
      </div>
    </main>
  )
}
