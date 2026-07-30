'use client'

// Maker Journal composer (Velor Social stage 4, 2026-07-29; extended
// 2026-07-30 for William's Makers' Circle journal page). The plan's
// "studio journal that sells": a seller documents their process for their
// own record; their storefront, the Workshop Feed and the Makers' Circle
// journal page are views over these posts. This composer captures
// everything the public journal page displays: title, story, photos, a
// video link, the optional story sections (Making process / Notes & tips
// / Behind the scenes -- the page's tabs), and up to FOUR shoppable
// listings ("Shop products from this journal"). Entries can be edited and
// deleted after publishing (William: "they can edit inside it for their
// journal").

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface OwnProduct { id: string; name?: string; title?: string }

interface JournalPost {
  id: string
  title: string | null
  body: string
  images: string[]
  videoUrl: string | null
  status: string
  createdAt: string
  makingProcess: string | null
  notesTips: string | null
  behindScenes: string | null
  productIds: string[]
  category: string | null
  scheduledAt: string | null
  product: { id: string; title: string } | null
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 0,
  padding: '24px',
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: 0,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontSize: '14.5px',
  boxSizing: 'border-box',
}

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  margin: '0 0 6px',
}

const MAX_IMAGES = 6
const MAX_LINKED_PRODUCTS = 4

function JournalComposer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editParam = searchParams?.get('edit') ?? null
  const [posts, setPosts] = useState<JournalPost[]>([])
  const [products, setProducts] = useState<OwnProduct[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'disabled'>('loading')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [makingProcess, setMakingProcess] = useState('')
  const [notesTips, setNotesTips] = useState('')
  const [behindScenes, setBehindScenes] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showSections, setShowSections] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [publishMode, setPublishMode] = useState<'PUBLISHED' | 'DRAFT' | 'SCHEDULED'>('PUBLISHED')
  const [scheduledAt, setScheduledAt] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [posted, setPosted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/social/journal')
      if (r.status === 403) { setState('disabled'); return }
      if (!r.ok) { setState('ready'); return }
      const data = await r.json()
      const list: JournalPost[] = Array.isArray(data.posts) ? data.posts : []
      setPosts(list)
      setState('ready')
      if (editParam) {
        const target = list.find(p => p.id === editParam)
        if (target) startEdit(target)
      }
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

  function toggleProduct(id: string) {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_LINKED_PRODUCTS
          ? [...prev, id]
          : prev,
    )
  }

  function resetForm() {
    setTitle(''); setBody(''); setImages([]); setVideoUrl('')
    setMakingProcess(''); setNotesTips(''); setBehindScenes('')
    setSelectedProducts([]); setShowSections(false); setEditingId(null)
    setCategory(''); setPublishMode('PUBLISHED'); setScheduledAt('')
  }

  function startEdit(p: JournalPost) {
    setEditingId(p.id)
    setTitle(p.title ?? '')
    setBody(p.body)
    setImages(p.images)
    setVideoUrl(p.videoUrl ?? '')
    setMakingProcess(p.makingProcess ?? '')
    setNotesTips(p.notesTips ?? '')
    setBehindScenes(p.behindScenes ?? '')
    setSelectedProducts(p.productIds?.length ? p.productIds : p.product ? [p.product.id] : [])
    setShowSections(Boolean(p.makingProcess || p.notesTips || p.behindScenes))
    setCategory(p.category ?? '')
    const mode = p.status === 'DRAFT' ? 'DRAFT' : p.status === 'SCHEDULED' ? 'SCHEDULED' : 'PUBLISHED'
    setPublishMode(mode)
    setScheduledAt(p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : '')
    setPosted(false)
    setError('')
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault()
    if (posting) return
    setPosting(true)
    setError('')
    setPosted(false)
    try {
      const payload = {
        title,
        body,
        images,
        videoUrl: videoUrl || null,
        makingProcess: makingProcess || null,
        notesTips: notesTips || null,
        behindScenes: behindScenes || null,
        productIds: selectedProducts,
        category: category || null,
        status: publishMode,
        scheduledAt: publishMode === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }
      const r = await fetch('/api/social/journal', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, postId: editingId } : payload),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) { setError(data.error || 'Could not publish. Please try again.'); return }
      router.push('/dashboard/journal')
      return
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
    if (editingId === postId) resetForm()
    await load()
  }

  const productName = (id: string) => {
    const p = products.find(x => x.id === id)
    return p ? (p.name || p.title || 'Listing') : 'Listing'
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px 80px', position: 'relative', zIndex: 1, fontFamily: 'var(--font-body)' }}>
      <Link href="/dashboard/journal" style={{ fontSize: 12.5, color: 'var(--muted)', textDecoration: 'none' }}>&larr; Creator Journals</Link>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', margin: '14px 0 4px' }}>Sell</div>
      <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', margin: '0 0 6px' }}>{editingId ? 'Edit journal entry' : 'New journal entry'}</h1>
      <p style={{ fontSize: '14.5px', color: 'var(--muted)', margin: '0 0 26px', maxWidth: '560px', lineHeight: 1.6 }}>
        Show the work behind the work — progress photos, materials, the story of a piece.
        Entries appear on your public storefront and in the Makers&rsquo; Circle, and buyers
        who follow you will see them. Link your listings and every entry becomes a quiet
        shop window.
      </p>

      {state === 'disabled' && (
        <div style={card}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14.5px' }}>The journal isn&apos;t switched on right now. Check back soon.</p>
        </div>
      )}

      {state !== 'disabled' && (
        <>
          <form ref={formRef} onSubmit={publish} style={{ ...card, marginBottom: '30px' }}>
            {editingId && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, padding: '8px 12px', borderRadius: 0, background: 'var(--surface-2)', fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Editing an entry</span>
                <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5 }}>
                  Cancel edit
                </button>
              </div>
            )}

            <input
              style={{ ...input, fontWeight: 600, marginBottom: '10px' }}
              type="text"
              placeholder="Title (optional) — e.g. Day 12 — Glazing day in the studio"
              maxLength={120}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              style={{ ...input, minHeight: '110px', resize: 'vertical', marginBottom: '12px' }}
              placeholder="The story. What are you working on? Buyers love the process — the wheel, the loom, the forge…"
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
                <div key={i} style={{ position: 'relative', width: '72px', height: '72px', borderRadius: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImages(prev => prev.filter((_, x) => x !== i))}
                    style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 0, border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, lineHeight: 1, cursor: 'pointer' }}
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
                  style={{ width: '72px', height: '72px', borderRadius: 0, border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: '24px', cursor: 'pointer' }}
                >
                  +
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { addPhotos(e.target.files); e.target.value = '' }} />
            </div>

            <input
              style={{ ...input, marginBottom: '14px' }}
              type="url"
              placeholder="Video link (optional, YouTube or Vimeo)"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
            />

            {/* Optional story sections -- the public journal page's tabs. */}
            <div style={{ marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setShowSections(v => !v)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {showSections ? '− Hide story sections' : '+ Add story sections (Making process, Notes & tips, Behind the scenes)'}
              </button>
              {showSections && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  <div>
                    <p style={sectionLabel}>Making process</p>
                    <textarea
                      style={{ ...input, minHeight: '80px', resize: 'vertical' }}
                      placeholder="How this piece is made — the steps, the tools, the hours."
                      maxLength={4000}
                      value={makingProcess}
                      onChange={e => setMakingProcess(e.target.value)}
                    />
                  </div>
                  <div>
                    <p style={sectionLabel}>Notes &amp; tips</p>
                    <textarea
                      style={{ ...input, minHeight: '80px', resize: 'vertical' }}
                      placeholder="What you learned, what you'd tell another maker or a curious buyer."
                      maxLength={4000}
                      value={notesTips}
                      onChange={e => setNotesTips(e.target.value)}
                    />
                  </div>
                  <div>
                    <p style={sectionLabel}>Behind the scenes</p>
                    <textarea
                      style={{ ...input, minHeight: '80px', resize: 'vertical' }}
                      placeholder="The studio, the mess, the morning light — the bits buyers never usually see."
                      maxLength={4000}
                      value={behindScenes}
                      onChange={e => setBehindScenes(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Shoppable listings -- up to four, shown on the journal page as
                "Shop products from this journal". */}
            {products.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <p style={sectionLabel}>
                  Shop products from this entry ({selectedProducts.length}/{MAX_LINKED_PRODUCTS})
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {products.map(p => {
                    const on = selectedProducts.includes(p.id)
                    const full = !on && selectedProducts.length >= MAX_LINKED_PRODUCTS
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        disabled={full}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 0,
                          border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                          background: on ? 'var(--accent)' : 'transparent',
                          color: on ? '#fff' : 'var(--text)',
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: full ? 'not-allowed' : 'pointer',
                          opacity: full ? 0.45 : 1,
                        }}
                      >
                        {p.name || p.title}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <p style={sectionLabel}>Category (optional)</p>
              <input
                style={input}
                type="text"
                list="journal-categories"
                placeholder="e.g. Weaving, New designs, Studio life"
                maxLength={40}
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
              <datalist id="journal-categories">
                {Array.from(new Set(posts.map(p => p.category).filter(Boolean) as string[])).map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <p style={sectionLabel}>When should this go live?</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {([
                  ['PUBLISHED', 'Publish now'],
                  ['DRAFT', 'Save as draft'],
                  ['SCHEDULED', 'Schedule'],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPublishMode(mode)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 0,
                      border: `1.5px solid ${publishMode === mode ? 'var(--accent)' : 'var(--border)'}`,
                      background: publishMode === mode ? 'var(--accent)' : 'transparent',
                      color: publishMode === mode ? '#fff' : 'var(--text)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {publishMode === 'SCHEDULED' && (
                <input
                  style={{ ...input, marginTop: 10, maxWidth: 260 }}
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  aria-label="Schedule date and time"
                  required
                />
              )}
            </div>

            {error && <p style={{ color: 'var(--red)', fontSize: '13.5px', margin: '0 0 10px' }}>{error}</p>}
            {posted && <p style={{ color: 'var(--green)', fontSize: '13.5px', fontWeight: 600, margin: '0 0 10px' }}>Saved — it&apos;s live on your storefront.</p>}

            <button
              type="submit"
              disabled={posting || !body.trim()}
              style={{ minHeight: '44px', padding: '0 28px', borderRadius: 0, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: posting || !body.trim() ? 'not-allowed' : 'pointer', opacity: posting || !body.trim() ? 0.6 : 1 }}
            >
              {posting
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : publishMode === 'DRAFT'
                    ? 'Save draft'
                    : publishMode === 'SCHEDULED'
                      ? 'Schedule entry'
                      : 'Publish entry'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function NewJournalEntryPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)' }}>Loading&hellip;</div>}>
      <JournalComposer />
    </Suspense>
  )
}
