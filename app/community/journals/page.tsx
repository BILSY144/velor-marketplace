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
import { jpCss } from './jpStyles'
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

const css = jpCss
