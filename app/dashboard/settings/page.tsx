'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SUPPORTED_CURRENCIES, CURRENCY_NAMES } from '@/lib/currency'
import { useSellerTier, tierCardStyle, DASHBOARD_TIER_THEME } from '@/lib/dashboard-theme'

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France',
  'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'Austria', 'Belgium', 'Portugal', 'Ireland', 'New Zealand', 'Singapore',
  'Japan', 'South Korea', 'Hong Kong', 'India', 'Brazil', 'Mexico', 'Other',
]

// Suggests a sensible default currency the moment a seller picks their
// country — they can still override it with the Currency dropdown below.
const COUNTRY_CURRENCY: Record<string, string> = {
  'United Kingdom': 'GBP', 'United States': 'USD', 'Canada': 'CAD', 'Australia': 'AUD',
  'Germany': 'EUR', 'France': 'EUR', 'Spain': 'EUR', 'Italy': 'EUR', 'Netherlands': 'EUR',
  'Sweden': 'SEK', 'Norway': 'NOK', 'Denmark': 'DKK', 'Switzerland': 'CHF',
  'Austria': 'EUR', 'Belgium': 'EUR', 'Portugal': 'EUR', 'Ireland': 'EUR',
  'New Zealand': 'NZD', 'Singapore': 'SGD', 'Japan': 'JPY', 'South Korea': 'KRW',
  'Hong Kong': 'HKD', 'India': 'INR', 'Brazil': 'BRL', 'Mexico': 'MXN', 'Other': 'GBP',
}

// Feature list shown in the new "Your Plan" card so sellers can see exactly
// what their subscription buys them, and what upgrading would add.
const PLAN_FEATURES: Record<string, string[]> = {
  STARTER: ['Up to 20 listings', 'Seller dashboard', 'Buyer protection built in', '10% commission'],
  PRO: ['200 listings', 'Free custom storefront', 'Priority search placement', 'Advanced analytics', '4% commission'],
  ENTERPRISE: ['Unlimited listings', 'Dedicated account manager', 'Full API access', 'Live Shopping', 'Priority support', '0% commission'],
}

interface Settings {
  name: string
  email: string
  storeName: string
  description: string
  country: string
  currency: string
}

export default function SettingsPage() {
  const { update } = useSession()
  const { tier, theme } = useSellerTier()
  const [form, setForm] = useState<Settings>({
    name: '',
    email: '',
    storeName: '',
    description: '',
    country: '',
    currency: 'GBP',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/settings')
      .then((r) => r.json())
      .then((d) => {
        setForm({ ...d, currency: d.currency || 'GBP' })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const set = (field: keyof Settings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
    setError('')
  }

  // Changing the country re-suggests a currency, but the seller can still
  // pick a different one from the Currency dropdown right after this field.
  const setCountry = (value: string) => {
    setForm((prev) => ({
      ...prev,
      country: value,
      currency: COUNTRY_CURRENCY[value] ?? prev.currency,
    }))
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
          currency: form.currency,
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
      setError('Failed to save — please try again')
    } finally {
      setSaving(false)
    }
  }

  const card: React.CSSProperties = tierCardStyle(theme, { padding: '32px', marginBottom: '24px' })

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

  const selectStyle: React.CSSProperties = {
    ...inputStyle(),
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage:
      `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: '36px',
  }

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

  const isEnterprise = tier === 'ENTERPRISE'
  const isPro = tier === 'PRO'
  const nextTier = tier === 'STARTER' ? 'PRO' : tier === 'PRO' ? 'ENTERPRISE' : null

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

      {/* Your Plan — shown first so sellers see exactly what their subscription buys them */}
      <div style={tierCardStyle(theme, { padding: '28px 32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' })}>
        {isEnterprise && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #FFD54A, #FF6B00)' }} />
        )}
        {isPro && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#4FC3F7' }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Your Plan
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 800,
                color: isEnterprise ? '#FFD54A' : isPro ? '#4FC3F7' : 'var(--text)',
                marginBottom: 12,
              }}
            >
              {isEnterprise ? '★ Enterprise' : isPro ? 'Pro' : 'Starter'}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PLAN_FEATURES[tier].map((f) => (
                <li key={f} style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--green)' }}>✔</span> {f}
                </li>
              ))}
            </ul>
          </div>
          {nextTier && (
            <Link
              href={`/dashboard/upgrade/${nextTier.toLowerCase()}`}
              style={{
                flexShrink: 0,
                background: nextTier === 'ENTERPRISE' ? 'linear-gradient(90deg, #FFD54A, #FF6B00)' : '#4FC3F7',
                color: nextTier === 'ENTERPRISE' ? '#111' : '#001018',
                fontWeight: 800,
                fontSize: 13,
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              Upgrade to {DASHBOARD_TIER_THEME[nextTier].label}
            </Link>
          )}
          {isEnterprise && (
            <span style={{ flexShrink: 0, color: '#FFD54A', fontWeight: 700, fontSize: 13 }}>
              You&apos;re on our top plan
            </span>
          )}
        </div>
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
              style={selectStyle}
              value={form.country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Currency</label>
            <select
              style={selectStyle}
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c} — {CURRENCY_NAMES[c]}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
              Auto-suggested from your country. All your product prices are set in this
              currency — buyers abroad automatically see them converted to their own.
            </div>
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
