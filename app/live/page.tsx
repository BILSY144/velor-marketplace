'use client'

// Velor Live — the live shopping hub. Real streams from /api/live render as
// a grid the moment sellers go on air (real LIVE badges only — fake liveness
// is banned, standing rule). Until then the zero state is a cinematic
// preview of what the rail becomes: film from the kinds of places our
// founding sellers work, clearly labelled Preview.

import { useEffect, useState } from 'react'
import Link from 'next/link'

type StreamCard = {
  id: string
  title: string
  roomName: string
  status: string
  sellerName: string
  currency: string
  products: { id: string; title: string; price: number; images: string[] }[]
}

// The full Velor Live preview reel. Moved here from the homepage 2026-07-28
// (William: the live reel comes off the homepage and lives solely on this
// page, behind the header's Live button).
const vf = (path: string) => `https://videos.pexels.com/video-files/${path}`

const PREVIEWS = [
  { src: 'https://videos.pexels.com/video-files/9363591/9363591-sd_360_640_25fps.mp4', flag: 'CN', t: 'Throwing the tea set', s: 'Ceramics, live from the wheel' },
  { src: 'https://videos.pexels.com/video-files/34499603/14618073_360_640_30fps.mp4', flag: 'MA', t: 'The spice souk, Marrakech', s: 'Shop the stalls as they open' },
  { src: 'https://videos.pexels.com/video-files/33350906/14200976_360_640_24fps.mp4', flag: 'PE', t: 'Alpaca, on the loom', s: 'From the Andes, as it is woven' },
  { src: 'https://videos.pexels.com/video-files/7681482/7681482-sd_360_640_25fps.mp4', flag: 'TR', t: 'Coffee, brewed on sand', s: 'Watch it made, buy the set' },
  { src: 'https://videos.pexels.com/video-files/9733033/9733033-sd_360_640_24fps.mp4', flag: 'JP', t: 'Glaze, fire, finish', s: 'From the kiln to your basket' },
  { src: 'https://videos.pexels.com/video-files/35766889/15164187_360_640_30fps.mp4', flag: 'IN', t: 'Market day', s: 'The stalls of old Delhi' },
  // The 15 HD craft films (William, 2026-07-17: "added to the velor live
  // reel at the top"). Craft-generic footage carries NO flag tag -- claiming
  // a country on it would be a fabricated origin (LAW #1).
  { src: vf('12681572/12681572-hd_1920_1080_24fps.mp4'), flag: '', t: 'Thrown on the wheel', s: 'Ceramics, live from the wheel' },
  { src: vf('32655899/13923463_1280_720_25fps.mp4'), flag: '', t: 'On the loom', s: 'Weaving, thread by thread' },
  { src: vf('34711974/14713477_720_1280_30fps.mp4'), flag: '', t: 'The wok, live', s: 'Street kitchens at full flame' },
  { src: vf('35822699/15189596_1280_720_25fps.mp4'), flag: '', t: "The goldsmith's bench", s: 'Jewellery, made by hand' },
  { src: vf('8507896/8507896-hd_1080_1920_25fps.mp4'), flag: '', t: 'The pour', s: 'Tea, poured properly' },
  { src: vf('6748677/6748677-hd_1920_1080_25fps.mp4'), flag: '', t: 'Candle making', s: 'Light, poured and set' },
  { src: vf('34740027/14727180_1280_720_30fps.mp4'), flag: '', t: 'Saddle stitch', s: 'Leather, sewn by hand' },
  { src: vf('7519297/7519297-hd_720_1366_25fps.mp4'), flag: '', t: 'Glass, blown', s: 'Shaped in fire' },
  { src: vf('37789666/16029515_1280_720_59fps.mp4'), flag: '', t: 'Carved by hand', s: 'Wood, worked in daylight' },
  { src: vf('31638148/13478949_1280_720_24fps.mp4'), flag: '', t: 'The forge, live', s: 'Iron, struck while hot' },
  { src: vf('7344854/7344854-hd_1080_1920_25fps.mp4'), flag: '', t: 'Ink & nib', s: 'Writing, the slow way' },
  { src: vf('36147273/15329473_1280_720_25fps.mp4'), flag: '', t: 'The spice souk', s: 'Sold by the kilo' },
  { src: vf('37864529/16064058_1366_720_50fps.mp4'), flag: '', t: 'The luthier', s: 'A violin takes shape' },
  { src: vf('28987854/12538074_1280_720_24fps.mp4'), flag: '', t: 'Lantern night', s: 'Festivals after dark' },
  { src: vf('8322334/8322334-hd_1366_720_25fps.mp4'), flag: '', t: 'The watchmaker', s: 'Seconds, by hand' },
]

const css = `
.vl{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh}
.vl a{color:inherit;text-decoration:none}
.vl-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
.vl h1,.vl h2,.vl h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.vl-hero{padding:64px 0 20px;max-width:820px}
.vl-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:18px;font-weight:600}
.vl-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.vl-hero h1{font-size:44px;line-height:1.08;margin-bottom:16px}
.vl-hero p{font-size:16.5px;color:var(--muted);line-height:1.65;max-width:56ch;margin:0}
.vl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;padding:42px 0 30px}
.vl-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:transform .15s,border-color .15s}
.vl-card:hover{transform:translateY(-2px);border-color:#3d3d46}
.vl-thumb{aspect-ratio:16/9;background:#000;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.vl-live{position:absolute;top:10px;left:10px;background:var(--accent);color:#111;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px}
.vl-body{padding:14px 16px}
.vl-seller{font-size:13px;color:var(--accent);margin-bottom:4px}
.vl-title{font-weight:600;margin-bottom:6px}
.vl-status{font-size:12px;color:var(--muted)}
.vl-previews{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;padding:38px 0 10px}
.vl-tile{position:relative;aspect-ratio:9/16;border-radius:14px;overflow:hidden;border:1px solid var(--border);background:var(--surface-2)}
.vl-tile video{width:100%;height:100%;object-fit:cover;display:block;opacity:.85}
.vl-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 36%,rgba(0,0,0,.78) 100%)}
.vl-chip{position:absolute;top:12px;left:12px;font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.16);border-radius:5px;padding:4px 8px;color:#fff}
.vl-flag{position:absolute;top:12px;right:12px;font-size:10px;font-weight:700;letter-spacing:.08em;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.16);border-radius:4px;padding:3px 7px;color:#fff}
.vl-meta{position:absolute;left:14px;right:14px;bottom:14px}
.vl-meta .t{font-size:14px;font-weight:500;line-height:1.3;margin-bottom:5px}
.vl-meta .s{font-size:11.5px;color:#c6c6cf}
.vl-note{border:1px solid var(--border);border-radius:14px;background:var(--surface);padding:22px 26px;margin:34px 0 80px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.vl-note p{font-size:14px;color:var(--muted);line-height:1.6;margin:0;max-width:60ch}
.vl-note b{color:var(--text);font-weight:600}
.vl-btn{display:inline-block;background:var(--accent);color:#160a00 !important;border-radius:10px;padding:13px 24px;font-size:14px;font-weight:600;white-space:nowrap}
@media(max-width:720px){.vl-hero h1{font-size:32px}}
`

export default function LiveHubPage() {
  const [streams, setStreams] = useState<StreamCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/live')
        const data = await res.json()
        if (active && res.ok) setStreams(data.streams || [])
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  return (
    <div className="vl">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="vl-wrap">
        <div className="vl-hero">
          <div className="vl-eyebrow"><span className="vl-dot" /> Velor Live</div>
          <h1>Shopping, from where things are made.</h1>
          <p>
            Velor sellers go live from the workshop, the market stall, the kitchen — show the thing
            being made, answer you in real time, and sell it without you leaving the stream. Real
            people, real places, and only ever a real LIVE badge.
          </p>
        </div>

        {loading ? (
          <div className="vl-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="vl-card" style={{ height: 220, opacity: 0.35 }} />
            ))}
          </div>
        ) : streams.length > 0 ? (
          <div className="vl-grid">
            {streams.map((s) => (
              <Link key={s.id} href={`/live/${s.roomName}`}>
                <div className="vl-card">
                  <div className="vl-thumb">
                    {s.status === 'LIVE' && <span className="vl-live">LIVE</span>}
                    {s.products[0]?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.products[0].images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
                    ) : (
                      <span style={{ color: '#555' }}>Live Shopping</span>
                    )}
                  </div>
                  <div className="vl-body">
                    <div className="vl-seller">{s.sellerName}</div>
                    <div className="vl-title">{s.title}</div>
                    <div className="vl-status">{s.status === 'LIVE' ? 'Watching now' : 'Starting soon'}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <>
            <div className="vl-previews">
              {PREVIEWS.map((p) => (
                <div className="vl-tile" key={p.src}>
                  <video src={p.src} autoPlay muted loop playsInline preload="metadata" />
                  <div className="vl-scrim" />
                  <div className="vl-chip">Preview</div>
                  {p.flag ? <div className="vl-flag">{p.flag}</div> : null}
                  <div className="vl-meta"><div className="t">{p.t}</div><div className="s">{p.s}</div></div>
                </div>
              ))}
            </div>
            <div className="vl-note">
              <p>
                <b>Nobody is on air yet — honestly.</b> The first streams belong to our founding
                sellers, going live from 190 countries. When they do, this page fills with real
                broadcasts and real LIVE badges — never fake ones.
              </p>
              <Link className="vl-btn" href="/founding">Meet the founding countries</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
