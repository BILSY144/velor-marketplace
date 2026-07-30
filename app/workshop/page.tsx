'use client'

// The Workshop Feed (Velor Social stage 5, 2026-07-29): every maker's
// journal, one stream, STRICTLY newest-first -- no algorithm, no ranking,
// no autoplay, no infinite scroll (a deliberate "Older entries" button:
// healthy by design, LAW #4 item 3). The feed is a view over journals;
// there is nothing to post here -- makers write from their dashboard.

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import ReportContentButton from '@/components/ReportContentButton'
import FollowSellerButton from '@/components/FollowSellerButton'

interface FeedPost {
  id: string
  title: string | null
  body: string
  images: string[]
  videoUrl: string | null
  createdAt: string
  seller: { id: string; storeName: string; storeLogo: string | null; country: string | null; foundingBadge: boolean }
  product: { id: string; title: string; images: string[]; status: string } | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function WorkshopFeedPage() {
  const { data: session } = useSession()
  const [scope, setScope] = useState<'all' | 'following'>('all')
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'disabled'>('loading')
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async (which: 'all' | 'following') => {
    setState('loading')
    try {
      const r = await fetch(`/api/social/feed?scope=${which}`)
      if (r.status === 403) { setState('disabled'); return }
      if (r.status === 401) { setPosts([]); setNextCursor(null); setState('ready'); return }
      if (!r.ok) { setState('ready'); return }
      const data = await r.json()
      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setNextCursor(data.nextCursor ?? null)
      setState('ready')
    } catch {
      setState('ready')
    }
  }, [])

  useEffect(() => { void load(scope) }, [scope, load])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const d = await fetch(`/api/social/feed?scope=${scope}&cursor=${encodeURIComponent(nextCursor)}`)
        .then(r => (r.ok ? r.json() : null))
      if (d && Array.isArray(d.posts)) {
        setPosts(prev => [...prev, ...d.posts])
        setNextCursor(d.nextCursor ?? null)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    minHeight: '42px',
    padding: '9px 22px',
    borderRadius: '999px',
    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text)',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  })

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'var(--font-body)' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
        The Workshop Feed
      </div>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', margin: '0 0 10px', lineHeight: 1.1 }}>
        Fresh from the workshop
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.65, margin: '0 0 24px', maxWidth: '560px' }}>
        Real makers, documenting real work — newest first, every time. No algorithm
        decides what you see here.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
        <button type="button" style={tabStyle(scope === 'all')} onClick={() => setScope('all')}>All makers</button>
        <button type="button" style={tabStyle(scope === 'following')} onClick={() => setScope('following')}>Following</button>
      </div>

      {state === 'disabled' && (
        <p style={{ color: 'var(--muted)', fontSize: '15px' }}>The Workshop Feed isn&apos;t switched on right now. Check back soon.</p>
      )}

      {state === 'loading' && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

      {state === 'ready' && posts.length === 0 && (
        <div style={{ border: '1px dashed var(--border)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
          {scope === 'following' ? (
            !session ? (
              <>
                <p style={{ fontSize: '16px', margin: '0 0 8px' }}>Sign in to see makers you follow</p>
                <Link href="/auth/sign-in?callbackUrl=/workshop" style={{ display: 'inline-block', marginTop: '8px', padding: '11px 24px', borderRadius: '999px', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </>
            ) : (
              <>
                <p style={{ fontSize: '16px', margin: '0 0 8px' }}>You&apos;re not following anyone yet</p>
                <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                  Follow a maker from their storefront — their workshop entries will land here.
                </p>
              </>
            )
          ) : (
            <>
              <p style={{ fontSize: '16px', margin: '0 0 8px' }}>The workshops are quiet right now</p>
              <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                Makers post their works-in-progress here. Check back soon — or{' '}
                <Link href="/shop" style={{ color: 'var(--accent)' }}>browse what&apos;s already finished</Link>.
              </p>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {posts.map(p => (
          <article key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 22px' }}>
            {/* Maker header -- links to the maker's real Journal page
                (/community/journals/[sellerId]), not their plain storefront.
                William, 2026-07-30: clicking through from a journal post in
                the Makers' Circle was landing on the storefront's small
                embedded diary section instead of the full journal page. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <Link href={`/community/journals/${p.seller.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text)', minWidth: 0 }}>
                <span style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
                  {p.seller.storeLogo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.seller.storeLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    p.seller.storeName?.[0]?.toUpperCase() || '?'
                  )}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '14.5px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.seller.storeName}
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>
                    {p.seller.country || 'Maker'} · {timeAgo(p.createdAt)}
                  </span>
                </span>
              </Link>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FollowSellerButton sellerId={p.seller.id} compact />
                <ReportContentButton contentType="JOURNAL" contentId={p.id} />
              </div>
            </div>

            {p.title && <h2 style={{ fontSize: '18px', margin: '0 0 6px' }}>{p.title}</h2>}
            <p style={{ fontSize: '14.5px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0 0 12px', color: 'var(--text)' }}>{p.body}</p>

            {p.images.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {p.images.map((img, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={img} alt="" style={{ width: p.images.length === 1 ? '100%' : 'min(200px, 44vw)', maxHeight: p.images.length === 1 ? '420px' : undefined, aspectRatio: p.images.length === 1 ? undefined : '1', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border)' }} />
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              {p.videoUrl && (
                <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  ▶ Watch the process video
                </a>
              )}
              {p.product && p.product.status === 'APPROVED' && (
                <Link href={`/shop/${p.product.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', borderRadius: '999px', padding: '6px 14px 6px 6px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                  {p.product.images?.[0] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.product.images[0]} alt="" style={{ width: '28px', height: '28px', borderRadius: '999px', objectFit: 'cover' }} />
                  )}
                  <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product.title}</span>
                  <span style={{ color: 'var(--accent)' }}>→</span>
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {nextCursor && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          style={{ marginTop: '18px', minHeight: '44px', padding: '10px 26px', borderRadius: '999px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          {loadingMore ? 'Loading…' : 'Older entries'}
        </button>
      )}
    </main>
  )
}
