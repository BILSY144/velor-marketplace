'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useSellerTier, PlanBadge, tierCardStyle } from '@/lib/dashboard-theme'

interface OrderItem {
  id: string; productId: string; quantity: number; price: number;
  product: { name: string; images: string[] };
}
interface Shipment {
  id: string; status: string; trackingNumber: string | null;
  trackingUrl: string | null; labelUrl: string | null; carrier: string | null;
}
interface Order {
  id: string; status: string; total: number; productSubtotal: number;
  shippingCost: number; dutiesCost: number; currency: string;
  buyerEmail: string; buyerName: string; createdAt: string;
  shippingAddress: Record<string, string>;
  items: OrderItem[]; shipments: Shipment[];
}

interface ShipFormState {
  carrier: string
  trackingNumber: string
  trackingUrl: string
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

const inputStyle: CSSProperties = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
}

// Velor dispatch promise (William, 2026-07-20): every order must be
// dispatched within 7 days of purchase. These helpers drive the pill on the
// order row and the polite reminder inside the tracking form.
const DISPATCH_WINDOW_DAYS = 7

function daysSinceOrder(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
}

function dispatchDaysLeft(createdAt: string): number {
  return DISPATCH_WINDOW_DAYS - daysSinceOrder(createdAt)
}

function dispatchDueDate(createdAt: string): string {
  const due = new Date(new Date(createdAt).getTime() + DISPATCH_WINDOW_DAYS * 86400000)
  return due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function dispatchPillColor(daysLeft: number): string {
  if (daysLeft <= 0) return '#FF1744'
  if (daysLeft <= 2) return '#FF6B00'
  return 'var(--accent)'
}

function dispatchPillLabel(daysLeft: number): string {
  if (daysLeft <= 0) return 'Add tracking - dispatch overdue'
  if (daysLeft === 1) return 'Add tracking - 1 day left'
  return `Add tracking - ${daysLeft} days left`
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [shipLoading, setShipLoading] = useState<Record<string, boolean>>({})
  const [shipErrors, setShipErrors] = useState<Record<string, string>>({})
  const [shipForms, setShipForms] = useState<Record<string, ShipFormState>>({})
  const [editingShipment, setEditingShipment] = useState<Record<string, boolean>>({})
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const { tier, theme } = useSellerTier()
  // Enterprise retired 2026-07-15 — normalized to PRO before it reaches the
  // client, so this is a plain two-tier (Starter/Pro) check now.
  const isPro = tier === 'PRO'
  const isElevated = isPro

  useEffect(() => {
    fetch('/api/dashboard/orders')
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
      .finally(() => setLoading(false))
  }, [])

  function updateShipForm(orderId: string, field: keyof ShipFormState, value: string) {
    setShipForms(f => {
      const current: ShipFormState = f[orderId] ?? { carrier: '', trackingNumber: '', trackingUrl: '' }
      const next: ShipFormState = { ...current, [field]: value }
      return { ...f, [orderId]: next }
    })
  }

  async function markShipped(orderId: string) {
    const form = shipForms[orderId] ?? { carrier: '', trackingNumber: '', trackingUrl: '' }
    if (!form.carrier.trim() || !form.trackingNumber.trim()) {
      setShipErrors(e => ({ ...e, [orderId]: 'Carrier and tracking number are both required' }))
      return
    }
    setShipLoading(l => ({ ...l, [orderId]: true }))
    setShipErrors(e => ({ ...e, [orderId]: '' }))
    try {
      const res = await fetch('/api/dashboard/shipping/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          carrier: form.carrier.trim(),
          trackingNumber: form.trackingNumber.trim(),
          trackingUrl: form.trackingUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setShipErrors(e => ({ ...e, [orderId]: data.error ?? 'Could not mark this order as shipped' }))
        return
      }
      // Refresh orders to show the new shipment
      const refreshed = await fetch('/api/dashboard/orders').then(r => r.json())
      setOrders(refreshed.orders ?? [])
      setEditingShipment(e => ({ ...e, [orderId]: false }))
    } catch {
      setShipErrors(e => ({ ...e, [orderId]: 'Network error — please try again' }))
    } finally {
      setShipLoading(l => ({ ...l, [orderId]: false }))
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
        {isPro && orders.length > 0 && (
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

      {/* Search & filter — Pro only */}
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
            Pro search
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
            const hasShipment = order.shipments && order.shipments.length > 0
            const latestShipment = order.shipments?.[0]
            const canShip = ['PAID', 'PROCESSING'].includes(order.status)
            const isExpanded = expandedOrder === order.id
            const addr = order.shippingAddress as Record<string, string>
            const form = shipForms[order.id] ?? { carrier: '', trackingNumber: '', trackingUrl: '' }
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {canShip && !hasShipment && (() => {
                      const daysLeft = dispatchDaysLeft(order.createdAt)
                      const pillColor = dispatchPillColor(daysLeft)
                      return (
                        <button
                          onClick={e => { e.stopPropagation(); setExpandedOrder(order.id) }}
                          style={{
                            padding: '7px 16px', borderRadius: 999,
                            background: pillColor + '18', border: `1px solid ${pillColor}`,
                            color: pillColor, fontFamily: 'var(--font-body)',
                            fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {dispatchPillLabel(daysLeft)}
                        </button>
                      )
                    })()}
                    <div style={{ fontSize: '18px', color: 'var(--muted)' }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                          Ship To
                          <button
                            onClick={() => {
                              const text = [addr?.name, addr?.line1, addr?.line2, `${addr?.city ?? ''}${addr?.state ? ', ' + addr.state : ''} ${addr?.postal_code ?? ''}`.trim(), addr?.country].filter(Boolean).join('\n')
                              void navigator.clipboard?.writeText(text)
                            }}
                            style={{
                              padding: '3px 12px', borderRadius: 999, background: 'var(--surface)',
                              border: '1px solid var(--border)', color: 'var(--muted)',
                              fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600,
                              cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal',
                            }}
                          >
                            Copy address
                          </button>
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

                    {/* Shipment section */}
                    {hasShipment && latestShipment && !editingShipment[order.id] ? (
                      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                          Shipment
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                            {latestShipment.carrier ?? 'Carrier'} &middot; {statusBadge(latestShipment.status)}
                          </div>
                          {latestShipment.trackingNumber && (
                            <div style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                              {latestShipment.trackingNumber}
                            </div>
                          )}
                          {latestShipment.trackingUrl && (
                            <a href={latestShipment.trackingUrl} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                              Track Package
                            </a>
                          )}
                          {latestShipment.labelUrl && (
                            <a href={latestShipment.labelUrl} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                              Download Label
                            </a>
                          )}
                          {order.status !== 'DELIVERED' && (
                            <button
                              onClick={() => {
                                setShipForms(f => ({
                                  ...f,
                                  [order.id]: {
                                    carrier: latestShipment.carrier ?? '',
                                    trackingNumber: latestShipment.trackingNumber ?? '',
                                    trackingUrl: latestShipment.trackingUrl ?? '',
                                  },
                                }))
                                setEditingShipment(e => ({ ...e, [order.id]: true }))
                              }}
                              style={{
                                padding: '6px 16px', borderRadius: 999, background: 'var(--surface)',
                                border: '1px solid var(--border)', color: 'var(--text)',
                                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              Update tracking
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (canShip || editingShipment[order.id]) ? (
                      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                          {editingShipment[order.id] ? 'Update Tracking' : 'Mark as Shipped'}
                        </div>
                        {!editingShipment[order.id] && (() => {
                          const daysLeft = dispatchDaysLeft(order.createdAt)
                          const noteColor = dispatchPillColor(daysLeft)
                          return (
                            <div style={{
                              padding: '12px 16px', marginBottom: '14px', borderRadius: '8px',
                              background: noteColor + '12', border: `1px solid ${noteColor}44`,
                              fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.6,
                            }}>
                              {daysLeft > 0 ? (
                                <>A friendly reminder: items on Velor must be dispatched within 7 days of purchase, so this order should be on its way by <strong>{dispatchDueDate(order.createdAt)}</strong>. Once it is posted, add the tracking details below so your buyer can follow it. Thank you for keeping Velor deliveries reliable.</>
                              ) : (
                                <>This order has passed its 7-day dispatch window. Please post it as soon as you can and add the tracking details below — your buyer is waiting to see it on its way. If something is preventing dispatch, message the buyer to let them know.</>
                              )}
                            </div>
                          )
                        })()}
                        <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6, marginTop: 0, marginBottom: '14px' }}>
                          Ship this order yourself with your own carrier account, then enter the tracking details below so your buyer can follow it. Your shipping payment from the buyer is included in your normal payout after delivery is confirmed and the hold window passes — same as your product proceeds.
                        </p>
                        {shipErrors[order.id] && (
                          <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>
                            {shipErrors[order.id]}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Carrier *</label>
                            <input
                              value={form.carrier}
                              onChange={e => updateShipForm(order.id, 'carrier', e.target.value)}
                              placeholder="e.g. Royal Mail, DHL, UPS"
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Tracking Number *</label>
                            <input
                              value={form.trackingNumber}
                              onChange={e => updateShipForm(order.id, 'trackingNumber', e.target.value)}
                              placeholder="e.g. RR123456789GB"
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Tracking URL (optional)</label>
                          <input
                            value={form.trackingUrl}
                            onChange={e => updateShipForm(order.id, 'trackingUrl', e.target.value)}
                            placeholder="Link your buyer can use to follow the parcel"
                            style={inputStyle}
                          />
                        </div>
                        <button
                          onClick={() => markShipped(order.id)}
                          disabled={shipLoading[order.id]}
                          style={{
                            padding: '10px 24px', background: shipLoading[order.id] ? 'var(--border)' : 'var(--accent)',
                            color: '#fff', border: 'none', borderRadius: 999,
                            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px',
                            cursor: shipLoading[order.id] ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {shipLoading[order.id] ? 'Saving...' : editingShipment[order.id] ? 'Save Tracking' : 'Mark as Shipped'}
                        </button>
                        {editingShipment[order.id] && (
                          <button
                            onClick={() => setEditingShipment(e => ({ ...e, [order.id]: false }))}
                            style={{
                              padding: '10px 24px', marginLeft: 10, background: 'transparent',
                              color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 999,
                              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        )}
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
