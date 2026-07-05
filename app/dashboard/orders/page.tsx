'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSellerTier, PlanBadge, tierCardStyle } from '@/lib/dashboard-theme'

interface OrderItem {
  id: string; productId: string; quantity: number; price: number;
  product: { name: string; images: string[] };
}
interface Shipment {
  id: string; status: string; trackingNumber: string | null;
  labelUrl: string | null; carrier: string | null;
}
interface Order {
  id: string; status: string; total: number; productSubtotal: number;
  shippingCost: number; dutiesCost: number; currency: string;
  buyerEmail: string; buyerName: string; createdAt: string;
  shippingAddress: Record<string, string>;
  items: OrderItem[]; shipments: Shipment[];
}

const STATUS_COLORS: Record<string, string> = {
  PAID: '#FF6B00', PROCESSING: '#FF6B00', SHIPPED: '#00E676',
  DELIVERED: '#00E676', CANCELLED: '#FF1744', REFUNDED: '#FF1744',
}

function statusBadge(status: string) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
      fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
      background: (STATUS_COLORS[status] ?? '#999') + '22',
      color: STATUS_COLORS[status] ?? '#999',
    }}>{status}</span>
  )
}

function exportOrdersCsv(orders: Order[]) {
  const lines: string[] = []
  lines.push('Order ID,Customer,Email,Date,Status,Total,Currency')
  for (const o of orders) {
    lines.push([
      o.id,
      `"${(o.buyerName ?? '').replace(/"/g, '""')}"`,
      o.buyerEmail ?? '',
      new Date(o.createdAt).toISOString().slice(0, 10),
      o.status,
      o.total.toFixed(2),
      o.currency ?? 'GBP',
    ].join(','))
  }
  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `velor-orders-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [labelLoading, setLabelLoading] = useState<Record<string, boolean>>({})
  const [labelErrors, setLabelErrors] = useState<Record<string, string>>({})
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const { tier, theme } = useSellerTier()
  const isPro = tier === 'PRO'
  const isEnterprise = tier === 'ENTERPRISE'
  const isElevated = isPro || isEnterprise

  useEffect(() => {
    fetch('/api/dashboard/orders')
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function createLabel(orderId: string) {
    setLabelLoading(l => ({ ...l, [orderId]: true }))
    setLabelErrors(e => ({ ...e, [orderId]: '' }))
    try {
      const res = await fetch('/api/dashboard/shipping/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLabelErrors(e => ({ ...e, [orderId]: data.error ?? 'Label creation failed' }))
        return
      }
      // Refresh orders to show new shipment
      const refreshed = await fetch('/api/dashboard/orders').then(r => r.json())
      setOrders(refreshed.orders ?? [])
    } catch {
      setLabelErrors(e => ({ ...e, [orderId]: 'Network error — please try again' }))
    } finally {
      setLabelLoading(l => ({ ...l, [orderId]: false }))
    }
  }

  const fmt = (val: number, currency: string) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(val)

  const visibleOrders = useMemo(() => {
    let list = orders
    if (statusFilter !== 'ALL') list = list.filter(o => o.status === statusFilter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(o =>
        o.buyerName?.toLowerCase().includes(q) ||
        o.buyerEmail?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, statusFilter, query])

  if (loading) {
    return (
      <div style={{ padding: '40px', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
        Loading orders...
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 40px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isElevated ? 20 : 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Orders
          </h1>
          <PlanBadge tier={tier} />
        </div>
        {isEnterprise && orders.length > 0 && (
          <button
            onClick={() => exportOrdersCsv(visibleOrders)}
            style={{
              background: 'linear-gradient(90deg, #FFD54A, #FF6B00)',
              color: '#111', border: 'none', borderRadius: '6px',
              padding: '9px 16px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            }}
          >
            Export Orders (CSV)
          </button>
        )}
      </div>

      {/* Search & filter — Pro and Enterprise only */}
      {isElevated && orders.length > 0 && (
        <div style={tierCardStyle(theme, { padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' })}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by customer, email or order ID..."
            style={{
              flex: 1, minWidth: 220, background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
            }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '9px 12px', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}
          >
            <option value="ALL">All statuses</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: 12, color: theme.headingAccent === 'var(--text)' ? 'var(--muted)' : theme.headingAccent, fontWeight: 700 }}>
            {isPro ? 'Pro' : 'Enterprise'} search
          </span>
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ padding: '40px', color: 'var(--muted)', textAlign: 'center' }}>
          <p>No orders yet.</p>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div style={{ padding: '40px', color: 'var(--muted)', textAlign: 'center' }}>
          <p>No orders match your search.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {visibleOrders.map(order => {
            const currency = order.currency ?? 'GBP'
            const hasLabel = order.shipments && order.shipments.length > 0
            const latestShipment = order.shipments?.[0]
            const canLabel = ['PAID', 'PROCESSING'].includes(order.status)
            const isExpanded = expandedOrder === order.id
            const addr = order.shippingAddress as Record<string, string>
            return (
              <div key={order.id} style={tierCardStyle(theme, { overflow: 'hidden' })}>
                <div
                  style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>Order</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' }}>
                        {order.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>Customer</div>
                      <div style={{ fontSize: '14px', color: 'var(--text)' }}>{order.buyerName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>Total</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        {fmt(order.total, currency)}
                      </div>
                    </div>
                    {statusBadge(order.status)}
                  </div>
                  <div style={{ fontSize: '18px', color: 'var(--muted)' }}>{isExpanded ? '▲' : '▼'}</div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                          Ship To
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.7 }}>
                          {addr?.name}<br />
                          {addr?.line1}{addr?.line2 ? ', ' + addr.line2 : ''}<br />
                          {addr?.city}{addr?.state ? ', ' + addr.state : ''} {addr?.postal_code}<br />
                          {addr?.country}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                          Breakdown
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.9 }}>
                          Products: <span style={{ color: 'var(--text)' }}>{fmt(order.productSubtotal ?? 0, currency)}</span><br />
                          Shipping: <span style={{ color: 'var(--text)' }}>{fmt(order.shippingCost ?? 0, currency)}</span><br />
                          {(order.dutiesCost ?? 0) > 0 && (
                            <>Duties (DDP): <span style={{ color: 'var(--text)' }}>{fmt(order.dutiesCost, currency)}</span><br /></>
                          )}
                          Total: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{fmt(order.total, currency)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Items</div>
                      {order.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                          {item.product?.images?.[0] && (
                            <img src={item.product.images[0]} alt={item.product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', background: 'var(--bg)' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{item.product?.name ?? 'Product'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Qty {item.quantity} × {fmt(item.price, currency)}</div>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{fmt(item.quantity * item.price, currency)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Shipment / Label section */}
                    {hasLabel && latestShipment ? (
                      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                          Shipment
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                            {latestShipment.carrier ?? 'DHL Express'} &middot; {statusBadge(latestShipment.status)}
                          </div>
                          {latestShipment.trackingNumber && (
                            <div style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                              {latestShipment.trackingNumber}
                            </div>
                          )}
                          {latestShipment.labelUrl && (
                            <a href={latestShipment.labelUrl} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                              Download Label
                            </a>
                          )}
                        </div>
                      </div>
                    ) : canLabel ? (
                      <div>
                        {labelErrors[order.id] && (
                          <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>
                            {labelErrors[order.id]}
                          </div>
                        )}
                        <button
                          onClick={() => createLabel(order.id)}
                          disabled={labelLoading[order.id]}
                          style={{
                            padding: '10px 22px', background: labelLoading[order.id] ? 'var(--border)' : 'var(--accent)',
                            color: '#fff', border: 'none', borderRadius: '6px',
                            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px',
                            cursor: labelLoading[order.id] ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {labelLoading[order.id] ? 'Creating Label...' : 'Create Shipping Label (DDP)'}
                        </button>
                        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                          Purchases a DHL Express DDP label via Shippo. Duties pre-collected — buyer will not be charged at delivery.
                        </p>
                      </div>
                    ) : null}
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
