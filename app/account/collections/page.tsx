'use client'

// My Collections (Velor Social stage 3, 2026-07-29). Private curation:
// collections are visible only to their owner (docs/osa/dpia-velor-social.md
// -- no public browsing surface at launch). Renders an honest "not enabled"
// state if the feature flag is ever off.

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CollectionItem {
  productId: string
  product: { title: string; images: string[]; price: number; status: string }
}

interface Collection {
  id: string
  name: string
  isPublic: boolean
  createdAt: string
  items: CollectionItem[]
  _count: { items: number }
}

export default function CollectionsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'disabled'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/sign-in?callbackUrl=/account/collections')
  }, [status, router])

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/social/collections')
      if (r.status === 403) { setState('disabled'); return }
      if (!r.ok) { setState('ready'); return }
      const data = await r.json()
      setCollections(Array.isArray(data.collections) ? data.collections : [])
      setState('ready')
    } catch {
      setState('ready')
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') void load()
  }, [status, load])

  async function removeItem(collectionId: string, productId: string) {
    setBusyId(collectionId)
    try {
      await fetch('/api/social/collections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, productId }),
      })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function deleteCollection(collectionId: string, name: string) {
    if (!window.confirm(`Delete the collection “${name}”? The items themselves are not affected.`)) return
    setBusyId(collectionId)
    try {
      await fetch('/api/social/collections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId }),
      })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '6px' }}>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', margin: 0 }}>Your collections</h1>
        <Link href="/account/following" style={{ fontSize: '13.5px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Sellers you follow →
        </Link>
      </div>
      <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 30px' }}>
        Private to you. Save pieces from any listing page with “Save to collection”.
      </p>

      {state === 'loading' && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

      {state === 'disabled' && (
        <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
          Collections aren&apos;t switched on right now. Check back soon.
        </p>
      )}

      {state === 'ready' && collections.length === 0 && (
        <div style={{ border: '1px dashed var(--border)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', margin: '0 0 8px' }}>No collections yet</p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px' }}>
            Find something you love and tap “Save to collection” on its page.
          </p>
          <Link href="/shop" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: '999px', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
            Browse the marketplace
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
        {collections.map(c => (
          <section key={c.id} style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '19px', margin: 0 }}>{c.name}</h2>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                  {c._count.items} item{c._count.items === 1 ? '' : 's'} · Private
                </span>
              </div>
              <button
                type="button"
                onClick={() => void deleteCollection(c.id, c.name)}
                disabled={busyId === c.id}
                style={{ background: 'none', border: 'none', padding: '8px', fontSize: '12.5px', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Delete collection
              </button>
            </div>
            {c.items.length === 0 ? (
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>Nothing saved here yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' }}>
                {c.items.map(it => (
                  <div key={it.productId} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--surface-2)' }}>
                    <Link href={`/shop/${it.productId}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                      <div style={{ aspectRatio: '1', background: 'var(--border)', overflow: 'hidden' }}>
                        {it.product.images?.[0] && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={it.product.images[0]} alt={it.product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div style={{ padding: '8px 10px 4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.product.title}</div>
                        <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                          £{Number(it.product.price).toFixed(2)}
                          {it.product.status !== 'APPROVED' && <span> · no longer available</span>}
                        </div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void removeItem(c.id, it.productId)}
                      disabled={busyId === c.id}
                      style={{ display: 'block', width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border)', padding: '7px', fontSize: '11.5px', color: 'var(--muted)', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
