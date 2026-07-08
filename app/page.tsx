'use client'

// Homepage — ported 2026-07-08 from velor-homepage-BUILD.html (design phase,
// see CLAUDE.md "HOMEPAGE REDESIGN"). Positioning is ORIGIN: everywhere makes
// something better than everywhere else. Two-axis lattice (origin x
// speciality) replaces the old category tiles.
//
// Honesty rules baked in:
// - Zero-state honest: no fake products, no fake sellers, no fake counts.
//   Live counts come from /api/lattice; until sellers list, every country
//   card shows "Founding seat open" and every speciality tile is dashed.
// - Showreel is labelled "Preview" — no fake LIVE badge, no viewer counts.
// - First-seller copy uses opener language: "opens", never "owns"/"claims".
// - Pexels clips are hotlinked for now; self-host + confirm licence before
//   heavy traffic (tracked in CLAUDE.md).

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SPECIALITIES, SPECIALITY_KINDS, buyerLabel } from '@/lib/specialities'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'
import { cultureHints } from '@/lib/cultureHints'

type LatticeSummary = {
  totalCountries: number
  trading: number
  countries: { code: string; name: string; products: number; specialities: string[] }[]
  specialities: Record<string, { countries: number; products: number }>
}

const css = `
.vh{background:var(--bg);color:var(--text);font-family:var(--font-body)}
.vh a{color:inherit;text-decoration:none}
.vh-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
.vh h1,.vh h2,.vh h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.vh section{padding:62px 0}
.vh-shead{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:26px;gap:24px}
.vh-shead h2{font-size:29px}
.vh-shead p{font-size:14.5px;color:var(--muted);margin:8px 0 0;max-width:66ch;line-height:1.6}
.vh-slink{font-size:14px;color:var(--accent) !important;flex:0 0 auto;white-space:nowrap}
.vh-hero{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;padding:58px 0 50px}
.vh-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.vh-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.vh-hero h1{font-size:50px;line-height:1.08;margin-bottom:18px;max-width:16ch}
.vh-lede{font-size:17.5px;line-height:1.6;color:var(--muted);max-width:47ch;margin:0 0 28px}
.vh-ctas{display:flex;gap:12px;margin-bottom:30px;flex-wrap:wrap}
.vh-btn{border-radius:10px;padding:14px 26px;font-size:15px;font-weight:600;display:inline-block}
.vh-btn-p{background:var(--accent);color:#160a00 !important}
.vh-btn-s{border:1px solid var(--border)}
.vh-microtrust{display:flex;gap:22px;font-size:13px;color:var(--muted);flex-wrap:wrap}
.vh-microtrust i{color:var(--green);font-style:normal;margin-right:6px}
.vh-proof{position:relative}
.vh-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden}
.vh-card .img{aspect-ratio:4/3;background:var(--surface-2);display:flex;align-items:center;justify-content:center;color:#3c3c45;font-size:11.5px;letter-spacing:.1em;position:relative;overflow:hidden}
.vh-card .img video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.vh-card .img .lbl{position:absolute;top:12px;left:12px;font-size:10px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.16);border-radius:5px;padding:4px 8px;color:#fff}
.vh-card .body{padding:16px 18px}
.vh-origin{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);margin-bottom:8px}
.vh-flagchip{font-size:10px;font-weight:700;letter-spacing:.08em;background:var(--surface-2);border:1px solid var(--border);border-radius:4px;padding:2px 6px;color:var(--text)}
.vh-pname{font-size:15.5px;font-weight:500;margin-bottom:6px;line-height:1.35}
.vh-price{font-family:var(--font-display);font-size:21px;font-weight:700}
.vh-maker{font-size:12.5px;color:var(--muted);margin-top:2px}
.vh-escrow-badge{background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:13px 16px;display:flex;gap:11px;align-items:center;margin-top:14px}
.vh-escrow-badge .tick{width:26px;height:26px;border-radius:50%;background:rgba(46,204,113,.14);color:var(--green);display:flex;align-items:center;justify-content:center;font-size:14px;flex:0 0 auto}
.vh-escrow-badge strong{display:block;font-size:12.5px;font-weight:600}
.vh-escrow-badge span{color:var(--muted);font-size:12.5px;line-height:1.4}
.vh-reelsec{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.vh-reel{display:flex;gap:16px;overflow-x:auto;scrollbar-width:none;cursor:grab;padding-bottom:4px}
.vh-reel::-webkit-scrollbar{display:none}
.vh-reel.dragging{cursor:grabbing}
.vh-reel.dragging *{pointer-events:none}
.vh-tile{position:relative;flex:0 0 218px;aspect-ratio:9/16;border-radius:14px;overflow:hidden;border:1px solid var(--border);background:var(--surface-2)}
.vh-tile video{width:100%;height:100%;object-fit:cover;display:block;opacity:.85}
.vh-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 36%,rgba(0,0,0,.78) 100%)}
.vh-chip{position:absolute;top:12px;left:12px;font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.16);border-radius:5px;padding:4px 8px;color:#fff}
.vh-flagtag{position:absolute;top:12px;right:12px;font-size:10px;font-weight:700;letter-spacing:.08em;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.16);border-radius:4px;padding:3px 7px;color:#fff}
.vh-tile .meta{position:absolute;left:14px;right:14px;bottom:14px}
.vh-tile .meta .t{font-size:13.5px;font-weight:500;line-height:1.3;margin-bottom:5px}
.vh-tile .meta .s{font-size:11.5px;color:#b9b9c2}
.vh-tile.claim{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;border-style:dashed;background:var(--bg)}
.vh-tile.claim .plus{width:42px;height:42px;border-radius:50%;border:1px solid var(--accent);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:22px}
.vh-tile.claim .t{font-size:14px;font-weight:500;padding:0 16px}
.vh-tile.claim .s{font-size:11.5px;color:var(--muted);padding:0 18px;line-height:1.5}
.vh-swipehint{font-size:12px;color:var(--muted);margin-top:14px}
.vh-creel{display:flex;gap:16px;overflow-x:auto;scrollbar-width:none;cursor:grab;padding-bottom:6px}
.vh-creel::-webkit-scrollbar{display:none}
.vh-creel.dragging{cursor:grabbing}
.vh-creel.dragging *{pointer-events:none}
.vh-ccard{flex:0 0 254px;border:1px solid var(--border);border-radius:14px;padding:20px;background:var(--surface);min-height:198px;display:flex;flex-direction:column;transition:border-color .15s, transform .15s}
.vh-ccard:hover{border-color:#3d3d46;transform:translateY(-2px)}
.vh-ccard.live{border-color:rgba(46,204,113,.32)}
.vh-ccard .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;gap:10px}
.vh-ccard h3{font-size:18px;line-height:1.2}
.vh-cflag{font-size:19px;line-height:1;flex:0 0 auto}
.vh-specs{display:flex;flex-wrap:wrap;gap:6px;flex:1;align-content:flex-start}
.vh-spec{font-size:11.5px;color:var(--muted);border:1px solid var(--border);border-radius:999px;padding:4px 10px}
.vh-ccard .foot{margin-top:15px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:600}
.vh-foot-on{color:var(--green)}.vh-foot-off{color:var(--muted)}
.vh-ccard.invite{border-style:dashed;background:var(--bg)}
.vh-ccard.invite h3{color:var(--accent);line-height:1.25}
.vh-ccard.invite .known{font-size:12.5px;color:var(--muted);line-height:1.55;margin-top:10px;flex:1}
.vh-kind{margin-bottom:38px}
.vh-kind:last-child{margin-bottom:0}
.vh-kindhead{display:flex;align-items:baseline;gap:14px;margin-bottom:14px;flex-wrap:wrap}
.vh-kindlbl{font-family:var(--font-display);font-size:17px;font-weight:500;letter-spacing:-0.01em}
.vh-kinddesc{font-size:13px;color:var(--muted)}
.vh-kindline{flex:1;height:1px;background:var(--border);align-self:center;min-width:40px}
.vh-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:10px}
.vh-sp{border:1px solid var(--border);border-radius:12px;padding:13px 15px;font-size:14px;font-weight:500;background:var(--surface);display:flex;align-items:center;gap:10px;transition:transform .13s,border-color .13s}
.vh-sp:hover{border-color:var(--accent);transform:translateY(-2px)}
.vh-sp .dotst{width:7px;height:7px;border-radius:50%;background:var(--accent);opacity:.55;flex:0 0 auto}
.vh-sp.hot .dotst{background:var(--green);opacity:1}
.vh-sp .n{font-size:11px;color:var(--muted);margin-left:auto;font-weight:400;white-space:nowrap}
.vh-sp.hot{border-color:rgba(46,204,113,.4)}
.vh-walllegend{display:flex;gap:20px;font-size:12px;color:var(--muted);margin-bottom:26px}
.vh-walllegend i{font-style:normal;margin-right:6px}
.vh-escrow{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.vh-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.vh-step{border-left:2px solid var(--border);padding-left:20px}
.vh-step.active{border-left-color:var(--green)}
.vh-step .num{font-family:var(--font-display);font-size:12px;letter-spacing:.14em;color:var(--muted);margin-bottom:10px}
.vh-step h3{font-size:17px;margin-bottom:8px}
.vh-step p{font-size:14px;color:var(--muted);line-height:1.65;margin:0}
.vh-founding{border:1px solid rgba(255,107,0,.32);border-radius:18px;padding:44px 48px;display:grid;grid-template-columns:1.25fr .75fr;gap:40px;align-items:center;background:var(--surface)}
.vh-founding h2{font-size:30px;line-height:1.15;margin-bottom:14px;max-width:20ch}
.vh-founding p{font-size:15.5px;color:var(--muted);line-height:1.65;max-width:52ch;margin:0}
.vh-fpoints{list-style:none;display:grid;gap:13px;margin:0;padding:0}
.vh-fpoints li{display:flex;gap:11px;font-size:14.5px;line-height:1.5}
.vh-fpoints i{color:var(--green);font-style:normal}
.vh-fcta{margin-top:26px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.vh-fnote{font-size:12.5px;color:var(--muted)}
@media(max-width:960px){
.vh-hero{grid-template-columns:1fr;gap:36px;padding:38px 0}
.vh-hero h1{font-size:34px}
.vh-countries{grid-template-columns:repeat(2,1fr)}
.vh-steps,.vh-founding{grid-template-columns:1fr}
.vh-founding{padding:32px 26px}
.vh-tile{flex:0 0 168px}
}
`

// Showreel: speciality footage from Pexels (see velor-media-manifest.html).
// Honest labelling — clips show the craft, not a specific seller.
const REEL = [
  { src: 'https://videos.pexels.com/video-files/9363591/9363591-sd_360_640_25fps.mp4', flag: 'CN', t: 'Throwing the tea set', s: 'Clay · seat open' },
  { src: 'https://videos.pexels.com/video-files/34499603/14618073_360_640_30fps.mp4', flag: 'MA', t: 'The spice souk, Marrakech', s: 'Spice · seat open' },
  { src: 'https://videos.pexels.com/video-files/33350906/14200976_360_640_24fps.mp4', flag: 'PE', t: 'Alpaca, on the loom', s: 'Wool · seat open' },
  { src: 'https://videos.pexels.com/video-files/7681482/7681482-sd_360_640_25fps.mp4', flag: 'TR', t: 'The coffee table', s: 'Coffee · seat open' },
  { src: 'https://videos.pexels.com/video-files/9733033/9733033-sd_360_640_24fps.mp4', flag: 'JP', t: 'Glaze, fire, finish', s: 'Clay · seat open' },
  { src: 'https://videos.pexels.com/video-files/35766889/15164187_360_640_30fps.mp4', flag: 'IN', t: 'Market day', s: 'Spice · seat open' },
]

const KIND_LINES: Record<string, string> = {
  'Materials': 'The stuff itself — dug, grown, tanned and fired.',
  'Techniques': 'Ways of making that took centuries to learn.',
  'Consumables': 'Eaten, drunk, used up — from where it is actually from.',
  'Forms': 'The objects a place is famous for.',
  'Rituals': 'Bought for meaning, not function.',
  'Modern industry': 'Culture is not only old.',
}

// Curated front of the country reel — a deliberate regional spread with
// strong cultural-product identities. Hints come from lib/cultureHints.ts:
// finished cultural products, never raw materials (William, 2026-07-08 —
// "real culture is the selling point"). After these come every other
// country, hinted ones first, then the rest.
const REEL_FIRST = ['CN', 'JP', 'MA', 'TR', 'IN', 'PE', 'MX', 'IT', 'KR', 'GH', 'ET', 'UZ', 'NP', 'EC', 'PT', 'VN', 'GR', 'AR', 'TH', 'NG']

function flagOf(code: string): string {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
}

export default function HomePage() {
  const [lattice, setLattice] = useState<LatticeSummary | null>(null)
  const reelRef = useRef<HTMLDivElement>(null)
  const creelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/lattice')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setLattice(d) })
      .catch(() => {})
  }, [])

  // Pointer-capture drag scroll — shared by the showreel and the country reel.
  useEffect(() => {
    const cleanups: (() => void)[] = []
    for (const ref of [reelRef, creelRef]) {
      const reel = ref.current
      if (!reel) continue
      let down = false, startX = 0, startScroll = 0, moved = 0
      const onDown = (e: PointerEvent) => { down = true; moved = 0; startX = e.clientX; startScroll = reel.scrollLeft; reel.setPointerCapture(e.pointerId) }
      const onMove = (e: PointerEvent) => {
        if (!down) return
        const dx = e.clientX - startX
        if (Math.abs(dx) > 6) { reel.classList.add('dragging'); moved = Math.abs(dx) }
        reel.scrollLeft = startScroll - dx
      }
      const onUp = (e: PointerEvent) => { if (!down) return; down = false; reel.classList.remove('dragging'); try { reel.releasePointerCapture(e.pointerId) } catch {} }
      const onClick = (e: MouseEvent) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0 } }
      reel.addEventListener('pointerdown', onDown)
      reel.addEventListener('pointermove', onMove)
      reel.addEventListener('pointerup', onUp)
      reel.addEventListener('pointercancel', onUp)
      reel.addEventListener('click', onClick, true)
      cleanups.push(() => {
        reel.removeEventListener('pointerdown', onDown)
        reel.removeEventListener('pointermove', onMove)
        reel.removeEventListener('pointerup', onUp)
        reel.removeEventListener('pointercancel', onUp)
        reel.removeEventListener('click', onClick, true)
      })
    }
    return () => cleanups.forEach(fn => fn())
  }, [])

  // Pause off-screen showreel video — phones matter.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.target.querySelector('video')
        if (!v) return
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      })
    }, { rootMargin: '120px' })
    document.querySelectorAll('.vh-tile').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const byCode = new Map((lattice?.countries ?? []).map(c => [c.code, c]))

  // Reel order: trading countries first, then the curated spread, then every
  // other hinted country, then the rest of the world alphabetically.
  const orderedCountries = (() => {
    const seen = new Set<string>()
    const out: { code: string; name: string }[] = []
    const push = (code: string) => {
      if (seen.has(code)) return
      const c = WORLD_COUNTRIES.find(w => w.code === code)
      if (!c) return
      seen.add(code)
      out.push(c)
    }
    ;(lattice?.countries ?? []).slice().sort((a, b) => b.products - a.products).forEach(c => push(c.code))
    REEL_FIRST.forEach(push)
    WORLD_COUNTRIES.forEach(c => { if (cultureHints(c.code).length) push(c.code) })
    WORLD_COUNTRIES.forEach(c => push(c.code))
    return out
  })()
  const trading = lattice?.trading ?? 0
  const specStats = lattice?.specialities ?? {}

  return (
    <div className="vh">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="vh-wrap">
        <div className="vh-hero">
          <div>
            <div className="vh-eyebrow"><span className="vh-dot" /> 190 countries &middot; one checkout</div>
            <h1>The world has more to sell than you&apos;ve been shown.</h1>
            <p className="vh-lede">
              Everywhere makes something better than everywhere else. Velor brings those things
              to one place — with the country and the maker on every listing, so you always know
              where it came from.
            </p>
            <div className="vh-ctas">
              <Link className="vh-btn vh-btn-p" href="#origins">Start with a country</Link>
              <Link className="vh-btn vh-btn-s" href="#protect">How protection works</Link>
            </div>
            <div className="vh-microtrust">
              <span><i>&#10003;</i>Identity-verified sellers</span>
              <span><i>&#10003;</i>Escrow on every order</span>
              <span><i>&#10003;</i>Prices in your currency</span>
            </div>
          </div>
          <div className="vh-proof">
            <div className="vh-card">
              <div className="img">
                <video src="https://videos.pexels.com/video-files/12690263/12690263-sd_640_360_24fps.mp4" autoPlay muted loop playsInline preload="metadata" />
                <span className="lbl">What a Velor listing looks like</span>
              </div>
              <div className="body">
                <div className="vh-origin"><span className="vh-flagchip">CN</span> Jingdezhen, China</div>
                <div className="vh-pname">Celadon porcelain tea set, fired in the city that invented it</div>
                <div className="vh-price">&pound;42.00</div>
                <div className="vh-maker">Example listing &mdash; your store, your city, your name here</div>
              </div>
            </div>
            <div className="vh-escrow-badge">
              <div className="tick">&#10003;</div>
              <div><strong>Held in escrow</strong><span>Your money is held until delivery is confirmed.</span></div>
            </div>
          </div>
        </div>
      </div>

      <section className="vh-reelsec">
        <div className="vh-wrap">
          <div className="vh-shead">
            <div>
              <h2>Shopping the world</h2>
              <p>Short film from the places our sellers will work — the souk, the kiln, the loom,
              the coffee house. Live shopping opens when our founding sellers go on air.</p>
            </div>
          </div>
          <div className="vh-reel" ref={reelRef}>
            {REEL.map(r => (
              <div className="vh-tile" key={r.src}>
                <video src={r.src} muted loop playsInline preload="metadata" />
                <div className="vh-scrim" />
                <div className="vh-chip">Preview</div>
                <div className="vh-flagtag">{r.flag}</div>
                <div className="meta"><div className="t">{r.t}</div><div className="s">{r.s}</div></div>
              </div>
            ))}
            <Link className="vh-tile claim" href="/apply">
              <div className="plus">+</div>
              <div className="t">Your slot is open</div>
              <div className="s">Founding sellers keep a permanent place on this rail.</div>
            </Link>
          </div>
          <div className="vh-swipehint">Drag to browse</div>
        </div>
      </section>

      <section id="origins">
        <div className="vh-wrap">
          <div className="vh-shead">
            <div>
              <h2>Start with a country</h2>
              <p>Every country on earth, and what its makers are known for — the finished thing,
              not the raw material. A country only ever lists what its sellers actually offer.</p>
            </div>
            <Link className="vh-slink" href="/founding">All 190 &rarr;</Link>
          </div>
          <div className="vh-creel" ref={creelRef}>
            {orderedCountries.map(c => {
              const live = byCode.get(c.code)
              const isLive = !!live && live.products > 0
              const hints = cultureHints(c.code)
              return (
                <Link key={c.code} className={'vh-ccard' + (isLive ? ' live' : '')} href={isLive ? `/shop?origin=${c.code}` : '/apply'}>
                  <div className="top"><h3>{c.name}</h3><span className="vh-cflag">{flagOf(c.code)}</span></div>
                  <div className="vh-specs">{hints.map(h => <span className="vh-spec" key={h}>{h}</span>)}</div>
                  <div className={'foot ' + (isLive ? 'vh-foot-on' : 'vh-foot-off')}>
                    {isLive ? `${live!.products} product${live!.products === 1 ? '' : 's'} · open now` : 'Founding seat open'}
                  </div>
                </Link>
              )
            })}
            <Link className="vh-ccard invite" href="/apply">
              <div className="top"><h3>Your country,<br />your culture.</h3></div>
              <div className="known">Be the first seller from your country and you keep the founding
              badge and Pro free for life &mdash; and your store opens the country page.</div>
              <div className="foot" style={{ color: 'var(--accent)' }}>Open it &rarr;</div>
            </Link>
          </div>
          <div className="vh-swipehint">Drag to browse all 190 countries</div>
        </div>
      </section>

      <section id="specialities" style={{ paddingTop: 0 }}>
        <div className="vh-wrap">
          <div className="vh-shead">
            <div>
              <h2>Or start with a speciality</h2>
              <p>Not departments. The things a place has spent centuries getting right — and the
              things it is good at now. Dashed means no seller has listed in it yet.</p>
            </div>
          </div>
          <div className="vh-walllegend">
            <span><i style={{ color: 'var(--green)' }}>&#9679;</i>Open now &mdash; sellers are listing it</span>
            <span><i style={{ color: 'var(--accent)', opacity: .7 }}>&#9679;</i>Founding seat open &mdash; be the first to list it</span>
          </div>
          {SPECIALITY_KINDS.map(kind => {
            const terms = SPECIALITIES.filter(s => s.kind === kind)
            // Claimed terms first within each family (Q5 decision).
            const sorted = [...terms].sort((a, b) => (specStats[b.term]?.products ?? 0) - (specStats[a.term]?.products ?? 0))
            return (
              <div className="vh-kind" key={kind}>
                <div className="vh-kindhead">
                  <span className="vh-kindlbl">{kind}</span>
                  <span className="vh-kinddesc">{KIND_LINES[kind]}</span>
                  <span className="vh-kindline" />
                </div>
                <div className="vh-wall">
                  {sorted.map(s => {
                    const st = specStats[s.term]
                    const claimed = !!st && st.products > 0
                    return (
                      <Link key={s.term} className={'vh-sp' + (claimed ? ' hot' : '')} href={claimed ? `/shop?speciality=${encodeURIComponent(s.term)}` : '/apply'} title={s.line}>
                        <span className="dotst" />
                        {buyerLabel(s.term)}
                        {claimed && <span className="n">{st.countries} {st.countries === 1 ? 'country' : 'countries'}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="vh-escrow" id="protect">
        <div className="vh-wrap">
          <div className="vh-shead">
            <div>
              <h2>How Velor protects your money</h2>
              <p>Buying from a country you have never bought from before only works if the money
              is safe. So it is.</p>
            </div>
          </div>
          <div className="vh-steps">
            <div className="vh-step active"><div className="num">STEP 01</div><h3>You pay Velor, not the seller</h3><p>Your card is charged at checkout through Stripe. The money sits in escrow, untouched.</p></div>
            <div className="vh-step"><div className="num">STEP 02</div><h3>The seller ships, you track</h3><p>Tracking is issued the moment the parcel is collected. You watch it the whole way.</p></div>
            <div className="vh-step"><div className="num">STEP 03</div><h3>Delivery is confirmed</h3><p>Your money stayed protected the whole way. Anything wrong &mdash; open a dispute and the funds freeze immediately.</p></div>
          </div>
        </div>
      </section>

      <section id="founding">
        <div className="vh-wrap">
          <div className="vh-founding">
            <div>
              <div className="vh-eyebrow"><span className="vh-dot" /> Founding sellers &middot; buyers arrive 6 August</div>
              <h2>Be the first from your country.</h2>
              <p>
                {trading > 0
                  ? `${trading} ${trading === 1 ? 'country is' : 'countries are'} trading on Velor. ${190 - trading} are not.`
                  : 'A hundred and ninety countries. Not one founding seat taken yet.'}{' '}
                Whoever arrives first from each of them keeps something no seller after them can ever earn.
              </p>
              <div className="vh-fcta">
                <Link className="vh-btn vh-btn-p" href="/apply">Apply to sell</Link>
                <span className="vh-fnote">Decision within 24 hours of your verification completing.</span>
              </div>
            </div>
            <ul className="vh-fpoints">
              <li><i>&#10003;</i><span><b>Pro, free for life</b> &mdash; never charged, while the subscription runs unbroken.</span></li>
              <li><i>&#10003;</i><span>The founding badge, permanently, on your store and every listing.</span></li>
              <li><i>&#10003;</i><span>Your store opens your country&apos;s page &mdash; and every speciality you list credits you as its founding seller.</span></li>
              <li><i>&#10003;</i><span>Identity-verified through Stripe. No document ever touches Velor.</span></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
