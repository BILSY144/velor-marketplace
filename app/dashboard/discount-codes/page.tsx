'use client'

import { useState, useEffect } from 'react'
import { useSellerTier, PlanBadge, tierCardStyle } from '@/lib/dashboard-theme'
import { HALO, HaloButton } from '@/lib/halo'

interface DiscountCode {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minOrder: number | null
  maxDiscount: number | null
  usedCount: number
  usageLimit: number | null
  expiresAt: string | null
  isActive: boolean
  productIds: string[]
  createdAt: string
}

interface SellerProduct {
  id: string
  title: string
  price: number
  status: string
}

const S: Record<string, React.CSSProperties> = {
  // background left transparent (was a solid 'var(--bg)' that painted over
  // the dashboard's Halo aurora backdrop, hiding it completely on this
  // page -- see lib/halo.tsx HaloBackdrop / app/dashboard/layout.tsx).
  page: { minHeight: '100vh', color: 'var(--text)', fontFamily: 'Inter, sans-serif', padding: '32px', position: 'relative', zIndex: 1 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: 16 },
  title: { fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: '30px', margin: 0, color: HALO.ink },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  btnSm: { border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: 'var(--muted)', borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 16px', fontSize: '14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' as const },
  code: { fontFamily: 'monospace', background: 'rgba(255,107,0,0.12)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '13px' },
  badge: { padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(26,26,29,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 24px 60px rgba(90,60,20,0.22)', borderRadius: '20px', padding: '32px', width: '520px', maxWidth: '90vw', maxHeight: '88vh', overflowY: 'auto' as const },
  modalTitle: { fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: '22px', margin: '0 0 24px', color: HALO.ink },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  input: { width: '100%', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(26,26,29,0.12)', borderRadius: '10px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' as const },
  select: { width: '100%', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(26,26,29,0.12)', borderRadius: '10px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' as const },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  modalFooter: { display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' },
  btnOutline: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center' as const, padding: '60px', color: 'var(--muted)' },
}

// Pro+ one-click discount presets — generates a ready-to-use, store-wide code
// instantly instead of making the seller fill out the full create form.
// Per-product targeting lives in the full "+ Create Code" form below.
const QUICK_PRESETS = [5, 10, 15, 20]

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6).toUpperCase()
}

export default function DiscountCodesPage() {
  const { tier, theme } = useSellerTier()
  const isPro = tier === 'PRO'
  const isElevated = tier !== 'STARTER'
  const accentColor = isPro ? '#FFD54A' : isElevated ? '#4FC3F7' : 'var(--accent)'

  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quickBusy, setQuickBusy] = useState<number | null>(null)
  const [customValue, setCustomValue] = useState('')
  const [customBusy, setCustomBusy] = useState(false)
  const [customError, setCustomError] = useState('')
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: '', minOrder: '', usageLimit: '', expiresAt: '' })
  const [error, setError] = useState('')

  // Per-product targeting — "all" discounts the seller's whole catalogue
  // (the old, only behaviour); "specific" restricts the code to just the
  // products checked below.
  const [scope, setScope] = useState<'all' | 'specific'>('all')
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [productFilter, setProductFilter] = useState('')

  useEffect(() => { fetchCodes() }, [])

  async function fetchCodes() {
    try {
      const r = await fetch('/api/dashboard/discount-codes')
      if (r.ok) {
        const data = await r.json()
        setCodes(Array.isArray(data) ? data : (data.codes ?? []))
      }
    } catch {}
    setLoading(false)
  }

  async function fetchProducts() {
    if (products.length > 0 || productsLoading) return
    setProductsLoading(true)
    try {
      const r = await fetch('/api/dashboard/products')
      if (r.ok) {
        const data = await r.json()
        const list = Array.isArray(data) ? data : (data.products ?? [])
        setProducts(list)
      }
    } catch {}
    setProductsLoading(false)
  }

  function openCreateModal() {
    setScope('all')
    setSelectedProductIds([])
    setProductFilter('')
    setShowModal(true)
    fetchProducts()
  }

  function toggleProductSelected(id: string) {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  async function handleCreate() {
    if (!form.code || !form.value) { setError('Name and value are required'); return }
    if (scope === 'specific' && selectedProductIds.length === 0) {
      setError('Select at least one product, or switch to "All products"')
      return
    }
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/dashboard/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase().trim(),
          type: form.type,
          value: parseFloat(form.value),
          minimumOrder: form.minOrder ? parseFloat(form.minOrder) : undefined,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
          expiresAt: form.expiresAt || undefined,
          productIds: scope === 'specific' ? selectedProductIds : [],
        }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'Failed to create discount'); setSaving(false); return }
      setCodes(prev => [data.discount, ...prev])
      setShowModal(false)
      setForm({ code: '', type: 'PERCENTAGE', value: '', minOrder: '', usageLimit: '', expiresAt: '' })
      setScope('all')
      setSelectedProductIds([])
    } catch { setError('Network error') }
    setSaving(false)
  }

  // One-click preset: instantly creates an active, store-wide PERCENTAGE
  // discount, e.g. internal reference "SAVE10-XXXX" — Pro and Enterprise only.
  async function quickCreate(percent: number) {
    setQuickBusy(percent)
    try {
      const r = await fetch('/api/dashboard/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `SAVE${percent}-${randomSuffix()}`,
          type: 'PERCENTAGE',
          value: percent,
        }),
      })
      const data = await r.json()
      if (r.ok) setCodes(prev => [data.discount, ...prev])
    } catch {}
    setQuickBusy(null)
  }

  // Manual quick-create — lets the seller type any percentage they want
  // instead of being limited to the fixed presets above. Also store-wide;
  // use the full form below to restrict a discount to specific products.
  async function customCreate() {
    const val = parseFloat(customValue)
    if (!val || val <= 0 || val > 100) { setCustomError('Enter a percentage between 1 and 100'); return }
    setCustomBusy(true); setCustomError('')
    try {
      const r = await fetch('/api/dashboard/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `SAVE${val}-${randomSuffix()}`,
          type: 'PERCENTAGE',
          value: val,
        }),
      })
      const data = await r.json()
      if (r.ok) { setCodes(prev => [data.discount, ...prev]); setCustomValue('') }
      else setCustomError(data.error || 'Failed to create discount')
    } catch { setCustomError('Network error') }
    setCustomBusy(false)
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch('/api/dashboard/discount-codes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !isActive }) })
    setCodes(prev => prev.map(c => c.id === id ? { ...c, isActive: !isActive } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this discount?')) return
    await fetch(`/api/dashboard/discount-codes?id=${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  function productTitle(id: string) {
    return products.find(p => p.id === id)?.title ?? id
  }

  const filteredProducts = productFilter.trim()
    ? products.filter(p => p.title.toLowerCase().includes(productFilter.trim().toLowerCase()))
    : products

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={{ fontFamily: HALO.fontDisplay, fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HALO.accent, marginBottom: 4 }}>Sell</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={S.title}>Discounts</h1>
            <PlanBadge tier={tier} />
          </div>
        </div>
        <HaloButton variant="accent" onClick={openCreateModal}>+ Create Discount</HaloButton>
      </div>

      <div style={{
        marginBottom: 24, padding: '14px 18px', borderRadius: 10,
        background: 'rgba(0,230,118,0.08)', border: '1px solid var(--green)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
          Fully automatic — no codes for buyers to enter
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
          The moment a discount below is active, it shows up directly as a reduced price on your product listing and product page — buyers see it before they even add to cart. It carries through to checkout automatically, with the same amount applied to the exact same products. There's nothing to hand out, remember, or type in: no discount codes, no coupons, no promo boxes. The "name" you give a discount is only for your own reference in this dashboard.
        </div>
      </div>

      {isElevated && (
        <div style={tierCardStyle(theme, { padding: '16px 20px', marginBottom: 24, position: 'relative', overflow: 'hidden' })}>
          {isPro && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FFD54A, #FF6B00)' }} />
          )}
          <div style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Quick Presets — Whole Store
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {QUICK_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => quickCreate(p)}
                disabled={quickBusy !== null}
                style={{
                  background: 'transparent',
                  border: `1px solid ${accentColor}`,
                  color: accentColor,
                  borderRadius: 999,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: quickBusy !== null ? 'not-allowed' : 'pointer',
                  opacity: quickBusy !== null && quickBusy !== p ? 0.5 : 1,
                }}
              >
                {quickBusy === p ? 'Creating…' : `${p}% off — one click`}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)', fontSize: 12.5, fontWeight: 600 }}>Or set your own:</span>
            <input
              type="number"
              min="1"
              max="100"
              placeholder="e.g. 25"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              style={{
                width: 90, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
                padding: '7px 10px', color: 'var(--text)', fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>%</span>
            <button
              onClick={customCreate}
              disabled={customBusy || !customValue}
              style={{
                background: accentColor, color: '#000', border: 'none', borderRadius: 999,
                padding: '8px 18px', fontSize: 13, fontWeight: 700,
                cursor: customBusy || !customValue ? 'not-allowed' : 'pointer',
                opacity: !customValue ? 0.6 : 1,
              }}
            >
              {customBusy ? 'Creating…' : 'Create custom discount'}
            </button>
            <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>
              Instantly creates a store-wide active discount — applies automatically, no form needed.
            </span>
          </div>
          {customError && (
            <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 10 }}>{customError}</div>
          )}
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12 }}>
            Want a discount on just one item? Use <strong style={{ color: accentColor }}>+ Create Discount</strong> above — it lets you pick specific products.
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : codes.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No discounts yet</p>
          <p style={{ fontSize: '14px' }}>Create a discount and it will show automatically on your listings — buyers never need a code</p>
        </div>
      ) : (
        <div style={tierCardStyle(theme, { overflow: 'hidden' })}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Discount</th>
                <th style={S.th}>Applies To</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Uses</th>
                <th style={S.th}>Min Order</th>
                <th style={S.th}>Expires</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => {
                const scoped = Array.isArray(c.productIds) && c.productIds.length > 0
                return (
                  <tr key={c.id}>
                    <td style={S.td}><span style={S.code}>{c.code}</span></td>
                    <td style={S.td}>
                      {c.type === 'PERCENTAGE' ? `${c.value}% off` : `£${c.value.toFixed(2)} off`}
                      {c.maxDiscount ? <span style={{ color: 'var(--muted)', fontSize: '12px' }}> (max £{c.maxDiscount})</span> : null}
                    </td>
                    <td style={S.td}>
                      {scoped ? (
                        <span
                          title={c.productIds.map(productTitle).join(', ')}
                          style={{ ...S.badge, background: 'rgba(79,195,247,0.15)', color: '#4FC3F7', cursor: 'default' }}
                        >
                          {c.productIds.length} product{c.productIds.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ ...S.badge, background: 'rgba(153,153,153,0.12)', color: 'var(--muted)' }}>
                          All products
                        </span>
                      )}
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, background: c.isActive ? 'rgba(0,230,118,0.15)' : 'rgba(153,153,153,0.15)', color: c.isActive ? 'var(--green)' : 'var(--muted)' }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={S.td}>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                    <td style={S.td}>{c.minOrder ? `£${c.minOrder.toFixed(2)}` : <span style={{ color: 'var(--muted)' }}>None</span>}</td>
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Create Discount</h2>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
              This applies automatically — the moment you save it, eligible products show the reduced price on your listings and it carries through checkout on its own. Buyers never see or type a code.
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
            <div style={S.field}>
              <label style={S.label}>Internal Name (for your reference only)</label>
              <input style={S.input} placeholder="e.g. SUMMER20" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
            </div>
            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Type</label>
                <select style={S.select} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (£)</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Value</label>
                <input style={S.input} type="number" placeholder={form.type === 'PERCENTAGE' ? '10' : '5.00'} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Min Order (£)</label>
                <input style={S.input} type="number" placeholder="Optional" value={form.minOrder} onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))} />
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

            <div style={{ ...S.field, borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 4 }}>
              <label style={S.label}>Applies To</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${scope === 'all' ? accentColor : 'var(--border)'}`,
                    background: scope === 'all' ? `${accentColor}18` : 'transparent',
                    color: scope === 'all' ? accentColor : 'var(--text)',
                  }}
                >
                  All products
                </button>
                <button
                  type="button"
                  onClick={() => setScope('specific')}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${scope === 'specific' ? accentColor : 'var(--border)'}`,
                    background: scope === 'specific' ? `${accentColor}18` : 'transparent',
                    color: scope === 'specific' ? accentColor : 'var(--text)',
                  }}
                >
                  Specific products
                </button>
              </div>

              {scope === 'specific' && (
                <div>
                  <input
                    style={{ ...S.input, marginBottom: 8 }}
                    placeholder="Search your products..."
                    value={productFilter}
                    onChange={e => setProductFilter(e.target.value)}
                  />
                  <div style={{
                    maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--bg)',
                  }}>
                    {productsLoading ? (
                      <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>Loading your products…</div>
                    ) : filteredProducts.length === 0 ? (
                      <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>
                        {products.length === 0 ? 'No products found.' : 'No products match your search.'}
                      </div>
                    ) : (
                      filteredProducts.map(p => (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                            borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(p.id)}
                            onChange={() => toggleProductSelected(p.id)}
                            style={{ accentColor, width: 15, height: 15, flexShrink: 0 }}
                          />
                          <span style={{ flex: 1, color: 'var(--text)' }}>{p.title}</span>
                          <span style={{ color: 'var(--muted)' }}>£{Number(p.price).toFixed(2)}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                    {selectedProductIds.length === 0
                      ? 'Select one or more products this discount should apply to.'
                      : `${selectedProductIds.length} product${selectedProductIds.length > 1 ? 's' : ''} selected — everything else stays full price.`}
                  </div>
                </div>
              )}
            </div>

            <div style={S.modalFooter}>
              <button style={S.btnOutline} onClick={() => { setShowModal(false); setError('') }}>Cancel</button>
              <button style={S.btn} onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Discount'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
