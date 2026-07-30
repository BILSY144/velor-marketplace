'use client'

// The living per-seller journal page in William's journal-page design.
// Rendered by /community/journals/[sellerId] with the seller's REAL
// published entries -- the layout the showcase page demonstrates, minus
// every placeholder. Sections a maker hasn't written yet show honest
// awaiting-content slots; figures are genuine and start small.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { jpCss } from './jpStyles'
import { countryToCode } from '@/lib/payoutRail'

interface JournalEntry {
  id: string
  title: string | null
  body: string
  images: string[]
  videoUrl: string | null
  createdAt: string
  category: string | null
  viewCount: number
  makingProcess: string | null
  notesTips: string | null
  behindScenes: string | null
  productIds: string[]
  likes: number
  comments: number
}

interface SellerInfo {
  id: string
  storeName: string
  description: string | null
  country: string | null
  storeLogo: string | null
  foundingBadge: boolean
  currency: string
  memberSince: number
  followers: number
  listings: number
}

interface TaggedProduct { id: string; title: string; price: number; image: string | null }

const P = {
  heart: 'M12 21C7 16.5 3.5 13.2 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .8 3.9 2a4.9 4.9 0 0 1 3.9-2 4.6 4.6 0 0 1 4.6 4.6c0 3.6-3.5 6.9-8.5 11.4z',
  comment: 'M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
  calendar: 'M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9h16M8 2v4M16 2v4',
  check: 'M20 6L9 17l-5-5',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  laurel: 'M12 4v9M12 13c-3 0-5 2-5 5 3 0 5-2 5-5zM12 13c3 0 5 2 5 5-3 0-5-2-5-5z',
  back: 'M19 12H5M12 19l-7-7 7-7',
  doc: 'M6 2h9l4 4v16H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM14 2v5h5M9 12h7M9 16h7',
}

function Ico({ d, size = 12 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

function Verified({ size = 15 }: { size?: number }) {
  return (
    <span className="jp-verified" style={{ width: size, height: size }} aria-label="Verified seller">
      <Ico d={P.check} size={Math.round(size * 0.6)} />
    </span>
  )
}

function flagFor(country: string | null): string {
  const code = countryToCode(country)
  if (!code || code.length !== 2) return ''
  const A = 0x1f1e6
  return String.fromCodePoint(A + code.charCodeAt(0) - 65, A + code.charCodeAt(1) - 65)
}

function fmtK(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/* eslint-disable @next/next/no-img-element */

type Tab = 'story' | 'making' | 'photos' | 'notes' | 'behind'

export default function SellerJournalView({ seller, posts, products }: { seller: SellerInfo; posts: JournalEntry[]; products: TaggedProduct[] }) {
  const [currentId, setCurrentId] = useState(posts[0].id)
  const [tab, setTab] = useState<Tab>('story')
  const [shared, setShared] = useState(false)
  const viewed = useRef<Set<string>>(new Set())

  const entry = posts.find(p => p.id === currentId) ?? posts[0]
  const entryTitle = entry.title || entry.body.slice(0, 60)
  const flag = flagFor(seller.country)
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0)

  // Real view counting -- once per entry per visit.
  useEffect(() => {
    if (viewed.current.has(entry.id)) return
    viewed.current.add(entry.id)
    fetch('/api/social/journal/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: entry.id, kind: 'view' }),
    }).catch(() => {})
  }, [entry.id])

  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: `${seller.storeName} — Maker Journal`, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }).catch(() => {})
    }
  }

  function trackProductClick() {
    fetch('/api/social/journal/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: entry.id, kind: 'productClick' }),
    }).catch(() => {})
  }

  const entryProducts = products.filter(pr => entry.productIds.includes(pr.id))
  const gallery = entry.images

  const tabs: { key: Tab; label: string }[] = [
    { key: 'story', label: 'The Story' },
    { key: 'making', label: 'Making Process' },
    { key: 'photos', label: `Photos (${gallery.length})` },
    { key: 'notes', label: 'Notes & Tips' },
    { key: 'behind', label: 'Behind The Scenes' },
  ]

  const awaiting = (what: string) => (
    <p className="jp-note" style={{ margin: 0 }}>
      {seller.storeName} hasn&rsquo;t written {what} for this entry yet &mdash; it appears here the moment they do.
    </p>
  )

  const avatar = seller.storeLogo
    ? <img className="jp-meta-avatar" src={seller.storeLogo} alt={seller.storeName} />
    : <span className="jp-meta-avatar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF8A2B, #FF6B00)', color: '#fff', fontWeight: 700 }}>{seller.storeName.charAt(0).toUpperCase()}</span>

  return (
    <main className="jp-page">
      <style>{jpCss}</style>

      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span>{' '}
        <Link href="/community">The Makers&rsquo; Circle</Link> <span aria-hidden="true">/</span>{' '}
        <span className="jp-crumb-here">{entryTitle}</span>
      </nav>

      <div className="jp-grid">
        <div className="jp-main">
          <Link href="/community" className="jp-back">
            <Ico d={P.back} size={13} /> Back to The Makers&rsquo; Circle
          </Link>

          {/* hero */}
          <div className="jp-hero">
            <div className="jp-hero-text">
              <span className="jp-chip-gold">{entry.category || 'Maker Journal'}</span>
              <h1 className="jp-title">{entryTitle}</h1>
              <p className="jp-intro">{entry.body.slice(0, 180)}{entry.body.length > 180 ? '…' : ''}</p>
              <div className="jp-meta">
                <span className="jp-meta-item">
                  {avatar}
                  <span>
                    <span className="jp-meta-strong">{seller.storeName}<Verified size={13} /></span>
                    <span className="jp-meta-sub">{seller.country || 'Velor maker'}</span>
                  </span>
                </span>
                <span className="jp-meta-item">
                  <span className="jp-meta-ico"><Ico d={P.calendar} size={14} /></span>
                  <span>
                    <span className="jp-meta-strong">{fmtDate(entry.createdAt)}</span>
                    <span className="jp-meta-sub">Journal entry</span>
                  </span>
                </span>
                {flag && (
                  <span className="jp-meta-item">
                    <span className="jp-meta-flag" aria-hidden="true">{flag}</span>
                    <span>
                      <span className="jp-meta-strong">{seller.country}</span>
                      <span className="jp-meta-sub">Ships worldwide</span>
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className="jp-hero-media">
              {gallery[0]
                ? <img src={gallery[0]} alt={entryTitle} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', minHeight: 220, background: 'var(--mc-card2)', color: 'var(--mc-muted)' }}><Ico d={P.doc} size={26} /></div>}
            </div>
          </div>

          {/* engagement */}
          <div className="jp-engage">
            <span className="jp-engage-stat"><Ico d={P.heart} size={15} /> {fmtK(entry.likes)}</span>
            <span className="jp-engage-stat"><Ico d={P.comment} size={15} /> {fmtK(entry.comments)}</span>
            <span className="jp-engage-stat"><Ico d={P.eye} size={15} /> {fmtK(entry.viewCount)}</span>
            <button type="button" className="jp-engage-stat jp-share" onClick={share}>
              <Ico d={P.share} size={15} /> {shared ? 'Link copied' : 'Share'}
            </button>
          </div>

          {/* story tabs -- real switching */}
          <div className="jp-tabs" role="tablist">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`jp-tab ${tab === t.key ? 'jp-tab-on' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="jp-story">
            <div className="jp-story-text">
              {tab === 'story' && <p style={{ whiteSpace: 'pre-wrap' }}>{entry.body}</p>}
              {tab === 'making' && (entry.makingProcess ? <p style={{ whiteSpace: 'pre-wrap' }}>{entry.makingProcess}</p> : awaiting('the making process'))}
              {tab === 'notes' && (entry.notesTips ? <p style={{ whiteSpace: 'pre-wrap' }}>{entry.notesTips}</p> : awaiting('notes and tips'))}
              {tab === 'behind' && (entry.behindScenes ? <p style={{ whiteSpace: 'pre-wrap' }}>{entry.behindScenes}</p> : awaiting('a behind-the-scenes look'))}
              {tab === 'photos' && gallery.length === 0 && awaiting('photos')}
              {tab === 'photos' && gallery.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {gallery.map((g, i) => <img key={i} src={g} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} loading="lazy" />)}
                </div>
              )}
            </div>
            {tab !== 'photos' && gallery.length > 0 && (
              <div className="jp-gallery">
                <img className="jp-gal-main" src={gallery[0]} alt="" loading="lazy" />
                {gallery.length > 1 && (
                  <div className="jp-gal-thumbs">
                    {gallery.slice(1, 4).map((g, i) => <img key={i} src={g} alt="" loading="lazy" />)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* shoppable listings */}
          <section className="jp-section">
            <div className="jp-sechead">
              <h2 className="jp-sectitle">Shop Products From This Journal</h2>
              <Link href={`/seller/${seller.id}`} className="jp-viewall">View all products <span aria-hidden="true">&rarr;</span></Link>
            </div>
            {entryProducts.length === 0 ? (
              <p className="jp-note" style={{ margin: 0 }}>No listings are tagged on this entry yet &mdash; when {seller.storeName} links a piece, it appears here ready to buy.</p>
            ) : (
              <div className="jp-prod-grid">
                {entryProducts.map(pr => (
                  <Link key={pr.id} href={`/shop/${pr.id}`} className="jp-prod" onClick={trackProductClick}>
                    {pr.image
                      ? <img src={pr.image} alt={pr.title} loading="lazy" />
                      : <span style={{ display: 'block', aspectRatio: '1', background: 'var(--mc-card2)' }} aria-hidden />}
                    <span className="jp-prod-name">{pr.title}</span>
                    <span className="jp-prod-price">{money(pr.price, seller.currency)}</span>
                    <span className="jp-prod-foot">
                      <span className="jp-prod-view">View product <span aria-hidden="true">&rarr;</span></span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* more entries */}
          {posts.length > 1 && (
            <section className="jp-section">
              <div className="jp-sechead">
                <h2 className="jp-sectitle">More Journal Entries From {seller.storeName}</h2>
                <Link href="/workshop" className="jp-viewall">View the Workshop feed <span aria-hidden="true">&rarr;</span></Link>
              </div>
              <div className="jp-mj-rail">
                {posts.filter(p => p.id !== entry.id).slice(0, 6).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="jp-mj"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit', padding: 0 }}
                    onClick={() => { setCurrentId(p.id); setTab('story'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  >
                    {p.images[0]
                      ? <img src={p.images[0]} alt="" loading="lazy" />
                      : <span style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', background: 'var(--mc-card2)' }} aria-hidden />}
                    <span className="jp-mj-day">{fmtDate(p.createdAt)}</span>
                    <span className="jp-mj-title">{p.title || p.body.slice(0, 44)}</span>
                    <span className="jp-prod-loves"><Ico d={P.heart} size={11} /> {fmtK(p.likes)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* sidebar */}
        <aside className="jp-side">
          <div className="jp-card">
            <div className="jp-maker">
              {seller.storeLogo
                ? <img className="jp-maker-avatar" src={seller.storeLogo} alt={seller.storeName} />
                : <span className="jp-maker-avatar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF8A2B, #FF6B00)', color: '#fff', fontWeight: 700, fontSize: 22 }}>{seller.storeName.charAt(0).toUpperCase()}</span>}
              <span>
                <div className="jp-maker-name">{seller.storeName}<Verified size={14} /></div>
                <div className="jp-maker-loc">{flag && <span aria-hidden="true">{flag} </span>}{seller.country || 'Velor maker'}</div>
              </span>
            </div>
            <div className="jp-maker-actions">
              <Link href={`/seller/${seller.id}`} className="jp-followbtn">Visit Store</Link>
              <Link href="/messages" className="jp-msgbtn" aria-label={`Message ${seller.storeName}`}><Ico d={P.send} size={14} /></Link>
            </div>
            <div className="jp-stats">
              {[
                { l: 'Journal entries', v: fmtK(posts.length) },
                { l: 'Journal likes', v: fmtK(totalLikes) },
                { l: 'Followers', v: fmtK(seller.followers) },
                { l: 'Listings', v: fmtK(seller.listings) },
                { l: 'Member since', v: String(seller.memberSince) },
                { l: 'Country', v: seller.country || '—' },
              ].map(s => (
                <div key={s.l} className="jp-stat">
                  <span className="jp-stat-num">{s.v}</span>
                  <span className="jp-stat-label">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {seller.foundingBadge && (
            <div className="jp-card jp-founding">
              <span className="jp-founding-ico" aria-hidden="true"><Ico d={P.laurel} size={17} /></span>
              <span>
                <div className="jp-founding-title">Founding Seller</div>
                <div className="jp-note">One of Velor&rsquo;s original makers{seller.country ? ` from ${seller.country}` : ''}</div>
              </span>
            </div>
          )}

          <div className="jp-card">
            <h3 className="jp-sidetitle">About {seller.storeName}</h3>
            <p className="jp-note" style={{ margin: 0 }}>
              {seller.description || `${seller.storeName} is telling their story one entry at a time.`}
            </p>
            <Link href={`/seller/${seller.id}`} className="jp-viewall" style={{ display: 'inline-block', marginTop: 10 }}>Visit the storefront <span aria-hidden="true">&rarr;</span></Link>
          </div>

          <div className="jp-card">
            <h3 className="jp-sidetitle">Never Miss A Story</h3>
            <p className="jp-note">Follow {seller.storeName} from their storefront and new journal entries ring your bell.</p>
            <Link href={`/seller/${seller.id}`} className="jp-goldbtn" style={{ display: 'inline-flex' }}>Follow on the storefront</Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
