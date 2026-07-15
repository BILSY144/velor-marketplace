'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Set a new password from an emailed reset link (?token=...). Same visual
// language as /auth/sign-in. The token is verified server-side — expired
// or reused links get an honest error and a route back to a fresh one.
function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'busy') return
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setState('busy')
    setError(null)
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setState('done')
      setTimeout(() => router.push('/auth/sign-in'), 2500)
    } else {
      setState('idle')
      setError(data?.error ?? 'Something went wrong — try again.')
    }
  }

  const input: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text)',
    fontSize: 15,
    marginTop: 8,
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '80px 20px 120px' }}>
      <div style={{ fontFamily: 'var(--fd)', fontSize: 10, letterSpacing: '0.24em', color: 'var(--accent)' }}>
        VELOR · ACCOUNT
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '10px 0 8px' }}>
        Set a new password.
      </h1>

      {!token ? (
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          This page needs the link from your reset email. Request one from the sign-in page and
          click the button in the email.
        </p>
      ) : state === 'done' ? (
        <p style={{ color: 'var(--green)', lineHeight: 1.6 }}>
          Done — your password is changed and your email is verified. Taking you to sign in…
        </p>
      ) : (
        <form onSubmit={submit}>
          <label style={{ display: 'block', marginTop: 22, fontSize: 12, color: 'var(--muted)' }}>
            NEW PASSWORD
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={input}
              autoComplete="new-password"
            />
          </label>
          <label style={{ display: 'block', marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            CONFIRM PASSWORD
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              style={input}
              autoComplete="new-password"
            />
          </label>
          {error ? (
            <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 14 }}>{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={state === 'busy'}
            style={{
              width: '100%',
              marginTop: 22,
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
            {state === 'busy' ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  )
}
