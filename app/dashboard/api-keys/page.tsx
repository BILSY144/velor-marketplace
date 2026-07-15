'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { PlanBadge } from '@/lib/dashboard-theme'

interface ApiKeyRecord {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

// This entire page is gated Pro-only server-side (see the 403 check
// below), so every card here uses the premium treatment directly —
// there's no Starter/Pro variant of this page to preserve.
const goldCard: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,180,60,0.08), var(--surface) 55%)',
  border: '1px solid rgba(255,213,74,0.32)',
  borderRadius: 12,
  boxShadow: '0 10px 34px rgba(255,180,60,0.14)',
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isEnterprise, setIsEnterprise] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/api-keys')
      const data = await res.json()
      if (res.status === 403) {
        setIsEnterprise(false)
      } else if (res.ok) {
        setIsEnterprise(true)
        setKeys(data.keys || [])
      }
    } catch {
      setError('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create key')
      } else {
        setRevealedKey(data.key)
        setNewKeyName('')
        fetchKeys()
      }
    } catch {
      setError('Failed to create key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    try {
      await fetch(`/api/dashboard/api-keys?id=${id}`, { method: 'DELETE' })
      fetchKeys()
    } catch {
      setError('Failed to revoke key')
    }
  }

  if (loading) {
    return <div style={{ padding: '48px', color: 'var(--muted)' }}>Loading...</div>
  }

  if (!isEnterprise) {
    return (
      <div style={{ padding: '48px', maxWidth: '640px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '28px', marginBottom: '16px' }}>API Access</h1>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
            API key access for programmatic product and order retrieval is available on the Pro plan.
          </p>
          <Link href="/dashboard/upgrade/pro" style={{ display: 'inline-block', background: 'linear-gradient(90deg, #FFD54A, #FF6B00)', color: '#111', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
            Upgrade to Pro
          </Link>
        </div>
      </div>
    )
  }

  const activeCount = keys.filter((k) => !k.revokedAt).length

  return (
    <div style={{ padding: '48px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '8px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '28px', margin: 0 }}>API Access</h1>
        <PlanBadge tier="ENTERPRISE" />
      </div>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
        Generate API keys to read your products programmatically. Keys are shown once at creation, so store them securely.
      </p>

      {revealedKey && (
        <div style={{ ...goldCard, padding: '20px', marginBottom: '24px' }}>
          <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '8px' }}>Your new API key - copy it now, it will not be shown again</p>
          <code style={{ display: 'block', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--green)', wordBreak: 'break-all', fontSize: '14px', marginBottom: '12px' }}>{revealedKey}</code>
          <button onClick={() => setRevealedKey(null)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>
            Dismiss
          </button>
        </div>
      )}

      {error && <div style={{ color: 'var(--red)', marginBottom: '16px' }}>{error}</div>}

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <input
          type="text"
          placeholder="Key name (e.g. Inventory sync)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text)' }}
        />
        <button
          type="submit"
          disabled={creating || activeCount >= 5}
          style={{ background: 'linear-gradient(90deg, #FFD54A, #FF6B00)', color: '#111', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 800, cursor: 'pointer', opacity: creating ? 0.6 : 1 }}
        >
          {creating ? 'Generating...' : 'Generate key'}
        </button>
      </form>

      <div style={{ ...goldCard, overflow: 'hidden', marginBottom: '32px' }}>
        {keys.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--muted)' }}>No API keys yet.</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ color: 'var(--text)', fontWeight: 600 }}>{k.name}</p>
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  {k.keyPrefix}... - created {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt ? ` - last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' - never used'}
                  {k.revokedAt ? ' - REVOKED' : ''}
                </p>
              </div>
              {!k.revokedAt && (
                <button onClick={() => handleRevoke(k.id)} style={{ background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>
                  Revoke
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ ...goldCard, padding: '20px' }}>
        <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '12px' }}>Usage example</p>
        <pre style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', color: 'var(--muted)', fontSize: '13px', overflowX: 'auto' }}>
          {`curl https://velorcommerce.store/api/v1/products \\
  -H "Authorization: Bearer vlk_live_..."`}
        </pre>
      </div>
    </div>
  )
}
