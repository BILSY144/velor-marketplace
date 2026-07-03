'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function UnsubscribePage() {
  const params = useSearchParams()
  const u = params.get('u') || ''
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  async function confirm() {
    setState('saving')
    try {
      const res = await fetch('/api/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ u }) })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 460, width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--accent)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 16 }}>VELOR</div>
        {state === 'done' ? (
          <div>
            <h1 style={{ color: 'var(--text)', fontSize: 22, margin: '0 0 12px' }}>You are unsubscribed</h1>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>We will not contact you again. Sorry to miss you.</p>
          </div>
        ) : state === 'error' ? (
          <div>
            <h1 style={{ color: 'var(--text)', fontSize: 22, margin: '0 0 12px' }}>Something went wrong</h1>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6, margin: '0 0 20px' }}>Please try again, or reply to our email and we will remove you.</p>
            <button onClick={confirm} style={{ background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Try again</button>
          </div>
        ) : (
          <div>
            <h1 style={{ color: 'var(--text)', fontSize: 22, margin: '0 0 12px' }}>Unsubscribe from Velor</h1>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>Click below and we will stop sending you seller invitations.</p>
            <button onClick={confirm} disabled={state === 'saving' || !u} style={{ background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: (state === 'saving' || !u) ? 'not-allowed' : 'pointer', opacity: (state === 'saving' || !u) ? 0.6 : 1 }}>{state === 'saving' ? 'Please wait...' : 'Confirm unsubscribe'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
