'use client'

/**
 * THE MAKERS' CIRCLE -- individual seller's personal journal page.
 *
 * EXACT REPLICATION OF WILLIAM'S SUPPLIED DESIGN (2026-07-30): the Maria
 * Quispe "Day 128 -- A New Design, A New Beginning" journal entry. Every
 * image is extracted directly from his design file
 * (public/community/journal/*.jpg; the maker portrait reuses
 * public/community/passport.jpg from the hub design -- same person).
 * All copy, names and figures mirror the design 1:1 at William's explicit
 * instruction ("exactly the same so when seller starts, it replaces
 * placeholders") -- this showcase content is the placeholder set that real
 * sellers' journals replace as they join.
 *
 * This static route supersedes the dynamic /community/[section]
 * placeholder for "journals". The hub's Creator Journals box lands here.
 */

import Link from 'next/link'
import { useState } from 'react'

/* ---------- helpers ---------- */

/** Flag derived from the ISO-2 code at runtime -- never written into source. */
function flagFor(code: string): string {
  if (!code || code.length !== 2) return ''
  const base = 0x1f1e6
  const a = 'A'.charCodeAt(0)
  return String.fromCodePoint(base + code.toUpperCase().charCodeAt(0) - a, base + code.toUpperCase().charCodeAt(1) - a)
}

/* ---------- icons (inline SVG, no emojis) ---------- */

function Ico({ d, size = 12, fill = false }: { d: string; size?: number; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={fill ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const P = {
  heart: 'M12 21C7 16.5 3.5 13.2 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .8 3.9 2a4.9 4.9 0 0 1 3.9-2 4.6 4.6 0 0 1 4.6 4.6c0 3.6-3.5 6.9-8.5 11.4z',
  comment: 'M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10z',
  bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z',
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
  calendar: 'M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9h16M8 2v4M16 2v4',
  check: 'M20 6L9 17l-5-5',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  star: 'M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.3l7.1-.7L12 2z',
  laurel: 'M12 4v9M12 13c-3 0-5 2-5 5 3 0 5-2 5-5zM12 13c3 0 5 2 5 5-3 0-5-2-5-5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  back: 'M19 12H5M12 19l-7-7 7-7',
  quote: 'M10 8c-3 0-5 2-5 5v3h5v-5H7c0-1.5 1.2-3 3-3V8zM19 8c-3 0-5 2-5 5v3h5v-5h-3c0-1.5 1.2-3 3-3V8z',
  globe2: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  mic: 'M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v5',
}

function Verified({ size = 15 }: { size?: number }) {
  return (
    <span className="jp-verified" style={{ width: size, height: size }} aria-label="Verified seller">
      <Ico d={P.check} size={Math.round(size * 0.6)} />
    </span>
  )
}

/* eslint-disable @next/next/no-img-element */

export default function SellerJournalPage() {
  const [shared, setShared] = useState(false)

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://velorcommerce.store/community/journals'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Day 128 - A New Design, A New Beginning', url })
      } else {
        await navigator.clipboard.writeText(url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      /* user closed the share sheet -- nothing to do */
    }
  }

  const products = [
    { img: '/community/journal/prod-1.jpg', name: 'Handwoven Table Runner', price: '£84', loves: '612' },
    { img: '/community/journal/prod-2.jpg', name: 'Sacred Valley Cushion Cover', price: '£62', loves: '421' },
    { img: '/community/journal/prod-3.jpg', name: 'Andean Wall Hanging', price: '£128', loves: '733' },
    { img: '/community/journal/prod-4.jpg', name: 'Handwoven Shoulder Bag', price: '£92', loves: '389' },
  ]

  const comments = [
    { img: '/community/journal/cavatar-1.jpg', name: 'Emily R.', cc: 'CA', country: 'Canada', time: '2h ago', text: 'Your work is incredible Maria. The time, patience and love you put into each piece is so inspiring.', loves: '128' },
    { img: '/community/journal/cavatar-2.jpg', name: 'Thomas L.', cc: 'US', country: 'United States', time: '4h ago', text: "I just received the table runner I ordered from you and it's even more beautiful in person. Thank you!", loves: '96' },
    { img: '/community/journal/cavatar-3.jpg', name: 'Aiko S.', cc: 'JP', country: 'Japan', time: '6h ago', text: 'Your journals are my favourite. I learn so much from your process.', loves: '74' },
  ]

  const moreJournals = [
    { img: '/community/journal/mj-1.jpg', day: 'Day 127', title: 'Natural Dyes Bring Life', loves: '2.2K' },
    { img: '/community/journal/mj-2.jpg', day: 'Day 126', title: 'A Special Order From Japan', loves: '1.9K' },
    { img: '/community/journal/mj-3.jpg', day: 'Day 125', title: 'Finishing The Details', loves: '2.1K' },
    { img: '/community/journal/mj-4.jpg', day: 'Day 124', title: 'Preparing The Yarn', loves: '1.8K' },
    { img: '/community/journal/mj-5.jpg', day: 'Day 123', title: 'A Visit To The Market', loves: '1.6K' },
    { img: '/community/journal/mj-6.jpg', day: 'Day 122', title: 'New Ideas Blooming', loves: '1.7K' },
  ]

  const alsoLoved = [
    { img: '/community/journal/pal-1.jpg', title: 'Day 124 - Natural Dyes Bring Life', loves: '2.1K' },
    { img: '/community/journal/pal-2.jpg', title: 'Day 120 - Preparing The Wool', loves: '1.8K' },
    { img: '/community/journal/pal-3.jpg', title: 'Day 115 - Inspiration From Nature', loves: '1.6K' },
  ]

  const stats = [
    { n: '4.9', l: 'Rating', star: true },
    { n: '2.3K', l: 'Followers', star: false },
    { n: '128', l: 'Journals', star: false },
    { n: '9.8K', l: 'Sales', star: false },
    { n: '98%', l: 'Response', star: false },
    { n: '3 Yrs', l: 'On Velor', star: false },
  ]

  return (
    <main className="jp-page">
      <style>{css}</style>

      {/* breadcrumb */}
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link href="/community/journals">Journals</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link href="/community/passport">Maria Quispe</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Day 128 &ndash; A New Design, A New Beginning</span>
      </nav>

      <div className="jp-grid">
        {/* ================= MAIN COLUMN ================= */}
        <div className="jp-main">
          <Link href="/community" className="jp-back">
            <Ico d={P.back} size={12} /> Back to Journals
          </Link>

          {/* hero */}
          <div className="jp-hero">
            <div className="jp-hero-text">
              <span className="jp-chip-gold">Featured Journal</span>
              <h1 className="jp-title">Day 128 &ndash; A New<br />Design, A New Beginning</h1>
              <p className="jp-intro">
                Every piece I create carries the threads of my ancestors. Today I started something new &mdash; a design I
                hope will honour them and bring joy to your home.
              </p>
              <div className="jp-meta">
                <span className="jp-meta-item">
                  <img className="jp-meta-avatar" src="/community/passport.jpg" alt="Maria Quispe" />
                  <span>
                    <span className="jp-meta-strong">Maria Quispe<Verified size={13} /></span>
                    <span className="jp-meta-sub">Peru &middot; Textile Weaver</span>
                  </span>
                </span>
                <span className="jp-meta-item">
                  <span className="jp-meta-ico"><Ico d={P.calendar} size={14} /></span>
                  <span>
                    <span className="jp-meta-strong">26 May 2026</span>
                    <span className="jp-meta-sub">Posted 7:45 AM</span>
                  </span>
                </span>
                <span className="jp-meta-item">
                  <span className="jp-meta-flag" aria-hidden="true">{flagFor('PE')}</span>
                  <span>
                    <span className="jp-meta-strong">Peru</span>
                    <span className="jp-meta-sub">Cusco, Peru</span>
                  </span>
                </span>
              </div>
            </div>
            <div className="jp-hero-media">
              <img src="/community/journal/hero.jpg" alt="Maria Quispe weaving at her loom" loading="eager" />
            </div>
          </div>

          {/* engagement row */}
          <div className="jp-engage">
            <span className="jp-engage-stat"><Ico d={P.heart} size={15} /> 2.8K</span>
            <span className="jp-engage-stat"><Ico d={P.comment} size={15} /> 342</span>
            <span className="jp-engage-stat"><Ico d={P.bookmark} size={15} /> 1.1K</span>
            <button type="button" className="jp-engage-stat jp-share" onClick={share}>
              <Ico d={P.share} size={15} /> {shared ? 'Link copied' : 'Share'}
            </button>
            <span className="jp-loved">
              <img src="/community/journal/loved.jpg" alt="" aria-hidden="true" />
              <span>Loved by 2.8K people</span>
            </span>
          </div>

          {/* tabs */}
          <div className="jp-tabs" role="presentation">
            <span className="jp-tab jp-tab-on">The Story</span>
            <span className="jp-tab">Making Process</span>
            <span className="jp-tab">Photos (12)</span>
            <span className="jp-tab">Notes &amp; Tips</span>
            <span className="jp-tab">Behind The Scenes</span>
          </div>

          {/* story + gallery */}
          <div className="jp-story">
            <div className="jp-story-text">
              <p>Today was a day of new beginnings.</p>
              <p>I have been sketching this new design for weeks, thinking about the colours, the meaning and how it will come to life on the loom.</p>
              <p>This morning, I set up the warp with deep terracotta and indigo threads. These colours come from natural dyes &mdash; cochineal from the cactus and indigo from the leaves we grow in our garden.</p>
              <p>It is a slow process, but a peaceful one. Each thread is placed with intention.</p>
              <p>I cannot wait to show you the finished piece in the coming days.</p>
              <p>Thank you for being part of my journey.</p>
              <p>&ndash; Maria</p>
              <span className="jp-showless">Show less</span>
            </div>
            <div className="jp-gallery">
              <img className="jp-gal-main" src="/community/journal/gal-main.jpg" alt="Naturally dyed yarns" loading="lazy" />
              <div className="jp-gal-thumbs">
                <img src="/community/journal/thumb-1.jpg" alt="Weaving in progress" loading="lazy" />
                <img src="/community/journal/thumb-2.jpg" alt="Finished textile detail" loading="lazy" />
                <img src="/community/journal/thumb-3.jpg" alt="The Sacred Valley" loading="lazy" />
              </div>
            </div>
          </div>

          {/* shop products */}
          <section className="jp-section">
            <div className="jp-sechead">
              <h2 className="jp-sectitle">Shop Products From This Journal</h2>
              <Link href="/shop" className="jp-viewall">View all products <span aria-hidden="true">&rarr;</span></Link>
            </div>
            <div className="jp-prod-grid">
              {products.map((p) => (
                <Link key={p.name} href="/shop" className="jp-prod">
                  <img src={p.img} alt={p.name} loading="lazy" />
                  <span className="jp-prod-name">{p.name}</span>
                  <span className="jp-prod-price">{p.price}</span>
                  <span className="jp-prod-foot">
                    <span className="jp-prod-loves"><Ico d={P.heart} size={11} /> {p.loves}</span>
                    <span className="jp-prod-view">View product <span aria-hidden="true">&rarr;</span></span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* comments */}
          <section className="jp-section" id="comments">
            <div className="jp-sechead">
              <h2 className="jp-sectitle">Comments (342)</h2>
              <span className="jp-sort">Sort by: <span className="jp-sort-val">Newest</span> <span aria-hidden="true">&#9662;</span></span>
            </div>
            <Link href="/auth/join" className="jp-cinput">
              <span className="jp-cinput-avatar" aria-hidden="true"><Ico d={P.user} size={13} /></span>
              <span className="jp-cinput-ph">Write a comment...</span>
              <span className="jp-cinput-send" aria-hidden="true"><Ico d={P.send} size={12} /></span>
            </Link>
            <div className="jp-comments">
              {comments.map((c) => (
                <div key={c.name} className="jp-comment">
                  <img className="jp-comment-avatar" src={c.img} alt="" aria-hidden="true" />
                  <div className="jp-comment-body">
                    <div className="jp-comment-top">
                      <span className="jp-comment-name">{c.name}</span>
                      <span className="jp-comment-country"><span aria-hidden="true">{flagFor(c.cc)}</span> {c.country}</span>
                      <span className="jp-comment-time">{c.time}</span>
                      <span className="jp-comment-menu" aria-hidden="true"><Ico d={P.dots} size={14} /></span>
                    </div>
                    <p className="jp-comment-text">{c.text}</p>
                    <span className="jp-comment-loves"><Ico d={P.heart} size={11} /> {c.loves}</span>
                  </div>
                </div>
              ))}
            </div>
            <a href="#comments" className="jp-viewall">View all comments <span aria-hidden="true">&rarr;</span></a>
          </section>

          {/* more journals */}
          <section className="jp-section">
            <div className="jp-sechead">
              <h2 className="jp-sectitle">More Journal Entries From Maria</h2>
              <Link href="/workshop" className="jp-viewall">View all journals <span aria-hidden="true">&rarr;</span></Link>
            </div>
            <div className="jp-mj-rail">
              {moreJournals.map((m) => (
                <Link key={m.day} href="/workshop" className="jp-mj">
                  <img src={m.img} alt={m.title} loading="lazy" />
                  <span className="jp-mj-day">{m.day}</span>
                  <span className="jp-mj-title">{m.title}</span>
                  <span className="jp-prod-loves"><Ico d={P.heart} size={11} /> {m.loves}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ================= SIDEBAR ================= */}
        <aside className="jp-side">
          {/* maker card */}
          <div className="jp-card">
            <div className="jp-maker">
              <img className="jp-maker-avatar" src="/community/passport.jpg" alt="Maria Quispe" />
              <div>
                <div className="jp-maker-name">Maria Quispe<Verified size={14} /></div>
                <div className="jp-maker-craft">Textile Weaver</div>
                <div className="jp-maker-loc"><span aria-hidden="true">{flagFor('PE')}</span> Peru &middot; Cusco</div>
              </div>
            </div>
            <div className="jp-maker-actions">
              <Link href="/auth/join" className="jp-followbtn">Follow</Link>
              <Link href="/messages" className="jp-msgbtn" aria-label="Message Maria"><Ico d={P.send} size={14} /></Link>
            </div>
            <div className="jp-stats">
              {stats.map((s) => (
                <div key={s.l} className="jp-stat">
                  <span className="jp-stat-num">
                    {s.n}
                    {s.star && <span className="jp-stat-star"><Ico d={P.star} size={11} fill /></span>}
                  </span>
                  <span className="jp-stat-label">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* founding seller */}
          <div className="jp-card jp-founding">
            <span className="jp-founding-ico" aria-hidden="true"><Ico d={P.laurel} size={17} /></span>
            <div>
              <div className="jp-founding-title">Founding Seller</div>
              <div className="jp-note">One of Velor&rsquo;s original makers from Peru</div>
            </div>
          </div>

          {/* about */}
          <div className="jp-card">
            <h3 className="jp-sidetitle">About Maria</h3>
            <p className="jp-note">
              I am a third generation weaver from the Sacred Valley. I create textiles using traditional backstrap loom
              techniques passed down by my mother and grandmother.
            </p>
            <Link href="/community/passport" className="jp-viewall">View full profile <span aria-hidden="true">&rarr;</span></Link>
          </div>

          {/* today's workshop */}
          <div className="jp-card">
            <h3 className="jp-sidetitle">Today&rsquo;s Workshop</h3>
            <Link href="/live" className="jp-live" onClick={(e) => e.stopPropagation()}>
              <img src="/community/journal/live.jpg" alt="Maria live in her studio" loading="lazy" />
            </Link>
            <div className="jp-live-title">Weaving a New Pattern</div>
            <p className="jp-note">Maria is live right now in her studio.</p>
            <div className="jp-live-foot">
              <span className="jp-live-watching"><Ico d={P.heart} size={12} /> 1.2K watching</span>
              <Link href="/live" className="jp-goldbtn">Watch Live</Link>
            </div>
          </div>

          {/* people also loved */}
          <div className="jp-card">
            <h3 className="jp-sidetitle">People Also Loved</h3>
            <div className="jp-pal">
              {alsoLoved.map((a) => (
                <Link key={a.title} href="/workshop" className="jp-pal-row">
                  <img src={a.img} alt="" aria-hidden="true" loading="lazy" />
                  <span className="jp-pal-text">
                    <span className="jp-pal-title">{a.title}</span>
                    <span className="jp-prod-loves"><Ico d={P.heart} size={10} /> {a.loves}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* buyer love */}
          <div className="jp-card">
            <h3 className="jp-sidetitle">Buyer Love</h3>
            <div className="jp-quote-ico" aria-hidden="true"><Ico d={P.quote} size={18} fill /></div>
            <p className="jp-quote">
              &ldquo;Maria&rsquo;s journals make me feel like I&rsquo;m right there in her studio. The love and tradition
              in every piece she makes is something truly special.&rdquo;
            </p>
            <div className="jp-quote-by">&mdash; Emily R. <span aria-hidden="true">{flagFor('CA')}</span> Canada</div>
            <div className="jp-dots" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`jp-dot ${i === 0 ? 'jp-dot-on' : ''}`} />
              ))}
            </div>
          </div>

          {/* collections */}
          <div className="jp-card">
            <div className="jp-sechead">
              <h3 className="jp-sidetitle">Maria&rsquo;s Collections</h3>
              <Link href="/community/collections" className="jp-viewall">View all collections</Link>
            </div>
            <div className="jp-colls">
              <Link href="/community/collections" className="jp-coll"><img src="/community/journal/coll-1.jpg" alt="Sacred Valley Collection, 12 items" loading="lazy" /></Link>
              <Link href="/community/collections" className="jp-coll"><img src="/community/journal/coll-2.jpg" alt="Natural Dye Collection, 8 items" loading="lazy" /></Link>
            </div>
          </div>

          {/* never miss a story */}
          <div className="jp-card">
            <h3 className="jp-sidetitle">Never Miss A Story</h3>
            <p className="jp-note">Follow Maria to get notified when she shares new journals, goes live and adds new products.</p>
            <Link href="/auth/join" className="jp-email" aria-label="Create an account to follow Maria">
              <span>Enter your email</span>
            </Link>
            <div className="jp-nms-actions">
              <Link href="/auth/join" className="jp-followbtn jp-followbtn-wide">Follow Maria</Link>
              <Link href="/auth/join" className="jp-msgbtn" aria-label="Save Maria to your favourites"><Ico d={P.heart} size={14} /></Link>
            </div>
          </div>
        </aside>
      </div>

      {/* trust strip */}
      <div className="jp-trust">
        {(
          [
            { t: 'Real People, Real Stories', s: 'Every maker has a story worth sharing', i: 'user' },
            { t: '190 Countries Connected', s: 'A global community of independent makers', i: 'globe2' },
            { t: 'Live Interaction', s: 'Watch, ask & shop live with makers', i: 'mic' },
            { t: 'Preserve Culture', s: 'Keeping traditions alive for generations', i: 'laurel' },
          ] as { t: string; s: string; i: keyof typeof P }[]
        ).map((item) => (
          <div key={item.t} className="jp-trust-item">
            <span className="jp-trust-ico" aria-hidden="true"><Ico d={P[item.i]} size={15} /></span>
            <div>
              <div className="jp-trust-title">{item.t}</div>
              <div className="jp-trust-sub">{item.s}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

/* ---------- styles: exact palette from William's design ---------- */

const css = `
.jp-page {
  --mc-bg: #0b0906;
  --mc-card: #131008;
  --mc-card2: rgba(255,255,255,0.04);
  --mc-goldline: rgba(212,175,55,0.55);
  --mc-text: #f4efe6;
  --mc-muted: #a99f8c;
  --mc-gold: #D4AF37;
  --mc-shadow: 0 18px 44px rgba(0,0,0,0.4);
  background: var(--mc-bg); color: var(--mc-text);
  padding: 0 clamp(8px, 1vw, 14px) 50px;
}
html[data-theme='light'] .jp-page {
  --mc-bg: var(--bg);
  --mc-card: var(--surface);
  --mc-card2: rgba(0,0,0,0.045);
  --mc-goldline: #c9a227;
  --mc-text: var(--text);
  --mc-muted: var(--muted);
  --mc-gold: #a8811a;
  --mc-shadow: 0 10px 28px rgba(26,20,10,0.09);
}

.jp-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 16px 4px 14px; font-size: 12px; color: var(--mc-muted); }
.jp-crumbs a { color: var(--mc-muted); }
.jp-crumbs a:hover { color: var(--mc-gold); }
.jp-crumb-here { color: var(--mc-text); }

.jp-grid { display: grid; grid-template-columns: 1fr 310px; gap: 20px; align-items: start; }
@media (max-width: 980px) { .jp-grid { grid-template-columns: 1fr; } }
.jp-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.jp-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.jp-card { background: var(--mc-card); border-radius: 16px; padding: 16px; box-shadow: var(--mc-shadow); }
.jp-sidetitle { font-size: 16px; margin-bottom: 9px; }
.jp-note { font-size: 12.5px; color: var(--mc-muted); line-height: 1.6; }
.jp-viewall { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mc-gold); margin-top: 8px; }
.jp-viewall:hover { color: var(--accent); }
.jp-sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.jp-sectitle { font-size: 20px; }
.jp-chip-gold { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 6px; border: 1px solid var(--mc-goldline); color: var(--mc-gold); font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; align-self: flex-start; }

.jp-back { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 7px; background: var(--mc-card2); color: var(--mc-text); font-size: 12px; align-self: flex-start; }
.jp-back:hover { color: var(--mc-gold); }

/* hero */
.jp-hero { display: grid; grid-template-columns: 1fr 1.15fr; gap: 0; background: var(--mc-card); border-radius: 16px; overflow: hidden; box-shadow: var(--mc-shadow); }
@media (max-width: 760px) { .jp-hero { grid-template-columns: 1fr; } }
.jp-hero-text { padding: 20px; display: flex; flex-direction: column; gap: 13px; }
.jp-title { font-size: clamp(26px, 3.2vw, 38px); line-height: 1.12; }
.jp-intro { font-size: 13.5px; color: var(--mc-muted); line-height: 1.7; }
.jp-hero-media { min-height: 260px; }
.jp-hero-media img { width: 100%; height: 100%; object-fit: cover; }
.jp-meta { display: flex; flex-wrap: wrap; gap: 18px; margin-top: auto; }
.jp-meta-item { display: inline-flex; align-items: center; gap: 9px; }
.jp-meta-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
.jp-meta-ico { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: var(--mc-card2); color: var(--mc-gold); }
.jp-meta-flag { font-size: 22px; }
.jp-meta-strong { display: flex; align-items: center; font-size: 12.5px; font-weight: 600; color: var(--mc-text); }
.jp-meta-sub { display: block; font-size: 11px; color: var(--mc-muted); }
.jp-verified { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--mc-gold); color: #14110c; margin-left: 6px; }

/* engagement */
.jp-engage { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; padding: 2px 4px; }
.jp-engage-stat { display: inline-flex; align-items: center; gap: 7px; color: var(--mc-text); font-size: 13px; }
.jp-engage-stat svg { color: var(--mc-gold); }
.jp-share { background: none; border: none; padding: 0; font-family: inherit; color: var(--mc-text); cursor: pointer; }
.jp-share:hover { color: var(--mc-gold); }
.jp-loved { display: inline-flex; align-items: center; gap: 9px; margin-left: auto; font-size: 12px; color: var(--mc-muted); }
.jp-loved img { height: 26px; width: auto; border-radius: 999px; }

/* tabs */
.jp-tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--mc-card2); padding: 0 2px; }
.jp-tab { padding: 9px 14px; font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mc-muted); border-bottom: 2px solid transparent; }
.jp-tab-on { color: var(--mc-gold); border-bottom-color: var(--accent); }

/* story */
.jp-story { display: grid; grid-template-columns: 1fr 1.05fr; gap: 18px; }
@media (max-width: 760px) { .jp-story { grid-template-columns: 1fr; } }
.jp-story-text { display: flex; flex-direction: column; gap: 12px; font-size: 13.5px; color: var(--mc-muted); line-height: 1.75; }
.jp-story-text p { margin: 0; }
.jp-showless { color: var(--mc-gold); font-size: 12.5px; }
.jp-gallery { display: flex; flex-direction: column; gap: 10px; }
.jp-gal-main { width: 100%; border-radius: 12px; object-fit: cover; aspect-ratio: 298 / 174; }
.jp-gal-thumbs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.jp-gal-thumbs img { width: 100%; border-radius: 10px; object-fit: cover; aspect-ratio: 96 / 104; }

/* products */
.jp-section { display: flex; flex-direction: column; }
.jp-prod-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 760px) { .jp-prod-grid { grid-template-columns: repeat(2, 1fr); } }
.jp-prod { display: flex; flex-direction: column; background: var(--mc-card); border-radius: 12px; overflow: hidden; box-shadow: var(--mc-shadow); }
.jp-prod:hover { filter: brightness(1.08); }
.jp-prod img { width: 100%; aspect-ratio: 155 / 114; object-fit: cover; }
.jp-prod-name { padding: 9px 11px 0; font-size: 12.5px; font-weight: 600; color: var(--mc-text); }
.jp-prod-price { padding: 2px 11px 0; font-family: var(--font-serif); font-size: 16px; color: var(--mc-text); }
.jp-prod-foot { display: flex; align-items: center; justify-content: space-between; padding: 6px 11px 11px; }
.jp-prod-loves { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--mc-muted); }
.jp-prod-loves svg { color: var(--red); }
.jp-prod-view { font-size: 10.5px; font-family: var(--font-display); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--mc-gold); }

/* comments */
.jp-sort { font-size: 12px; color: var(--mc-muted); }
.jp-sort-val { color: var(--mc-text); }
.jp-cinput { display: flex; align-items: center; gap: 10px; background: var(--mc-card); border-radius: 12px; padding: 10px 12px; margin-bottom: 14px; box-shadow: var(--mc-shadow); }
.jp-cinput:hover { filter: brightness(1.1); }
.jp-cinput-avatar { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: var(--mc-card2); border: 1px solid var(--mc-goldline); color: var(--mc-gold); flex-shrink: 0; }
.jp-cinput-ph { flex: 1; font-size: 13px; color: var(--mc-muted); }
.jp-cinput-send { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; color: var(--mc-gold); }
.jp-comments { display: flex; flex-direction: column; gap: 14px; }
.jp-comment { display: flex; gap: 11px; background: var(--mc-card); border-radius: 12px; padding: 13px; box-shadow: var(--mc-shadow); }
.jp-comment-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.jp-comment-body { flex: 1; min-width: 0; }
.jp-comment-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.jp-comment-name { font-size: 12.5px; font-weight: 700; }
.jp-comment-country { font-size: 11.5px; color: var(--mc-muted); }
.jp-comment-time { font-size: 11px; color: var(--mc-muted); margin-left: auto; }
.jp-comment-menu { color: var(--mc-muted); }
.jp-comment-text { font-size: 13px; color: var(--mc-muted); margin: 6px 0 8px; line-height: 1.6; }
.jp-comment-loves { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--mc-muted); }
.jp-comment-loves svg { color: var(--red); }

/* more journals */
.jp-mj-rail { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
@media (max-width: 980px) { .jp-mj-rail { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 540px) { .jp-mj-rail { grid-template-columns: repeat(2, 1fr); } }
.jp-mj { display: flex; flex-direction: column; gap: 3px; background: var(--mc-card); border-radius: 10px; overflow: hidden; padding-bottom: 9px; box-shadow: var(--mc-shadow); }
.jp-mj:hover { filter: brightness(1.1); }
.jp-mj img { width: 100%; aspect-ratio: 101 / 90; object-fit: cover; margin-bottom: 5px; }
.jp-mj-day { padding: 0 9px; font-size: 10.5px; font-weight: 700; color: var(--accent); font-family: var(--font-display); letter-spacing: 0.05em; }
.jp-mj-title { padding: 0 9px; font-size: 11.5px; color: var(--mc-text); line-height: 1.4; }
.jp-mj .jp-prod-loves { padding: 2px 9px 0; }

/* sidebar: maker card */
.jp-maker { display: flex; align-items: center; gap: 12px; }
.jp-maker-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--mc-gold); flex-shrink: 0; }
.jp-maker-name { display: flex; align-items: center; font-family: var(--font-serif); font-size: 17px; }
.jp-maker-craft { font-size: 12px; color: var(--mc-muted); }
.jp-maker-loc { font-size: 11.5px; color: var(--mc-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.jp-maker-actions { display: flex; gap: 8px; margin: 13px 0; }
.jp-followbtn { flex: 1; display: inline-flex; align-items: center; justify-content: center; min-height: 38px; border-radius: 7px; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 11.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.jp-followbtn:hover { filter: brightness(1.08); }
.jp-followbtn-wide { width: 100%; }
.jp-msgbtn { display: inline-flex; align-items: center; justify-content: center; width: 38px; min-height: 38px; border-radius: 7px; border: 1px solid var(--mc-goldline); color: var(--mc-gold); flex-shrink: 0; }
.jp-msgbtn:hover { border-color: var(--mc-gold); }
.jp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.jp-stat { background: var(--mc-card2); border-radius: 10px; padding: 9px 6px; text-align: center; }
.jp-stat-num { display: flex; align-items: center; justify-content: center; gap: 4px; font-family: var(--font-serif); font-size: 16px; color: var(--mc-text); }
.jp-stat-star { color: var(--mc-gold); display: inline-flex; }
.jp-stat-label { display: block; font-size: 10px; color: var(--mc-muted); font-family: var(--font-display); letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px; }

/* founding */
.jp-founding { display: flex; align-items: center; gap: 12px; border: 1px solid var(--mc-goldline); }
.jp-founding-ico { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; border: 1.3px solid var(--mc-gold); color: var(--mc-gold); flex-shrink: 0; }
.jp-founding-title { font-family: var(--font-display); font-size: 11.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mc-gold); }

/* live */
.jp-live { display: block; border-radius: 12px; overflow: hidden; }
.jp-live img { width: 100%; aspect-ratio: 224 / 122; object-fit: cover; }
.jp-live:hover { filter: brightness(1.08); }
.jp-live-title { font-size: 14px; font-weight: 600; margin-top: 9px; }
.jp-live-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 9px; }
.jp-live-watching { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--red); }
.jp-goldbtn { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 6px 16px; border-radius: 7px; background: var(--mc-gold); color: #14110c; font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.jp-goldbtn:hover { filter: brightness(1.08); }

/* people also loved */
.jp-pal { display: flex; flex-direction: column; gap: 10px; }
.jp-pal-row { display: flex; align-items: center; gap: 10px; }
.jp-pal-row:hover { filter: brightness(1.15); }
.jp-pal-row img { width: 48px; height: 48px; border-radius: 9px; object-fit: cover; flex-shrink: 0; }
.jp-pal-text { display: flex; flex-direction: column; gap: 2px; }
.jp-pal-title { font-size: 12px; color: var(--mc-text); line-height: 1.4; }

/* buyer love */
.jp-quote-ico { color: var(--mc-gold); margin-bottom: 4px; }
.jp-quote { font-size: 13px; color: var(--mc-text); line-height: 1.7; font-style: italic; }
.jp-quote-by { font-size: 11.5px; color: var(--mc-muted); margin-top: 9px; }
.jp-dots { display: flex; gap: 6px; margin-top: 11px; }
.jp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mc-goldline); opacity: 0.4; }
.jp-dot-on { background: var(--mc-gold); opacity: 1; }

/* collections */
.jp-colls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.jp-coll { border-radius: 10px; overflow: hidden; }
.jp-coll:hover { filter: brightness(1.1); }
.jp-coll img { width: 100%; aspect-ratio: 110 / 98; object-fit: cover; }

/* never miss a story */
.jp-email { display: flex; align-items: center; background: var(--mc-card2); border-radius: 8px; padding: 11px 14px; margin: 11px 0 10px; font-size: 12.5px; color: var(--mc-muted); }
.jp-email:hover { filter: brightness(1.15); }
.jp-nms-actions { display: flex; gap: 8px; }

/* trust strip */
.jp-trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; border-top: 1px solid var(--mc-card2); padding-top: 24px; margin-top: 28px; }
@media (max-width: 980px) { .jp-trust { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) { .jp-trust { grid-template-columns: 1fr; } }
.jp-trust-item { display: flex; align-items: flex-start; gap: 11px; }
.jp-trust-ico { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: 1.3px solid var(--mc-gold); color: var(--mc-gold); flex-shrink: 0; }
.jp-trust-title { font-family: var(--font-display); font-size: 12.5px; font-weight: 700; letter-spacing: 0.06em; color: var(--mc-text); }
.jp-trust-sub { font-size: 12px; color: var(--mc-muted); }
`
