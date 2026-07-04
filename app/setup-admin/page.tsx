'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SetupAdminPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/setup-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.')
    } else {
      setSuccess(true)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#0D0D0D',
    border: '1px solid #2A2A2A',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#FFFFFF',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    color: '#999999',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    marginBottom: '8px',
  }

  if (success) {
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
        <div
          style={{
            background: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '16px',
            padding: '48px',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'rgba(0,230,118,0.1)',
              border: '2px solid #00E676',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
            }}
          >
            &#10003;
          </div>
          <h2
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '24px',
              color: '#FFFFFF',
              margin: '0 0 12px',
            }}
          >
            Admin account created
          </h2>
          <p style={{ color: '#999999', fontSize: '15px', lineHeight: '1.6', margin: '0 0 32px' }}>
            <strong style={{ color: '#FFFFFF' }}>{form.email}</strong> now has admin access.
            This setup page is now disabled for any future use.
          </p>
          <Link
            href="/auth/sign-in"
            style={{
              display: 'inline-block',
              background: '#FF6B00',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '12px 32px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '15px',
            }}
          >
            Go to sign in
          </Link>
        </div>
      </div>
    )
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
          maxWidth: '440px',
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
          Create the first admin
        </h1>
        <p style={{ color: '#999999', fontSize: '14px', margin: '0 0 32px' }}>
          One-time setup. This form disables itself permanently once an admin account exists.
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
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              placeholder="Your full name"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#FF6B00')}
              onBlur={(e) => (e.target.style.borderColor = '#2A2A2A')}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#FF6B00')}
              onBlur={(e) => (e.target.style.borderColor = '#2A2A2A')}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              placeholder="At least 8 characters"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#FF6B00')}
              onBlur={(e) => (e.target.style.borderColor = '#2A2A2A')}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              required
              placeholder="Repeat your password"
              style={inputStyle}
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
            {loading ? 'Creating...' : 'Create admin account'}
          </button>
        </form>
      </div>
    </div>
  )
}
