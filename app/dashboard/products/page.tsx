'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

type ProductStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'DELISTED'

interface SellerProduct {
  id: string
  name: string
  price: number
  stock: number
  status: ProductStatus
  category: string
  images: string[]
  createdAt: string
  sales: number
}

const CATEGORIES = [
  'Fitness & Gym', 'Electronics', 'Home & Garden', 'Sports & Outdoors',
  'Beauty & Health', 'Toys & Games', 'Fashion', 'Automotive', 'Other',
]

function StatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, { label: string; color: string; bg: string }> = {
    PENDING_REVIEW: { label: 'Under Review', color: '#FF6B00', bg: 'rgba(255,107,0,0.1)' },
    APPROVED: { label: 'Live', color: '#00E676', bg: 'rgba(0,230,118,0.1)' },
    REJECTED: { label: 'Rejected', color: '#FF1744', bg: 'rgba(255,23,68,0.1)' },
    DELISTED: { label: 'Delisted', color: '#999999', bg: 'rgba(153,153,153,0.1)' },
  }
  const s = map[status]
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      color: s.color, background: s.bg,
    }}>
      {s.label}
    </span>
  )
}

export default function ProductsPage() {
  const { status } = useSession()
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formStock, setFormStock] = useState('0')
  const [formCategory, setFormCategory] = useState('Fitness & Gym')
  const [formImages, setFormImages] = useState('')
  const [formTags, setFormTags] = useState('')

  const fetchProducts = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/dashboard/products')
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to load products'); return }
      const d = await res.json(); setProducts(d.products || [])
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (status === 'authenticated') fetchProducts() }, [status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setSubmitError(''); setSubmitSuccess(false)
    const images = formImages.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'))
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean)
    try {
      const res = await fetch('/api/dashboard/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, description: formDesc, price: parseFloat(formPrice),
          stock: parseInt(formStock), category: formCategory, images, tags }),
      })
      const d = await res.json()
      if (!res.ok) { setSubmitError(d.error || 'Failed to create product'); return }
      setSubmitSuccess(true)
      setFormName(''); setFormDesc(''); setFormPrice(''); setFormStock('0')
      setFormCategory('Fitness & Gym'); setFormImages(''); setFormTags('')
      await fetchProducts()
      setTimeout(() => { setShowForm(false); setSubmitSuccess(false) }, 1500)
    } catch { setSubmitError('Network error. Please try again.') }
    finally { setSubmitting(false) }
  }

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
    </div>
  )

  if (status === 'unauthenticated') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Please sign in to view your products.</p>
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--text)' }}>
            My Products
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} listed
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>
      {/* Add Product Form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '28px', marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 24px', fontFamily: 'var(--font-display)', fontSize: '20px',
            fontWeight: 700, color: 'var(--text)' }}>New Product</h2>
          {submitSuccess && (
            <div style={{ padding: '12px 16px', background: 'rgba(0,230,118,0.1)', border: '1px solid #00E676',
              borderRadius: '8px', marginBottom: '20px', color: '#00E676', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
              Product submitted for review!
            </div>
          )}
          {submitError && (
            <div style={{ padding: '12px 16px', background: 'rgba(255,23,68,0.1)', border: '1px solid #FF1744',
              borderRadius: '8px', marginBottom: '20px', color: '#FF1744', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
              {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '12px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                  Product Name *
                </label>
                <input value={formName} onChange={e => setFormName(e.target.value)} required
                  placeholder="e.g. Adjustable Dumbbell Set"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-body)',
                    outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '12px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                  Category *
                </label>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-body)',
                    outline: 'none', boxSizing: 'border-box' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '12px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                  Price (GBP) *
                </label>
                <input type="number" step="0.01" min="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} required
                  placeholder="29.99"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-body)',
                    outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '12px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                  Stock Quantity
                </label>
                <input type="number" min="0" value={formStock} onChange={e => setFormStock(e.target.value)}
                  placeholder="100"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-body)',
                    outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '12px',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                Description
              </label>
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4}
                placeholder="Describe your product..."
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-body)',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '12px',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                Image URLs (one per line)
              </label>
              <textarea value={formImages} onChange={e => setFormImages(e.target.value)} rows={3}
                placeholder="https://example.com/image1.jpg"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-body)',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '12px',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                Tags (comma-separated)
              </label>
              <input value={formTags} onChange={e => setFormTags(e.target.value)}
                placeholder="fitness, dumbbells, home gym"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-body)',
                  outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={submitting}
                style={{ padding: '12px 28px', background: submitting ? 'var(--border)' : 'var(--accent)',
                  color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)',
                  fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '12px 28px', background: 'transparent', color: 'var(--muted)',
                  border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'var(--font-body)',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', background: 'rgba(255,23,68,0.1)', border: '1px solid #FF1744',
          borderRadius: '8px', marginBottom: '24px', color: '#FF1744', fontFamily: 'var(--font-body)' }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>-</div>
          <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: '20px',
            fontWeight: 700, color: 'var(--text)' }}>No products yet</h3>
          <p style={{ margin: '0 0 24px', color: 'var(--muted)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
            Add your first product to start selling on Velor.
          </p>
          <button onClick={() => setShowForm(true)}
            style={{ padding: '12px 24px', background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Add Your First Product
          </button>
        </div>
      ) : (
        /* Products table */
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
          overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Product', 'Category', 'Price', 'Stock', 'Sales', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)',
                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    fontFamily: 'var(--font-body)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt={p.name}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px',
                            border: '1px solid var(--border)', flexShrink: 0 }} />
                      )}
                      <div>
                        <p style={{ margin: 0, color: 'var(--text)', fontSize: '14px', fontWeight: 600,
                          fontFamily: 'var(--font-body)', maxWidth: '200px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-body)' }}>
                          Added {new Date(p.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(p.price)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: p.stock < 5 ? '#FF1744' : 'var(--text)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>{p.sales}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
