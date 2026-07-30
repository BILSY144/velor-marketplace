'use client'

// CREATOR JOURNALS -- the seller's journal studio (William's dashboard
// design, 2026-07-30, replicated pixel-for-pixel per his order: "make it
// exactly the same as my design, exactly the same pixel for pixel").
// Every figure on this page is the signed-in seller's REAL data (his
// explicit choice: counters are genuine and start at zero); the layout,
// palette, tiles, tabs, table, chips, action icons and footer cards
// mirror the design 1:1. Entries are created/edited in the composer at
// /dashboard/journal/new.

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface JournalPost {
  id: string
  title: string | null
  body: string
  images: string[]
  videoUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  category: string | null
  featured: boolean
  viewCount: number
  productClicks: number
  salesCount: number
  makingProcess: string | null
  notesTips: string | null
  behindScenes: string | null
  productIds: string[]
  product?: { id: string } | null
  _count: { likes: number; comments: number }
}

function fmtK(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

function Ico({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const P = {
  doc: 'M6 2h9l4 4v16H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM14 2v5h5M9 12h7M9 16h7',
  docCheck: 'M6 2h9l4 4v16H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM14 2v5h5M9 14l2 2 4-4',
  draft: 'M6 2h9l4 4v16H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM14 2v5h5M9 13h4',
  calendar: 'M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9h16M8 2v4M16 2v4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  heart: 'M12 21C7 16.5 3.5 13.2 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .8 3.9 2a4.9 4.9 0 0 1 3.9-2 4.6 4.6 0 0 1 4.6 4.6c0 3.6-3.5 6.9-8.5 11.4z',
  comment: 'M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10z',
  bag: 'M6 7h12l1.5 14h-15L6 7zM9 10V7a3 3 0 0 1 6 0v3',
  folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z',
  plus: 'M12 5v14M5 12h14',
  search: 'M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',
  filter: 'M3 5h18l-7 8v6l-4-2v-4L3 5z',
  pencil: 'M17 3l4 4L8 20l-5 1 1-5L17 3z',
  chart: 'M4 20V10M10 20V4M16 20v-8M20 20H4',
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',
  pen2: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  medal: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14L7 22l5-3 5 3-1.5-8',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-3.5 3-5.5 7-5.5s7 2 7 5.5M17 3.5a4 4 0 0 1 0 7.6M22 21c0-3-2-4.8-5-5.4',
}

/* eslint-disable @next/next/no-img-element */

export default function CreatorJournalsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<JournalPost[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'disabled'>('loading')
  const [tab, setTab] = useState<'all' | 'published' | 'drafts' | 'scheduled' | 'archived' | 'featured'>('all')
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sortNewest, setSortNewest] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [catsOpen, setCatsOpen] = useState(false)
  const [renameFrom, setRenameFrom] = useState('')
  const [renameTo, setRenameTo] = useState('')
  const [sellerId, setSellerId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

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
    fetch('/api/seller/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.id) setSellerId(d.id) })
      .catch(() => {})
  }, [load])

  const counts = useMemo(() => ({
    all: posts.length,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
    drafts: posts.filter(p => p.status === 'DRAFT').length,
    scheduled: posts.filter(p => p.status === 'SCHEDULED').length,
    archived: posts.filter(p => p.status === 'ARCHIVED').length,
    featured: posts.filter(p => p.featured).length,
    views: posts.reduce((s, p) => s + p.viewCount, 0),
    likes: posts.reduce((s, p) => s + p._count.likes, 0),
    comments: posts.reduce((s, p) => s + p._count.comments, 0),
    sales: posts.reduce((s, p) => s + p.salesCount, 0),
  }), [posts])

  const categories = useMemo(
    () => Array.from(new Set(posts.map(p => p.category).filter(Boolean) as string[])).sort(),
    [posts],
  )

  const filtered = useMemo(() => {
    let list = posts
    if (tab === 'published') list = list.filter(p => p.status === 'PUBLISHED')
    if (tab === 'drafts') list = list.filter(p => p.status === 'DRAFT')
    if (tab === 'scheduled') list = list.filter(p => p.status === 'SCHEDULED')
    if (tab === 'archived') list = list.filter(p => p.status === 'ARCHIVED')
    if (tab === 'featured') list = list.filter(p => p.featured)
    if (catFilter) list = list.filter(p => p.category === catFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(p => (p.title ?? '').toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
    list = [...list].sort((a, b) =>
      sortNewest
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    return list
  }, [posts, tab, catFilter, search, sortNewest])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageClamped = Math.min(page, totalPages)
  const shown = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize)

  async function setStatus(p: JournalPost, status: string) {
    setMenuFor(null)
    await fetch('/api/social/journal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: p.id,
        title: p.title ?? '',
        body: p.body,
        images: p.images,
        videoUrl: p.videoUrl,
        makingProcess: p.makingProcess,
        notesTips: p.notesTips,
        behindScenes: p.behindScenes,
        productIds: p.productIds,
        productId: p.product?.id,
        category: p.category,
        status,
        scheduledAt: status === 'SCHEDULED' ? p.scheduledAt : null,
      }),
    })
    await load()
  }

  async function remove(postId: string) {
    setMenuFor(null)
    if (!window.confirm('Delete this journal entry? This cannot be undone.')) return
    await fetch('/api/social/journal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    await load()
  }

  async function renameCategory() {
    if (!renameFrom) return
    await fetch('/api/social/journal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: renameFrom, to: renameTo }),
    })
    setRenameFrom(''); setRenameTo('')
    await load()
  }

  function share(p: JournalPost) {
    const url = sellerId ? `${window.location.origin}/seller/${sellerId}` : `${window.location.origin}/workshop`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(p.id)
      setTimeout(() => setCopied(null), 1800)
    }).catch(() => {})
  }

  function statusChip(p: JournalPost) {
    const map: Record<string, { label: string; cls: string }> = {
      PUBLISHED: { label: 'Published', cls: 'dj-chip-pub' },
      SCHEDULED: { label: 'Scheduled', cls: 'dj-chip-sched' },
      DRAFT: { label: 'Draft', cls: 'dj-chip-draft' },
      ARCHIVED: { label: 'Archived', cls: 'dj-chip-draft' },
      HIDDEN: { label: 'Hidden', cls: 'dj-chip-hidden' },
    }
    const c = map[p.status] ?? map.DRAFT
    return <span className={`dj-chip ${c.cls}`}>{c.label}</span>
  }

  const dash = <span className="dj-dash">&ndash;</span>
  const isLive = (p: JournalPost) => p.status === 'PUBLISHED' || (p.status === 'SCHEDULED' && p.scheduledAt && new Date(p.scheduledAt) <= new Date())

  const tabs = [
    { key: 'all' as const, label: 'All Journals', n: null as number | null },
    { key: 'published' as const, label: 'Published', n: counts.published },
    { key: 'drafts' as const, label: 'Drafts', n: counts.drafts },
    { key: 'scheduled' as const, label: 'Scheduled', n: counts.scheduled },
    { key: 'archived' as const, label: 'Archived', n: counts.archived },
    { key: 'featured' as const, label: 'Featured', n: counts.featured },
  ]

  const stats = [
    { label: 'Total Journals', value: String(counts.all), icon: P.doc },
    { label: 'Published', value: String(counts.published), icon: P.docCheck },
    { label: 'Drafts', value: String(counts.drafts), icon: P.draft },
    { label: 'Scheduled', value: String(counts.scheduled), icon: P.calendar },
    { label: 'Total Views', value: fmtK(counts.views), icon: P.eye },
    { label: 'Likes', value: fmtK(counts.likes), icon: P.heart },
    { label: 'Comments', value: fmtK(counts.comments), icon: P.comment },
    { label: 'Products Sold', value: fmtK(counts.sales), icon: P.bag },
  ]

  const footCards = [
    { icon: P.pen2, title: 'Write. Share. Inspire.', sub: 'Journals help you build trust, grow your audience and increase sales.', cta: 'How it works', href: '/community/journals' },
    { icon: P.medal, title: 'Featured Opportunities', sub: 'Get your journal featured on our homepage and reach thousands of readers.', cta: 'Learn more', href: '/community' },
    { icon: P.trend, title: 'Track Your Impact', sub: 'See how your stories influence readers and drive sales.', cta: 'View analytics', href: '/dashboard/analytics' },
    { icon: P.users, title: 'Join the Community', sub: 'Connect with makers worldwide, share tips and grow together.', cta: 'Visit community', href: '/community' },
  ]

  return (
    <div className="dj-page">
      <style>{css}</style>

      <div className="dj-head">
        <div>
          <h1 className="dj-title">Creator Journals</h1>
          <p className="dj-sub">Share your story, your process and your world.</p>
        </div>
        <div className="dj-head-actions">
          <button type="button" className="dj-ghostbtn" onClick={() => setCatsOpen(v => !v)}>
            <Ico d={P.folder} size={15} /> Manage Categories
          </button>
          <Link href="/dashboard/journal/new" className="dj-primarybtn">
            <Ico d={P.plus} size={14} /> Create New Journal
          </Link>
        </div>
      </div>

      {catsOpen && (
        <div className="dj-cats">
          {categories.length === 0 ? (
            <p className="dj-sub" style={{ margin: 0 }}>No categories yet &mdash; set one on an entry in the composer and it appears here.</p>
          ) : (
            <>
              <div className="dj-cats-list">
                {categories.map(c => (
                  <button key={c} type="button" className={`dj-cat ${renameFrom === c ? 'dj-cat-on' : ''}`} onClick={() => { setRenameFrom(c); setRenameTo(c) }}>
                    {c} <span className="dj-dash">({posts.filter(p => p.category === c).length})</span>
                  </button>
                ))}
              </div>
              {renameFrom && (
                <div className="dj-cats-edit">
                  <input className="dj-input" value={renameTo} onChange={e => setRenameTo(e.target.value)} maxLength={40} aria-label="New category name" />
                  <button type="button" className="dj-primarybtn" onClick={() => void renameCategory()}>Rename</button>
                  <button type="button" className="dj-ghostbtn" onClick={() => { setRenameTo(''); void renameCategory() }}>Remove category</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {state === 'disabled' ? (
        <div className="dj-panel"><p className="dj-sub" style={{ margin: 0 }}>The journal isn&apos;t switched on right now. Check back soon.</p></div>
      ) : (
        <>
          {/* stat tiles */}
          <div className="dj-stats">
            {stats.map(s => (
              <div key={s.label} className="dj-stat">
                <span className="dj-stat-ico"><Ico d={s.icon} size={17} /></span>
                <span>
                  <span className="dj-stat-label">{s.label}</span>
                  <span className="dj-stat-num">{s.value}</span>
                </span>
              </div>
            ))}
          </div>

          {/* tabs + filters */}
          <div className="dj-toolbar">
            <div className="dj-tabs">
              {tabs.map(t => (
                <button key={t.key} type="button" className={`dj-tab ${tab === t.key ? 'dj-tab-on' : ''}`} onClick={() => { setTab(t.key); setPage(1) }}>
                  {t.label}{t.n !== null ? ` (${t.n})` : ''}
                </button>
              ))}
            </div>
            <div className="dj-filters">
              <select className="dj-input dj-select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }} aria-label="Filter by category">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="dj-searchwrap">
                <Ico d={P.search} size={14} />
                <input className="dj-searchin" placeholder="Search journals..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
              </div>
              <button type="button" className={`dj-ghostbtn ${!sortNewest ? 'dj-ghostbtn-on' : ''}`} onClick={() => setSortNewest(v => !v)} title={sortNewest ? 'Newest first — click for oldest first' : 'Oldest first — click for newest first'}>
                <Ico d={P.filter} size={14} /> Filters
              </button>
            </div>
          </div>

          {/* table */}
          <div className="dj-panel dj-tablewrap">
            <table className="dj-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Journal</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Product Clicks</th>
                  <th>Sales</th>
                  <th>Last Edited</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state === 'loading' && (
                  <tr><td colSpan={10} className="dj-empty">Loading your journals&hellip;</td></tr>
                )}
                {state === 'ready' && shown.length === 0 && (
                  <tr>
                    <td colSpan={10} className="dj-empty">
                      {posts.length === 0
                        ? <>No journal entries yet. Your story starts with the first one &mdash; <Link href="/dashboard/journal/new" className="dj-link">create your first journal</Link>.</>
                        : 'Nothing matches these filters.'}
                    </td>
                  </tr>
                )}
                {shown.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="dj-jcell">
                        {p.images[0]
                          ? <img className="dj-thumb" src={p.images[0]} alt="" aria-hidden="true" loading="lazy" />
                          : <span className="dj-thumb dj-thumb-empty"><Ico d={P.doc} size={15} /></span>}
                        <span className="dj-jtitle">{p.title || p.body.slice(0, 60)}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{statusChip(p)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {p.status === 'SCHEDULED' && p.scheduledAt ? (
                        <span>
                          {new Date(p.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          <span className="dj-subline">{new Date(p.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      ) : p.status === 'DRAFT' ? dash : (
                        new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{isLive(p) ? fmtK(p.viewCount) : dash}</td>
                    <td style={{ textAlign: 'center' }}>{isLive(p) ? fmtK(p._count.likes) : dash}</td>
                    <td style={{ textAlign: 'center' }}>{isLive(p) ? fmtK(p._count.comments) : dash}</td>
                    <td style={{ textAlign: 'center' }}>{isLive(p) ? fmtK(p.productClicks) : dash}</td>
                    <td style={{ textAlign: 'center' }}>{isLive(p) ? fmtK(p.salesCount) : dash}</td>
                    <td style={{ textAlign: 'center' }}>
                      {new Date(p.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <span className="dj-subline">{new Date(p.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td>
                      <div className="dj-actions">
                        <button type="button" className="dj-act" title="Edit" onClick={() => router.push(`/dashboard/journal/new?edit=${p.id}`)}><Ico d={P.pencil} size={14} /></button>
                        <Link className="dj-act" title="View on your storefront" href={sellerId ? `/seller/${sellerId}` : '/workshop'}><Ico d={P.eye} size={15} /></Link>
                        <Link className="dj-act" title="Analytics" href="/dashboard/analytics"><Ico d={P.chart} size={14} /></Link>
                        <button type="button" className="dj-act" title={copied === p.id ? 'Link copied' : 'Share'} onClick={() => share(p)}><Ico d={P.share} size={14} /></button>
                        {p.status === 'DRAFT' || p.status === 'ARCHIVED' ? (
                          <button type="button" className="dj-act dj-act-red" title="Delete" onClick={() => void remove(p.id)}><Ico d={P.trash} size={14} /></button>
                        ) : (
                          <span style={{ position: 'relative' }}>
                            <button type="button" className="dj-act" title="More" onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}><Ico d={P.dots} size={15} /></button>
                            {menuFor === p.id && (
                              <span className="dj-menu">
                                {p.status !== 'ARCHIVED' && p.status !== 'HIDDEN' && (
                                  <button type="button" onClick={() => void setStatus(p, 'ARCHIVED')}>Archive</button>
                                )}
                                {p.status === 'ARCHIVED' && (
                                  <button type="button" onClick={() => void setStatus(p, 'PUBLISHED')}>Restore &amp; publish</button>
                                )}
                                <button type="button" className="dj-menu-red" onClick={() => void remove(p.id)}>Delete</button>
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="dj-foot">
              <span className="dj-sub" style={{ margin: 0 }}>
                {filtered.length === 0
                  ? 'Showing 0 journals'
                  : `Showing ${(pageClamped - 1) * pageSize + 1} to ${Math.min(pageClamped * pageSize, filtered.length)} of ${filtered.length} journals`}
              </span>
              <div className="dj-pager">
                <button type="button" className="dj-pagebtn" disabled={pageClamped <= 1} onClick={() => setPage(pageClamped - 1)} aria-label="Previous page">&lsaquo;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 6).map(n => (
                  <button key={n} type="button" className={`dj-pagebtn ${n === pageClamped ? 'dj-pagebtn-on' : ''}`} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button type="button" className="dj-pagebtn" disabled={pageClamped >= totalPages} onClick={() => setPage(pageClamped + 1)} aria-label="Next page">&rsaquo;</button>
                <select className="dj-input dj-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} aria-label="Rows per page">
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* footer promo cards */}
          <div className="dj-cards">
            {footCards.map(c => (
              <div key={c.title} className="dj-card">
                <span className="dj-card-ico"><Ico d={c.icon} size={19} /></span>
                <div>
                  <div className="dj-card-title">{c.title}</div>
                  <div className="dj-sub" style={{ margin: '2px 0 8px' }}>{c.sub}</div>
                  <Link href={c.href} className="dj-link">{c.cta} <span aria-hidden="true">&rarr;</span></Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const css = `
.dj-page {
  --dj-bg: transparent;
  --dj-panel: #141109;
  --dj-panel2: rgba(255,255,255,0.045);
  --dj-line: rgba(255,255,255,0.07);
  --dj-text: #f4efe6;
  --dj-muted: #a99f8c;
  --dj-green: #46c07a;
  --dj-blue: #5b9bd5;
  color: var(--dj-text);
  padding: 26px 26px 60px;
  font-family: var(--font-body);
}
html[data-theme='light'] .dj-page {
  --dj-panel: var(--surface);
  --dj-panel2: rgba(0,0,0,0.05);
  --dj-line: var(--border);
  --dj-text: var(--text);
  --dj-muted: var(--muted);
}
.dj-title { font-size: clamp(26px, 3vw, 34px); margin: 0 0 4px; }
.dj-sub { font-size: 13.5px; color: var(--dj-muted); margin: 0; }
.dj-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
.dj-head-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.dj-ghostbtn { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 8px 16px; border-radius: 0; border: 1px solid var(--dj-line); background: var(--dj-panel); color: var(--dj-text); font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
.dj-ghostbtn:hover, .dj-ghostbtn-on { border-color: var(--accent); color: var(--accent); }
.dj-primarybtn { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 8px 18px; border-radius: 0; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; font-family: var(--font-body); }
.dj-primarybtn:hover { filter: brightness(1.08); }
.dj-link { color: var(--accent); font-size: 12.5px; font-weight: 700; text-decoration: none; }
.dj-link:hover { filter: brightness(1.15); }
.dj-panel { background: var(--dj-panel); border-radius: 0; padding: 16px; }
.dj-cats { background: var(--dj-panel); border-radius: 0; padding: 16px; margin-bottom: 18px; }
.dj-cats-list { display: flex; gap: 8px; flex-wrap: wrap; }
.dj-cat { padding: 7px 14px; border-radius: 0; border: 1px solid var(--dj-line); background: none; color: var(--dj-text); font-size: 12.5px; cursor: pointer; }
.dj-cat-on { border-color: var(--accent); color: var(--accent); }
.dj-cats-edit { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.dj-input { background: var(--dj-panel2); border: 1px solid var(--dj-line); border-radius: 0; color: var(--dj-text); font-size: 13px; padding: 9px 12px; font-family: var(--font-body); }
.dj-select { cursor: pointer; }
.dj-select option { color: #000; }

/* stat tiles */
.dj-stats { display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; margin-bottom: 20px; }
@media (max-width: 1400px) { .dj-stats { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 700px) { .dj-stats { grid-template-columns: repeat(2, 1fr); } }
.dj-stat { display: flex; align-items: center; gap: 11px; background: var(--dj-panel); border-radius: 0; padding: 14px; }
.dj-stat-ico { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 0; background: rgba(232,137,12,0.13); color: var(--accent); flex-shrink: 0; }
.dj-stat-label { display: block; font-size: 11px; color: var(--dj-muted); }
.dj-stat-num { display: block; font-family: var(--font-serif); font-size: 21px; line-height: 1.2; color: var(--dj-text); }

/* toolbar */
.dj-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.dj-tabs { display: flex; gap: 2px; flex-wrap: wrap; }
.dj-tab { padding: 9px 13px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--dj-muted); font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
.dj-tab-on { color: var(--accent); border-bottom-color: var(--accent); }
.dj-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.dj-searchwrap { display: flex; align-items: center; gap: 8px; background: var(--dj-panel2); border: 1px solid var(--dj-line); border-radius: 0; padding: 0 12px; color: var(--dj-muted); }
.dj-searchin { background: none; border: none; outline: none; color: var(--dj-text); font-size: 13px; padding: 9px 0; min-width: 150px; font-family: var(--font-display); }

/* table */
.dj-tablewrap { padding: 0; overflow-x: auto; }
.dj-table { width: 100%; border-collapse: collapse; min-width: 960px; }
.dj-table th { font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; color: var(--dj-muted); text-align: center; padding: 14px 12px; border-bottom: 1px solid var(--dj-line); white-space: nowrap; }
.dj-table td { padding: 13px 12px; border-bottom: 1px solid var(--dj-line); font-size: 13px; vertical-align: middle; }
.dj-table tbody tr:last-child td { border-bottom: none; }
.dj-table tbody tr:hover { background: rgba(255,255,255,0.02); }
.dj-jcell { display: flex; align-items: center; gap: 12px; min-width: 240px; }
.dj-thumb { width: 52px; height: 44px; border-radius: 0; object-fit: cover; flex-shrink: 0; }
.dj-thumb-empty { display: inline-flex; align-items: center; justify-content: center; background: var(--dj-panel2); color: var(--dj-muted); }
.dj-jtitle { font-size: 13.5px; font-weight: 600; color: var(--dj-text); line-height: 1.4; }
.dj-subline { display: block; font-size: 11px; color: var(--dj-muted); }
.dj-dash { color: var(--dj-muted); }
.dj-empty { text-align: center; color: var(--dj-muted); padding: 34px 16px !important; font-size: 13.5px; }
.dj-chip { display: inline-flex; padding: 4px 12px; border-radius: 0; font-size: 11.5px; font-weight: 700; }
.dj-chip-pub { background: rgba(70,192,122,0.14); color: var(--dj-green); }
.dj-chip-sched { background: rgba(91,155,213,0.15); color: var(--dj-blue); }
.dj-chip-draft { background: rgba(255,255,255,0.07); color: var(--dj-muted); }
.dj-chip-hidden { background: rgba(226,75,74,0.15); color: var(--red); }
.dj-actions { display: flex; align-items: center; gap: 4px; justify-content: center; }
.dj-act { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 0; border: none; background: none; color: var(--dj-muted); cursor: pointer; }
.dj-act:hover { background: var(--dj-panel2); color: var(--accent); }
.dj-act-red:hover { color: var(--red); }
.dj-menu { position: absolute; right: 0; top: 34px; z-index: 20; display: flex; flex-direction: column; min-width: 160px; background: var(--dj-panel); border: 1px solid var(--dj-line); border-radius: 0; padding: 6px; box-shadow: 0 18px 40px rgba(0,0,0,0.5); }
.dj-menu button { background: none; border: none; text-align: left; padding: 9px 12px; border-radius: 0; color: var(--dj-text); font-size: 13px; cursor: pointer; font-family: var(--font-body); }
.dj-menu button:hover { background: var(--dj-panel2); }
.dj-menu-red { color: var(--red) !important; }

/* footer of table */
.dj-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 16px; }
.dj-pager { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dj-pagebtn { min-width: 32px; height: 32px; border-radius: 0; border: 1px solid var(--dj-line); background: none; color: var(--dj-text); font-size: 13px; cursor: pointer; }
.dj-pagebtn:disabled { opacity: 0.35; cursor: default; }
.dj-pagebtn-on { border-color: var(--accent); color: var(--accent); font-weight: 700; }

/* promo cards */
.dj-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 22px; }
@media (max-width: 1100px) { .dj-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .dj-cards { grid-template-columns: 1fr; } }
.dj-card { display: flex; align-items: flex-start; gap: 12px; background: var(--dj-panel); border-radius: 0; padding: 16px; }
.dj-card-ico { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 0; border: 1.4px solid var(--accent); color: var(--accent); flex-shrink: 0; }
.dj-card-title { font-size: 14px; font-weight: 700; color: var(--dj-text); }
`
