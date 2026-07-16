'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { id: string; name: string; images: string[] } | null
}

interface Order {
  id: string
  // 2026-07-16 readiness audit fix: this was named `total`, but the Order
  // Prisma model (prisma/schema.prisma) has no `total` field -- it stores
  // the seller's full order amount (subtotal + shipping + duties, see
  // lib/orders.ts) under `subtotal`. /api/account/orders returns the raw
  // Prisma row, so order.total was always undefined here and every price
  // on this page rendered as "£NaN" once a real order existed.
  subtotal: number
  currency: string
  status: string
  createdAt: string
  items: OrderItem[]
}

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  PENDING:   { background: 'rgba(255,107,0,0.12)',  color: 'var(--accent)' },
  PAID:      { background: 'rgba(0,230,118,0.12)',  color: 'var(--green)'  },
  FULFILLED: { background: 'rgba(0,230,118,0.12)',  color: 'var(--green)'  },
  REFUNDED:  { background: 'rgba(153,153,153,0.15)', color: 'var(--muted)' },
  CANCELLED: { background: 'rgba(255,23,68,0.12)',  color: 'var(--red)'    },
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMoney(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

export default function AccountPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/sign-in?callbackUrl=/account')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.name) setEditName(session.user.name)
  }, [session])

  useEffect(() => {
    if (!session) return
    fetch('/api/account/orders')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false))
  }, [session])

  async function saveName() {
    const trimmed = editName.trim()
    if (!trimmed) { setNameError('Name cannot be empty'); return }
    setSaving(true)
    setNameError('')
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) { setNameError('Failed to save. Please try again.'); return }
      await update({ name: trimmed })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '32px', fontSize: '13px', color: 'var(--muted)' }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <span style={{ color: 'var(--text)' }}>My Account</span>
        </div>

        {/* Profile header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--accent)', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '26px',
            flexShrink: 0,
          }}>
            {initials(session.user?.name)}
          </div>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '26px', fontWeight: 800, margin: '0 0 4px' }}>
              {session.user?.name || 'My Account'}
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>{session.user?.email}</p>
          </div>
        </div>

        {/* Account settings */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, margin: '0 0 24px' }}>Account Settings</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Display Name
              </label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text)', fontSize: '14px',
                  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                value={session.user?.email || ''}
                disabled
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: '#555', fontSize: '14px',
                  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', cursor: 'not-allowed',
                }}
              />
            </div>
          </div>

          {nameError && (
            <p style={{ color: 'var(--red)', fontSize: '13px', margin: '0 0 12px' }}>{nameError}</p>
          )}

          <button
            onClick={saveName}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: saved ? 'var(--green)' : 'var(--accent)',
              border: 'none', borderRadius: '8px', color: '#000',
              fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, transition: 'background 0.25s',
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>

        {/* Order history */}
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, margin: '0 0 20px' }}>Order History</h2>

        {ordersLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: '72px', background: 'var(--surface)', borderRadius: '10px', opacity: 0.5 }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
          }}>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>No orders yet</p>
            <p style={{ color: 'var(--muted)', margin: '0 0 24px', fontSize: '14px' }}>Your order history will appear here once you place your first order.</p>
            <Link href="/shop" style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'var(--accent)', color: '#000', borderRadius: '8px',
              textDecoration: 'none', fontWeight: 700, fontSize: '14px',
            }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.map(order => {
              const ss = STATUS_STYLE[order.status] || { background: 'rgba(153,153,153,0.15)', color: 'var(--muted)' }
              const isExpanded = expandedOrder === order.id
              return (
                <div key={order.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '18px 24px', background: 'none', border: 'none', color: 'var(--text)',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', fontFamily: 'Space Grotesk, sans-serif' }}>
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {fmtDate(order.createdAt)} &middot; {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', ...ss }}>
                        {order.status}
                      </span>
                      <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px' }}>
                        {fmtMoney(order.subtotal, order.currency)}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                        <path d="M2 5l5 5 5-5"/>
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        {order.items.map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                              {item.product?.images?.[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.product.images[0]} alt={item.product?.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {item.product ? (
                                <Link href={`/shop/${item.product.id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: '14px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.product.name}
                                </Link>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Goods no longer available</span>
                              )}
                              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Qty: {item.quantity}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                              {fmtMoney(item.price * item.quantity, order.currency)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Order total</span>
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '18px' }}>{fmtMoney(order.subtotal, order.currency)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
  }
