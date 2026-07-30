'use client'

/**
 * THE MAKERS' CIRCLE -- Velor's community hub (William's redesign, 2026-07-30).
 *
 * Built to match William's supplied design pixel-close: warm near-black
 * surfaces with gold accents, photo-dominant featured cards with coloured
 * badges, journal carousel, live-shopping frame with chat panel, wireframe
 * globe, passport card, circled gold icons and the trust strip.
 *
 * LAW #1 (honesty): every figure, maker, post and stream rendered here comes
 * from a live API (/api/lattice, /api/social/feed, /api/live,
 * /api/shop/products). Nothing is fabricated -- William explicitly chose
 * "real data + honest empty states" over the mockup's sample makers. Empty
 * sections keep the design's exact structure with honest invitation copy.
 *
 * Theme: the page carries its own --mc-* variables. Dark theme (site
 * default) reproduces the design's exact palette; the light toggle maps the
 * same structure onto the site's light tokens. Hero + story banner sit on
 * photography with a dark scrim, so their text stays light in both themes.
 *
 * Every section is a clickable box routing to /community/<section>
 * (placeholders in app/community/[section]/page.tsx until each section's
 * dedicated design lands -- we build them one at a time).
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { pexelsUrl } from '@/lib/countryImagery'

/* ---------- types (mirroring the live API responses) ---------- */

type FeedPost = {
  id: string
  title: string
  body: string
  images: string[]
  videoUrl: string | null
  createdAt: string
  seller: { id: string; storeName: string; storeLogo: string | null; country: string | null; foundingBadge: boolean }
  product: { id: string; title: string; images: string[] } | null
}

type Stream = {
  id: string
  title: string
  roomName: string
  status: string
  scheduledFor: string | null
  sellerName: string
  currency: string
  products: { id: string; title: string; price: number; images: string[] }[]
}

type LatticeCountry = { code: string; name: string; products: number }

type ShopProduct = { id: string; name: string; images: string[]; sellerName: string }

/* ---------- helpers ---------- */

/** Flag derived from the ISO-2 code at runtime -- never written into source. */
function flagFor(code: string): string {
  if (!code || code.length !== 2) return ''
  const base = 0x1f1e6
  const a = 'A'.charCodeAt(0)
  return String.fromCodePoint(base + code.toUpperCase().charCodeAt(0) - a, base + code.toUpperCase().charCodeAt(1) - a)
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? '1 day ago' : `${d} days ago`
}

function excerpt(text: string, max = 170): string {
  if (!text) return ''
  return text.length <= max ? text : text.slice(0, max).replace(/\s+\S*$/, '') + '...'
}

/* ---------- icons (inline SVG, no emojis) ---------- */

function Ico({ d, size = 12 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const PATHS = {
  spark: 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z',
  play: 'M8 5.5v13l11-6.5L8 5.5z',
  check: 'M20 6L9 17l-5-5',
  search: 'M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',
  chat: 'M21 12a8 8 0 0 1-8 8H4l2.4-2.9A8 8 0 1 1 21 12z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  vase: 'M9 3h6M10 3c0 3-3 4.5-3 9a5 5 0 0 0 10 0c0-4.5-3-6-3-9M9 21h6',
  weave: 'M4 6h16M4 12h16M4 18h16M8 3v18M16 3v18',
  wood: 'M4 8c0-2 3.6-3 8-3s8 1 8 3v8c0 2-3.6 3-8 3s-8-1-8-3V8zM20 8c0 2-3.6 3-8 3S4 10 4 8',
  metal: 'M4 7h12l4 4h-6l-2 6H8l2-6H4V7z',
  tea: 'M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9zM16 10h2a2 2 0 0 1 0 5h-2',
  needle: 'M4 20c8-1 13-6 16-16M14 6l4 4',
  leather: 'M6 4h12l3 5-9 11L3 9l3-5z',
  globe2: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  laurel: 'M12 4v9M12 13c-3 0-5 2-5 5 3 0 5-2 5-5zM12 13c3 0 5 2 5 5-3 0-5-2-5-5z',
  cap: 'M2 9l10-5 10 5-10 5L2 9zM6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5',
  passport: 'M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 17h6',
  heart: 'M12 21C7 16.5 3.5 13.2 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .8 3.9 2a4.9 4.9 0 0 1 3.9-2 4.6 4.6 0 0 1 4.6 4.6c0 3.6-3.5 6.9-8.5 11.4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  shield: 'M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mic: 'M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v5',
  text: 'M4 6h16M4 12h16M4 18h10',
}

function Verified() {
  return (
    <span className="mc-verified" aria-label="Verified seller">
      <Ico d={PATHS.check} size={9} />
    </span>
  )
}

function SectionMark({ icon }: { icon: keyof typeof PATHS }) {
  return (
    <span className="mc-mark" aria-hidden="true">
      <Ico d={PATHS[icon]} size={11} />
    </span>
  )
}

function SectionHead({ title, href, icon }: { title: string; href: string; icon: keyof typeof PATHS }) {
  return (
    <div className="mc-shead">
      <span className="mc-shead-left">
        <SectionMark icon={icon} />
        <span className="mc-kicker">{title}</span>
      </span>
      <Link href={href} className="mc-viewall" onClick={(e) => e.stopPropagation()}>
        View all <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  )
}

/** A whole section box is clickable (routes to its section page); inner links stop propagation. */
function SectionBox({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter()
  return (
    <section
      className={`mc-box ${className ?? ''}`}
      role="link"
      tabIndex={0}
      aria-label="Open section"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(href)
        }
      }}
    >
      {children}
    </section>
  )
}

/** Wireframe globe matching the design's glowing map graphic. */
function Globe() {
  return (
    <div className="mc-globe-wrap" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="mc-globe">
        <defs>
          <radialGradient id="mcGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.28)" />
            <stop offset="70%" stopColor="rgba(212,175,55,0.06)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#mcGlow)" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="1" />
        <ellipse cx="100" cy="100" rx="78" ry="30" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="0.8" />
        <ellipse cx="100" cy="100" rx="78" ry="58" fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="0.8" />
        <ellipse cx="100" cy="100" rx="30" ry="78" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="0.8" />
        <ellipse cx="100" cy="100" rx="58" ry="78" fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="0.8" />
        <line x1="22" y1="100" x2="178" y2="100" stroke="rgba(212,175,55,0.35)" strokeWidth="0.8" />
        {[
          [58, 62], [92, 48], [130, 70], [150, 104], [118, 128], [80, 140], [46, 108], [104, 92], [66, 88], [138, 92],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="#FF6B00">
            <animate attributeName="opacity" values="1;0.35;1" dur="3s" begin={`${(x + y) % 7 * 0.4}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    </div>
  )
}

/* ---------- page ---------- */

export default function CommunityPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [streams, setStreams] = useState<Stream[]>([])
  const [countries, setCountries] = useState<LatticeCountry[]>([])
  const [totalCountries, setTotalCountries] = useState(190)
  const [productCount, setProductCount] = useState<number | null>(null)
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([])
  const [loaded, setLoaded] = useState(false)
  const [journalIndex, setJournalIndex] = useState(0)

  useEffect(() => {
    let alive = true
    async function load() {
      const [feedR, liveR, latticeR, shopR] = await Promise.allSettled([
        fetch('/api/social/feed?scope=all').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/live').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/lattice').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/shop/products?limit=8').then((r) => (r.ok ? r.json() : null)),
      ])
      if (!alive) return
      if (feedR.status === 'fulfilled' && feedR.value?.posts) setPosts(feedR.value.posts)
      if (liveR.status === 'fulfilled' && liveR.value?.streams) setStreams(liveR.value.streams)
      if (latticeR.status === 'fulfilled' && latticeR.value) {
        const lat = latticeR.value
        if (Array.isArray(lat.countries)) {
          setCountries(lat.countries)
          setProductCount(lat.countries.reduce((s: number, c: LatticeCountry) => s + (c.products || 0), 0))
        }
        if (lat.totalCountries) setTotalCountries(lat.totalCountries)
      }
      if (shopR.status === 'fulfilled' && shopR.value?.products) {
        setShopProducts(
          shopR.value.products.map((p: { id: string; name: string; images?: string[]; sellerName: string }) => ({
            id: p.id,
            name: p.name,
            images: p.images ?? [],
            sellerName: p.sellerName,
          })),
        )
      }
      setLoaded(true)
    }
    load()
    return () => { alive = false }
  }, [])

  const liveStreams = useMemo(() => streams.filter((s) => s.status === 'LIVE'), [streams])
  const scheduledStreams = useMemo(() => streams.filter((s) => s.status === 'SCHEDULED'), [streams])
  const videoPosts = useMemo(() => posts.filter((p) => p.videoUrl), [posts])
  const tradingCountries = useMemo(
    () => [...countries].sort((a, b) => (b.products || 0) - (a.products || 0)),
    [countries],
  )
  const journalPost = posts.length > 0 ? posts[Math.min(journalIndex, posts.length - 1)] : null
  const topCountry = tradingCountries[0] ?? null

  /* Featured Today: real live streams first, then real journal posts, then
     honest open-seat invitations to fill the row of four. */
  type FeaturedCard = {
    key: string
    tag: string
    tagTone: 'live' | 'gold' | 'orange' | 'plain'
    img: string | null
    name: string
    countryName: string | null
    line: string
    ctaLabel: string
    ctaHref: string
    verified: boolean
  }
  const featured: FeaturedCard[] = []
  for (const s of liveStreams.slice(0, 2)) {
    featured.push({
      key: `live-${s.id}`,
      tag: 'Live now',
      tagTone: 'live',
      img: s.products[0]?.images?.[0] ?? null,
      name: s.sellerName,
      countryName: null,
      line: s.title,
      ctaLabel: 'Watch live',
      ctaHref: `/live/${s.roomName}`,
      verified: true,
    })
  }
  for (const p of posts) {
    if (featured.length >= 4) break
    featured.push({
      key: `post-${p.id}`,
      tag: p.videoUrl ? 'New video' : 'Journal',
      tagTone: p.videoUrl ? 'orange' : 'gold',
      img: p.images?.[0] ?? p.product?.images?.[0] ?? null,
      name: p.seller.storeName,
      countryName: p.seller.country,
      line: p.title,
      ctaLabel: p.videoUrl ? 'Watch video' : 'View journal',
      ctaHref: '/workshop',
      verified: true,
    })
  }
  while (featured.length < 4) {
    featured.push({
      key: `seat-${featured.length}`,
      tag: 'Open seat',
      tagTone: 'plain',
      img: null,
      name: 'Your craft here',
      countryName: null,
      line: 'The world is waiting to watch you work.',
      ctaLabel: 'Become a creator',
      ctaHref: '/apply',
      verified: false,
    })
  }

  /* Hero collage -- William approved keeping this imagery choice
     (verified Pexels photography already used across the site). */
  const heroImages = [
    pexelsUrl(37619027, 'free-photo-of-hand-block-printing-on-yellow-fabric', 900),
    pexelsUrl(9412408, null, 900),
    pexelsUrl(23436813, 'free-photo-of-man-holding-a-japanese-knife', 900),
    pexelsUrl(31508160, null, 900),
  ]
  const bannerImage = pexelsUrl(34495354, null, 1400)

  const firstLive = liveStreams[0] ?? null
  const nextScheduled = scheduledStreams[0] ?? null
  const liveProduct = firstLive?.products[0] ?? null

  const crafts: { label: string; icon: keyof typeof PATHS }[] = [
    { label: 'All', icon: 'grid' },
    { label: 'Textile', icon: 'weave' },
    { label: 'Pottery', icon: 'vase' },
    { label: 'Wood', icon: 'wood' },
    { label: 'Metal', icon: 'metal' },
    { label: 'Tea', icon: 'tea' },
    { label: 'Embroidery', icon: 'needle' },
    { label: 'Leather', icon: 'leather' },
  ]

  const askSuggestions = [
    'How long does a piece like this take to make?',
    'What materials and techniques do you use?',
    'Can you make this in a different size?',
    'Can you ship to my country?',
  ]

  return (
    <main className="mc-page">
      <style>{css}</style>

      {/* ============ HERO ============ */}
      <header className="mc-hero">
        <div className="mc-hero-collage" aria-hidden="true">
          {heroImages.map((src) => (
            <div key={src} className="mc-hero-cell">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="eager" />
            </div>
          ))}
        </div>
        <div className="mc-hero-scrim" aria-hidden="true" />
        <div className="mc-hero-inner">
          <h1 className="mc-hero-title">
            The World&rsquo;s Makers.
            <br />
            <span className="mc-hero-accent">One Community.</span>
          </h1>
          <p className="mc-hero-sub">
            Watch artisans, ask questions, follow their journey and discover how authentic goods are created around the world.
          </p>
          <div className="mc-hero-ctas">
            <Link href="/workshop" className="mc-btn mc-btn-primary">Explore stories</Link>
            <Link href="/apply" className="mc-btn mc-btn-ghost">Become a creator</Link>
          </div>
        </div>
      </header>

      <div className="mc-wrap">
        {/* ============ FEATURED TODAY ============ */}
        <SectionBox href="/community/featured" className="mc-span2">
          <SectionHead title="Featured today" href="/community/featured" icon="spark" />
          <div className="mc-featured-grid">
            {featured.map((c) => (
              <article key={c.key} className={`mc-fcard ${c.img ? '' : 'mc-fcard-seat'}`}>
                {c.img && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img className="mc-fcard-img" src={c.img} alt={c.name} loading="lazy" />
                )}
                <div className="mc-fcard-shade" aria-hidden="true" />
                <span className={`mc-tag mc-tag-${c.tagTone}`}>
                  {c.tagTone === 'live' && <span className="mc-livedot" aria-hidden="true" />}
                  {c.tag}
                </span>
                <div className="mc-fcard-body">
                  <h3 className="mc-fcard-name">
                    {c.name}
                    {c.verified && <Verified />}
                  </h3>
                  {c.countryName && <div className="mc-fcard-country">{c.countryName}</div>}
                  <p className="mc-fcard-line">{c.line}</p>
                  <Link href={c.ctaHref} className="mc-outbtn" onClick={(e) => e.stopPropagation()}>
                    {c.ctaLabel === 'Watch live' && <Ico d={PATHS.play} size={11} />}
                    {c.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </SectionBox>

        {/* ============ CREATOR JOURNALS + ASK THE MAKER ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/journals">
            <SectionHead title="Creator journals" href="/community/journals" icon="passport" />
            {journalPost ? (
              <>
                <div className="mc-journal">
                  <div className="mc-journal-text">
                    <h3 className="mc-journal-title">{journalPost.title}</h3>
                    <p className="mc-journal-body">{excerpt(journalPost.body)}</p>
                    <div className="mc-journal-meta">
                      <span className="mc-journal-heart"><Ico d={PATHS.heart} size={13} /></span>
                      {journalPost.seller.storeName}
                      {journalPost.seller.country ? ` · ${journalPost.seller.country}` : ''} · {timeAgo(journalPost.createdAt)}
                    </div>
                  </div>
                  <div className="mc-journal-media">
                    {(journalPost.images?.[0] ?? journalPost.product?.images?.[0]) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={journalPost.images?.[0] ?? journalPost.product?.images?.[0] ?? ''} alt={journalPost.title} loading="lazy" />
                    ) : (
                      <div className="mc-media-empty" />
                    )}
                    {journalPost.videoUrl && (
                      <span className="mc-playbtn" aria-hidden="true"><Ico d={PATHS.play} size={18} /></span>
                    )}
                    {posts.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="mc-arrow mc-arrow-l"
                          aria-label="Previous journal"
                          onClick={(e) => { e.stopPropagation(); setJournalIndex((i) => (i - 1 + posts.length) % posts.length) }}
                        >
                          &lsaquo;
                        </button>
                        <button
                          type="button"
                          className="mc-arrow mc-arrow-r"
                          aria-label="Next journal"
                          onClick={(e) => { e.stopPropagation(); setJournalIndex((i) => (i + 1) % posts.length) }}
                        >
                          &rsaquo;
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {posts.length > 1 && (
                  <div className="mc-dots" aria-hidden="true">
                    {posts.slice(0, 5).map((p, i) => (
                      <span key={p.id} className={`mc-dot ${i === journalIndex % Math.min(posts.length, 5) ? 'mc-dot-on' : ''}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mc-empty">
                {loaded
                  ? 'The first workshop journals are being written. Follow a maker and their story starts here.'
                  : 'Loading journals...'}
              </p>
            )}
          </SectionBox>

          <SectionBox href="/community/ask">
            <SectionHead title="Ask the maker" href="/community/ask" icon="chat" />
            <div className="mc-ask-search" aria-hidden="true">
              <Ico d={PATHS.search} size={14} />
              <span>Ask any verified seller a question...</span>
            </div>
            <div className="mc-ask-rows">
              {askSuggestions.map((q) => (
                <Link key={q} href="/shop" className="mc-ask-row" onClick={(e) => e.stopPropagation()}>
                  <span className="mc-ask-avatar" aria-hidden="true"><Ico d={PATHS.user} size={12} /></span>
                  <span className="mc-ask-q">{q}</span>
                  <span className="mc-ask-go" aria-hidden="true">&rarr;</span>
                </Link>
              ))}
            </div>
            <div className="mc-ask-using">
              <span className="mc-ask-using-label">Ask using:</span>
              <span className="mc-ask-mode"><Ico d={PATHS.text} size={12} /> Text</span>
              <span className="mc-ask-note">Answers are published for the whole community</span>
            </div>
          </SectionBox>
        </div>

        {/* ============ WORKSHOP VIDEOS + LIVE SHOPPING ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/videos">
            <SectionHead title="Workshop videos" href="/community/videos" icon="camera" />
            <div className="mc-crafts" aria-hidden="true">
              {crafts.map((c, i) => (
                <span key={c.label} className={`mc-craft ${i === 0 ? 'mc-craft-on' : ''}`}>
                  <Ico d={PATHS[c.icon]} size={15} />
                  <span>{c.label}</span>
                </span>
              ))}
            </div>
            {videoPosts.length > 0 ? (
              <div className="mc-video-grid">
                {videoPosts.slice(0, 4).map((v) => (
                  <Link key={v.id} href="/workshop" className="mc-vcard" onClick={(e) => e.stopPropagation()}>
                    <div className="mc-vthumb">
                      {(v.images?.[0] ?? v.product?.images?.[0]) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={v.images?.[0] ?? v.product?.images?.[0] ?? ''} alt={v.title} loading="lazy" />
                      ) : (
                        <div className="mc-media-empty" />
                      )}
                      <span className="mc-playbtn mc-playbtn-sm" aria-hidden="true"><Ico d={PATHS.play} size={13} /></span>
                    </div>
                    <div className="mc-vcard-meta">
                      <div className="mc-vcard-title">{v.title}</div>
                      <div className="mc-vcard-sub">{v.seller.storeName}{v.seller.country ? ` · ${v.seller.country}` : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mc-video-grid">
                {['Dyeing', 'Throwing', 'Forging', 'Weaving'].map((t) => (
                  <div key={t} className="mc-vcard mc-vcard-seatcard">
                    <div className="mc-vthumb mc-vthumb-seat">
                      <Ico d={PATHS.play} size={16} />
                    </div>
                    <div className="mc-vcard-meta">
                      <div className="mc-vcard-title">{t} films coming</div>
                      <div className="mc-vcard-sub">As makers join the circle</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionBox>

          <SectionBox href="/community/live-shopping">
            <SectionHead title="Live shopping" href="/community/live-shopping" icon="play" />
            <div className="mc-live">
              <div className="mc-live-left">
                <div className="mc-live-frame">
                  {liveProduct?.images?.[0] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={liveProduct.images[0]} alt={firstLive?.title ?? ''} loading="lazy" />
                  ) : (
                    <div className="mc-live-off">
                      <Ico d={PATHS.play} size={22} />
                      <span>
                        {loaded
                          ? nextScheduled
                            ? `Next live: ${nextScheduled.title} by ${nextScheduled.sellerName}`
                            : 'No maker is on air right now'
                          : 'Loading the live channel...'}
                      </span>
                    </div>
                  )}
                  {firstLive && (
                    <span className="mc-tag mc-tag-live mc-tag-onframe"><span className="mc-livedot" aria-hidden="true" />Live</span>
                  )}
                </div>
                {firstLive && liveProduct ? (
                  <div className="mc-live-productbar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {liveProduct.images?.[0] && <img className="mc-live-thumb" src={liveProduct.images[0]} alt="" aria-hidden="true" />}
                    <div className="mc-live-pmeta">
                      <div className="mc-vcard-title">{liveProduct.title}</div>
                      <div className="mc-vcard-sub">by {firstLive.sellerName}</div>
                    </div>
                    <Link href={`/shop/${liveProduct.id}`} className="mc-cartbtn" onClick={(e) => e.stopPropagation()}>
                      Add to cart
                    </Link>
                  </div>
                ) : (
                  <div className="mc-live-productbar">
                    <div className="mc-live-pmeta">
                      <div className="mc-vcard-title">Watch, chat and buy in real time</div>
                      <div className="mc-vcard-sub">Pieces are pinned live as makers show them</div>
                    </div>
                    <Link href="/live" className="mc-cartbtn" onClick={(e) => e.stopPropagation()}>
                      Live channel
                    </Link>
                  </div>
                )}
              </div>
              <div className="mc-chat">
                <div className="mc-chat-body">
                  {firstLive ? (
                    <p className="mc-chat-note">The chat is live inside the stream -- join to talk to {firstLive.sellerName} and the room.</p>
                  ) : (
                    <p className="mc-chat-note">The chat opens the moment a maker goes on air. Ask about pieces, watch them made, and buy without leaving the stream.</p>
                  )}
                </div>
                <Link
                  href={firstLive ? `/live/${firstLive.roomName}` : '/live'}
                  className="mc-chat-input"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Type a message...</span>
                  <span className="mc-chat-send" aria-hidden="true"><Ico d={PATHS.play} size={11} /></span>
                </Link>
              </div>
            </div>
          </SectionBox>
        </div>

        {/* ============ AROUND THE WORLD + BUYER'S COLLECTIONS ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/world">
            <SectionHead title="Around the world" href="/community/world" icon="globe2" />
            <div className="mc-world">
              <div className="mc-world-left">
                <div className="mc-world-stats">
                  <div className="mc-stat"><span className="mc-stat-num">{totalCountries}</span><span className="mc-stat-label">Countries</span></div>
                  <div className="mc-stat"><span className="mc-stat-num">{countries.length}</span><span className="mc-stat-label">Trading</span></div>
                  <div className="mc-stat"><span className="mc-stat-num">{liveStreams.length}</span><span className="mc-stat-label">Live now</span></div>
                  <div className="mc-stat"><span className="mc-stat-num">{productCount ?? '--'}</span><span className="mc-stat-label">Products</span></div>
                </div>
                <Globe />
                <Link href="/community/world" className="mc-outbtn mc-outbtn-wide" onClick={(e) => e.stopPropagation()}>
                  Explore map
                </Link>
              </div>
              <div className="mc-world-panel">
                {topCountry ? (
                  <>
                    <div className="mc-world-country">
                      <span className="mc-flag" aria-hidden="true">{flagFor(topCountry.code)}</span>
                      <span className="mc-world-cname">{topCountry.name}</span>
                      <span className="mc-chip-gold">{topCountry.products} {topCountry.products === 1 ? 'piece' : 'pieces'}</span>
                    </div>
                    {[
                      { label: 'Newest products', href: `/shop?origin=${topCountry.code}` },
                      { label: 'Latest journals', href: '/workshop' },
                      { label: 'Weekly drop', href: '/drops' },
                      { label: 'Live sellers', href: '/live' },
                    ].map((r) => (
                      <Link key={r.label} href={r.href} className="mc-panel-row" onClick={(e) => e.stopPropagation()}>
                        <span>{r.label}</span>
                        <span aria-hidden="true">&rsaquo;</span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <p className="mc-empty">
                    {loaded
                      ? 'Every country&rsquo;s channel opens the moment its first maker lists.'
                      : 'Loading the map...'}
                  </p>
                )}
              </div>
            </div>
          </SectionBox>

          <SectionBox href="/community/collections">
            <SectionHead title="Buyer's collections" href="/community/collections" icon="grid" />
            {shopProducts.length > 0 ? (
              <div className="mc-coll-grid">
                {shopProducts.slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/shop/${p.id}`} className="mc-coll-tile" onClick={(e) => e.stopPropagation()}>
                    {p.images?.[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.images[0]} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="mc-media-empty" />
                    )}
                    <span className="mc-coll-name">{p.name}</span>
                    <span className="mc-coll-by">by {p.sellerName}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mc-coll-grid">
                {['A dream kitchen', 'A gallery wall', 'Gifts to come back to', 'Heritage pieces'].map((n) => (
                  <div key={n} className="mc-coll-tile mc-coll-seat">
                    <div className="mc-media-empty mc-media-sq" />
                    <span className="mc-coll-name">{n}</span>
                    <span className="mc-coll-by">Start it today</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mc-note">Save pieces you love into collections of your own and get inspired.</p>
            <Link href="/account/collections" className="mc-outbtn" onClick={(e) => e.stopPropagation()}>
              Create collection
            </Link>
          </SectionBox>
        </div>

        {/* ============ CHALLENGE + LEARNING + COUNTRIES ============ */}
        <div className="mc-row3">
          <SectionBox href="/community/challenge">
            <SectionHead title="Community challenge" href="/community/challenge" icon="laurel" />
            <div className="mc-challenge">
              <div className="mc-challenge-main">
                <div className="mc-chip-plain">The first challenge</div>
                <h3 className="mc-challenge-title">Show us your oldest tool.</h3>
                <p className="mc-note">Upload a video and share the story behind it.</p>
                <Link href="/community/challenge" className="mc-goldbtn" onClick={(e) => e.stopPropagation()}>
                  Join challenge
                </Link>
                <div className="mc-challenge-ends">Opens as the circle grows</div>
              </div>
              <div className="mc-challenge-winner">
                <div className="mc-chip-plain">Artisan of the month</div>
                <div className="mc-winner-avatar" aria-hidden="true"><Ico d={PATHS.user} size={20} /></div>
                <div className="mc-winner-name">Your name here</div>
                <div className="mc-laurel" aria-hidden="true"><Ico d={PATHS.laurel} size={16} /></div>
              </div>
            </div>
          </SectionBox>

          <SectionBox href="/community/learning">
            <SectionHead title="Learning centre" href="/community/learning" icon="cap" />
            <div className="mc-lessons">
              {['How leather is dyed', 'How ceramics are fired', 'Why one wool is special', 'The story of a carpet'].map((t) => (
                <div key={t} className="mc-lesson">
                  <span className="mc-lesson-thumb" aria-hidden="true"><Ico d={PATHS.play} size={12} /></span>
                  <span className="mc-lesson-title">{t}</span>
                  <span className="mc-chip-plain">Coming soon</span>
                </div>
              ))}
            </div>
            <p className="mc-note">Filmed in real workshops as makers join the circle.</p>
          </SectionBox>

          <SectionBox href="/community/countries">
            <SectionHead title="Follow countries" href="/community/countries" icon="shield" />
            <div className="mc-countries">
              {tradingCountries.slice(0, 5).map((c) => (
                <div key={c.code} className="mc-country-row">
                  <span className="mc-flag" aria-hidden="true">{flagFor(c.code)}</span>
                  <span className="mc-country-name">{c.name}</span>
                  <Link href={`/shop?origin=${c.code}`} className="mc-chip-gold" onClick={(e) => e.stopPropagation()}>
                    Shop
                  </Link>
                </div>
              ))}
              {loaded && tradingCountries.length === 0 && (
                <p className="mc-empty">Country channels appear here as makers around the world open them.</p>
              )}
            </div>
            <Link href="/shop" className="mc-outbtn mc-outbtn-wide" onClick={(e) => e.stopPropagation()}>
              Browse countries
            </Link>
          </SectionBox>
        </div>

        {/* ============ MAKER PASSPORT + STORY BANNER ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/passport">
            <SectionHead title="Maker passport" href="/community/passport" icon="passport" />
            <div className="mc-passport">
              <div className="mc-passport-id">
                <div className="mc-passport-avatar" aria-hidden="true"><Ico d={PATHS.user} size={26} /></div>
                <div>
                  <div className="mc-passport-name">Every maker&rsquo;s record<Verified /></div>
                  <div className="mc-vcard-sub">Built in public, order by order</div>
                  <span className="mc-chip-gold mc-chip-founding">Founding seller stamp for life</span>
                </div>
              </div>
              <div className="mc-passport-stats">
                {[
                  'Orders completed',
                  'Followers',
                  'Videos',
                  'Journal entries',
                  'Years preserving craft',
                  'Verification level',
                ].map((label) => (
                  <div key={label} className="mc-pstat">
                    <span className="mc-pstat-num">--</span>
                    <span className="mc-pstat-label">{label}</span>
                  </div>
                ))}
              </div>
              <Link href="/community/passport" className="mc-outbtn" onClick={(e) => e.stopPropagation()}>
                View full passport
              </Link>
            </div>
          </SectionBox>

          <section className="mc-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mc-banner-img" src={bannerImage} alt="" aria-hidden="true" loading="lazy" />
            <div className="mc-banner-scrim" aria-hidden="true" />
            <div className="mc-banner-inner">
              <h2 className="mc-banner-title">
                Every product has a story.
                <br />
                Every story has a maker.
              </h2>
              <p className="mc-banner-sub">Discover the people behind the world&rsquo;s greatest craftsmanship.</p>
              <Link href="/shop" className="mc-btn mc-btn-primary">Explore the community</Link>
            </div>
          </section>
        </div>

        {/* ============ TRUST STRIP ============ */}
        <div className="mc-trust">
          {(
            [
              { t: 'Authentic makers', s: 'Real people, real stories', i: 'user' },
              { t: 'Verified sellers', s: 'Trusted and authenticated', i: 'shield' },
              { t: 'Global community', s: `${totalCountries} countries connected`, i: 'globe2' },
              { t: 'Live interaction', s: 'Ask, watch and shop live', i: 'mic' },
              { t: 'Preserve culture', s: 'Keeping traditions alive', i: 'laurel' },
            ] as { t: string; s: string; i: keyof typeof PATHS }[]
          ).map((item) => (
            <div key={item.t} className="mc-trust-item">
              <span className="mc-trust-ico" aria-hidden="true"><Ico d={PATHS[item.i]} size={15} /></span>
              <div>
                <div className="mc-trust-title">{item.t}</div>
                <div className="mc-trust-sub">{item.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

/* ---------- styles ----------
   The page carries its own --mc-* palette: dark theme reproduces William's
   design exactly (warm near-black, gold, orange); the light toggle maps the
   identical structure onto the site's light tokens. */

const css = `
.mc-page {
  --mc-bg: #0b0906;
  --mc-card: #131008;
  --mc-card2: rgba(255,255,255,0.04);
  --mc-line: rgba(255,255,255,0.28);
  --mc-goldline: rgba(212,175,55,0.5);
  --mc-text: #f4efe6;
  --mc-muted: #a99f8c;
  --mc-gold: #D4AF37;
  --mc-shadow: 0 18px 44px rgba(0,0,0,0.4);
  background: var(--mc-bg); color: var(--mc-text);
}
html[data-theme='light'] .mc-page {
  --mc-bg: var(--bg);
  --mc-card: var(--surface);
  --mc-card2: rgba(0,0,0,0.045);
  --mc-line: rgba(26,26,29,0.3);
  --mc-goldline: #c9a227;
  --mc-text: var(--text);
  --mc-muted: var(--muted);
  --mc-gold: #a8811a;
  --mc-shadow: 0 10px 28px rgba(26,20,10,0.09);
}
/* Full-bleed per William 2026-07-30 ("fit the page perfectly left to right
   no gaps either side") -- same no-max-width rule as the homepage. A slim
   edge inset keeps the boxes' gold borders and rounded corners visible. */
.mc-wrap { width: 100%; padding: 24px clamp(8px, 1vw, 14px) 50px; display: flex; flex-direction: column; gap: 20px; }

.mc-kicker { font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--mc-text); }
.mc-mark { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; border: 1.4px solid var(--accent); color: var(--accent); flex-shrink: 0; }
.mc-verified { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; background: var(--mc-gold); color: #14110c; margin-left: 7px; vertical-align: 2px; }

.mc-shead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.mc-shead-left { display: inline-flex; align-items: center; gap: 10px; }
.mc-viewall { font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mc-gold); white-space: nowrap; }
.mc-viewall:hover { color: var(--accent); }

.mc-box { background: var(--mc-card); border-radius: 18px; padding: 20px 20px 22px; cursor: pointer; box-shadow: var(--mc-shadow); transition: transform 0.18s ease, filter 0.18s ease; }
.mc-box:hover { filter: brightness(1.06); }
.mc-box:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) { .mc-box:hover { transform: translateY(-2px); } }

.mc-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.mc-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
@media (max-width: 980px) { .mc-row2, .mc-row3 { grid-template-columns: 1fr; } }

/* buttons */
.mc-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 10px 26px; border-radius: 8px; font-family: var(--font-display); font-size: 12.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.mc-btn-primary { background: var(--accent); color: #fff; }
.mc-btn-primary:hover { filter: brightness(1.08); }
.mc-btn-ghost { border: 1px solid rgba(255,255,255,0.6); color: #fff; }
.mc-btn-ghost:hover { border-color: #fff; }
.mc-outbtn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 38px; padding: 7px 16px; margin-top: 10px; border: 1px solid var(--mc-line); border-radius: 7px; font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mc-text); align-self: flex-start; background: none; }
.mc-outbtn:hover { border-color: var(--mc-gold); color: var(--mc-gold); }
.mc-outbtn-wide { width: 100%; grid-column: 1 / -1; }
.mc-goldbtn { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 8px 20px; margin-top: 10px; border-radius: 7px; background: var(--mc-gold); color: #14110c; font-family: var(--font-display); font-size: 11.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.mc-goldbtn:hover { filter: brightness(1.08); }
.mc-cartbtn { display: inline-flex; align-items: center; justify-content: center; min-height: 36px; padding: 7px 15px; border-radius: 6px; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
.mc-cartbtn:hover { filter: brightness(1.08); }

/* chips + tags */
.mc-tag { position: absolute; top: 10px; left: 10px; z-index: 2; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-family: var(--font-display); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.mc-tag-live { background: var(--red); color: #fff; }
.mc-tag-gold { background: var(--mc-gold); color: #14110c; }
.mc-tag-orange { background: var(--accent); color: #fff; }
.mc-tag-plain { background: rgba(0,0,0,0.55); color: #eee; border: 1px solid rgba(255,255,255,0.25); }
.mc-livedot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.mc-chip-gold { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--mc-goldline); color: var(--mc-gold); font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.mc-chip-gold:hover { border-color: var(--mc-gold); }
.mc-chip-plain { display: inline-flex; padding: 3px 10px; border-radius: 999px; background: var(--mc-card2); color: var(--mc-muted); font-family: var(--font-display); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.mc-chip-founding { margin-top: 7px; }

/* hero */
.mc-hero { position: relative; min-height: 440px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #0c0a08; }
.mc-hero-collage { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(4, 1fr); }
.mc-hero-cell { position: relative; overflow: hidden; }
.mc-hero-cell + .mc-hero-cell { border-left: 1px solid rgba(0,0,0,0.35); }
.mc-hero-cell img { width: 100%; height: 100%; object-fit: cover; }
.mc-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,8,6,0.5) 0%, rgba(10,8,6,0.7) 52%, rgba(12,10,8,0.94) 100%); }
.mc-hero-inner { position: relative; text-align: center; padding: 66px 20px; max-width: 780px; }
.mc-hero-title { font-size: clamp(34px, 5.6vw, 56px); line-height: 1.06; color: #fff; margin-bottom: 16px; }
.mc-hero-accent { color: #D4AF37; }
.mc-hero-sub { color: rgba(255,255,255,0.85); font-size: 15.5px; max-width: 530px; margin: 0 auto 26px; }
.mc-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* featured */
.mc-span2 { width: 100%; }
.mc-featured-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 980px) { .mc-featured-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) { .mc-featured-grid { grid-template-columns: 1fr; } }
.mc-fcard { position: relative; border-radius: 14px; overflow: hidden; min-height: 320px; display: flex; align-items: flex-end; background: var(--mc-card2); }
.mc-fcard-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.mc-fcard-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,8,6,0.05) 30%, rgba(10,8,6,0.62) 68%, rgba(10,8,6,0.92) 100%); }
.mc-fcard-seat .mc-fcard-shade { background: none; }
.mc-fcard-seat { background: var(--mc-card2); }
.mc-fcard-body { position: relative; z-index: 2; padding: 14px; display: flex; flex-direction: column; gap: 4px; width: 100%; }
.mc-fcard-name { font-size: 20px; color: #fff; }
.mc-fcard-seat .mc-fcard-name { color: var(--mc-text); }
.mc-fcard-country { font-size: 12.5px; color: rgba(255,255,255,0.8); }
.mc-fcard-line { font-size: 13px; color: rgba(255,255,255,0.85); }
.mc-fcard-seat .mc-fcard-country, .mc-fcard-seat .mc-fcard-line { color: var(--mc-muted); }
.mc-fcard .mc-outbtn { border-color: rgba(255,255,255,0.4); color: #fff; }
.mc-fcard .mc-outbtn:hover { border-color: #fff; color: #fff; }
.mc-fcard-seat .mc-outbtn { border-color: var(--mc-line); color: var(--mc-text); }

/* journals */
.mc-journal { display: grid; grid-template-columns: 1fr 1.1fr; gap: 16px; align-items: stretch; }
@media (max-width: 640px) { .mc-journal { grid-template-columns: 1fr; } }
.mc-journal-text { display: flex; flex-direction: column; gap: 9px; }
.mc-journal-title { font-size: 24px; line-height: 1.15; }
.mc-journal-body { font-size: 13.5px; color: var(--mc-muted); flex: 1; }
.mc-journal-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--mc-muted); }
.mc-journal-heart { color: var(--mc-gold); display: inline-flex; }
.mc-journal-media { position: relative; border-radius: 14px; overflow: hidden; min-height: 190px; }
.mc-journal-media img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.mc-media-empty { width: 100%; height: 100%; min-height: 150px; background: var(--mc-card2); border-radius: inherit; }
.mc-media-sq { aspect-ratio: 1; min-height: 0; }
.mc-playbtn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 52px; height: 52px; border-radius: 50%; background: rgba(12,10,8,0.6); border: 1.5px solid rgba(255,255,255,0.8); color: #fff; display: flex; align-items: center; justify-content: center; }
.mc-playbtn-sm { width: 36px; height: 36px; }
.mc-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; border-radius: 50%; background: rgba(12,10,8,0.65); border: 1px solid rgba(255,255,255,0.4); color: #fff; font-size: 19px; line-height: 1; display: flex; align-items: center; justify-content: center; }
.mc-arrow:hover { border-color: #fff; }
.mc-arrow-l { left: 10px; }
.mc-arrow-r { right: 10px; }
.mc-dots { display: flex; gap: 6px; justify-content: center; margin-top: 12px; }
.mc-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mc-goldline); opacity: 0.5; }
.mc-dot-on { background: var(--mc-gold); opacity: 1; }

/* ask */
.mc-ask-search { display: flex; align-items: center; gap: 10px; background: var(--mc-card2); border-radius: 999px; padding: 11px 18px; color: var(--mc-muted); font-size: 13.5px; margin-bottom: 12px; }
.mc-ask-rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.mc-ask-row { display: flex; align-items: center; gap: 11px; background: var(--mc-card2); border-radius: 10px; padding: 9px 13px; color: var(--mc-text); font-size: 13.5px; }
.mc-ask-row:hover { background: rgba(212,175,55,0.12); }
.mc-ask-avatar { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: var(--mc-card); border: 1px solid var(--mc-goldline); color: var(--mc-gold); flex-shrink: 0; }
.mc-ask-q { flex: 1; }
.mc-ask-go { color: var(--mc-gold); }
.mc-ask-using { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid var(--mc-card2); padding-top: 12px; font-size: 12px; color: var(--mc-muted); }
.mc-ask-using-label { font-family: var(--font-display); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-size: 10.5px; }
.mc-ask-mode { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--mc-goldline); color: var(--mc-gold); font-size: 11.5px; }
.mc-ask-note { flex: 1; text-align: right; min-width: 140px; }
.mc-empty { font-size: 13.5px; color: var(--mc-muted); background: var(--mc-card2); border-radius: 12px; padding: 16px; }
.mc-note { font-size: 12.5px; color: var(--mc-muted); margin-top: 10px; }

/* workshop videos */
.mc-crafts { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 13px; }
.mc-craft { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; min-width: 56px; padding: 8px 6px; border-radius: 10px; background: var(--mc-card2); color: var(--mc-muted); font-family: var(--font-display); font-size: 10px; font-weight: 600; letter-spacing: 0.05em; }
.mc-craft-on { color: var(--mc-gold); background: rgba(212,175,55,0.14); }
.mc-video-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.mc-vcard { border-radius: 12px; overflow: hidden; background: var(--mc-card2); }
.mc-vcard:hover { filter: brightness(1.12); }
.mc-vthumb { position: relative; aspect-ratio: 16 / 10; }
.mc-vthumb img { width: 100%; height: 100%; object-fit: cover; }
.mc-vthumb-seat { display: flex; align-items: center; justify-content: center; color: var(--mc-gold); background: rgba(255,255,255,0.03); }
.mc-vcard-seatcard { background: var(--mc-card2); }
.mc-vcard-meta { padding: 9px 11px; }
.mc-vcard-title { font-size: 13.5px; font-weight: 600; color: var(--mc-text); }
.mc-vcard-sub { font-size: 12px; color: var(--mc-muted); }

/* live shopping */
.mc-live { display: grid; grid-template-columns: 1.35fr 1fr; gap: 12px; }
@media (max-width: 640px) { .mc-live { grid-template-columns: 1fr; } }
.mc-live-left { display: flex; flex-direction: column; gap: 10px; }
.mc-live-frame { position: relative; border-radius: 14px; overflow: hidden; aspect-ratio: 16 / 10; background: var(--mc-card2); }
.mc-live-frame img { width: 100%; height: 100%; object-fit: cover; }
.mc-tag-onframe { top: 12px; left: 12px; }
.mc-live-off { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--mc-muted); font-size: 13px; text-align: center; padding: 16px; }
.mc-live-off svg { color: var(--mc-gold); }
.mc-live-productbar { display: flex; align-items: center; gap: 11px; background: var(--mc-card2); border-radius: 12px; padding: 9px 11px; }
.mc-live-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
.mc-live-pmeta { flex: 1; min-width: 0; }
.mc-chat { display: flex; flex-direction: column; background: var(--mc-card2); border-radius: 14px; padding: 12px; }
.mc-chat-body { flex: 1; }
.mc-chat-note { font-size: 12.5px; color: var(--mc-muted); }
.mc-chat-input { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; background: var(--mc-card); border-radius: 999px; padding: 8px 8px 8px 16px; color: var(--mc-muted); font-size: 12.5px; }
.mc-chat-input:hover { filter: brightness(1.15); }
.mc-chat-send { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff; flex-shrink: 0; }

/* around the world */
.mc-world { display: grid; grid-template-columns: 1.15fr 1fr; gap: 14px; align-items: start; }
@media (max-width: 640px) { .mc-world { grid-template-columns: 1fr; } }
.mc-world-left { display: grid; grid-template-columns: auto 1fr; gap: 10px 14px; align-items: center; }
.mc-world-stats { display: flex; flex-direction: column; gap: 12px; }
.mc-stat { text-align: left; }
.mc-stat-num { display: block; font-family: var(--font-serif); font-size: 22px; color: var(--mc-gold); line-height: 1.15; }
.mc-stat-label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mc-muted); font-family: var(--font-display); }
.mc-globe-wrap { display: flex; justify-content: center; }
.mc-globe { width: min(100%, 230px); height: auto; }
.mc-world-panel { display: flex; flex-direction: column; gap: 8px; background: var(--mc-card2); border-radius: 14px; padding: 13px; }
.mc-world-country { display: flex; align-items: center; gap: 9px; padding-bottom: 9px; border-bottom: 1px solid var(--mc-card2); }
.mc-world-cname { flex: 1; font-family: var(--font-serif); font-size: 17px; }
.mc-panel-row { display: flex; align-items: center; justify-content: space-between; background: var(--mc-card); border-radius: 10px; padding: 9px 13px; font-size: 13px; color: var(--mc-text); }
.mc-panel-row:hover { filter: brightness(1.15); }
.mc-panel-row span:last-child { color: var(--mc-gold); font-size: 16px; line-height: 1; }
.mc-flag { font-size: 17px; }

/* collections */
.mc-coll-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 640px) { .mc-coll-grid { grid-template-columns: repeat(2, 1fr); } }
.mc-coll-tile { border-radius: 12px; overflow: hidden; background: var(--mc-card2); display: flex; flex-direction: column; }
.mc-coll-tile:hover { filter: brightness(1.12); }

.mc-coll-tile img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.mc-coll-name { display: block; padding: 7px 9px 0; font-size: 12.5px; font-weight: 600; color: var(--mc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-coll-by { display: block; padding: 0 9px 8px; font-size: 11px; color: var(--mc-muted); }

/* challenge */
.mc-challenge { display: grid; grid-template-columns: 1.25fr 1fr; gap: 10px; align-items: stretch; }
@media (max-width: 440px) { .mc-challenge { grid-template-columns: 1fr; } }
.mc-challenge-main { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; background: var(--mc-card2); border-radius: 14px; padding: 14px; }
.mc-challenge-title { font-size: 22px; line-height: 1.15; }
.mc-challenge-ends { font-size: 11.5px; color: var(--mc-muted); }
.mc-challenge-winner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; background: var(--mc-card2); border-radius: 14px; padding: 14px; text-align: center; }
.mc-winner-avatar { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 50%; border: 1.5px solid var(--mc-gold); color: var(--mc-gold); }
.mc-winner-name { font-family: var(--font-serif); font-size: 16px; }
.mc-laurel { color: var(--mc-gold); }

/* learning */
.mc-lessons { display: flex; flex-direction: column; gap: 8px; }
.mc-lesson { display: flex; align-items: center; gap: 11px; background: var(--mc-card2); border-radius: 12px; padding: 9px 12px; }
.mc-lesson-thumb { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 30px; border-radius: 6px; background: rgba(212,175,55,0.14); color: var(--mc-gold); flex-shrink: 0; }
.mc-lesson-title { flex: 1; font-size: 13px; color: var(--mc-text); }

/* follow countries */
.mc-countries { display: flex; flex-direction: column; gap: 8px; }
.mc-country-row { display: flex; align-items: center; gap: 10px; background: var(--mc-card2); border-radius: 10px; padding: 9px 13px; font-size: 13.5px; color: var(--mc-text); }
.mc-country-row:hover { filter: brightness(1.12); }
.mc-country-name { flex: 1; font-weight: 600; }

/* passport */
.mc-passport { display: flex; flex-direction: column; gap: 14px; }
.mc-passport-id { display: flex; align-items: center; gap: 14px; }
.mc-passport-avatar { display: flex; align-items: center; justify-content: center; width: 66px; height: 66px; border-radius: 50%; border: 1.5px solid var(--mc-gold); color: var(--mc-gold); flex-shrink: 0; }
.mc-passport-name { font-family: var(--font-serif); font-size: 19px; }
.mc-passport-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
@media (max-width: 540px) { .mc-passport-stats { grid-template-columns: repeat(2, 1fr); } }
.mc-pstat { background: var(--mc-card2); border-radius: 12px; padding: 10px 8px; text-align: center; }
.mc-pstat-num { display: block; font-family: var(--font-serif); font-size: 19px; color: var(--mc-gold); }
.mc-pstat-label { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--mc-muted); font-family: var(--font-display); }

/* banner */
.mc-banner { position: relative; border-radius: 18px; overflow: hidden; min-height: 300px; display: flex; align-items: center; box-shadow: var(--mc-shadow); }
.mc-banner-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.mc-banner-scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(10,8,6,0.85) 0%, rgba(10,8,6,0.55) 60%, rgba(10,8,6,0.3) 100%); }
.mc-banner-inner { position: relative; padding: 30px; max-width: 480px; }
.mc-banner-title { font-size: clamp(22px, 2.6vw, 31px); color: #fff; margin-bottom: 10px; }
.mc-banner-sub { color: rgba(255,255,255,0.85); font-size: 13.5px; margin-bottom: 18px; }

/* trust strip */
.mc-trust { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; border-top: 1px solid var(--mc-card2); padding-top: 24px; }
@media (max-width: 980px) { .mc-trust { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) { .mc-trust { grid-template-columns: 1fr; } }
.mc-trust-item { display: flex; align-items: flex-start; gap: 11px; }
.mc-trust-ico { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: 1.3px solid var(--mc-gold); color: var(--mc-gold); flex-shrink: 0; }
.mc-trust-title { font-family: var(--font-display); font-size: 12.5px; font-weight: 700; letter-spacing: 0.06em; color: var(--mc-text); }
.mc-trust-sub { font-size: 12px; color: var(--mc-muted); }
`
