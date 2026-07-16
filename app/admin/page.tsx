'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Stats {
  totalUsers: number
  totalSellers: number
  totalApprovedProducts: number
  totalOrders: number
  totalRevenue: number
  pendingSellers: number
  pendingProducts: number
  recentOrders: Array<{
    id: string
    total: number
    createdAt: string
    items: Array<{ product: { name: string } }>
  }>
}

interface Seller {
  id: string
  storeName: string
  status: string
  createdAt: string
  user: { name: string | null; email: string | null }
}

const card = {
  background: '#1A1A1A',
  border: '1px solid #2A2A2A',
  borderRadius: '12px',
  padding: '24px',
}

const statCard = (accent?: boolean) => ({
  ...card,
  borderLeft: accent ? '3px solid #FF6B00' : '3px solid #2A2A2A',
})

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingSellers, setLoadingSellers] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const role = (session?.user as any)?.role

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    if (status === 'authenticated' && role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [status, role, router])

  // middleware.ts requires 'Authorization: Bearer <ADMIN_SECRET>' on every
  // /api/admin/* request regardless of NextAuth session -- this page's
  // fetches had no such header at all until 2026-07-16's readiness audit
  // caught it (every call here was silently 401'ing, so Approve/Reject did
  // nothing). Token is entered once via /admin/dashboard or /admin/sellers
  // and cached in localStorage under 'velor_admin_secret'; reused here.
  const [tokenMissing, setTokenMissing] = useState(false)
  const adminAuthHeader = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('velor_admin_secret') || '' : ''
    return token ? { Authorization: 'Bearer ' + token } : {}
  }

  useEffect(() => {
    if (role !== 'ADMIN') return
    const authHeader = adminAuthHeader()
    if (!authHeader.Authorization) { setTokenMissing(true); setLoadingStats(false); setLoadingSellers(false); return }
    fetch('/api/admin/stats', { headers: authHeader })
      .then(r => { if (r.status === 401) setTokenMissing(true); return r.json() })
      .then(d => { setStats(d); setLoadingStats(false) })
      .catch(() => setLoadingStats(false))

    fetch('/api/admin/sellers?status=PENDING', { headers: authHeader })
      .then(r => { if (r.status === 401) setTokenMissing(true); return r.json() })
      .then(d => { setSellers(d.sellers || []); setLoadingSellers(false) })
      .catch(() => setLoadingSellers(false))
  }, [role])

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSellerAction = async (sellerId: string, action: string) => {
    setActionLoading(sellerId + action)
    try {
      const res = await fetch('/api/admin/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...adminAuthHeader() },
        body: JSON.stringify({ sellerId, action }),
      })
      if (!res.ok) throw new Error('Failed')
      setSellers(prev => prev.filter(s => s.id !== sellerId))
      showToast(action === 'approve' ? 'Seller approved and notified' : 'Seller rejected', 'success')
    } catch {
      showToast('Action failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && role !== 'ADMIN')) {
    return (
      <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999999', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
      </div>
    )
  }

  if (tokenMissing) {
    return (
      <div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px', textAlign: 'center' }}>
        <div style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600 }}>Admin token needed</div>
        <div style={{ color: '#999999', fontFamily: 'Inter, sans-serif', fontSize: '14px', maxWidth: '360px' }}>
          This dashboard needs your admin secret to call the API. Enter it once on the{' '}
          <a href="/admin/dashboard" style={{ color: '#FF6B00' }}>Admin Dashboard</a> page and it'll be remembered here too.
        </div>
      </div>
    )
  }

  const statItems = stats ? [
    { label: 'Total Users', value: stats.totalUsers, accent: false },
    { label: 'Active Sellers', value: stats.totalSellers, accent: false },
    { label: 'Approved Products', value: stats.totalApprovedProducts, accent: false },
    { label: 'Total Orders', value: stats.totalOrders, accent: false },
    { label: 'Total Revenue', value: `${(stats.totalRevenue / 100).toFixed(2)}`, prefix: '', accent: true },
    { label: 'Pending Sellers', value: stats.pendingSellers, accent: stats.pendingSellers > 0 },
    { label: 'Pending Products', value: stats.pendingProducts, accent: stats.pendingProducts > 0 },
  ] : []

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'success' ? '#00E676' : '#FF1744',
          color: '#000000', padding: '12px 20px', borderRadius: '8px',
          fontWeight: 600, fontSize: '14px',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#999999', marginTop: '8px', fontSize: '15px' }}>
            Platform overview and moderation
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {loadingStats ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ ...statCard(), height: '88px', background: '#1A1A1A' }} />
            ))
          ) : statItems.map((item, i) => (
            <div key={i} style={statCard(item.accent)}>
              <div style={{ color: '#999999', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                {item.label}
              </div>
              <div style={{ color: item.accent ? '#FF6B00' : '#ffffff', fontSize: '28px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
                {item.prefix}{item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Pending Sellers */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Pending Seller Applications
            </h2>
            {stats && stats.pendingSellers > 0 && (
              <span style={{ background: '#FF6B00', color: '#000000', fontWeight: 700, fontSize: '12px', padding: '4px 10px', borderRadius: '99px' }}>
                {stats.pendingSellers} pending
              </span>
            )}
          </div>

          {loadingSellers ? (
            <div style={{ ...card, color: '#999999', fontSize: '15px' }}>Loading...</div>
          ) : sellers.length === 0 ? (
            <div style={{ ...card, color: '#999999', fontSize: '15px', textAlign: 'center', padding: '48px' }}>
              No pending seller applications
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sellers.map(seller => (
                <div key={seller.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '15px' }}>{seller.storeName}</div>
                    <div style={{ color: '#999999', fontSize: '13px', marginTop: '4px' }}>
                      {seller.user.name} &middot; {seller.user.email}
                    </div>
                    <div style={{ color: '#666666', fontSize: '12px', marginTop: '2px' }}>
                      Applied {new Date(seller.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleSellerAction(seller.id, 'approve')}
                      disabled={actionLoading !== null}
                      style={{
                        background: '#00E676', color: '#000000', border: 'none',
                        borderRadius: '8px', padding: '8px 18px', fontWeight: 700,
                        fontSize: '13px', cursor: 'pointer', opacity: actionLoading !== null ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === seller.id + 'approve' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleSellerAction(seller.id, 'reject')}
                      disabled={actionLoading !== null}
                      style={{
                        background: 'transparent', color: '#FF1744', border: '1px solid #FF1744',
                        borderRadius: '8px', padding: '8px 18px', fontWeight: 700,
                        fontSize: '13px', cursor: 'pointer', opacity: actionLoading !== null ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === seller.id + 'reject' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '20px' }}>
            Moderation Queues
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            <a href="/admin/products" style={{
              ...card, textDecoration: 'none', display: 'block',
              borderLeft: stats && stats.pendingProducts > 0 ? '3px solid #FF6B00' : '3px solid #2A2A2A',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ color: '#999999', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Product Review
              </div>
              <div style={{ color: '#ffffff', fontSize: '22px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
                {stats?.pendingProducts ?? '-'}
              </div>
              <div style={{ color: '#FF6B00', fontSize: '13px', marginTop: '8px', fontWeight: 600 }}>
                Review products
              </div>
            </a>
            <a href="/admin/sellers" style={{ ...card, textDecoration: 'none', display: 'block', borderLeft: '3px solid #2A2A2A' }}>
              <div style={{ color: '#999999', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                All Sellers
              </div>
              <div style={{ color: '#ffffff', fontSize: '22px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
                {stats?.totalSellers ?? '-'}
              </div>
              <div style={{ color: '#FF6B00', fontSize: '13px', marginTop: '8px', fontWeight: 600 }}>
                Manage sellers
              </div>
            </a>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '20px' }}>
            Recent Orders
          </h2>
          {loadingStats ? (
            <div style={{ ...card, color: '#999999' }}>Loading...</div>
          ) : !stats?.recentOrders?.length ? (
            <div style={{ ...card, color: '#999999', textAlign: 'center', padding: '48px' }}>No orders yet</div>
          ) : (
            <div style={{ ...card, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Order ID', 'Item', 'Total', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', color: '#999999', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0 16px 0', borderBottom: '1px solid #2A2A2A' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ padding: '14px 0', color: '#999999', fontSize: '13px', fontFamily: 'monospace', borderBottom: '1px solid #1F1F1F' }}>
                        {order.id.slice(0, 8)}...
                      </td>
                      <td style={{ padding: '14px 16px 14px 0', color: '#ffffff', fontSize: '14px', borderBottom: '1px solid #1F1F1F' }}>
                        {order.items[0]?.product?.name || 'Unknown'}
                        {order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
                      </td>
                      <td style={{ padding: '14px 16px 14px 0', color: '#00E676', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid #1F1F1F' }}>
                        &pound;{(order.total / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 0', color: '#999999', fontSize: '13px', borderBottom: '1px solid #1F1F1F' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
