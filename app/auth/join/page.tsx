'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// The BUYER door (found missing by William 2026-07-29: /auth/sign-up is
// the seller application, so visitors had no way to create a buyer
// account). Mirrors the sign-in page styling.

export default function JoinPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/auth/register-buyer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
      const j = await r.json()
      if (!r.ok) { setError(j.error || 'Something went wrong'); setLoading(false); return }
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.error) { setError('Account created -- please sign in'); router.push('/auth/sign-in'); return }
      // Buyers land on the homepage after joining (William, 2026-07-29).
      router.push('/')
      router.refresh()
    } catch {
      setError('Something went wrong -- please try again'); setLoading(false)
    }
  }

  const input = { width: '100%', padding: '12px 14px', fontSize: '14px', background: '#0D0D0F', color: '#FFFFFF', border: '1px solid #2A2A2A', borderRadius: '8px', marginBottom: '16px' } as const
  const label = { display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#999999', marginBottom: '6px' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0D0D0F' }}>
      <Link href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '24px', color: '#FF6B00', textDecoration: 'none', letterSpacing: '-0.5px', marginBottom: '24px' }}>VELOR</Link>
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '48px', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '28px', color: '#FFFFFF', margin: '0 0 8px' }}>Create your account</h1>
        <p style={{ color: '#999999', fontSize: '14px', margin: '0 0 32px' }}>Follow makers, save pieces to collections, and track your orders -- free in half a minute.</p>
        <form onSubmit={submit}>
          <label style={label}>Name</label>
          <input style={input} value={name} onChange={e => setName(e.target.value)} required maxLength={80} autoComplete="name" />
          <label style={label}>Email</label>
          <input style={input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <label style={label}>Password</label>
          <input style={input} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, background: '#FF6B00', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating your account...' : 'Create account'}
          </button>
        </form>
        <p style={{ color: '#999999', fontSize: '13px', margin: '24px 0 0', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/auth/sign-in" style={{ color: '#FF6B00', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
        <p style={{ color: '#666666', fontSize: '12px', margin: '10px 0 0', textAlign: 'center' }}>
          Are you a maker?{' '}
          <Link href="/auth/sign-up" style={{ color: '#999999', textDecoration: 'underline' }}>Apply to sell</Link>
        </p>
      </div>
    </div>
  )
}
