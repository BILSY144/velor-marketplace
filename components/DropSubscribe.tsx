'use client'

import { useState } from 'react'

export default function DropSubscribe() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    try {
      const r = await fetch('/api/drops/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const j = await r.json()
      if (!r.ok) { setMsg(j.error || 'Something went wrong'); setState('error'); return }
      setState('done')
    } catch {
      setMsg('Something went wrong -- please try again'); setState('error')
    }
  }
  if (state === 'done') {
    return <p style={{ margin: 0, fontSize: 14, color: 'var(--green, #22c55e)', fontWeight: 600 }}>You are on the list. One email a week, only when a drop opens.</p>
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com" aria-label="Email address"
        style={{ flex: '1 1 220px', padding: '12px 14px', fontSize: 14, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10 }}
      />
      <button type="submit" disabled={state === 'sending'}
        style={{ padding: '12px 22px', fontSize: 14, fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer', opacity: state === 'sending' ? 0.7 : 1 }}>
        {state === 'sending' ? 'Adding you...' : 'Email me the drop'}
      </button>
      {state === 'error' && <p style={{ margin: 0, fontSize: 13, color: 'var(--red, #ef4444)', width: '100%' }}>{msg}</p>}
    </form>
  )
}
