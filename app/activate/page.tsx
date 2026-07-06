'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  background: '#111',
  border: '1px solid #2A2A2A',
  borderRadius: 6,
  color: '#FFF',
  fontSize: 14,
}

function ActivateForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('This activation link is missing its token. Please use the link from your email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/account/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
      setTimeout(() => router.push('/auth/sign-in'), 2000)
    } catch {
      setStatus('error')
      setError('Something went wrong. Please try again.')
    }
  }

  if (!token) {
    return (
      <div>
        <h1 style={{ fontSize: 22, color: '#FFF', margin: '0 0 12px' }}>Invalid activation link</h1>
        <p style={{ color: '#BBB', margin: 0 }}>This link is missing its activation token. Please use the link from your approval email.</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div>
        <h1 style={{ fontSize: 22, margin: '0 0 12px', color: '#4ADE80' }}>Account activated</h1>
        <p style={{ color: '#BBB', margin: 0 }}>Redirecting you to sign in...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 22, color: '#FFF', margin: 0 }}>Activate your seller account</h1>
      <p style={{ color: '#BBB', fontSize: 14, margin: 0 }}>Set a password to finish setting up your Velor seller account.</p>

      <label style={{ color: '#AAA', fontSize: 13 }}>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          style={inputStyle}
        />
      </label>

      <label style={{ color: '#AAA', fontSize: 13 }}>
        Confirm password
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
          style={inputStyle}
        />
      </label>

      {error && <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          background: '#FF6B00',
          color: '#FFF',
          fontWeight: 600,
          fontSize: 14,
          padding: '12px 24px',
          borderRadius: 6,
          border: 'none',
          cursor: status === 'submitting' ? 'default' : 'pointer',
          opacity: status === 'submitting' ? 0.7 : 1,
        }}
      >
        {status === 'submitting' ? 'Activating...' : 'Activate account'}
      </button>
    </form>
  )
}

export default function ActivatePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D0D0D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: 10,
          padding: 32,
        }}
      >
        <Suspense fallback={<p style={{ color: '#BBB' }}>Loading...</p>}>
          <ActivateForm />
        </Suspense>
      </div>
    </div>
  )
}
