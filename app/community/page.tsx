'use client'

/**
 * THE MAKERS' CIRCLE -- Velor's community hub (William's redesign, 2026-07-30).
 *
 * Replaces Workshop + Drops in the main nav with one front door for the whole
 * social layer. Every section below is a clickable box that routes to its own
 * page under /community/<section> (placeholder pages until William supplies
 * each section's dedicated design -- see app/community/[section]/page.tsx).
 *
 * LAW #1 (honesty): every figure, maker, post and stream rendered here comes
 * from a live API (/api/lattice, /api/social/feed, /api/live,
 * /api/shop/products). Nothing is fabricated. Empty sections render honest
 * invitations, never sample makers or invented counts.
 *
 * Theme: built entirely on the site's CSS variables so the light/dark toggle
 * works everywhere. The hero and story banner sit on photography with a dark
 * scrim, so their text is deliberately light in both themes (same precedent
 * as the live-stage dark surfaces).
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { pexelsUrl } from '@/lib/countryImagery'

const GOLD = '#D4AF37'

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

type ShopProduct = {
  id: string
  name: string
  images: string[]
  sellerName: string
}

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

function excerpt(text: string, max = 150): string {
  if (!text) return ''
  return text.length <= max ? text : text.slice(0, max).replace(/\s+\S*$/, '') + '...'
}

/* ---------- tiny shared visuals ---------- */

function SectionMark() {
  return (
    <span className="mc-mark" aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
      </svg>
    </span>
  )
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="mc-shead">
      <span className="mc-shead-left">
        <SectionMark />
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

/* ---------- page ---------- */

export default function CommunityPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [streams, setStreams] = useState<Stream[]>([])
  const [countries, setCountries] = useState<LatticeCountry[]>([])
  const [totalCountries, setTotalCountries] = useState(190)
  const [productCount, setProductCount] = useState<number | null>(null)
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([])
  const [loaded, setLoaded] = useState(false)

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
  const latestPost = posts[0] ?? null
  const tradingCountries = useMemo(
    () => [...countries].sort((a, b) => (b.products || 0) - (a.products || 0)),
    [countries],
  )

  /* Featured Today: real live streams first, then real journal posts, then
     honest open-seat invitations to fill the row of four. */
  type FeaturedCard = {
    key: string
    tag: string
    tagTone: 'live' | 'gold' | 'plain'
    img: string | null
    name: string
    countryCode: string | null
    countryName: string | null
    line: string
    ctaLabel: string
    ctaHref: string
  }
  const featured: FeaturedCard[] = []
  for (const s of liveStreams.slice(0, 2)) {
    featured.push({
      key: `live-${s.id}`,
      tag: 'Live now',
      tagTone: 'live',
      img: s.products[0]?.images?.[0] ?? null,
      name: s.sellerName,
      countryCode: null,
      countryName: null,
      line: s.title,
      ctaLabel: 'Watch live',
      ctaHref: `/live/${s.roomName}`,
    })
  }
  for (const p of posts) {
    if (featured.length >= 4) break
    featured.push({
      key: `post-${p.id}`,
      tag: p.videoUrl ? 'New video' : 'Journal',
      tagTone: 'gold',
      img: p.images?.[0] ?? p.product?.images?.[0] ?? null,
      name: p.seller.storeName,
      countryCode: null,
      countryName: p.seller.country,
      line: p.title,
      ctaLabel: p.videoUrl ? 'Watch video' : 'View journal',
      ctaHref: '/workshop',
    })
  }
  while (featured.length < 4) {
    featured.push({
      key: `seat-${featured.length}`,
      tag: 'Open seat',
      tagTone: 'plain',
      img: null,
      name: 'Your craft here',
      countryCode: null,
      countryName: null,
      line: 'The world is waiting to watch you work.',
      ctaLabel: 'Become a creator',
      ctaHref: '/apply',
    })
  }

  /* Hero collage -- verified Pexels imagery already used across the site
     (lib/countryImagery.ts), editorial placeholders until real maker
     photography exists. */
  const heroImages = [
    pexelsUrl(37619027, 'free-photo-of-hand-block-printing-on-yellow-fabric', 900),
    pexelsUrl(9412408, null, 900),
    pexelsUrl(23436813, 'free-photo-of-man-holding-a-japanese-knife', 900),
    pexelsUrl(31508160, null, 900),
  ]
  const bannerImage = pexelsUrl(34495354, null, 1400)

  const firstLive = liveStreams[0] ?? null
  const nextScheduled = scheduledStreams[0] ?? null

  return (
    <main className="mc-page">
      <style>{css}</style>

      {/* ============ HERO ============ */}
      <header className="mc-hero">
        <div className="mc-hero-collage" aria-hidden="true">
          {heroImages.map((src) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={src} src={src} alt="" loading="eager" />
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
          <SectionHead title="Featured today" href="/community/featured" />
          <div className="mc-featured-grid">
            {featured.map((c) => (
              <article key={c.key} className="mc-fcard">
                <div className="mc-fcard-media">
                  {c.img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.img} alt={c.name} loading="lazy" />
                  ) : (
                    <div className="mc-fcard-empty" aria-hidden="true">
                      <SectionMark />
                    </div>
                  )}
                  <span className={`mc-tag mc-tag-${c.tagTone}`}>
                    {c.tagTone === 'live' && <span className="mc-livedot" aria-hidden="true" />}
                    {c.tag}
                  </span>
                </div>
                <div className="mc-fcard-body">
                  <h3 className="mc-fcard-name">{c.name}</h3>
                  {c.countryName && <div className="mc-fcard-country">{c.countryName}</div>}
                  <p className="mc-fcard-line">{c.line}</p>
                  <Link href={c.ctaHref} className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
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
            <SectionHead title="Creator journals" href="/community/journals" />
            {latestPost ? (
              <div className="mc-journal">
                {(latestPost.images?.[0] ?? latestPost.product?.images?.[0]) && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    className="mc-journal-img"
                    src={latestPost.images?.[0] ?? latestPost.product?.images?.[0] ?? ''}
                    alt={latestPost.title}
                    loading="lazy"
                  />
                )}
                <div className="mc-journal-text">
                  <h3 className="mc-journal-title">{latestPost.title}</h3>
                  <p className="mc-journal-body">{excerpt(latestPost.body)}</p>
                  <div className="mc-journal-meta">
                    {latestPost.seller.storeName}
                    {latestPost.seller.country ? ` · ${latestPost.seller.country}` : ''} · {timeAgo(latestPost.createdAt)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mc-empty">
                {loaded
                  ? 'The first workshop journals are being written. Follow a maker and their story starts here.'
                  : 'Loading journals...'}
              </p>
            )}
          </SectionBox>

          <SectionBox href="/community/ask">
            <SectionHead title="Ask the maker" href="/community/ask" />
            <div className="mc-ask-search" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <span>Ask any verified seller a question...</span>
            </div>
            <p className="mc-ask-copy">
              Every verified maker answers buyer questions publicly, straight from their listing page. Ask about materials,
              sizing, shipping or the story behind a piece -- answers appear for the whole community to read.
            </p>
            <Link href="/shop" className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
              Find a maker to ask
            </Link>
          </SectionBox>
        </div>

        {/* ============ WORKSHOP VIDEOS + LIVE SHOPPING ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/videos">
            <SectionHead title="Workshop videos" href="/community/videos" />
            <div className="mc-pills" aria-hidden="true">
              {['All', 'Textile', 'Pottery', 'Wood', 'Metal', 'Tea', 'Embroidery', 'Leather'].map((p, i) => (
                <span key={p} className={`mc-pill ${i === 0 ? 'mc-pill-on' : ''}`}>{p}</span>
              ))}
            </div>
            {videoPosts.length > 0 ? (
              <div className="mc-video-grid">
                {videoPosts.slice(0, 4).map((v) => (
                  <Link key={v.id} href="/workshop" className="mc-vcard" onClick={(e) => e.stopPropagation()}>
                    {(v.images?.[0] ?? v.product?.images?.[0]) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={v.images?.[0] ?? v.product?.images?.[0] ?? ''} alt={v.title} loading="lazy" />
                    ) : (
                      <div className="mc-vcard-empty" />
                    )}
                    <div className="mc-vcard-meta">
                      <div className="mc-vcard-title">{v.title}</div>
                      <div className="mc-vcard-sub">{v.seller.storeName}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mc-empty">
                {loaded
                  ? 'No workshop films yet. Makers share their process here -- dyeing, throwing, forging, weaving -- as the circle grows.'
                  : 'Loading videos...'}
              </p>
            )}
          </SectionBox>

          <SectionBox href="/community/live-shopping">
            <SectionHead title="Live shopping" href="/community/live-shopping" />
            {firstLive ? (
              <div className="mc-live">
                <div className="mc-live-frame">
                  {firstLive.products[0]?.images?.[0] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={firstLive.products[0].images[0]} alt={firstLive.title} loading="lazy" />
                  ) : (
                    <div className="mc-vcard-empty" />
                  )}
                  <span className="mc-tag mc-tag-live"><span className="mc-livedot" aria-hidden="true" />Live</span>
                </div>
                <div className="mc-live-meta">
                  <div className="mc-vcard-title">{firstLive.title}</div>
                  <div className="mc-vcard-sub">by {firstLive.sellerName}</div>
                  <Link href={`/live/${firstLive.roomName}`} className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
                    Watch and shop live
                  </Link>
                </div>
              </div>
            ) : nextScheduled ? (
              <div className="mc-live-meta">
                <div className="mc-vcard-title">Next live: {nextScheduled.title}</div>
                <div className="mc-vcard-sub">
                  by {nextScheduled.sellerName}
                  {nextScheduled.scheduledFor ? ` · ${new Date(nextScheduled.scheduledFor).toLocaleString()}` : ''}
                </div>
                <Link href="/live" className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
                  See the live channel
                </Link>
              </div>
            ) : (
              <>
                <p className="mc-empty">
                  {loaded
                    ? 'No maker is on air right now. When a seller goes live you can watch, chat and buy pieces in real time.'
                    : 'Loading live channel...'}
                </p>
                <Link href="/live" className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
                  Visit the live channel
                </Link>
              </>
            )}
          </SectionBox>
        </div>

        {/* ============ AROUND THE WORLD + BUYER'S COLLECTIONS ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/world">
            <SectionHead title="Around the world" href="/community/world" />
            <div className="mc-world">
              <div className="mc-world-stats">
                <div className="mc-stat"><span className="mc-stat-num">{totalCountries}</span><span className="mc-stat-label">Countries</span></div>
                <div className="mc-stat"><span className="mc-stat-num">{countries.length}</span><span className="mc-stat-label">Trading today</span></div>
                <div className="mc-stat"><span className="mc-stat-num">{liveStreams.length}</span><span className="mc-stat-label">Live now</span></div>
                <div className="mc-stat"><span className="mc-stat-num">{productCount ?? '--'}</span><span className="mc-stat-label">Products</span></div>
              </div>
              <div className="mc-world-list">
                {tradingCountries.slice(0, 4).map((c) => (
                  <Link
                    key={c.code}
                    href={`/shop?origin=${c.code}`}
                    className="mc-country-row"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="mc-flag" aria-hidden="true">{flagFor(c.code)}</span>
                    <span className="mc-country-name">{c.name}</span>
                    <span className="mc-country-count">{c.products} {c.products === 1 ? 'piece' : 'pieces'}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                ))}
                {loaded && tradingCountries.length === 0 && (
                  <p className="mc-empty">Every country&rsquo;s channel opens the moment its first maker lists.</p>
                )}
              </div>
            </div>
          </SectionBox>

          <SectionBox href="/community/collections">
            <SectionHead title="Buyer's collections" href="/community/collections" />
            {shopProducts.length > 0 && (
              <div className="mc-coll-grid">
                {shopProducts.slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/shop/${p.id}`} className="mc-coll-tile" onClick={(e) => e.stopPropagation()}>
                    {p.images?.[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.images[0]} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="mc-vcard-empty" />
                    )}
                    <span className="mc-coll-name">{p.name}</span>
                  </Link>
                ))}
              </div>
            )}
            <p className="mc-ask-copy">
              Save the pieces you love into collections of your own -- a dream kitchen, a gallery wall, gifts to come back
              to. Start one from any listing.
            </p>
            <Link href="/account/collections" className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
              Create a collection
            </Link>
          </SectionBox>
        </div>

        {/* ============ CHALLENGE + LEARNING + COUNTRIES ============ */}
        <div className="mc-row3">
          <SectionBox href="/community/challenge">
            <SectionHead title="Community challenge" href="/community/challenge" />
            <p className="mc-ask-copy">
              Monthly maker challenges -- show your oldest tool, your first piece, your workshop view -- with the winner
              crowned Artisan of the Month. The first challenge opens as the circle grows.
            </p>
            <Link href="/community/challenge" className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
              See the challenge
            </Link>
          </SectionBox>

          <SectionBox href="/community/learning">
            <SectionHead title="Learning centre" href="/community/learning" />
            <p className="mc-ask-copy">
              Short lessons from real makers: how leather is dyed, how ceramics are fired, why one wool is special. Filmed
              in real workshops as makers join.
            </p>
            <Link href="/community/learning" className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
              Enter the learning centre
            </Link>
          </SectionBox>

          <SectionBox href="/community/countries">
            <SectionHead title="Follow countries" href="/community/countries" />
            <div className="mc-world-list">
              {tradingCountries.slice(0, 5).map((c) => (
                <Link
                  key={c.code}
                  href={`/shop?origin=${c.code}`}
                  className="mc-country-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="mc-flag" aria-hidden="true">{flagFor(c.code)}</span>
                  <span className="mc-country-name">{c.name}</span>
                  <span className="mc-country-count">Shop</span>
                </Link>
              ))}
              {loaded && tradingCountries.length === 0 && (
                <p className="mc-empty">Country channels appear here as makers around the world open them.</p>
              )}
            </div>
            <Link href="/shop" className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
              Browse countries
            </Link>
          </SectionBox>
        </div>

        {/* ============ MAKER PASSPORT + STORY BANNER ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/passport">
            <SectionHead title="Maker passport" href="/community/passport" />
            <p className="mc-ask-copy">
              Every verified maker earns a Velor passport: orders completed, followers, journal entries, years preserving
              their craft. A record of real work, built in public -- founding sellers carry the founding stamp for life.
            </p>
            <Link href="/community/passport" className="mc-minibtn" onClick={(e) => e.stopPropagation()}>
              View the passport
            </Link>
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
          {[
            { t: 'Authentic makers', s: 'Real people, real stories' },
            { t: 'Verified sellers', s: 'Trusted and authenticated' },
            { t: 'Global community', s: `${totalCountries} countries connected` },
            { t: 'Live interaction', s: 'Ask, watch and shop live' },
            { t: 'Preserve culture', s: 'Keeping traditions alive' },
          ].map((item) => (
            <div key={item.t} className="mc-trust-item">
              <SectionMark />
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

/* ---------- styles: CSS-variable driven so the light/dark toggle works ---------- */

const css = `
.mc-page { background: var(--bg); color: var(--text); }
.mc-wrap { max-width: 1280px; margin: 0 auto; padding: 26px clamp(14px, 3vw, 34px) 50px; display: flex; flex-direction: column; gap: 22px; }

.mc-kicker { font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text); }
.mc-mark { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--accent); color: var(--accent); flex-shrink: 0; }

.mc-shead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.mc-shead-left { display: inline-flex; align-items: center; gap: 9px; }
.mc-viewall { font-family: var(--font-display); font-size: 11.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${GOLD}; white-space: nowrap; }
.mc-viewall:hover { color: var(--accent); }

.mc-box { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px 18px 20px; cursor: pointer; transition: border-color 0.18s ease, transform 0.18s ease; }
.mc-box:hover { border-color: ${GOLD}; }
.mc-box:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) { .mc-box:hover { transform: translateY(-2px); } }

.mc-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
.mc-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 22px; }
@media (max-width: 980px) { .mc-row2, .mc-row3 { grid-template-columns: 1fr; } }

/* hero */
.mc-hero { position: relative; min-height: 430px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.mc-hero-collage { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(4, 1fr); }
.mc-hero-collage img { width: 100%; height: 100%; object-fit: cover; }
.mc-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,8,10,0.55) 0%, rgba(8,8,10,0.72) 55%, rgba(8,8,10,0.88) 100%); }
.mc-hero-inner { position: relative; text-align: center; padding: 64px 20px; max-width: 760px; }
.mc-hero-title { font-size: clamp(34px, 5.4vw, 54px); line-height: 1.08; color: #fff; margin-bottom: 16px; }
.mc-hero-accent { color: ${GOLD}; font-style: italic; }
.mc-hero-sub { color: rgba(255,255,255,0.85); font-size: 15.5px; max-width: 520px; margin: 0 auto 24px; }
.mc-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.mc-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 10px 26px; border-radius: 8px; font-family: var(--font-display); font-size: 12.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.mc-btn-primary { background: var(--accent); color: #fff; }
.mc-btn-primary:hover { filter: brightness(1.08); }
.mc-btn-ghost { border: 1px solid rgba(255,255,255,0.55); color: #fff; }
.mc-btn-ghost:hover { border-color: #fff; }

/* featured */
.mc-span2 { width: 100%; }
.mc-featured-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 980px) { .mc-featured-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) { .mc-featured-grid { grid-template-columns: 1fr; } }
.mc-fcard { background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
.mc-fcard-media { position: relative; aspect-ratio: 4 / 3; background: var(--surface-2); }
.mc-fcard-media img { width: 100%; height: 100%; object-fit: cover; }
.mc-fcard-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: ${GOLD}; border-bottom: 1px dashed var(--border); }
.mc-tag { position: absolute; top: 10px; left: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.mc-tag-live { background: var(--red); color: #fff; }
.mc-tag-gold { background: ${GOLD}; color: #1a1408; }
.mc-tag-plain { background: var(--surface); color: var(--muted); border: 1px solid var(--border); }
.mc-livedot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.mc-fcard-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 5px; flex: 1; }
.mc-fcard-name { font-size: 17px; }
.mc-fcard-country { font-size: 12px; color: var(--muted); }
.mc-fcard-line { font-size: 13px; color: var(--muted); flex: 1; }
.mc-minibtn { display: inline-flex; align-items: center; justify-content: center; min-height: 38px; padding: 7px 16px; margin-top: 8px; border: 1px solid var(--border); border-radius: 7px; font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text); align-self: flex-start; }
.mc-minibtn:hover { border-color: ${GOLD}; color: ${GOLD}; }

/* journals */
.mc-journal { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: stretch; }
@media (max-width: 640px) { .mc-journal { grid-template-columns: 1fr; } }
.mc-journal-img { width: 100%; height: 100%; min-height: 180px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border); }
.mc-journal-text { display: flex; flex-direction: column; gap: 8px; }
.mc-journal-title { font-size: 20px; }
.mc-journal-body { font-size: 13.5px; color: var(--muted); flex: 1; }
.mc-journal-meta { font-size: 12px; color: var(--muted); }

/* ask */
.mc-ask-search { display: flex; align-items: center; gap: 10px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 999px; padding: 11px 18px; color: var(--muted); font-size: 13.5px; margin-bottom: 12px; }
.mc-ask-copy { font-size: 13.5px; color: var(--muted); margin-bottom: 4px; }
.mc-empty { font-size: 13.5px; color: var(--muted); border: 1px dashed var(--border); border-radius: 10px; padding: 16px; }

/* videos */
.mc-pills { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }
.mc-pill { font-family: var(--font-display); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; padding: 5px 12px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); }
.mc-pill-on { border-color: ${GOLD}; color: ${GOLD}; }
.mc-video-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.mc-vcard { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--surface-2); }
.mc-vcard img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
.mc-vcard-empty { width: 100%; aspect-ratio: 16 / 10; background: var(--surface-2); border-bottom: 1px dashed var(--border); }
.mc-vcard-meta { padding: 9px 11px; }
.mc-vcard-title { font-size: 13.5px; font-weight: 600; }
.mc-vcard-sub { font-size: 12px; color: var(--muted); }

/* live */
.mc-live { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; }
@media (max-width: 640px) { .mc-live { grid-template-columns: 1fr; } }
.mc-live-frame { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
.mc-live-frame img { width: 100%; aspect-ratio: 16 / 11; object-fit: cover; }
.mc-live-meta { display: flex; flex-direction: column; gap: 6px; justify-content: center; }

/* world */
.mc-world { display: flex; flex-direction: column; gap: 14px; }
.mc-world-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 540px) { .mc-world-stats { grid-template-columns: repeat(2, 1fr); } }
.mc-stat { background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 10px; text-align: center; }
.mc-stat-num { display: block; font-family: var(--font-serif); font-size: 24px; color: ${GOLD}; }
.mc-stat-label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); font-family: var(--font-display); }
.mc-world-list { display: flex; flex-direction: column; gap: 8px; }
.mc-country-row { display: flex; align-items: center; gap: 10px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 9px; padding: 9px 13px; font-size: 13.5px; color: var(--text); }
.mc-country-row:hover { border-color: ${GOLD}; }
.mc-flag { font-size: 16px; }
.mc-country-name { flex: 1; font-weight: 600; }
.mc-country-count { font-size: 12px; color: var(--muted); }

/* collections */
.mc-coll-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
@media (max-width: 640px) { .mc-coll-grid { grid-template-columns: repeat(2, 1fr); } }
.mc-coll-tile { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--surface-2); }
.mc-coll-tile img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.mc-coll-name { display: block; padding: 7px 9px; font-size: 12px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* banner */
.mc-banner { position: relative; border-radius: 14px; overflow: hidden; min-height: 280px; display: flex; align-items: center; border: 1px solid var(--border); }
.mc-banner-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.mc-banner-scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8,8,10,0.82) 0%, rgba(8,8,10,0.55) 60%, rgba(8,8,10,0.35) 100%); }
.mc-banner-inner { position: relative; padding: 30px 30px; max-width: 480px; }
.mc-banner-title { font-size: clamp(22px, 2.6vw, 30px); color: #fff; margin-bottom: 10px; }
.mc-banner-sub { color: rgba(255,255,255,0.85); font-size: 13.5px; margin-bottom: 18px; }

/* trust strip */
.mc-trust { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; border-top: 1px solid var(--border); padding-top: 24px; }
@media (max-width: 980px) { .mc-trust { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) { .mc-trust { grid-template-columns: 1fr; } }
.mc-trust-item { display: flex; align-items: flex-start; gap: 10px; }
.mc-trust-title { font-family: var(--font-display); font-size: 12.5px; font-weight: 700; letter-spacing: 0.06em; }
.mc-trust-sub { font-size: 12px; color: var(--muted); }
`
