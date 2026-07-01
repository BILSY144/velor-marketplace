'use client'

import { useState, useEffect } from 'react'

const HS_CATEGORY_MAP: Record<string, { label: string; example: string }> = {
  '01': { label: 'Live Animals', example: '010110 — horses' },
  '10': { label: 'Cereals', example: '100110 — wheat' },
  '39': { label: 'Plastics & Articles', example: '392690 — plastic articles' },
  '44': { label: 'Wood & Articles', example: '441900 — wooden household goods' },
  '49': { label: 'Books & Printed Media', example: '490110 — books' },
  '61': { label: 'Clothing (knitted)', example: '610910 — T-shirts' },
  '62': { label: 'Clothing (woven)', example: '620411 — suits' },
  '63': { label: 'Home Textiles', example: '630120 — bedding' },
  '64': { label: 'Footwear', example: '640299 — shoes' },
  '84': { label: 'Machinery & Equipment', example: '847130 — laptops' },
  '85': { label: 'Electronics', example: '851712 — smartphones' },
  '87': { label: 'Vehicles & Parts', example: '871190 — motorcycles' },
  '90': { label: 'Optical & Medical Instruments', example: '901831 — syringes' },
  '91': { label: 'Clocks & Watches', example: '910111 — wristwatches' },
  '94': { label: 'Furniture & Lighting', example: '940360 — wooden furniture' },
  '95': { label: 'Toys & Games', example: '950300 — toys' },
  '96': { label: 'Miscellaneous Articles', example: '960910 — pencils' },
}

function hsChapterInfo(hsCode: string) {
  if (!hsCode || hsCode.length < 2) return null
  const chapter = hsCode.slice(0, 2)
  return HS_CATEGORY_MAP[chapter] ?? null
}

const DUTY_GUIDANCE: Record<string, string> = {
  '61': 'UK 12% | EU 12% | US 18% | AU 17.5%',
  '62': 'UK 12% | EU 12% | US 18% | AU 17.5%',
  '63': 'UK 12% | EU 12% | US 9% | AU 10%',
  '64': 'UK 4% | EU 3.7% | US 10% | AU 17.5%',
  '84': 'UK 0% | EU 0% | US 0% | AU 0%',
  '85': 'UK 0% | EU 0% | US 0% | AU 0%',
  '87': 'UK 6.5% | EU 6.5% | US 2.5% | AU 5%',
  '90': 'UK 0% | EU 0% | US 0% | AU 0%',
  '91': 'UK 4.5% | EU 4.5% | US 0% | AU 5%',
  '94': 'UK 5.7% | EU 5.7% | US 0% | AU 5%',
  '95': 'UK 0% | EU 4.7% | US 0% | AU 0%',
}

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' }, { code: 'CN', name: 'China' },
  { code: 'US', name: 'United States' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' }, { code: 'IN', name: 'India' },
  { code: 'PL', name: 'Poland' }, { code: 'TW', name: 'Taiwan' },
  { code: 'KR', name: 'South Korea' }, { code: 'VN', name: 'Vietnam' },
  { code: 'TR', name: 'Turkey' }, { code: 'HK', name: 'Hong Kong' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'TH', name: 'Thailand' },
  { code: 'AU', name: 'Australia' }, { code: 'CA', name: 'Canada' },
]

interface Product {
  id: string; name: string; description: string; price: number; stock: number;
  category: string; images: string[]; status: string;
  weightGrams: number | null; lengthCm: number | null; widthCm: number | null; heightCm: number | null;
  hsCode: string | null; originCountry: string | null;
}

const emptyForm = {
  name: '', description: '', price: '', stock: '', category: '', imageUrls: '',
  weightGrams: '', lengthCm: '', widthCm: '', heightCm: '', hsCode: '', originCountry: 'CN',
}

const inputStyle = {
  width: '100%', padding: '10px 12px', background: 'var(--bg)',
  border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)',
  fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
}
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600 as const,
  color: 'var(--muted)', textTransform: 'uppercase' as const,
  letterSpacing: '0.05em', marginBottom: '6px',
}

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setLoading(true)
    const data = await fetch('/api/dashboard/products').then(r => r.json())
    setProducts(data.products ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditProduct(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({
      name: p.name, description: p.description, price: String(p.price),
      stock: String(p.stock), category: p.category, imageUrls: (p.images ?? []).join('\n'),
      weightGrams: p.weightGrams != null ? String(p.weightGrams) : '',
      lengthCm: p.lengthCm != null ? String(p.lengthCm) : '',
      widthCm: p.widthCm != null ? String(p.widthCm) : '',
      heightCm: p.heightCm != null ? String(p.heightCm) : '',
      hsCode: p.hsCode ?? '', originCountry: p.originCountry ?? 'CN',
    })
    setError('')
    setShowForm(true)
  }

  function set(k: keyof typeof emptyForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name, description: form.description,
        price: parseFloat(form.price), stock: parseInt(form.stock, 10) || 0,
        category: form.category,
        images: form.imageUrls.split('\n').map(u => u.trim()).filter(Boolean),
        weightGrams: form.weightGrams ? parseInt(form.weightGrams, 10) : null,
        lengthCm: form.lengthCm ? parseFloat(form.lengthCm) : null,
        widthCm: form.widthCm ? parseFloat(form.widthCm) : null,
        heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
        hsCode: form.hsCode || null,
        originCountry: form.originCountry || null,
      }
      const url = editProduct ? '/api/dashboard/products?id=' + editProduct.id : '/api/dashboard/products'
      const method = editProduct ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setShowForm(false)
      await loadProducts()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const hsInfo = hsChapterInfo(form.hsCode)
  const dutyGuide = form.hsCode?.length >= 2 ? DUTY_GUIDANCE[form.hsCode.slice(0, 2)] : null

  if (loading) return <div style={{ padding: '40px', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading...</div>

  return (
    <div style={{ padding: '32px 40px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Products</h1>
        <button onClick={openNew} style={{
          padding: '10px 20px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        }}>
          Add Product
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '680px', position: 'relative' }}>
            <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '24px', cursor: 'pointer' }}>x</button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '24px' }}>
              {editProduct ? 'Edit Product' : 'New Product'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Price (GBP) *</label>
                  <input style={inputStyle} type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Stock</label>
                  <input style={inputStyle} type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <input style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Image URLs (one per line)</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }} value={form.imageUrls} onChange={e => set('imageUrls', e.target.value)} />
              </div>

              {/* Shipping section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Shipping & Customs</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
                  Required for accurate DDP duty calculation and label generation.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>Weight (g)</label>
                    <input style={inputStyle} type="number" value={form.weightGrams} onChange={e => set('weightGrams', e.target.value)} placeholder="500" />
                  </div>
                  <div>
                    <label style={labelStyle}>Length (cm)</label>
                    <input style={inputStyle} type="number" step="0.1" value={form.lengthCm} onChange={e => set('lengthCm', e.target.value)} placeholder="20" />
                  </div>
                  <div>
                    <label style={labelStyle}>Width (cm)</label>
                    <input style={inputStyle} type="number" step="0.1" value={form.widthCm} onChange={e => set('widthCm', e.target.value)} placeholder="15" />
                  </div>
                  <div>
                    <label style={labelStyle}>Height (cm)</label>
                    <input style={inputStyle} type="number" step="0.1" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} placeholder="10" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>HS Code (6-digit)</label>
                    <input style={inputStyle} value={form.hsCode} onChange={e => set('hsCode', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="851712" maxLength={6} />
                  </div>
                  <div>
                    <label style={labelStyle}>Origin Country</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.originCountry} onChange={e => set('originCountry', e.target.value)}>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* HS code guidance panel */}
                {hsInfo && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                      Chapter {form.hsCode.slice(0, 2)} — {hsInfo.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                      Example: {hsInfo.example}
                    </div>
                    {dutyGuide && (
                      <div style={{ fontSize: '12px', color: 'var(--accent)' }}>
                        Typical duty rates: {dutyGuide}
                      </div>
                    )}
                    {!dutyGuide && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Duty rates vary — verify at trade-tariff.service.gov.uk
                      </div>
                    )}
                  </div>
                )}
                {!hsInfo && form.hsCode.length === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Enter your HS code to see duty rate guidance. Look up at{' '}
                    <a href="https://trade-tariff.service.gov.uk/find_commodity" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                      UK Trade Tariff
                    </a>
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '10px 20px', background: 'var(--bg)', color: 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{
                  padding: '10px 20px', background: saving ? 'var(--border)' : 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {products.map(p => (
          <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {p.images?.[0] && (
              <img src={p.images[0]} alt={p.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                £{p.price.toFixed(2)} &middot; Stock: {p.stock} &middot;
                {p.hsCode ? ' HS: ' + p.hsCode : ' No HS code'} &middot;
                {p.weightGrams ? ' ' + p.weightGrams + 'g' : ' No weight'}
              </div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
              background: p.status === 'APPROVED' ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,0,0.15)',
              color: p.status === 'APPROVED' ? 'var(--green)' : 'var(--accent)',
            }}>{p.status.replace('_', ' ')}</span>
            <button onClick={() => openEdit(p)} style={{
              padding: '7px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px',
              color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>Edit</button>
          </div>
        ))}
        {products.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 20px', fontSize: '14px' }}>
            No products yet. Add your first product to get started.
          </div>
        )}
      </div>
    </div>
  )
}
