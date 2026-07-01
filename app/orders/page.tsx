'use client'

import { useState, useEffect } from 'react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { id: string; name: string; images: string[]; category: string }
}

interface Order {
  id: string
  buyerEmail: string
  buyerName: string
  total: number
  currency: string
  status: string
  shippingAddress: Record<string, string>
  createdAt: string
  items: OrderItem[]
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: 'rgba(153,153,153,0.12)', color: '#999999' },
  PAID:      { bg: 'rgba(255,107,0,0.12)',   color: '#FF6B00' },
  FULFILLED: { bg: 'rgba(0,230,118,0.12)',   color: '#00E676' },
  REFUNDED:  { bg: 'rgba(255,23,68,0.12)',   color: '#FF1744' },
  CANCELLED: { bg: 'rgba(255,23,68,0.12)',   color: '#FF1744' },
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrdersPage() {
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('velor-last-order')
      if (stored) {
        const o = JSON.parse(stored)
        if (o?.shipping?.email) setEmail(o.shipping.email)
      }
    } catch {}
  }, [])

  const lookup = async () => {
    const q = email.trim().toLowerCase()
    if (!q) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data.orders ?? [])
      setSearched(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0D0D0D)', fontFamily: 'Inter, sans-serif', color: 'var(--text, #FFFFFF)' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #2A2A2A', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, color: '#FF6B00', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          VELOR
        </a>
        <span style={{ color: '#2A2A2A' }}>|</span>
        <span style={{ color: '#999999', fontSize: 14 }}>Order History</span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 800, margin: '0 0 8px' }}>
          Your Orders
        </h1>
        <p style={{ color: '#999999', fontSize: 15, margin: '0 0 36px' }}>
          Enter the email address used at checkout to view your order history.
        </p>

        {/* Email lookup */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="your@email.com"
            style={{
              flex: '1 1 260px',
              background: '#1A1A1A',
              border: '1px solid #2A2A2A',
              borderRadius: 8,
              padding: '13px 16px',
              color: '#FFFFFF',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <button
            onClick={lookup}
            disabled={loading}
            style={{
              padding: '13px 28px',
              background: loading ? '#222222' : '#FF6B00',
              border: 'none',
              borderRadius: 8,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Searching...' : 'Find Orders'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,23,68,0.08)', border: '1px solid #FF1744', borderRadius: 8, color: '#FF1744', fontSize: 14, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {searched && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#999999', fontSize: 15, marginBottom: 16 }}>No orders found for this email address.</p>
            <a href="/shop" style={{ color: '#FF6B00', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Start Shopping
            </a>
          </div>
        )}

        {orders.map(order => {
          const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING
          return (
            <div
              key={order.id}
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}
            >
              {/* Order header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid #2A2A2A',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: '#999999' }}>{fmtDate(order.createdAt)}</span>
                  <span style={{
                    padding: '3px 9px',
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                    background: s.bg,
                    color: s.color,
                  }}>
                    {order.status}
                  </span>
                </div>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 800, color: '#FF6B00' }}>
                  {fmt(order.total, order.currency)}
                </span>
              </div>

              {/* Items */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {item.product.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' as const, background: '#111111', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={`/shop/${item.product.id}`}
                        style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}
                      >
                        {item.product.name}
                      </a>
                      <span style={{ fontSize: 12, color: '#999999' }}>
                        Qty {item.quantity} &middot; {fmt(item.price, order.currency)} each
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', flexShrink: 0 }}>
                      {fmt(item.price * item.quantity, order.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping address */}
              {order.shippingAddress?.line1 && (
                <div style={{ padding: '10px 20px', borderTop: '1px solid #2A2A2A' }}>
                  <span style={{ fontSize: 11, color: '#999999', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                    Delivered to: {order.shippingAddress.name ? `${order.shippingAddress.name}, ` : ''}{order.shippingAddress.line1}, {order.shippingAddress.city}
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {searched && orders.length > 0 && (
          <p style={{ color: '#999999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} found &middot;{' '}
            <a href="/shop" style={{ color: '#FF6B00', textDecoration: 'none' }}>Continue Shopping</a>
          </p>
        )}
      </div>
    </div>
  )
}
