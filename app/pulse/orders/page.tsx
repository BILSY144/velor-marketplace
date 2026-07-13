'use client'

import { useEffect, useState, useCallback } from 'react'

type OrderItem = {
  id: string
  quantity: number
  price: number
  commission: number | null
  product: { id: string; title: string; images: string[] } | null
}

type Order = {
  id: string
  status: string
  subtotal: number
  platformFee: number
  sellerEarnings: number
  currency: string
  customerEmail: string
  customerName: string | null
  stripePaymentId: string | null
  shippingAddress: Record<string, string> | null
  createdAt: string
  seller: { id: string; storeName: string } | null
  items: OrderItem[]
  shipment: { status: string; trackingNumber: string | null; trackingUrl: string | null; carrier: string | null } | null
}

type OrdersResponse = {
  orders: Order[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#999999',
  PAID: '#ff7a1a',
  PROCESSING: '#4dc3ff',
  SHIPPED: '#4dc3ff',
  DELIVERED: '#4dd88a',
  CANCELLED: '#ff4d4d',
  REFUNDED: '#ff4d4d',
  DISPUTED: '#ff4d4d',
}

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  } catch {
    return `£${amount.toFixed(2)}`
  }
}

export default function PulseOrdersPage() {
  const [token, setToken] = useState('')
  const [needsToken, setNeedsToken] = useState(false)
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const saved = localStorage.getItem('velor_admin_secret')
    if (saved) {
      setToken(saved)
    } else {
      setNeedsToken(true)
      setLoading(false)
    }
  }, [])

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status !== 'ALL') params.set('status', status)
    params.set('page', String(page))
    params.set('pageSize', '20')

    fetch('/api/admin/orders?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((r) => {
        if (r.status === 401) {
          localStorage.removeItem('velor_admin_secret')
          setNeedsToken(true)
          setToken('')
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        setData(d)
        setLoading(false)
        setError('')
      })
      .catch(() => {
        setError('Could not reach the server.')
        setLoading(false)
      })
  }, [token, q, status, page])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  function handleUnlock() {
    const el = document.getElementById('orders-token-input') as HTMLInputElement | null
    const input = el && el.value ? el.value.trim() : ''
    if (!input) return
    localStorage.setItem('velor_admin_secret', input)
    setToken(input)
    setNeedsToken(false)
    setLoading(true)
  }

  function runFilters() {
    setPage(1)
  }

  if (needsToken) {
    return (
      <div style={styles.page}>
        <div style={styles.unlockBox}>
          <div style={styles.logo}>VELOR PULSE</div>
          <p style={styles.unlockText}>Enter your admin token to unlock the dashboard.</p>
          <input
            id="orders-token-input"
            type="text" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true"
            style={styles.input}
            placeholder="Admin token"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUnlock()
            }}
          />
          <button style={styles.button} onClick={handleUnlock}>
            Unlock
          </button>
        </div>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>Loading orders...</div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>VELOR PULSE</div>
          <div style={styles.subLogo}>All orders</div>
        </div>
        <a href="/pulse" style={styles.backLink}>&larr; Dashboard</a>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.filterBar}>
        <input
          style={styles.filterInput}
          placeholder="Search buyer, order ID, payment ID, seller..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <select
          style={styles.filterSelect}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          {['ALL', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button style={styles.filterButton} onClick={runFilters}>Search</button>
      </div>

      {data && (
        <div style={styles.resultsMeta}>
          {data.total} order{data.total === 1 ? '' : 's'} &middot; page {data.page} of {data.totalPages}
        </div>
      )}

      {data && data.orders.length === 0 && (
        <div style={styles.smallMuted}>No orders match these filters.</div>
      )}

      {data && data.orders.map((o) => {
        const fmtDate = (d: string) =>
          new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        const currency = o.currency?.toUpperCase() || 'GBP'
        return (
          <div key={o.id} style={styles.appCard}>
            <div style={styles.appCardTop}>
              <span style={styles.appName}>{fmt(o.subtotal, currency)}</span>
              <span style={{ ...styles.appBadge, color: STATUS_COLOR[o.status] || '#999' }}>{o.status}</span>
            </div>
            <div style={{ ...styles.appMeta, fontFamily: 'monospace', color: '#ff9d4d' }}>#{o.id}</div>
            <div style={styles.appMeta}>{o.customerName || 'Not provided'} &middot; {o.customerEmail || 'No email on record'}</div>
            <div style={styles.appMeta}>Seller: {o.seller?.storeName || 'Unknown seller'}</div>
            <div style={styles.smallMuted}>
              {o.items.length === 0
                ? 'No items on record'
                : o.items.map((it) => `${it.quantity}x ${it.product?.title || 'Deleted product'}`).join(', ')}
            </div>
            <div style={styles.smallMuted}>
              Platform fee {fmt(o.platformFee, currency)} &middot; seller earns {fmt(o.sellerEarnings, currency)}
            </div>
            {o.shippingAddress && (o.shippingAddress.city || o.shippingAddress.country) && (
              <div style={styles.smallMuted}>
                Ships to {[o.shippingAddress.city, o.shippingAddress.country].filter(Boolean).join(', ')}
              </div>
            )}
            {o.shipment && (
              <div style={styles.smallMuted}>
                {o.shipment.status} &middot; {o.shipment.carrier || 'Carrier TBC'} &middot; {o.shipment.trackingNumber || 'No tracking number yet'}
              </div>
            )}
            <div style={styles.smallMuted}>
              {fmtDate(o.createdAt)} &middot; {o.stripePaymentId || 'No payment ID on record'}
            </div>
          </div>
        )
      })}

      {data && data.totalPages > 1 && (
        <div style={styles.pageNav}>
          <button
            style={styles.pageButton}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span style={styles.smallMuted}>Page {page} of {data.totalPages}</span>
          <button
            style={styles.pageButton}
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <div style={styles.footer}>Auto-refreshes every 30 seconds. Private dashboard, not linked from the public site.</div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    background: '#0d0d0d',
    color: '#f2f2f2',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px 16px 60px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#ff7a1a',
  },
  subLogo: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  backLink: {
    fontSize: 13,
    color: '#ccc',
    textDecoration: 'none',
  },
  errorBanner: {
    background: '#3a1a00',
    color: '#ffb27a',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterInput: {
    flex: '1 1 200px',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#171717',
    color: '#f2f2f2',
    fontSize: 13,
    boxSizing: 'border-box',
  },
  filterSelect: {
    flex: '1 1 140px',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#171717',
    color: '#f2f2f2',
    fontSize: 13,
    boxSizing: 'border-box',
  },
  filterButton: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#ff7a1a',
    color: '#0d0d0d',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  resultsMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  smallMuted: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  appCard: {
    background: '#1e1e1e',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 8,
  },
  appCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f2f2f2',
  },
  appBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  appMeta: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 2,
  },
  pageNav: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  pageButton: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#171717',
    color: '#f2f2f2',
    fontSize: 13,
    cursor: 'pointer',
  },
  unlockBox: {
    maxWidth: 340,
    margin: '80px auto 0',
    textAlign: 'center',
  },
  unlockText: {
    fontSize: 13,
    color: '#999',
    margin: '16px 0 20px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#171717',
    color: '#f2f2f2',
    fontSize: 15,
    marginBottom: 12,
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#ff7a1a',
    color: '#0d0d0d',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    color: '#888',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#555',
    marginTop: 20,
  },
}
