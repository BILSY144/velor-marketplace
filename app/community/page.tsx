'use client'

/**
 * THE MAKERS' CIRCLE -- Velor's community hub.
 *
 * EXACT REPLICATION OF WILLIAM'S SUPPLIED DESIGN (his order, 2026-07-30,
 * verbatim: "take everything out of my design and replicate it exactly the
 * same non negoatiable"). Every image on this page is extracted directly
 * from his design file (public/community/*.jpg + community-globe.jpg); all
 * copy, names, figures and layout mirror the design 1:1. The showcase
 * makers and figures shown here are the design's own content, kept at
 * William's explicit instruction (he was offered real-data/honest-empty
 * states and chose exact replication, twice, informed). When real makers
 * fill these seats, swap sections to live data with his sign-off.
 *
 * Every section box is clickable and routes to /community/<section>
 * (placeholders in app/community/[section]/page.tsx until each section's
 * dedicated page is designed -- built one at a time with William).
 *
 * Theme: page-scoped --mc-* palette. Dark theme reproduces the design
 * exactly; the light/dark toggle maps the same structure onto light tokens
 * (photography keeps light-on-dark text).
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { pexelsUrl } from '@/lib/countryImagery'

/* ---------- helpers ---------- */

/** Flag derived from the ISO-2 code at runtime -- never written into source. */
function flagFor(code: string): string {
  if (!code || code.length !== 2) return ''
  const base = 0x1f1e6
  const a = 'A'.charCodeAt(0)
  return String.fromCodePoint(base + code.toUpperCase().charCodeAt(0) - a, base + code.toUpperCase().charCodeAt(1) - a)
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
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  comment: 'M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10z',
}

function Verified({ size = 15 }: { size?: number }) {
  return (
    <span className="mc-verified" style={{ width: size, height: size }} aria-label="Verified seller">
      <Ico d={PATHS.check} size={Math.round(size * 0.6)} />
    </span>
  )
}

function SectionHead({ title, href, icon }: { title: string; href: string; icon: keyof typeof PATHS }) {
  return (
    <div className="mc-shead">
      <span className="mc-shead-left">
        <span className="mc-mark" aria-hidden="true"><Ico d={PATHS[icon]} size={11} /></span>
        <span className="mc-kicker">{title}</span>
      </span>
      <Link href={href} className="mc-viewall" onClick={(e) => e.stopPropagation()}>
        View all <span aria-hidden="true">&rsaquo;</span>
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

/* eslint-disable @next/next/no-img-element */

export default function CommunityPage() {
  const featured = [
    { key: 'f1', img: pexelsUrl(35509025, null, 700), name: 'Fatima', verified: false, cc: 'MA', country: 'Morocco', line: 'Making hand-painted tagines.', cta: 'Watch live', ctaIcon: true, href: '/live' },
    { key: 'f2', img: pexelsUrl(27084601, null, 700), name: 'Hiroshi', verified: true, cc: 'JP', country: 'Japan', line: 'New workshop journal uploaded. Making Samurai kitchen knives.', cta: 'View journal', ctaIcon: false, href: '/workshop' },
    { key: 'f3', img: pexelsUrl(36103768, 'free-photo-of-colorful-mexican-talavera-pottery-display', 700), name: 'Saul', verified: true, cc: 'MX', country: 'Mexico', line: 'Answered 12 buyer questions today.', cta: 'Ask a question', ctaIcon: false, href: '/community/ask' },
    { key: 'f4', img: pexelsUrl(14106294, null, 700), name: 'Lhamo', verified: true, cc: 'NP', country: 'Nepal', line: 'Traditional Himalayan weaving.', cta: 'Watch video', ctaIcon: true, href: '/community/videos' },
  ]

  const askRows = [
    { q: 'How long does this rug take?', n: 23 },
    { q: 'Can you make this larger?', n: 18 },
    { q: 'What clay do you use?', n: 31 },
    { q: 'Can you ship to Australia?', n: 26 },
  ]

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

  const videos = [
    { img: pexelsUrl(33539680, null, 500), title: 'Natural Dyeing Process', country: 'Peru' },
    { img: pexelsUrl(19015377, null, 500), title: 'Hand Building Pottery', country: 'Italy' },
    { img: pexelsUrl(31004832, null, 500), title: 'Forging a Knife', country: 'Japan' },
    { img: pexelsUrl(33653647, 'free-photo-of-colorful-traditional-turkish-kilim-pattern', 500), title: 'Handwoven Carpet', country: 'Turkey' },
  ]

  const chat = [
    { img: pexelsUrl(36157389, null, 120), name: 'Emma', msg: 'How long does it take to make one?' },
    { img: pexelsUrl(8330375, null, 120), name: 'Rafael', msg: 'Do you ship to Europe?' },
    { img: pexelsUrl(36919208, null, 120), name: 'Julia', msg: "It's beautiful!" },
    { img: pexelsUrl(28351286, null, 120), name: 'Mia', msg: 'Can I order this in blue?' },
  ]

  const panelRows = [
    { img: pexelsUrl(37966508, null, 120), label: 'Live Sellers', sub: '23 live now', href: '/live' },
    { img: pexelsUrl(16963295, null, 120), label: 'Latest Videos', sub: 'New this week', href: '/community/videos' },
    { img: pexelsUrl(34189664, null, 120), label: 'Latest Journals', sub: '18 new entries', href: '/workshop' },
    { img: pexelsUrl(37966505, null, 120), label: 'Newest Products', sub: '56 new items', href: '/shop' },
  ]

  const collections = [
    { img: pexelsUrl(14705063, null, 500), name: 'My Dream Japanese Home', items: '18 items', by: 'by Olivia' },
    { img: pexelsUrl(37215000, 'free-photo-of-gourmet-seafood-and-avocado-molcajete-feast', 500), name: 'Traditional Mexican Kitchen', items: '24 items', by: 'by Daniel' },
    { img: pexelsUrl(29828564, null, 500), name: 'African Handmade', items: '31 items', by: 'by Sarah' },
    { img: pexelsUrl(6831008, null, 500), name: 'Himalayan Crafts', items: '15 items', by: 'by James' },
  ]

  const lessons = [
    { img: pexelsUrl(37357057, null, 200), title: 'How Moroccan Leather is Dyed', t: '10:24' },
    { img: pexelsUrl(18198515, null, 200), title: 'How Japanese Ceramics are Fired', t: '13:18' },
    { img: pexelsUrl(35729525, null, 200), title: 'Why Peruvian Alpaca Wool is Special', t: '9:47' },
    { img: pexelsUrl(30982437, null, 200), title: 'History of Turkish Carpets', t: '11:02' },
  ]

  const followCountries = [
    { cc: 'JP', name: 'Japan', state: 'Following' },
    { cc: 'IN', name: 'India', state: 'Follow' },
    { cc: 'GR', name: 'Greece', state: 'Follow' },
    { cc: 'MX', name: 'Mexico', state: 'Following' },
    { cc: 'MA', name: 'Morocco', state: 'Follow' },
  ]

  const passportStats = [
    { n: '1,245', l: 'Orders Completed' },
    { n: '3.8K', l: 'Followers' },
    { n: '87', l: 'Videos' },
    { n: '128', l: 'Journal Entries' },
    { n: '28', l: 'Years Preserving Craft' },
    { n: 'Gold', l: 'Verification Level' },
  ]

  return (
    <main className="mc-page">
      <style>{css}</style>

      {/* ============ HERO ============ */}
      <header className="mc-hero">
        {/* Hero + story-banner imagery: William reverted these two to the
            earlier verified-Pexels picks ("your previous images as they were
            better", 2026-07-30); everything else stays from his design file. */}
        <div className="mc-hero-collage" aria-hidden="true">
          <img src={pexelsUrl(37619027, 'free-photo-of-hand-block-printing-on-yellow-fabric', 900)} alt="" loading="eager" />
          <img src={pexelsUrl(9412408, null, 900)} alt="" loading="eager" />
          <div className="mc-hero-centercell" />
          <img src={pexelsUrl(23436813, 'free-photo-of-man-holding-a-japanese-knife', 900)} alt="" loading="eager" />
          <img src={pexelsUrl(31508160, null, 900)} alt="" loading="eager" />
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
            <Link href="/workshop" className="mc-btn mc-btn-primary">Explore Stories</Link>
            <Link href="/apply" className="mc-btn mc-btn-ghost">Become a Creator</Link>
          </div>
        </div>
      </header>

      <div className="mc-wrap">
        {/* ============ FEATURED TODAY ============ */}
        <SectionBox href="/community/featured" className="mc-span2">
          <SectionHead title="Featured Today" href="/community/featured" icon="spark" />
          <div className="mc-featured-grid">
            {featured.map((c) => (
              <article key={c.key} className="mc-fcard">
                <div className="mc-fcard-media">
                  <img src={c.img} alt={c.name} loading="lazy" />
                </div>
                <div className="mc-fcard-body">
                  <h3 className="mc-fcard-name">
                    {c.name}
                    {c.verified && <Verified />}
                  </h3>
                  <div className="mc-fcard-country">
                    <span aria-hidden="true">{flagFor(c.cc)}</span> {c.country}
                  </div>
                  <p className="mc-fcard-line">{c.line}</p>
                  <Link href={c.href} className="mc-outbtn" onClick={(e) => e.stopPropagation()}>
                    {c.ctaIcon && <Ico d={PATHS.play} size={10} />}
                    {c.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </SectionBox>

        {/* ============ CREATOR JOURNALS + ASK THE MAKER ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/journals">
            <SectionHead title="Creator Journals" href="/community/journals" icon="passport" />
            <div className="mc-journal">
              <div className="mc-journal-text">
                <h3 className="mc-journal-day">Day 128</h3>
                <p className="mc-journal-body">Today we finished our first order for Canada.</p>
                <p className="mc-journal-body">The glaze came out perfectly after three attempts.</p>
                <div className="mc-journal-meta">
                  <span className="mc-journal-stat"><Ico d={PATHS.heart} size={13} /> 412</span>
                  <span className="mc-journal-stat"><Ico d={PATHS.comment} size={13} /> 39</span>
                </div>
                <div className="mc-journal-viewed"><Ico d={PATHS.eye} size={12} /> Viewed in 17 countries</div>
              </div>
              <div className="mc-journal-media">
                <img src={pexelsUrl(18977427, null, 800)} alt="Creator journal video" loading="lazy" />
                <Link href="/community/journals" className="mc-arrow mc-arrow-l" aria-label="Previous journal" onClick={(e) => e.stopPropagation()}>&lsaquo;</Link>
                <Link href="/community/journals" className="mc-arrow mc-arrow-r" aria-label="Next journal" onClick={(e) => e.stopPropagation()}>&rsaquo;</Link>
              </div>
            </div>
            <div className="mc-dots" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`mc-dot ${i === 0 ? 'mc-dot-on' : ''}`} />
              ))}
            </div>
          </SectionBox>

          <SectionBox href="/community/ask">
            <SectionHead title="Ask the Maker" href="/community/ask" icon="chat" />
            <div className="mc-ask-search" aria-hidden="true">
              <Ico d={PATHS.search} size={14} />
              <span>Ask any verified seller a question...</span>
            </div>
            <div className="mc-ask-rows">
              {askRows.map((r) => (
                <Link key={r.q} href="/community/ask" className="mc-ask-row" onClick={(e) => e.stopPropagation()}>
                  <span className="mc-ask-avatar" aria-hidden="true"><Ico d={PATHS.user} size={12} /></span>
                  <span className="mc-ask-q">{r.q}</span>
                  <span className="mc-ask-count"><Ico d={PATHS.comment} size={11} /> {r.n}</span>
                </Link>
              ))}
            </div>
            <div className="mc-ask-using">
              <span className="mc-ask-using-label">Ask using:</span>
              <span className="mc-ask-mode"><Ico d={PATHS.camera} size={12} /> Video</span>
              <span className="mc-ask-mode"><Ico d={PATHS.mic} size={12} /> Voice</span>
              <span className="mc-ask-mode"><Ico d={PATHS.text} size={12} /> Text</span>
            </div>
          </SectionBox>
        </div>

        {/* ============ WORKSHOP VIDEOS + LIVE SHOPPING ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/videos">
            <SectionHead title="Workshop Videos" href="/community/videos" icon="camera" />
            <div className="mc-crafts" aria-hidden="true">
              {crafts.map((c, i) => (
                <span key={c.label} className={`mc-craft ${i === 0 ? 'mc-craft-on' : ''}`}>
                  <Ico d={PATHS[c.icon]} size={15} />
                  <span>{c.label}</span>
                </span>
              ))}
            </div>
            <div className="mc-video-grid">
              {videos.map((v) => (
                <Link key={v.title} href="/community/videos" className="mc-vcard" onClick={(e) => e.stopPropagation()}>
                  <div className="mc-vthumb">
                    <img src={v.img} alt={v.title} loading="lazy" />
                  </div>
                  <div className="mc-vcard-meta">
                    <div className="mc-vcard-title">{v.title}</div>
                    <div className="mc-vcard-sub">{v.country}</div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionBox>

          <SectionBox href="/community/live-shopping">
            <SectionHead title="Live Shopping" href="/community/live-shopping" icon="play" />
            <div className="mc-live">
              <div className="mc-live-left">
                <div className="mc-live-frame">
                  <img src={pexelsUrl(10377676, null, 800)} alt="Live shopping stream" loading="lazy" />
                </div>
                <div className="mc-live-productbar">
                  <img className="mc-live-thumb" src={pexelsUrl(6243343, null, 200)} alt="" aria-hidden="true" loading="lazy" />
                  <div className="mc-live-pmeta">
                    <div className="mc-live-pname">Handmade Ceramic Vase</div>
                    <div className="mc-vcard-sub">By Arjun &ndash; India</div>
                  </div>
                  <span className="mc-live-price">$129</span>
                  <Link href="/shop" className="mc-cartbtn" onClick={(e) => e.stopPropagation()}>
                    Add to Cart
                  </Link>
                </div>
              </div>
              <div className="mc-chat">
                <div className="mc-chat-body">
                  {chat.map((m) => (
                    <div key={m.name} className="mc-chat-msg">
                      <img className="mc-chat-avatar" src={m.img} alt="" aria-hidden="true" loading="lazy" />
                      <div>
                        <div className="mc-chat-name">{m.name}</div>
                        <div className="mc-chat-text">{m.msg}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/live" className="mc-chat-input" onClick={(e) => e.stopPropagation()}>
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
            <SectionHead title="Around the World" href="/community/world" icon="globe2" />
            <div className="mc-world">
              <div className="mc-world-left">
                <div className="mc-world-stats">
                  <div className="mc-stat"><span className="mc-stat-num">190</span><span className="mc-stat-label">Countries</span></div>
                  <div className="mc-stat"><span className="mc-stat-num">12.4K</span><span className="mc-stat-label">Makers</span></div>
                  <div className="mc-stat"><span className="mc-stat-num">2.8K</span><span className="mc-stat-label">Live Now</span></div>
                  <div className="mc-stat"><span className="mc-stat-num">328</span><span className="mc-stat-label">Products</span></div>
                </div>
                <div className="mc-globe-wrap" aria-hidden="true">
                  <img className="mc-globe" src="/community-globe.jpg" alt="" loading="lazy" />
                </div>
                <Link href="/community/world" className="mc-outbtn mc-outbtn-wide" onClick={(e) => e.stopPropagation()}>
                  Explore Map
                </Link>
              </div>
              <div className="mc-world-panel">
                <div className="mc-world-country">
                  <span className="mc-flag" aria-hidden="true">{flagFor('PE')}</span>
                  <span className="mc-world-cname">PERU</span>
                  <span className="mc-chip-gold">Following</span>
                </div>
                {panelRows.map((r) => (
                  <Link key={r.label} href={r.href} className="mc-panel-row" onClick={(e) => e.stopPropagation()}>
                    <img className="mc-panel-thumb" src={r.img} alt="" aria-hidden="true" loading="lazy" />
                    <span className="mc-panel-text">
                      <span className="mc-panel-label">{r.label}</span>
                      <span className="mc-panel-sub">{r.sub}</span>
                    </span>
                    <span className="mc-panel-go" aria-hidden="true">&rsaquo;</span>
                  </Link>
                ))}
              </div>
            </div>
          </SectionBox>

          <SectionBox href="/community/collections">
            <SectionHead title="Buyer's Collections" href="/community/collections" icon="grid" />
            <div className="mc-coll-grid">
              {collections.map((c) => (
                <Link key={c.name} href="/account/collections" className="mc-coll-tile" onClick={(e) => e.stopPropagation()}>
                  <img src={c.img} alt={c.name} loading="lazy" />
                  <span className="mc-coll-name">{c.name}</span>
                  <span className="mc-coll-by">{c.items}<br />{c.by}</span>
                </Link>
              ))}
            </div>
            <div className="mc-coll-foot">
              <p className="mc-note">Follow collections from other buyers and get inspired.</p>
              <Link href="/account/collections" className="mc-outbtn" onClick={(e) => e.stopPropagation()}>
                Create Collection
              </Link>
            </div>
          </SectionBox>
        </div>

        {/* ============ CHALLENGE + LEARNING + COUNTRIES ============ */}
        <div className="mc-row3">
          <SectionBox href="/community/challenge">
            <SectionHead title="Community Challenge" href="/community/challenge" icon="laurel" />
            <div className="mc-challenge">
              <div className="mc-challenge-main">
                <div className="mc-challenge-label">This Month&rsquo;s Challenge</div>
                <h3 className="mc-challenge-title">Show us your oldest tool.</h3>
                <p className="mc-note">Upload a video and share the story behind it.</p>
                <Link href="/community/challenge" className="mc-goldbtn" onClick={(e) => e.stopPropagation()}>
                  Join Challenge
                </Link>
                <div className="mc-challenge-ends">Ends in 12 days</div>
              </div>
              <div className="mc-challenge-winner">
                <div className="mc-challenge-label">Last Month Winner</div>
                <img className="mc-winner-avatar" src={pexelsUrl(38112321, null, 200)} alt="Abdul Karim" loading="lazy" />
                <div className="mc-winner-name">Abdul Karim</div>
                <div className="mc-winner-country"><span aria-hidden="true">{flagFor('MA')}</span> Morocco</div>
                <div className="mc-laurel"><Ico d={PATHS.laurel} size={14} /> Artisan of the Month <Ico d={PATHS.laurel} size={14} /></div>
              </div>
            </div>
          </SectionBox>

          <SectionBox href="/community/learning">
            <SectionHead title="Learning Centre" href="/community/learning" icon="cap" />
            <div className="mc-lessons">
              {lessons.map((l) => (
                <Link key={l.title} href="/community/learning" className="mc-lesson" onClick={(e) => e.stopPropagation()}>
                  <img className="mc-lesson-thumb" src={l.img} alt="" aria-hidden="true" loading="lazy" />
                  <span className="mc-lesson-title">{l.title}</span>
                  <span className="mc-lesson-time">{l.t}</span>
                </Link>
              ))}
            </div>
          </SectionBox>

          <SectionBox href="/community/countries">
            <SectionHead title="Follow Countries" href="/community/countries" icon="shield" />
            <div className="mc-countries">
              {followCountries.map((c) => (
                <div key={c.cc} className="mc-country-row">
                  <span className="mc-flag" aria-hidden="true">{flagFor(c.cc)}</span>
                  <span className="mc-country-name">{c.name}</span>
                  <Link
                    href={`/shop?origin=${c.cc}`}
                    className={c.state === 'Following' ? 'mc-chip-gold' : 'mc-chip-follow'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.state}
                  </Link>
                </div>
              ))}
            </div>
            <Link href="/shop" className="mc-outbtn mc-outbtn-wide" onClick={(e) => e.stopPropagation()}>
              Browse Countries
            </Link>
          </SectionBox>
        </div>

        {/* ============ MAKER PASSPORT + STORY BANNER ============ */}
        <div className="mc-row2">
          <SectionBox href="/community/passport">
            <SectionHead title="Maker Passport" href="/community/passport" icon="passport" />
            <div className="mc-passport">
              <div className="mc-passport-id">
                <img className="mc-passport-avatar" src={pexelsUrl(24645287, 'free-photo-of-elderly-person-holding-embroidered-blankets', 300)} alt="Maria Quispe" loading="lazy" />
                <div>
                  <div className="mc-passport-name">Maria Quispe<Verified /></div>
                  <div className="mc-passport-craft">
                    <span aria-hidden="true">{flagFor('PE')}</span> Peru &nbsp;&middot;&nbsp; Textile Weaving
                  </div>
                </div>
              </div>
              <div className="mc-passport-stats">
                {passportStats.map((s) => (
                  <div key={s.l} className="mc-pstat">
                    <span className={`mc-pstat-num ${s.n === 'Gold' ? 'mc-pstat-gold' : ''}`}>{s.n}</span>
                    <span className="mc-pstat-label">{s.l}</span>
                  </div>
                ))}
              </div>
              <div className="mc-passport-foot">
                <span className="mc-chip-gold">Founding Seller</span>
                <Link href="/community/passport" className="mc-outbtn" onClick={(e) => e.stopPropagation()}>
                  <Ico d={PATHS.play} size={10} /> View Full Passport
                </Link>
              </div>
            </div>
          </SectionBox>

          <section className="mc-banner">
            <img className="mc-banner-img" src={pexelsUrl(34495354, null, 1400)} alt="" aria-hidden="true" loading="lazy" />
            <div className="mc-banner-scrim" aria-hidden="true" />
            <div className="mc-banner-inner">
              <h2 className="mc-banner-title">
                Every Product Has A Story.
                <br />
                Every Story Has A Maker.
              </h2>
              <p className="mc-banner-sub">Discover the people behind the world&rsquo;s greatest craftsmanship.</p>
              <Link href="/shop" className="mc-btn mc-btn-primary">Explore the Community</Link>
            </div>
          </section>
        </div>

        {/* ============ TRUST STRIP ============ */}
        <div className="mc-trust">
          {(
            [
              { t: 'Authentic Makers', s: 'Real people, real stories', i: 'user' },
              { t: 'Verified Sellers', s: 'Trusted and authenticated', i: 'shield' },
              { t: 'Global Community', s: '190 countries connected', i: 'globe2' },
              { t: 'Live Interaction', s: 'Ask, watch & shop live', i: 'mic' },
              { t: 'Preserve Culture', s: 'Keeping traditions alive', i: 'laurel' },
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

/* ---------- styles: exact palette from William's design ---------- */

const css = `
.mc-page {
  --mc-bg: #0b0906;
  --mc-card: #131008;
  --mc-card2: rgba(255,255,255,0.04);
  --mc-line: rgba(255,255,255,0.28);
  --mc-goldline: rgba(212,175,55,0.55);
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
/* Full-bleed per William ("fit the page perfectly left to right no gaps either side"). */
.mc-wrap { width: 100%; padding: 22px clamp(8px, 1vw, 14px) 50px; display: flex; flex-direction: column; gap: 20px; }

.mc-kicker { font-family: var(--font-display); font-size: 12.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mc-text); }
.mc-mark { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #fff; flex-shrink: 0; }
.mc-verified { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--mc-gold); color: #14110c; margin-left: 7px; vertical-align: 1px; }

.mc-shead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
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
.mc-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 10px 26px; border-radius: 6px; font-family: var(--font-display); font-size: 12.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.mc-btn-primary { background: var(--accent); color: #fff; }
.mc-btn-primary:hover { filter: brightness(1.08); }
.mc-btn-ghost { border: 1px solid rgba(255,255,255,0.6); color: #fff; }
.mc-btn-ghost:hover { border-color: #fff; }
.mc-outbtn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 7px 16px; border: 1px solid var(--mc-goldline); border-radius: 6px; font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mc-gold); background: none; align-self: flex-start; }
.mc-outbtn:hover { border-color: var(--mc-gold); filter: brightness(1.15); }
.mc-goldbtn { display: inline-flex; align-items: center; justify-content: center; min-height: 38px; padding: 8px 20px; margin-top: 8px; border-radius: 6px; background: var(--mc-gold); color: #14110c; font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.mc-goldbtn:hover { filter: brightness(1.08); }
.mc-cartbtn { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 6px 13px; border-radius: 6px; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; white-space: nowrap; }
.mc-cartbtn:hover { filter: brightness(1.08); }

/* chips */
.mc-chip-gold { display: inline-flex; align-items: center; justify-content: center; padding: 3px 12px; border-radius: 5px; border: 1px solid var(--mc-goldline); color: var(--mc-gold); font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; }
.mc-chip-gold:hover { border-color: var(--mc-gold); }
.mc-chip-follow { display: inline-flex; align-items: center; justify-content: center; padding: 3px 12px; border-radius: 5px; color: var(--mc-muted); font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; }
.mc-chip-follow:hover { color: var(--mc-gold); }

/* hero */
.mc-hero { position: relative; min-height: 420px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #0b0906; }
.mc-hero-collage { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr 2.4fr 1fr 1fr; }
.mc-hero-collage img { width: 100%; height: 100%; object-fit: cover; }
.mc-hero-centercell { background: radial-gradient(ellipse at center, #191410 0%, #0b0906 75%); }
.mc-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,8,6,0.32) 0%, rgba(10,8,6,0.45) 50%, rgba(11,9,6,0.96) 100%); }
.mc-hero-inner { position: relative; text-align: center; padding: 62px 20px; max-width: 780px; }
.mc-hero-title { font-size: clamp(34px, 5.6vw, 56px); line-height: 1.06; color: #fff; margin-bottom: 15px; }
.mc-hero-accent { color: #E8890C; }
.mc-hero-sub { color: rgba(255,255,255,0.88); font-size: 15px; max-width: 520px; margin: 0 auto 26px; }
.mc-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* featured */
.mc-span2 { width: 100%; }
.mc-featured-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 980px) { .mc-featured-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) { .mc-featured-grid { grid-template-columns: 1fr; } }
.mc-fcard { border-radius: 12px; overflow: hidden; background: #100d07; display: flex; flex-direction: column; box-shadow: 0 10px 26px rgba(0,0,0,0.35); }
html[data-theme='light'] .mc-fcard { background: var(--surface); box-shadow: var(--mc-shadow); }
.mc-fcard-media { aspect-ratio: 210 / 122; overflow: hidden; }
.mc-fcard-media img { width: 100%; height: 100%; object-fit: cover; }
.mc-fcard-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.mc-fcard-name { font-size: 21px; color: var(--mc-text); display: flex; align-items: center; }
.mc-fcard-country { font-size: 12.5px; color: var(--mc-muted); display: flex; align-items: center; gap: 6px; }
.mc-fcard-line { font-size: 12.5px; color: var(--mc-muted); flex: 1; margin-top: 2px; }
.mc-fcard .mc-outbtn { margin-top: 10px; }

/* journals */
.mc-journal { display: grid; grid-template-columns: 1fr 1.25fr; gap: 16px; align-items: stretch; }
@media (max-width: 640px) { .mc-journal { grid-template-columns: 1fr; } }
.mc-journal-text { display: flex; flex-direction: column; gap: 9px; }
.mc-journal-day { font-size: 27px; }
.mc-journal-body { font-size: 13.5px; color: var(--mc-muted); }
.mc-journal-meta { display: flex; align-items: center; gap: 16px; margin-top: auto; }
.mc-journal-stat { display: inline-flex; align-items: center; gap: 6px; color: var(--mc-gold); font-size: 13px; }
.mc-journal-viewed { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; color: var(--mc-muted); }
.mc-journal-media { position: relative; border-radius: 12px; overflow: hidden; min-height: 190px; }
.mc-journal-media img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.mc-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; border-radius: 50%; background: rgba(12,10,8,0.6); color: var(--mc-gold); font-size: 19px; line-height: 1; display: flex; align-items: center; justify-content: center; }
.mc-arrow:hover { background: rgba(12,10,8,0.85); }
.mc-arrow-l { left: 10px; }
.mc-arrow-r { right: 10px; }
.mc-dots { display: flex; gap: 6px; justify-content: center; margin-top: 13px; }
.mc-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mc-goldline); opacity: 0.4; }
.mc-dot-on { background: var(--mc-gold); opacity: 1; }

/* ask */
.mc-ask-search { display: flex; align-items: center; gap: 10px; background: var(--mc-card2); border-radius: 999px; padding: 11px 18px; color: var(--mc-muted); font-size: 13.5px; margin-bottom: 12px; }
.mc-ask-rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.mc-ask-row { display: flex; align-items: center; gap: 11px; background: var(--mc-card2); border-radius: 10px; padding: 9px 13px; color: var(--mc-text); font-size: 13.5px; }
.mc-ask-row:hover { background: rgba(212,175,55,0.12); }
.mc-ask-avatar { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: var(--mc-card); border: 1px solid var(--mc-goldline); color: var(--mc-gold); flex-shrink: 0; }
.mc-ask-q { flex: 1; }
.mc-ask-count { display: inline-flex; align-items: center; gap: 5px; color: var(--mc-muted); font-size: 12px; }
.mc-ask-using { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid var(--mc-card2); padding-top: 12px; font-size: 12px; color: var(--mc-muted); }
.mc-ask-using-label { font-family: var(--font-display); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-size: 10.5px; }
.mc-ask-mode { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--mc-goldline); color: var(--mc-gold); font-size: 11.5px; }
.mc-note { font-size: 12.5px; color: var(--mc-muted); }

/* workshop videos */
.mc-crafts { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 13px; }
.mc-craft { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; min-width: 54px; padding: 8px 6px; border-radius: 10px; background: var(--mc-card2); color: var(--mc-muted); font-family: var(--font-display); font-size: 10px; font-weight: 600; letter-spacing: 0.05em; }
.mc-craft-on { color: var(--mc-gold); background: rgba(212,175,55,0.14); }
.mc-video-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 640px) { .mc-video-grid { grid-template-columns: repeat(2, 1fr); } }
.mc-vcard { border-radius: 10px; overflow: hidden; background: var(--mc-card2); }
.mc-vcard:hover { filter: brightness(1.12); }
.mc-vthumb { position: relative; aspect-ratio: 104 / 97; }
.mc-vthumb img { width: 100%; height: 100%; object-fit: cover; }
.mc-vcard-meta { padding: 8px 9px; }
.mc-vcard-title { font-size: 12.5px; font-weight: 600; color: var(--mc-text); }
.mc-vcard-sub { font-size: 11.5px; color: var(--mc-muted); }

/* live shopping */
.mc-live { display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; }
@media (max-width: 640px) { .mc-live { grid-template-columns: 1fr; } }
.mc-live-left { display: flex; flex-direction: column; gap: 0; }
.mc-live-frame { border-radius: 12px 12px 0 0; overflow: hidden; aspect-ratio: 210 / 143; }
.mc-live-frame img { width: 100%; height: 100%; object-fit: cover; }
.mc-live-productbar { display: flex; align-items: center; gap: 10px; background: #17120a; border-radius: 0 0 12px 12px; padding: 10px 12px; }
html[data-theme='light'] .mc-live-productbar { background: var(--surface-2); }
.mc-live-thumb { width: 42px; height: 42px; border-radius: 8px; object-fit: cover; }
.mc-live-pmeta { flex: 1; min-width: 0; }
.mc-live-pname { font-size: 13px; font-weight: 600; color: var(--mc-gold); }
.mc-live-price { font-family: var(--font-serif); font-size: 17px; color: var(--mc-text); }
.mc-chat { display: flex; flex-direction: column; background: var(--mc-card2); border-radius: 12px; padding: 12px; }
.mc-chat-body { flex: 1; display: flex; flex-direction: column; gap: 11px; }
.mc-chat-msg { display: flex; align-items: flex-start; gap: 9px; }
.mc-chat-avatar { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.mc-chat-name { font-size: 11.5px; font-weight: 700; color: var(--mc-gold); }
.mc-chat-text { font-size: 12px; color: var(--mc-text); }
.mc-chat-input { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; background: var(--mc-card); border-radius: 999px; padding: 7px 7px 7px 15px; color: var(--mc-muted); font-size: 12px; }
.mc-chat-input:hover { filter: brightness(1.15); }
.mc-chat-send { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; flex-shrink: 0; }

/* around the world */
.mc-world { display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; align-items: start; }
@media (max-width: 640px) { .mc-world { grid-template-columns: 1fr; } }
.mc-world-left { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; align-items: center; }
.mc-world-stats { display: flex; flex-direction: column; gap: 13px; }
.mc-stat { text-align: left; }
.mc-stat-num { display: block; font-family: var(--font-serif); font-size: 24px; color: var(--mc-gold); line-height: 1.1; }
.mc-stat-label { font-size: 12px; color: var(--mc-text); }
.mc-globe-wrap { display: flex; justify-content: center; align-items: center; }
.mc-globe { width: 100%; max-width: 340px; height: auto; border-radius: 10px; }
.mc-outbtn-wide { width: 100%; margin-top: 12px; grid-column: 1 / -1; }
.mc-world-panel { display: flex; flex-direction: column; gap: 8px; background: var(--mc-card2); border-radius: 12px; padding: 12px; }
.mc-world-country { display: flex; align-items: center; gap: 9px; padding-bottom: 9px; border-bottom: 1px solid var(--mc-card2); }
.mc-world-cname { flex: 1; font-family: var(--font-display); font-weight: 700; letter-spacing: 0.06em; font-size: 14px; }
.mc-panel-row { display: flex; align-items: center; gap: 10px; background: var(--mc-card); border-radius: 10px; padding: 8px 11px; color: var(--mc-text); }
.mc-panel-row:hover { filter: brightness(1.15); }
.mc-panel-thumb { width: 32px; height: 32px; border-radius: 7px; object-fit: cover; flex-shrink: 0; }
.mc-panel-text { flex: 1; display: flex; flex-direction: column; }
.mc-panel-label { font-size: 12.5px; font-weight: 600; }
.mc-panel-sub { font-size: 11px; color: var(--mc-muted); }
.mc-panel-go { color: var(--mc-gold); font-size: 17px; line-height: 1; }
.mc-flag { font-size: 17px; }

/* collections */
.mc-coll-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 640px) { .mc-coll-grid { grid-template-columns: repeat(2, 1fr); } }
.mc-coll-tile { border-radius: 10px; overflow: hidden; background: var(--mc-card2); display: flex; flex-direction: column; }
.mc-coll-tile:hover { filter: brightness(1.12); }
.mc-coll-tile img { width: 100%; aspect-ratio: 99 / 79; object-fit: cover; }
.mc-coll-name { display: block; padding: 8px 9px 2px; font-size: 12.5px; font-weight: 600; color: var(--mc-text); }
.mc-coll-by { display: block; padding: 0 9px 9px; font-size: 11px; color: var(--mc-muted); line-height: 1.5; }
.mc-coll-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; flex-wrap: wrap; }

/* challenge */
.mc-challenge { display: grid; grid-template-columns: 1.25fr 1fr; gap: 10px; align-items: stretch; }
@media (max-width: 440px) { .mc-challenge { grid-template-columns: 1fr; } }
.mc-challenge-label { font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mc-muted); }
.mc-challenge-main { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; background: var(--mc-card2); border-radius: 12px; padding: 14px; }
.mc-challenge-title { font-size: 21px; line-height: 1.15; }
.mc-challenge-ends { font-size: 11.5px; color: var(--mc-muted); }
.mc-challenge-winner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; background: var(--mc-card2); border-radius: 12px; padding: 14px; text-align: center; }
.mc-winner-avatar { width: 62px; height: 62px; border-radius: 50%; object-fit: cover; border: 2px solid var(--mc-gold); }
.mc-winner-name { font-family: var(--font-serif); font-size: 16px; }
.mc-winner-country { font-size: 11.5px; color: var(--mc-muted); }
.mc-laurel { display: inline-flex; align-items: center; gap: 7px; color: var(--mc-gold); font-family: var(--font-display); font-size: 9.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }

/* learning */
.mc-lessons { display: flex; flex-direction: column; gap: 8px; }
.mc-lesson { display: flex; align-items: center; gap: 11px; background: var(--mc-card2); border-radius: 10px; padding: 8px 11px; color: var(--mc-text); }
.mc-lesson:hover { filter: brightness(1.15); }
.mc-lesson-thumb { width: 48px; height: 34px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.mc-lesson-title { flex: 1; font-size: 12.5px; }
.mc-lesson-time { font-size: 11.5px; color: var(--mc-muted); }

/* follow countries */
.mc-countries { display: flex; flex-direction: column; gap: 8px; }
.mc-country-row { display: flex; align-items: center; gap: 10px; background: var(--mc-card2); border-radius: 10px; padding: 9px 13px; font-size: 13.5px; color: var(--mc-text); }
.mc-country-row:hover { filter: brightness(1.12); }
.mc-country-name { flex: 1; font-weight: 600; }

/* passport */
.mc-passport { display: flex; flex-direction: column; gap: 14px; }
.mc-passport-id { display: flex; align-items: center; gap: 14px; }
.mc-passport-avatar { width: 74px; height: 74px; border-radius: 50%; object-fit: cover; border: 2px solid var(--mc-gold); flex-shrink: 0; }
.mc-passport-name { font-family: var(--font-serif); font-size: 20px; display: flex; align-items: center; }
.mc-passport-craft { font-size: 12.5px; color: var(--mc-muted); display: flex; align-items: center; gap: 6px; margin-top: 3px; }
.mc-passport-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
@media (max-width: 540px) { .mc-passport-stats { grid-template-columns: repeat(2, 1fr); } }
.mc-pstat { background: var(--mc-card2); border-radius: 10px; padding: 10px 8px; text-align: center; }
.mc-pstat-num { display: block; font-family: var(--font-serif); font-size: 19px; color: var(--mc-text); }
.mc-pstat-gold { color: var(--mc-gold); }
.mc-pstat-label { font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--mc-muted); font-family: var(--font-display); }
.mc-passport-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

/* banner */
.mc-banner { position: relative; border-radius: 18px; overflow: hidden; min-height: 300px; display: flex; align-items: center; box-shadow: var(--mc-shadow); background: #12100a; }
.mc-banner-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.mc-banner-scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(10,8,6,0.85) 0%, rgba(10,8,6,0.55) 60%, rgba(10,8,6,0.3) 100%); }
.mc-banner-inner { position: relative; padding: 30px; max-width: 520px; }
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

/* awaiting-content media slots (placeholder images removed per William
   2026-07-30 -- only the hero collage, story banner and globe keep photos;
   these slots fill with real maker content as sellers join) */
.mc-ph { display: flex; align-items: center; justify-content: center; background: var(--mc-card2); color: rgba(212,175,55,0.5); }
.mc-fcard-media .mc-ph, .mc-vthumb .mc-ph, .mc-live-frame .mc-ph { width: 100%; height: 100%; }
.mc-ph-fill { position: absolute; inset: 0; }
.mc-coll-ph { width: 100%; aspect-ratio: 99 / 79; }
.mc-ph-circle { display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid var(--mc-gold); color: var(--mc-gold); border-radius: 50%; background: var(--mc-card2); }
`
