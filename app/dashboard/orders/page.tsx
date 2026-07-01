'use client'
import { useEffect, useState } from 'react'

interface OrderItemLine {
  id: string
  productId: string
  productName: string
  productImage: string | null
  quantity: number
  unitPrice: number
  commission: number
  payout: number
}

interface Order {
  id: string
  buyerName: string
  status: string
  createdAt: string
  currency: string
  items: OrderItemLine[]
  totalRevenue: number
  totalPayout: number
}

const STATUS_COLOURS: Record<string, string> = {
  PENDING: '#FF6B00',
  PAID: '#FF6B00',
  PROCESSING: '#FF6B00',
  FULFILLED: '#00E676',
  SHIPPED: '#00E676',
  CANCELLED: '#FF1744',
  REFUNDED: '#FF1744',
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP' }).format(amount)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/dashboard/orders')
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false) })
      .catch(() => { setError('Failed to load orders'); setLoading(false) })
  }, [])

  const totalOrders = orders.length
  const grossRevenue = orders.reduce((s, o) => s + o.totalRevenue, 0)
  const yourPayout = orders.reduce((s, o) => s + o.totalPayout, 0)

  function toggleOrder(id: string) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  if (loading) return (
    <div style={{ padding: '40px', color: '#999' }}>Loading orders...</div>
  )
  if (error) return (
    <div style={{ padding: '40px', color: '#FF1744' }}>{error}</div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '960px' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '32px' }}>
        Orders
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Orders', value: String(totalOrders) },
          { label: 'Gross Revenue', value: formatCurrency(grossRevenue, 'GBP') },
          { label: 'Your Payout', value: formatCurrency(yourPayout, 'GBP'), green: true },
        ].map(card => (
          <div key={card.label} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: card.green ? '#00E676' : '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>0</div>
          <div style={{ fontSize: '16px' }}>No orders yet. Share your products to get your first sale.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(order => {
            const colour = STATUS_COLOURS[order.status] || '#999'
            const isOpen = expanded.has(order.id)
            return (
              <div key={order.id} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleOrder(order.id)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>{order.id.slice(0, 8).toUpperCase()}</div>
                    <div style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>{order.buyerName}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#999' }}>{new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
                  <div style={{ background: colour + '22', color: colour, fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '6px', border: '1px solid ' + colour + '44' }}>
                    {order.status}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <div style={{ fontSize: '13px', color: '#999' }}>Payout</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#00E676' }}>{formatCurrency(order.totalPayout, order.currency)}</div>
                  </div>
                  <div style={{ color: '#999', fontSize: '18px' }}>{isOpen ? '\u2303' : '\u2304'}</div>
                </button>
                {isOpen && (
                  <div style={{ borderTop: '1px solid #2A2A2A', padding: '16px 20px' }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #222' }}>
                        {item.productImage && (
                          <img src={item.productImage} alt={item.productName} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', background: '#222' }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{item.productName}</div>
                          <div style={{ fontSize: '13px', color: '#999' }}>Qty: {item.quantity} x {formatCurrency(item.unitPrice, order.currency)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', color: '#999' }}>Your payout</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#00E676' }}>{formatCurrency(item.payout, order.currency)}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '14px' }}>
                      <span style={{ color: '#999' }}>Gross revenue: {formatCurrency(order.totalRevenue, order.currency)}</span>
                      <span style={{ color: '#00E676', fontWeight: 700 }}>Total payout: {formatCurrency(order.totalPayout, order.currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}