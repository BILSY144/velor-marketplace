'use client'

import { useState, useEffect } from 'react'

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' }, { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' }, { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' }, { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' }, { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' }, { code: 'AE', name: 'UAE' },
  { code: 'CN', name: 'China' }, { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' }, { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
]

interface ShippingProfile {
  name: string; company: string; street1: string; street2: string;
  city: string; state: string; zip: string; country: string;
  phone: string; email: string; handlingDays: number;
}

const empty: ShippingProfile = {
  name: '', company: '', street1: '', street2: '',
  city: '', state: '', zip: '', country: 'GB',
  phone: '', email: '', handlingDays: 1,
}

export default function ShippingSettingsPage() {
  const [form, setForm] = useState<ShippingProfile>(empty)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/settings/shipping')
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setForm({
            name: d.profile.name ?? '',
            company: d.profile.company ?? '',
            street1: d.profile.street1 ?? '',
            street2: d.profile.street2 ?? '',
            city: d.profile.city ?? '',
            state: d.profile.state ?? '',
            zip: d.profile.zip ?? '',
            country: d.profile.country ?? 'GB',
            phone: d.profile.phone ?? '',
            email: d.profile.email ?? '',
            handlingDays: d.profile.handlingDays ?? 1,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function set(k: keyof ShippingProfile, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
    setSaved(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/settings/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      setSaved(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text)',
    fontFamily: 'var(--font-body)', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'var(--muted)', textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', marginBottom: '6px',
  }
  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

  if (loading) {
    return (
      <div style={{ padding: '40px', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', padding: '32px 40px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
        Ship-From Address
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 32px', lineHeight: 1.6 }}>
        This address appears on shipping labels and customs declarations. It must be a real address
        where you can receive returned shipments. Required before purchasing labels.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={row2}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Jane Smith" />
          </div>
          <div>
            <label style={labelStyle}>Company (optional)</label>
            <input style={inputStyle} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Ltd" />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Street Address *</label>
          <input style={inputStyle} value={form.street1} onChange={e => set('street1', e.target.value)} required placeholder="123 High Street" />
        </div>
        <div>
          <label style={labelStyle}>Address Line 2</label>
          <input style={inputStyle} value={form.street2} onChange={e => set('street2', e.target.value)} placeholder="Unit 4" />
        </div>

        <div style={row2}>
          <div>
            <label style={labelStyle}>City *</label>
            <input style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} required placeholder="London" />
          </div>
          <div>
            <label style={labelStyle}>State / County</label>
            <input style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)} placeholder="England" />
          </div>
        </div>

        <div style={row2}>
          <div>
            <label style={labelStyle}>Postcode / ZIP *</label>
            <input style={inputStyle} value={form.zip} onChange={e => set('zip', e.target.value)} required placeholder="EC1A 1BB" />
          </div>
          <div>
            <label style={labelStyle}>Country *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.country} onChange={e => set('country', e.target.value)}>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={row2}>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 20 7000 0000" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="shop@example.com" />
          </div>
        </div>

        <div style={{ maxWidth: '200px' }}>
          <label style={labelStyle}>Handling Time (days)</label>
          <input style={inputStyle} type="number" min={0} max={30}
            value={form.handlingDays}
            onChange={e => set('handlingDays', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,23,68,0.1)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {saved && (
          <div style={{ padding: '12px 16px', background: 'rgba(0,230,118,0.1)', border: '1px solid var(--green)', borderRadius: '6px', color: 'var(--green)', fontSize: '14px' }}>
            Ship-from address saved successfully.
          </div>
        )}

        <button type="submit" disabled={saving} style={{
          padding: '12px 28px', background: saving ? 'var(--border)' : 'var(--accent)',
          color: '#fff', border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px',
          cursor: saving ? 'not-allowed' : 'pointer', alignSelf: 'flex-start',
        }}>
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </form>
    </div>
  )
}
