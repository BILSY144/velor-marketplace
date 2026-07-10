'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Seller {
  id: string
  storeName: string
  status: string; description?: string | null; country?: string | null; products?: { id: string; title: string; category: string; status: string }[];
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED']

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#FF6B00',
  APPROVED: '#00E676',
  REJECTED: '#FF1744',
  SUSPENDED: '#999999',
}

export default function AdminSellersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('PENDING')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    sellerId: string
    action: string
    storeName: string
  } | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    const role = (session?.user as any)?.role
    if (!session || role !== 'ADMIN') {
      router.push('/')
    }
  }, [session, status, router])

  useEffect(() => {
    loadSellers()
  }, [activeTab])

  async function loadSellers() {
    setLoading(true)
    setLoadError(null)
    try {
      const q = activeTab === 'ALL' ? '' : `?status=${activeTab}`
      const res = await fetch(`/api/admin/sellers${q}`, { headers: { Authorization: 'Bearer ' + (typeof window !== 'undefined' ? localStorage.getItem('velor_admin_secret') || '' : '') } })
      const data = await res.json()
      if (!res.ok) {
        setLoadError(data.error || `Request failed (${res.status})`)
        setSellers([])
        return
      }
      setSellers(data.sellers || [])
    } catch (e: any) {
      setLoadError(e?.message || 'Network error')
      setSellers([])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleAction(sellerId: string, action: string) {
    setActionLoading(sellerId + action)
    setConfirmDialog(null)
    try {
      const res = await fetch('/api/admin/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (typeof window !== 'undefined' ? localStorage.getItem('velor_admin_secret') || '' : '') },
        body: JSON.stringify({ sellerId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      showToast(
        action === 'approve'
          ? 'Seller approved and notified'
          : action === 'reject'
          ? 'Seller rejected and notified'
          : 'Seller suspended',
        true
      )
      loadSellers()
    } catch (e: any) {
      showToast(e.message || 'Something went wrong', false)
    } finally {
      setActionLoading(null)
    }
  }

  function requestAction(seller: Seller, action: string) {
    if (action === 'approve') {
      handleAction(seller.id, action)
    } else {
      setConfirmDialog({ sellerId: seller.id, action, storeName: seller.storeName })
    }
  }

  const role = (session?.user as any)?.role
  if (status === 'loading' || !session || role !== 'ADMIN') return null

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#00E676' : '#FF1744',
          color: '#000000', padding: '12px 20px', borderRadius: 8,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {confirmDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
        }}>
          <div style={{
            background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12,
            padding: 32, maxWidth: 400, width: '90%',
          }}>
            <h3 style={{ margin: '0 0 12px', fontFamily: 'Space Grotesk, sans-serif', fontSize: 18 }}>
              {confirmDialog.action === 'reject' ? 'Reject Seller' : 'Suspend Seller'}
            </h3>
            <p style={{ margin: '0 0 24px', color: '#999999', fontSize: 14 }}>
              Are you sure you want to {confirmDialog.action}{' '}
              <strong style={{ color: '#FFFFFF' }}>{confirmDialog.storeName}</strong>?
              {confirmDialog.action === 'reject' && ' They will be notified by email.'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 6, border: '1px solid #2A2A2A',
                  background: 'transparent', color: '#FFFFFF', cursor: 'pointer', fontSize: 14,
                }}>
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirmDialog.sellerId, confirmDialog.action)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 6, border: 'none',
                  background: confirmDialog.action === 'reject' ? '#FF1744' : '#FF6B00',
                  color: '#FFFFFF', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>
          Sellers
        </h1>
        <p style={{ color: '#999999', margin: 0, fontSize: 14 }}>
          Manage seller applications and account status
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#111111', padding: 4, borderRadius: 8, width: 'fit-content' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#1A1A1A' : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : '#999999',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: 13,
              borderLeft: activeTab === tab ? '2px solid #FF6B00' : '2px solid transparent',
            }}>
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div style={{
        background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#111111' }}>
              {['Business Name', 'Owner', 'Email', 'Applied', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: 12,
                  fontWeight: 600, color: '#999999', textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderBottom: '1px solid #2A2A2A',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#999999' }}>
                  Loading...
                </td>
              </tr>
            ) : sellers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: loadError ? '#FF1744' : '#999999' }}>
                  {loadError
                    ? `Could not load sellers: ${loadError}`
                    : `No ${activeTab.toLowerCase() === 'all' ? '' : activeTab.toLowerCase() + ' '}sellers found`}
                </td>
              </tr>
            ) : sellers.map((seller, i) => (
              <tr key={seller.id} style={{
                borderBottom: i < sellers.length - 1 ? '1px solid #2A2A2A' : 'none',
              }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: 14 }}>
                  {seller.storeName}{seller.country ? <span style={{ fontSize: 11, color: '#FF6B00', marginLeft: 6 }}>({seller.country})</span> : null}{seller.description ? <div style={{ fontSize: 11, color: '#777', marginTop: 4, maxWidth: 260 }}>{seller.description}</div> : null}{seller.products && seller.products.length > 0 ? <div style={{ fontSize: 11, color: '#00C2FF', marginTop: 4 }}>{Array.from(new Set(seller.products.map(p => p.category))).join(', ')} - {seller.products.filter(p => p.status === 'PENDING_REVIEW').length} pending review</div> : null}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 14, color: '#CCCCCC' }}>
                  {seller.user.name || 'ÃÂ¢ÃÂÃÂ'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#999999' }}>
                  {seller.user.email}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#999999' }}>
                  {new Date(seller.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                    background: (STATUS_COLOR[seller.status] || '#999999') + '22',
                    color: STATUS_COLOR[seller.status] || '#999999',
                    border: `1px solid ${STATUS_COLOR[seller.status] || '#999999'}44`,
                  }}>
                    {seller.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {seller.status !== 'APPROVED' && (
                      <button
                        disabled={actionLoading === seller.id + 'approve'}
                        onClick={() => requestAction(seller, 'approve')}
                        style={{
                          padding: '6px 14px', borderRadius: 6, border: 'none',
                          background: '#00E67622', color: '#00E676', cursor: 'pointer',
                          fontWeight: 600, fontSize: 12,
                          opacity: actionLoading === seller.id + 'approve' ? 0.5 : 1,
                        }}>
                        Approve
                      </button>
                    )}
                    {seller.status !== 'REJECTED' && seller.status !== 'APPROVED' && (
                      <button
                        disabled={actionLoading === seller.id + 'reject'}
                        onClick={() => requestAction(seller, 'reject')}
                        style={{
                          padding: '6px 14px', borderRadius: 6, border: '1px solid #FF174444',
                          background: 'transparent', color: '#FF1744', cursor: 'pointer',
                          fontWeight: 600, fontSize: 12,
                          opacity: actionLoading === seller.id + 'reject' ? 0.5 : 1,
                        }}>
                        Reject
                      </button>
                    )}
                    {seller.status === 'APPROVED' === true && (
                      <button
                        disabled={actionLoading === seller.id + 'suspend'}
                        onClick={() => requestAction(seller, 'suspend')}
                        style={{
                          padding: '6px 14px', borderRadius: 6, border: '1px solid #FF6B0044',
                          background: 'transparent', color: '#FF6B00', cursor: 'pointer',
                          fontWeight: 600, fontSize: 12,
                          opacity: actionLoading === seller.id + 'suspend' ? 0.5 : 1,
                        }}>
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
        }
