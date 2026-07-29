'use client'

// Maker Journal composer (Velor Social stage 4, 2026-07-29). The plan's
// "studio journal that sells": a seller documents their process for their
// own record; their storefront (and later the Workshop Feed) is simply a
// view over these posts. Ease-of-use bar per William's standing strategy:
// one box, tap-to-add photos, optional link to one of their own listings.

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

interface OwnProduct { id: string; name?: string; title?: string }

interface JournalPost {
  id: string
  title: string | null
  body: string
  images: string[]
  videoUrl: string | null
  status: string
  createdAt: string
  product: { id: string; title: string } | null
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '24px',
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontSize: '14.5px',
  boxSizing: 'border-box',
}

const MAX_IMAGES = 6

export default function JournalPage() {
  const [posts, setPosts] = useState<JournalPost[]>([])
  const [products, setProducts] = useState<OwnProduct[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'disabled'>('loading')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [productId, setProductId] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [posted, setPosted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/social/journal')
      if (r.status === 403) { setState('disabled'); return }
      if (!r.ok) { setState('ready'); return }
      const data = await r.json()
      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setState('ready')
    } catch {
      setState('ready')
    }
  }, [])

  useEffect(() => {
    void load()
    fetch('/api/dashboard/products')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list = Array.isArray(d?.products) ? d.products : Array.isArray(d) ? d : []
        setProducts(list)
      })
      .catch(() => {})
  }, [load])

  function addPhotos(files: FileList | null) {
    if (!files) return
    const room = MAX_IMAGES - images.length
    Array.from(files).slice(0, room).forEach(f => {
      if (!f.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => prev.length < MAX_IMAGES ? [...prev, reader.result as string] : prev)
        }
      }
      reader.readAsDataURL(f)
    })
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault()
    if (posting) return
    setPosting(true)
    setError('')
    setPosted(false)
    try {
      const r = await fetch('/api/social/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          images,
          videoUrl: videoUrl || null,
          productId: productId || null,
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) { setError(data.error || 'Could not publish. Please try again.'); return }
      setTitle(''); setBody(''); setImages([]); setVideoUrl(''); setProductId('')
      setPosted(true)
      await load()
    } catch {
      setError('Could not publish. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  async function remove(postId: string) {
    if (!window.confirm('Delete this journal entry?')) return
    await fetch('/api/social/journal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    await load()
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px 80px', position: 'relative', zIndex: 1, fontFamily: 'var(--font-body)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>Sell</div>
      <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', margin: '0 0 6px' }}>Your maker journal</h1>
      <p style={{ fontSize: '14.5px', color: 'var(--muted)', margin: '0 0 26px', maxWidth: '560px', lineHeight: 1.6 }}>
        Show the work behind the work — progress photos, materials, the story of a piece.
        Entries appear on your public storefront, and buyers who follow you will see them.
        Link a listing and every entry becomes a quiet shop window.
      </p>

      {state === 'disabled' && (
        <div style={card}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14.5px' }}>The journal isn&apos;t switched on right now. Check back soon.</p>
        </div>
      )}

      {state !== 'disabled' && (
        <>
          <form onSubmit={publish} style={{ ...card, marginBottom: '30px' }}>
            <input
              style={{ ...input, fontWeight: 600, marginBottom: '10px' }}
              type="text"
              placeholder="Title (optional) — e.g. Glazing day in the studio"
              maxLength={120}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              style={{ ...input, minHeight: '110px', resize: 'vertical', marginBottom: '12px' }}
              placeholder="What are you working on? Buyers love the process — the wheel, the loom, the forge…"
              maxLength={4000}
              required
              value={body}
              onChange={e => setBody(e.target.value)}
            />

            {/* Photo strip -- same +-to-add pattern as the listing form's
                variant photos: thumbnails with a corner remove, one + box,
                never a row of empty placeholders. */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImages(prev => prev.filter((_, x) => x !== i))}
                    style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, lineHeight: 1, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Add photos"
                  style={{ width: '72px', height: '72px', borderRadius: '10px', border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: '24px', cursor: 'pointer' }}
                >
                  +
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { addPhotos(e.target.files); e.target.value = '' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              <input
                style={input}
                type="url"
                placeholder="Video link (optional, YouTube or Vimeo)"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
              />
              <select style={input} value={productId} onChange={e => setProductId(e.target.value)} aria-label="Link a listing">
                <option value="">Link a listing (optional)</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.title}</option>
                ))}
              </select>
            </div>

            {error && <p style={{ color: 'var(--red)', fontSize: '13.5px', margin: '0 0 10px' }}>{error}</p>}
            {posted && <p style={{ color: 'var(--green)', fontSize: '13.5px', fontWeight: 600, margin: '0 0 10px' }}>Published — it&apos;s live on your storefront.</p>}

            <button
              type="submit"
              disabled={posting || !body.trim()}
              style={{ minHeight: '44px', padding: '0 28px', borderRadius: '999px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: posting || !body.trim() ? 'not-allowed' : 'pointer', opacity: posting || !body.trim() ? 0.6 : 1 }}
            >
              {posting ? 'Publishing…' : 'Publish entry'}
            </button>
          </form>

          <h2 style={{ fontSize: '19px', margin: '0 0 14px' }}>
            {state === 'loading' ? 'Loading…' : posts.length ? `Your entries (${posts.length})` : 'No entries yet'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {posts.map(p => (
              <article key={p.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    {p.title && <h3 style={{ fontSize: '16.5px', margin: '0 0 2px' }}>{p.title}</h3>}
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {p.status !== 'PUBLISHED' && <span style={{ color: 'var(--red)', fontWeight: 700 }}> · hidden by moderation</span>}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(p.id)}
                    style={{ background: 'none', border: 'none', padding: '6px', fontSize: '12px', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: '8px 0 10px' }}>{p.body}</p>
                {p.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {p.images.map((img, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={i} src={img} alt="" style={{ width: '86px', height: '86px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px' }}>
                  {p.videoUrl && <span style={{ color: 'var(--muted)' }}>▶ Video attached</span>}
                  {p.product && (
                    <Link href={`/shop/${p.product.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                      Linked listing: {p.product.title}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
