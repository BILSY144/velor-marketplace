'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France',
  'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'Austria', 'Belgium', 'Portugal', 'Ireland', 'New Zealand', 'Singapore',
  'Japan', 'South Korea', 'Hong Kong', 'India', 'Brazil', 'Mexico', 'Other',
]

interface Settings {
  name: string
  email: string
  storeName: string
  description: string
  country: string
}

export default function SettingsPage() {
  const { update } = useSession()
  const [form, setForm] = useState<Settings>({
    name: '',
    email: '',
    storeName: '',
    description: '',
    country: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/settings')
      .then((r) => r.json())
      .then((d) => {
        setForm(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const set = (field: keyof Settings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          storeName: form.storeName,
          description: form.description,
          country: form.country,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
      } else {
        await update({ name: form.name })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Failed to save â please try again')
    } finally {
      setSaving(false)
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '32px',
    marginBottom: '24px',
  }

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '8px',
  }

  const inputStyle = (disabled?: boolean): React.CSSProperties => ({
    width: '100%',
    background: disabled ? '#111' : '#111',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: disabled ? '#444' : 'var(--text)',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: disabled ? 'not-allowed' : 'text',
  })

  if (loading) {
    return (
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 32px 0',
          }}
        >
          Settings
        </h1>
        <div style={{ ...card, opacity: 0.4, height: '200px' }} />
        <div style={{ ...card, opacity: 0.4, height: '200px' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Settings
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '6px', fontSize: '14px' }}>
          Manage your profile and store details
        </p>
      </div>

      {/* Profile */}
      <div style={card}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 24px 0',
          }}
        >
          Profile
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={label}>Full name</label>
            <input
              style={inputStyle()}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label style={label}>Email address</label>
            <input
              style={inputStyle(true)}
              value={form.email}
              disabled
              placeholder="Email"
            />
            <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
              Email cannot be changed
            </div>
          </div>
        </div>
      </div>

      {/* Store Details */}
      <div style={card}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 24px 0',
          }}
        >
          Store Details
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={label}>Business name</label>
            <input
              style={inputStyle()}
              value={form.storeName}
              onChange={(e) => set('storeName', e.target.value)}
              placeholder="Your store name"
            />
          </div>
          <div>
            <label style={label}>Description</label>
            <textarea
              style={{
                ...inputStyle(),
                resize: 'vertical',
                minHeight: '100px',
                lineHeight: '1.5',
              }}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Tell buyers about your store..."
            />
          </div>
          <div>
            <label style={label}>Country</label>
            <select
              style={{
                ...inputStyle(),
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage:
                  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                paddingRight: '36px',
              }}
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(255,23,68,0.1)',
            border: '1px solid rgba(255,23,68,0.3)',
            borderRadius: '8px',
            color: 'var(--red)',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '14px 32px',
          background: saved ? 'var(--green)' : 'var(--accent)',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          transition: 'background 0.3s',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}
