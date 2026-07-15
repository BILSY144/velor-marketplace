'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignInForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password.')
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D0D0D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        padding: '24px',
      }}
    >
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '20px',
          color: '#FF6B00',
          textDecoration: 'none',
          letterSpacing: '-0.5px',
        }}
      >
        VELOR
      </Link>

      <div
        style={{
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          padding: '48px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '28px',
            color: '#FFFFFF',
            margin: '0 0 8px',
          }}
        >
          Sign in
        </h1>
        <p style={{ color: '#999999', fontSize: '14px', margin: '0 0 32px' }}>
          Access your seller dashboard
        </p>

        {error && (
          <div
            style={{
              background: 'rgba(255,23,68,0.1)',
              border: '1px solid #FF1744',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#FF1744',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                color: '#999999',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '8px',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                background: '#0D0D0D',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#FFFFFF',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#FF6B00')}
              onBlur={(e) => (e.target.style.borderColor = '#2A2A2A')}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: '#999999',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={{
                width: '100%',
                background: '#0D0D0D',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#FFFFFF',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#FF6B00')}
              onBlur={(e) => (e.target.style.borderColor = '#2A2A2A')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#CC5500' : '#FF6B00',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <a
            href="/auth/forgot"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '14px',
              color: '#8a8a95',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            Forgot your password? <span style={{ color: '#FF6B00' }}>Reset by email</span>
          </a>
        </form>

        <p
          style={{
            color: '#999999',
            fontSize: '14px',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          No account yet?{' '}
          <Link
            href="/auth/sign-up"
            style={{ color: '#FF6B00', textDecoration: 'none', fontWeight: 600 }}
          >
            Apply to sell
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D0D0D' }} />}>
      <SignInForm />
    </Suspense>
  )
}
