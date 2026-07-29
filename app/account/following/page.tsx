'use client'

// Sellers you follow (Velor Social stage 3, 2026-07-29). Private list --
// only the follower sees it (docs/osa/dpia-velor-social.md: no public
// follower lists at launch).

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FollowEntry {
  sellerId: string
  createdAt: string
  seller: { storeName: string; storeLogo: string | null; country: string | null; foundingBadge: boolean }
}

export default function FollowingPage() {
  const { status } = useSession()
  const router = useRouter()
  const [follows, setFollows] = useState<FollowEntry[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'disabled'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/sign-in?callbackUrl=/account/following')
  }, [status, router])

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/social/follows')
      if (r.status === 403) { setState('disabled'); return }
      if (!r.ok) { setState('ready'); return }
      const data = await r.json()
      setFollows(Array.isArray(data.follows) ? data.follows : [])
      setState('ready')
    } catch {
      setState('ready')
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') void load()
  }, [status, load])

  async function unfollow(sellerId: string) {
    setBusyId(sellerId)
    try {
      await fetch('/api/social/follows', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId }),
      })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '6px' }}>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', margin: 0 }}>Sellers you follow</h1>
        <Link href="/account/collections" style={{ fontSize: '13.5px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Your collections →
        </Link>
      </div>
      <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 30px' }}>
        Private to you — sellers see follower counts, never names. Their workshop
        entries appear in <Link href="/workshop" style={{ color: 'var(--accent)' }}>your feed</Link>.
      </p>

      {state === 'loading' && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

      {state === 'disabled' && (
        <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
          Following isn&apos;t switched on right now. Check back soon.
        </p>
      )}

      {state === 'ready' && follows.length === 0 && (
        <div style={{ border: '1px dashed var(--border)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', margin: '0 0 8px' }}>You&apos;re not following anyone yet</p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px' }}>
            Follow a maker from their storefront or any of their listings.
          </p>
          <Link href="/shop" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: '999px', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
            Browse the marketplace
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {follows.map(f => (
          <div key={f.sellerId} style={{ display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', background: 'var(--surface)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
              {f.seller.storeLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={f.seller.storeLogo} alt={f.seller.storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                f.seller.storeName?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/seller/${f.sellerId}`} style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
                {f.seller.storeName}
              </Link>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                {f.seller.country || ''}
                {f.seller.foundingBadge ? (f.seller.country ? ' · Founding seller' : 'Founding seller') : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void unfollow(f.sellerId)}
              disabled={busyId === f.sellerId}
              style={{ minHeight: '38px', padding: '7px 16px', borderRadius: '999px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
            >
              {busyId === f.sellerId ? '…' : 'Unfollow'}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
