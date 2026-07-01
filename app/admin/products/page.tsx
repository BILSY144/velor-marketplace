'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type ProductStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'DELISTED'

interface AdminProduct {
  id: string
  name: string
  category: string
  price: number
  description: string
  images: string[]
  status: ProductStatus
  createdAt: string
  seller: {
    storeName: string
    user: { name: string; email: string }
  }
}

const TABS = [
  { label: 'Pending Review', value: 'PENDING_REVIEW' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: 'ALL' },
]

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .adm-page { min-height: 100vh; background: #0D0D0D; color: #fff; font-family: Inter, sans-serif; padding: 40px 32px; }
  .adm-header { margin-bottom: 36px; }
  .adm-title { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; color: #fff; }
  .adm-sub { color: #999; font-size: 14px; margin-top: 8px; }
  .adm-tabs { display: flex; gap: 4px; border-bottom: 1px solid #2A2A2A; margin-bottom: 28px; }
  .adm-tab { padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; background: none; color: #999; border-bottom: 2px solid transparent; transition: color 0.15s; }
  .adm-tab.active { color: #FF6B00; border-bottom-color: #FF6B00; }
  .adm-tab:hover:not(.active) { color: #fff; }
  .adm-grid { display: flex; flex-direction: column; gap: 16px; }
  .adm-card { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 12px; padding: 20px; display: flex; gap: 20px; align-items: flex-start; }
  .adm-img { width: 96px; height: 96px; border-radius: 8px; object-fit: cover; background: #2A2A2A; flex-shrink: 0; }
  .adm-img-ph { width: 96px; height: 96px; border-radius: 8px; background: #2A2A2A; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #555; font-size: 11px; }
  .adm-info { flex: 1; min-width: 0; }
  .adm-name { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px; }
  .adm-meta { font-size: 12px; color: #999; margin-bottom: 8px; }
  .adm-meta b { color: #FF6B00; font-weight: 600; }
  .adm-desc { font-size: 13px; color: #bbb; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px; }
  .adm-price { font-size: 20px; font-weight: 700; color: #fff; }
  .adm-side { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; flex-shrink: 0; min-width: 140px; }
  .adm-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 20px; }
  .adm-badge-PENDING_REVIEW { background: rgba(255,107,0,0.15); color: #FF6B00; }
  .adm-badge-APPROVED { background: rgba(0,230,118,0.15); color: #00E676; }
  .adm-badge-REJECTED { background: rgba(255,23,68,0.15); color: #FF1744; }
  .adm-badge-DELISTED { background: rgba(153,153,153,0.15); color: #999; }
  .adm-btns { display: flex; gap: 8px; }
  .adm-btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.15s; white-space: nowrap; }
  .adm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .adm-approve { background: #00E676; color: #000; }
  .adm-reject { background: transparent; border: 1px solid #FF1744 !important; color: #FF1744; }
  .adm-empty { text-align: center; padding: 80px 20px; color: #555; font-size: 15px; }
  .adm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .adm-modal { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 16px; padding: 28px; width: 100%; max-width: 480px; }
  .adm-modal-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .adm-modal-sub { font-size: 13px; color: #999; margin-bottom: 20px; line-height: 1.5; }
  .adm-textarea { width: 100%; background: #0D0D0D; border: 1px solid #2A2A2A; border-radius: 8px; color: #fff; font-size: 14px; padding: 12px; resize: vertical; min-height: 100px; font-family: Inter, sans-serif; outline: none; transition: border-color 0.15s; }
  .adm-textarea:focus { border-color: #FF6B00; }
  .adm-modal-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }
  .adm-cancel { background: transparent; border: 1px solid #2A2A2A !important; color: #999; }
  .adm-confirm-reject { background: #FF1744; color: #fff; }
  .adm-spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(0,0,0,0.25); border-top-color: #000; border-radius: 50%; animation: adm-spin 0.6s linear infinite; }
  .adm-spinner-white { border-top-color: #fff; border-color: rgba(255,255,255,0.25); }
  @keyframes adm-spin { to { transform: rotate(360deg); } }
`

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('PENDING_REVIEW')
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState<{ productId: string; productName: string } | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    } else if (status === 'authenticated' && (session as any).user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchProducts = async (tab: string) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/products?status=${tab}`)
      const data = await r.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      setProducts([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (status === 'authenticated' && (session as any).user?.role === 'ADMIN') {
      fetchProducts(activeTab)
    }
  }, [activeTab, status, session])

  const handleAction = async (productId: string, action: 'approve' | 'reject', note?: string) => {
    setActionLoading(productId)
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, action, note }),
    })
    setActionLoading(null)
    setRejectModal(null)
    setRejectNote('')
    fetchProducts(activeTab)
  }

  const openRejectModal = (productId: string, productName: string) => {
    setRejectNote('')
    setRejectModal({ productId, productName })
  }

  if (status === 'loading' || (status === 'authenticated' && (session as any).user?.role !== 'ADMIN')) {
    return null
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;600&display=swap"
        rel="stylesheet"
      />
      <style>{css}</style>

      <div className="adm-page">
        <div className="adm-header">
          <h1 className="adm-title">Product Moderation</h1>
          <p className="adm-sub">Review and approve seller listings before they go live</p>
        </div>

        <div className="adm-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              className={`adm-tab${activeTab === tab.value ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="adm-empty">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="adm-empty">No products in this category.</div>
        ) : (
          <div className="adm-grid">
            {products.map((product) => (
              <div key={product.id} className="adm-card">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="adm-img" />
                ) : (
                  <div className="adm-img-ph">No image</div>
                )}

                <div className="adm-info">
                  <div className="adm-name">{product.name}</div>
                  <div className="adm-meta">
                    <b>{product.seller.storeName}</b> &mdash; {product.seller.user.email} &mdash; {product.category}
                  </div>
                  <div className="adm-desc">{product.description}</div>
                  <div className="adm-price">ÃÂ£{Number(product.price).toFixed(2)}</div>
                </div>

                <div className="adm-side">
                  <span className={`adm-badge adm-badge-${product.isApproved ? 'Approved' : 'Pending'}`}>
                    {product.isApproved ? 'Approved' : 'Pending'.replace('_', ' ')}
                  </span>

                  {activeTab === 'PENDING_REVIEW' && (
                    <div className="adm-btns">
                      <button
                        className="adm-btn adm-approve"
                        disabled={actionLoading === product.id}
                        onClick={() => handleAction(product.id, 'approve')}
                      >
                        {actionLoading === product.id ? (
                          <span className="adm-spinner" />
                        ) : (
                          'Approve'
                        )}
                      </button>
                      <button
                        className="adm-btn adm-reject"
                        disabled={actionLoading === product.id}
                        onClick={() => openRejectModal(product.id, product.name)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="adm-overlay">
          <div className="adm-modal">
            <div className="adm-modal-title">Reject Listing</div>
            <div className="adm-modal-sub">
              Adding a reason helps the seller understand what to fix. This note will be included in the email sent to them.
            </div>
            <textarea
              className="adm-textarea"
              placeholder="Reason for rejection (optional)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <div className="adm-modal-actions">
              <button
                className="adm-btn adm-cancel"
                onClick={() => {
                  setRejectModal(null)
                  setRejectNote('')
                }}
              >
                Cancel
              </button>
              <button
                className="adm-btn adm-confirm-reject"
                disabled={actionLoading === rejectModal.productId}
                onClick={() => handleAction(rejectModal.productId, 'reject', rejectNote)}
              >
                {actionLoading === rejectModal.productId ? (
                  <span className="adm-spinner adm-spinner-white" />
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
