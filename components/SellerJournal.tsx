'use client'

// Public Maker Journal section for a seller's storefront (Velor Social
// stage 4, 2026-07-29). Fetches /api/social/journal?sellerId= and renders
// the maker's process diary. Renders NOTHING while the feature flag is off
// or if the maker hasn't written anything -- an empty journal never shows
// as an empty box. Every entry carries its own report route per the signed
// online safety policy.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReportContentButton from '@/components/ReportContentButton'

interface JournalEntry {
  id: string
  title: string | null
  body: string
  images: string[]
  videoUrl: string | null
  createdAt: string
  product: { id: string; title: string; images: string[]; status: string } | null
}

export default function SellerJournal({ sellerId, storeName }: { sellerId: string; storeName: string }) {
  const [posts, setPosts] = useState<JournalEntry[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/social/journal?sellerId=${encodeURIComponent(sellerId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d && Array.isArray(d.posts)) {
          setPosts(d.posts)
          setNextCursor(d.nextCursor ?? null)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [sellerId])

  if (posts.length === 0) return null

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const d = await fetch(`/api/social/journal?sellerId=${encodeURIComponent(sellerId)}&cursor=${encodeURIComponent(nextCursor)}`)
        .then(r => (r.ok ? r.json() : null))
      if (d && Array.isArray(d.posts)) {
        setPosts(prev => [...prev, ...d.posts])
        setNextCursor(d.nextCursor ?? null)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section style={{ marginTop: '48px' }}>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '4px' }}>
          From the workshop
        </div>
        <h2 style={{ fontSize: '24px', margin: 0 }}>
          {storeName}&apos;s maker journal
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {posts.map(p => (
          <article key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div style={{ minWidth: 0 }}>
                {p.title && <h3 style={{ fontSize: '17px', margin: '0 0 2px' }}>{p.title}</h3>}
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <ReportContentButton contentType="JOURNAL" contentId={p.id} />
            </div>
            <p style={{ fontSize: '14.5px', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0 0 12px' }}>{p.body}</p>
            {p.images.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {p.images.map((img, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={img} alt="" style={{ width: 'min(180px, 42vw)', aspectRatio: '1', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border)' }} />
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
                  <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.product.title}
                  </span>
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
          style={{ marginTop: '16px', minHeight: '44px', padding: '10px 24px', borderRadius: '999px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          {loadingMore ? 'Loading…' : 'Older entries'}
        </button>
      )}
    </section>
  )
}
