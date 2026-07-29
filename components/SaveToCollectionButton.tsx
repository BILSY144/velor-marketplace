'use client'

// Save-to-collection button (Velor Social stage 3, 2026-07-29 -- OSA pack
// signed, feature enabled by William). Collections are PRIVATE BY DEFAULT
// (docs/osa/dpia-velor-social.md) -- this is a personal curation tool, not
// a public surface. Renders nothing while /api/social routes 403.
//
// Modal portals to document.body (dashboard stacking-context lesson).

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

interface CollectionSummary {
  id: string
  name: string
  _count?: { items: number }
}

export default function SaveToCollectionButton({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [newName, setNewName] = useState('')
  const [savedTo, setSavedTo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Probe once: 403 = feature off (hide); anything else = show the button.
    fetch('/api/social/collections')
      .then(r => { if (!cancelled && r.status !== 403) setEnabled(true) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!enabled) return null

  async function openModal() {
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=${encodeURIComponent(pathname || '/')}`)
      return
    }
    setOpen(true)
    setSavedTo(null)
    setError('')
    setLoadingList(true)
    try {
      const r = await fetch('/api/social/collections')
      if (r.ok) {
        const data = await r.json()
        setCollections(Array.isArray(data.collections) ? data.collections : [])
      }
    } finally {
      setLoadingList(false)
    }
  }

  async function addTo(collectionId: string, name: string) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/social/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, productId }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) { setError(data.error || 'Could not save. Please try again.'); return }
      setSavedTo(name)
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !newName.trim()) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/social/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.collection?.id) { setError(data.error || 'Could not create that collection.'); setBusy(false); return }
      setBusy(false)
      setNewName('')
      await addTo(data.collection.id, data.collection.name)
      // refresh list so the new collection shows if they save more
      const list = await fetch('/api/social/collections').then(x => x.ok ? x.json() : null).catch(() => null)
      if (list?.collections) setCollections(list.collections)
    } catch {
      setError('Could not create that collection.')
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openModal()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          minHeight: compact ? '36px' : '40px',
          padding: compact ? '6px 14px' : '8px 18px',
          borderRadius: '999px',
          fontSize: compact ? '12.5px' : '13.5px',
          fontWeight: 600,
          cursor: 'pointer',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        Save to collection
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Save to collection</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--muted)', cursor: 'pointer', minWidth: '44px', minHeight: '44px' }}>×</button>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '0 0 14px' }}>
              Collections are private to you.
            </p>
            {savedTo && (
              <p style={{ fontSize: '14px', color: 'var(--green)', margin: '0 0 12px', fontWeight: 600 }}>
                Saved to “{savedTo}”.
              </p>
            )}
            {loadingList ? (
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Loading…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {collections.length === 0 && (
                  <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>
                    No collections yet — create your first one below.
                  </p>
                )}
                {collections.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void addTo(c.id, c.name)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minHeight: '44px', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 400, flexShrink: 0, marginLeft: '10px' }}>
                      {c._count?.items ?? 0} item{(c._count?.items ?? 0) === 1 ? '' : 's'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={createAndAdd} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New collection name…"
                maxLength={60}
                style={{ flex: 1, minHeight: '44px', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '14px' }}
              />
              <button
                type="submit"
                disabled={busy || !newName.trim()}
                style={{ minHeight: '44px', padding: '0 16px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: busy || !newName.trim() ? 'not-allowed' : 'pointer', opacity: busy || !newName.trim() ? 0.6 : 1 }}
              >
                Create
              </button>
            </form>
            {error && <p style={{ color: 'var(--red)', fontSize: '13.5px', margin: '10px 0 0' }}>{error}</p>}
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '14px 0 0' }}>
              <a href="/account/collections" style={{ color: 'var(--accent)' }}>View all your collections →</a>
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
