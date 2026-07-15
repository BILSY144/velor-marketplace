'use client'

import { useState } from 'react'

// Request a password reset link by email. Always shows the same success
// state whether or not the account exists — no user enumeration.
export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'busy' || !email.trim()) return
    setState('busy')
    await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }).catch(() => {})
    setState('sent')
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '80px 20px 120px' }}>
      <div style={{ fontFamily: 'var(--fd)', fontSize: 10, letterSpacing: '0.24em', color: 'var(--accent)' }}>
        VELOR · ACCOUNT
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '10px 0 8px' }}>
        Reset your password.
      </h1>

      {state === 'sent' ? (
        <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          If an account exists for <strong style={{ color: 'var(--text)' }}>{email}</strong>, a
          reset link is on its way — it works for one hour and can be used once. Check your inbox
          (and spam), set the new password, then sign in.
        </p>
      ) : (
        <>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
            Enter the email on your account and we send a one-hour reset link. Nothing changes
            until you click it — the link itself is the verification.
          </p>
          <form onSubmit={submit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text)',
                fontSize: 15,
                marginTop: 18,
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={state === 'busy'}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '15px 0',
                borderRadius: 999,
                border: 'none',
                background: 'var(--accent)',
                color: '#160a00',
                fontFamily: 'var(--fd)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {state === 'busy' ? 'Sending…' : 'Email me the link'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
