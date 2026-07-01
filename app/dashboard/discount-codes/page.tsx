'use client'

import { useState, useEffect } from 'react'

interface DiscountCode {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minimumOrder: number | null
  maxDiscount: number | null
  usedCount: number
  usageLimit: number | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif', padding: '32px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  title: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, margin: 0 },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  btnSm: { border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: 'var(--muted)', borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 16px', fontSize: '14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' as const },
  code: { fontFamily: 'monospace', background: 'rgba(255,107,0,0.12)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '13px' },
  badge: { padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', width: '480px', maxWidth: '90vw' },
  modalTitle: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, margin: '0 0 24px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  input: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' as const },
  select: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' as const },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  modalFooter: { display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' },
  btnOutline: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center' as const, padding: '60px', color: 'var(--muted)' },
}

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: '', minimumOrder: '', usageLimit: '', expiresAt: '' })
  const [error, setError] = useState('')

  useEffect(() => { fetchCodes() }, [])

  async function fetchCodes() {
    try {
      const r = await fetch('/api/dashboard/discount-codes')
      if (r.ok) setCodes(await r.json())
    } catch {}
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.code || !form.value) { setError('Code and value are required'); return }
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/dashboard/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase().trim(),
          type: form.type,
          value: parseFloat(form.value),
          minimumOrder: form.minimumOrder ? parseFloat(form.minimumOrder) : undefined,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
          expiresAt: form.expiresAt || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'Failed to create code'); setSaving(false); return }
      setCodes(prev => [data, ...prev])
      setShowModal(false)
      setForm({ code: '', type: 'PERCENTAGE', value: '', minimumOrder: '', usageLimit: '', expiresAt: '' })
    } catch { setError('Network error') }
    setSaving(false)
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch('/api/dashboard/discount-codes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !isActive }) })
    setCodes(prev => prev.map(c => c.id === id ? { ...c, isActive: !isActive } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this discount code?')) return
    await fetch(`/api/dashboard/discount-codes?id=${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Discount Codes</h1>
        <button style={S.btn} onClick={() => setShowModal(true)}>+ Create Code</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : codes.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No discount codes yet</p>
          <p style={{ fontSize: '14px' }}>Create codes to offer discounts to your buyers</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Code</th>
                <th style={S.th}>Discount</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Uses</th>
                <th style={S.th}>Min Order</th>
                <th style={S.th}>Expires</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id}>
                  <td style={S.td}><span style={S.code}>{c.code}</span></td>
                  <td style={S.td}>
                    {c.type === 'PERCENTAGE' ? `${c.value}% off` : `Â£${c.value.toFixed(2)} off`}
                    {c.maxDiscount ? <span style={{ color: 'var(--muted)', fontSize: '12px' }}> (max Â£{c.maxDiscount})</span> : null}
                  </td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, background: c.isActive ? 'rgba(0,230,118,0.15)' : 'rgba(153,153,153,0.15)', color: c.isActive ? 'var(--green)' : 'var(--muted)' }}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={S.td}>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td style={S.td}>{c.minimumOrder ? `Â£${c.minimumOrder.toFixed(2)}` : <span style={{ color: 'var(--muted)' }}>None</span>}</td>
                  <td style={S.td}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-GB') : <span style={{ color: 'var(--muted)' }}>Never</span>}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ ...S.btnSm, background: c.isActive ? 'rgba(153,153,153,0.15)' : 'rgba(0,230,118,0.15)', color: c.isActive ? 'var(--muted)' : 'var(--green)' }} onClick={() => toggleActive(c.id, c.isActive)}>
                        {c.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button style={{ ...S.btnSm, background: 'rgba(255,23,68,0.15)', color: 'var(--red)' }} onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Create Discount Code</h2>
            {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
            <div style={S.field}>
              <label style={S.label}>Code</label>
              <input style={S.input} placeholder="e.g. SUMMER20" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
            </div>
            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Type</label>
                <select style={S.select} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (Â£)</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Value</label>
                <input style={S.input} type="number" placeholder={form.type === 'PERCENTAGE' ? '10' : '5.00'} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Min Order (Â£)</label>
                <input style={S.input} type="number" placeholder="Optional" value={form.minimumOrder} onChange={e => setForm(p => ({ ...p, minimumOrder: e.target.value }))} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Usage Limit</label>
                <input style={S.input} type="number" placeholder="Unlimited" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))} />
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Expires At</label>
              <input style={S.input} type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
            </div>
            <div style={S.modalFooter}>
              <button style={S.btnOutline} onClick={() => { setShowModal(false); setError('') }}>Cancel</button>
              <button style={S.btn} onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Code'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
