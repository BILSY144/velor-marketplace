'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface OrderItem {
  id: string
  quantity: number
  price: number
  commission: number | null
  product: { id: string; title: string; images: string[] } | null
}

interface Order {
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

const STATUS_TABS = ['ALL', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'DISPUTED']

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#999999',
  PAID: '#FF6B00',
  PROCESSING: '#00C2FF',
  SHIPPED: '#00C2FF',
  DELIVERED: '#00E676',
  CANCELLED: '#FF1744',
  REFUNDED: '#FF1744',
  DISPUTED: '#FF1744',
}

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  } catch {
    return `£${amount.toFixed(2)}`
  }
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('ALL')
  const [query, setQuery] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    const role = (session?.user as any)?.role
    if (!session || role !== 'ADMIN') {
      router.push('/')
    }
  }, [session, status, router])

  // middleware.ts requires an 'Authorization: Bearer <ADMIN_SECRET>' header
  // on every /api/admin/* request -- this page had none until the
  // 2026-07-16 readiness audit caught it, so this always 401'd ("Request
  // failed (401)"). Token is entered once via /admin/dashboard or
  // /admin/sellers and cached in localStorage under 'velor_admin_secret'.
  const adminAuthHeader = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('velor_admin_secret') || '' : ''
    return token ? { Authorization: 'Bearer ' + token } : {}
  }

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'ALL') params.set('status', activeTab)
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { headers: adminAuthHeader() })
      const data = await res.json()
      if (!res.ok) {
        setLoadError(data.error || `Request failed (${res.status})`)
        setOrders([])
        return
      }
      setOrders(data.orders || [])
    } catch (e: any) {
      setLoadError(e?.message || 'Network error')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, query])

  useEffect(() => {
    // Debounce search input; status-tab changes fire immediately via the
    // dependency change, this timer just avoids a request per keystroke.
    const t = setTimeout(loadOrders, query ? 350 : 0)
    return () => clearTimeout(t)
  }, [loadOrders, query])

  const role = (session?.user as any)?.role
  if (status === 'loading' || !session || role !== 'ADMIN') return null

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>
          Orders
        </h1>
        <p style={{ color: '#999999', margin: 0, fontSize: 14 }}>
          Look up any order by buyer email, order ID, payment ID, or seller name
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, order ID, payment ID, or seller..."
          style={{
            flex: '1 1 320px', padding: '10px 14px', borderRadius: 8,
            background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#FFFFFF',
            fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4, background: '#111111', padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: activeTab === tab ? '#1A1A1A' : 'transparent',
                color: activeTab === tab ? '#FFFFFF' : '#999999',
                fontWeight: activeTab === tab ? 600 : 400,
                fontSize: 12,
                borderLeft: activeTab === tab ? '2px solid #FF6B00' : '2px solid transparent',
              }}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#111111' }}>
              {['Order', 'Date', 'Customer', 'Seller', 'Items', 'Total', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#999999', textTransform: 'uppercase',
                    letterSpacing: '0.05em', borderBottom: '1px solid #2A2A2A',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#999999' }}>
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: loadError ? '#FF1744' : '#999999' }}>
                  {loadError ? `Could not load orders: ${loadError}` : 'No orders found'}
                </td>
              </tr>
            ) : (
              orders.map((order, i) => (
                <Fragment key={order.id}>
                  <tr
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    style={{
                      borderBottom: expanded === order.id ? 'none' : (i < orders.length - 1 ? '1px solid #2A2A2A' : 'none'),
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#FF6B00' }}>
                      {order.id.slice(0, 10)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#999999', whiteSpace: 'nowrap' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>
                      <div style={{ fontWeight: 600 }}>{order.customerName || 'Not provided'}</div>
                      <div style={{ fontSize: 12, color: '#999999' }}>{order.customerEmail || 'No email on record'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#CCCCCC' }}>
                      {order.seller?.storeName || 'Unknown seller'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#CCCCCC', maxWidth: 240 }}>
                      {order.items.length === 0
                        ? '—'
                        : order.items.map((it) => it.product?.title || 'Deleted product').join(', ')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {fmt(order.subtotal, order.currency?.toUpperCase() || 'GBP')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                          background: (STATUS_COLOR[order.status] || '#999999') + '22',
                          color: STATUS_COLOR[order.status] || '#999999',
                          border: `1px solid ${STATUS_COLOR[order.status] || '#999999'}44`,
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr style={{ borderBottom: i < orders.length - 1 ? '1px solid #2A2A2A' : 'none' }}>
                      <td colSpan={7} style={{ padding: '0 16px 20px', background: '#161616' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, paddingTop: 16 }}>
                          <div>
                            <p style={{ fontSize: 11, color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                              Line items
                            </p>
                            {order.items.map((it) => (
                              <div key={it.id} style={{ fontSize: 13, color: '#DDDDDD', marginBottom: 4 }}>
                                {it.quantity}× {it.product?.title || 'Deleted product'} — {fmt(it.price, order.currency?.toUpperCase() || 'GBP')} each
                              </div>
                            ))}
                          </div>
                          <div>
                            <p style={{ fontSize: 11, color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                              Money
                            </p>
                            <div style={{ fontSize: 13, color: '#DDDDDD', marginBottom: 4 }}>
                              Subtotal: {fmt(order.subtotal, order.currency?.toUpperCase() || 'GBP')}
                            </div>
                            <div style={{ fontSize: 13, color: '#DDDDDD', marginBottom: 4 }}>
                              Platform fee: {fmt(order.platformFee, order.currency?.toUpperCase() || 'GBP')}
                            </div>
                            <div style={{ fontSize: 13, color: '#DDDDDD', marginBottom: 4 }}>
                              Seller earns: {fmt(order.sellerEarnings, order.currency?.toUpperCase() || 'GBP')}
                            </div>
                            <div style={{ fontSize: 12, color: '#777', marginTop: 8, fontFamily: 'monospace' }}>
                              {order.stripePaymentId || 'No payment ID on record'}
                            </div>
                          </div>
                          <div>
                            <p style={{ fontSize: 11, color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                              Shipping
                            </p>
                            {order.shippingAddress ? (
                              <div style={{ fontSize: 13, color: '#DDDDDD', lineHeight: 1.6 }}>
                                {order.shippingAddress.name && <div>{order.shippingAddress.name}</div>}
                                {order.shippingAddress.line1 && <div>{order.shippingAddress.line1}</div>}
                                {order.shippingAddress.city && (
                                  <div>{order.shippingAddress.city}{order.shippingAddress.postcode ? `, ${order.shippingAddress.postcode}` : ''}</div>
                                )}
                                {order.shippingAddress.country && <div>{order.shippingAddress.country}</div>}
                              </div>
                            ) : (
                              <div style={{ fontSize: 13, color: '#777' }}>No address on record (order predates address capture)</div>
                            )}
                            {order.shipment && (
                              <div style={{ fontSize: 12, color: '#00C2FF', marginTop: 8 }}>
                                {order.shipment.carrier || 'Carrier TBC'} — {order.shipment.trackingNumber || 'No tracking number yet'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
