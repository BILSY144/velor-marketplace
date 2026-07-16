'use client'

// /founding — the founding-seller atlas, ported 2026-07-08 from
// velor-founding-seats-v3.html. One founding seat per country: the first
// verified seller from each country opens it. Statuses are computed live:
//   trading  -> /api/lattice (countries with >=1 approved product)
//   pending  -> RESTRICTED_IDENTITY_COUNTRY_CODES (identity checks not yet
//               available there; the Payoneer KYC rail will open these)
//   open     -> everything else
// Flags are derived from ISO codes at runtime (String.fromCodePoint) — never
// write flag emoji into source (content-filter incident, 2026-07-08).
// Opener language throughout: "opens", never "claims"/"owns"/"is yours".

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'
import { RESTRICTED_IDENTITY_COUNTRY_CODES } from '@/lib/identity'
import { cultureHints } from '@/lib/cultureHints'

type LatticeSummary = {
  trading: number
  countries: { code: string; name: string; products: number }[]
}

const REGION_BY_CODE: Record<string, string> = {
  DZ:'Africa',AO:'Africa',BJ:'Africa',BW:'Africa',BF:'Africa',BI:'Africa',CM:'Africa',CV:'Africa',CF:'Africa',TD:'Africa',KM:'Africa',CG:'Africa',CD:'Africa',DJ:'Africa',EG:'Africa',GQ:'Africa',ER:'Africa',SZ:'Africa',ET:'Africa',GA:'Africa',GM:'Africa',GH:'Africa',GN:'Africa',GW:'Africa',KE:'Africa',LS:'Africa',LR:'Africa',LY:'Africa',MG:'Africa',MW:'Africa',ML:'Africa',MR:'Africa',MU:'Africa',MA:'Africa',MZ:'Africa',NA:'Africa',NE:'Africa',NG:'Africa',RW:'Africa',SN:'Africa',SC:'Africa',SL:'Africa',SO:'Africa',ZA:'Africa',SS:'Africa',SD:'Africa',TZ:'Africa',TG:'Africa',TN:'Africa',UG:'Africa',ZM:'Africa',ZW:'Africa',
  AF:'Asia',AM:'Asia',AZ:'Asia',BH:'Asia',BD:'Asia',BT:'Asia',BN:'Asia',KH:'Asia',CN:'Asia',GE:'Asia',HK:'Asia',IN:'Asia',ID:'Asia',IR:'Asia',IQ:'Asia',IL:'Asia',JP:'Asia',JO:'Asia',KZ:'Asia',KW:'Asia',KG:'Asia',LA:'Asia',LB:'Asia',MO:'Asia',MY:'Asia',MV:'Asia',MN:'Asia',MM:'Asia',NP:'Asia',OM:'Asia',PK:'Asia',PH:'Asia',QA:'Asia',SA:'Asia',SG:'Asia',KR:'Asia',LK:'Asia',SY:'Asia',TW:'Asia',TJ:'Asia',TH:'Asia',TL:'Asia',TR:'Asia',TM:'Asia',AE:'Asia',UZ:'Asia',VN:'Asia',YE:'Asia',
  AL:'Europe',AD:'Europe',AT:'Europe',BY:'Europe',BE:'Europe',BA:'Europe',BG:'Europe',HR:'Europe',CY:'Europe',CZ:'Europe',DK:'Europe',EE:'Europe',FI:'Europe',FR:'Europe',DE:'Europe',GR:'Europe',HU:'Europe',IS:'Europe',IE:'Europe',IT:'Europe',LV:'Europe',LI:'Europe',LT:'Europe',LU:'Europe',MT:'Europe',MD:'Europe',MC:'Europe',ME:'Europe',NL:'Europe',MK:'Europe',NO:'Europe',PL:'Europe',PT:'Europe',RO:'Europe',RU:'Europe',SM:'Europe',RS:'Europe',SK:'Europe',SI:'Europe',ES:'Europe',SE:'Europe',CH:'Europe',UA:'Europe',GB:'Europe',VA:'Europe',
  AG:'The Americas',AR:'The Americas',BS:'The Americas',BB:'The Americas',BZ:'The Americas',BO:'The Americas',BR:'The Americas',CA:'The Americas',CL:'The Americas',CO:'The Americas',CR:'The Americas',CU:'The Americas',DM:'The Americas',DO:'The Americas',EC:'The Americas',SV:'The Americas',GD:'The Americas',GT:'The Americas',GY:'The Americas',HT:'The Americas',HN:'The Americas',JM:'The Americas',MX:'The Americas',NI:'The Americas',PA:'The Americas',PY:'The Americas',PE:'The Americas',KN:'The Americas',LC:'The Americas',VC:'The Americas',SR:'The Americas',TT:'The Americas',US:'The Americas',UY:'The Americas',VE:'The Americas',
  AU:'Oceania',FJ:'Oceania',KI:'Oceania',NZ:'Oceania',PG:'Oceania',WS:'Oceania',SB:'Oceania',TO:'Oceania',TV:'Oceania',VU:'Oceania',
}
const REGION_ORDER = ['Africa', 'Asia', 'Europe', 'The Americas', 'Oceania', 'Elsewhere']

const SPOTLIGHT = [
  { code: 'MA', name: 'Morocco', video: 'https://videos.pexels.com/video-files/34499603/14618073_360_640_30fps.mp4', specs: ['Leather babouches', 'Brass lanterns', 'Argan oil', 'Zellige tables'] },
  { code: 'JP', name: 'Japan', video: 'https://videos.pexels.com/video-files/9733033/9733033-sd_360_640_24fps.mp4', specs: ['Hand-forged knives', 'Matcha bowls', 'Washi stationery', 'Incense'] },
  { code: 'TR', name: 'Turkey', video: 'https://videos.pexels.com/video-files/7681482/7681482-sd_360_640_25fps.mp4', specs: ['Copper cezves', 'Kilim rugs', 'Hammam towels', 'Iznik ceramics'] },
]

function flag(code: string): string {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
}

const css = `
.vf{background:var(--bg);color:var(--text);font-family:var(--font-body)}
.vf a{color:inherit;text-decoration:none}
.vf-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
.vf h1,.vf h2,.vf h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.vf-hero{padding:70px 0 46px;display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:end}
.vf-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.vf-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.vf-hero h1{font-size:56px;line-height:1.04;margin-bottom:20px;max-width:14ch}
.vf-hero p{font-size:17.5px;color:var(--muted);line-height:1.62;max-width:50ch;margin:0}
.vf-perkbox{border:1px solid rgba(255,107,0,.3);border-radius:16px;padding:26px 28px;background:var(--surface)}
.vf-perkbox .lbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:16px}
.vf-perkbox ul{list-style:none;display:grid;gap:12px;margin:0;padding:0}
.vf-perkbox li{display:flex;gap:11px;font-size:14px;line-height:1.5}
.vf-perkbox i{color:var(--green);font-style:normal;flex:0 0 auto}
.vf-counter{border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:28px 0;margin-top:56px;display:flex;align-items:center;gap:44px;flex-wrap:wrap}
.vf-bigno{font-family:var(--font-display);font-size:58px;font-weight:700;line-height:1;color:var(--accent)}
.vf-cap{font-size:15px;color:var(--muted);line-height:1.55;max-width:34ch}
.vf-bar{flex:1;min-width:240px;height:8px;border-radius:99px;background:var(--surface-2);overflow:hidden;position:relative}
.vf-bar span{position:absolute;top:0;bottom:0;left:0;background:var(--green)}
.vf-barlbl{font-size:12px;color:var(--muted);margin-top:9px;letter-spacing:.04em}
.vf section{padding:70px 0}
.vf-shead{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;gap:24px}
.vf-shead h2{font-size:29px}
.vf-shead p{font-size:14.5px;color:var(--muted);margin:8px 0 0;max-width:64ch;line-height:1.6}
.vf-spot{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.vf-sc{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--border);aspect-ratio:4/5;background:var(--surface-2);display:flex;flex-direction:column;justify-content:flex-end}
.vf-sc video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.72}
.vf-veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.32) 0%,rgba(0,0,0,.05) 34%,rgba(0,0,0,.86) 100%)}
.vf-sc .inner{position:relative;padding:24px 24px 26px}
.vf-sc h3{font-size:28px;margin-bottom:10px}
.vf-sc .sp{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.vf-sc .sp span{font-size:11.5px;color:#d7d7dd;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:4px 10px}
.vf-cta{font-size:12.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:700;color:var(--accent)}
.vf-badge{position:absolute;top:16px;left:16px;font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;padding:5px 9px;border-radius:5px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.18);color:#fff}
.vf-idx{border-top:1px solid var(--border)}
.vf-controls{position:sticky;top:64px;z-index:20;background:var(--bg);display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:20px 0;border-bottom:1px solid var(--border)}
.vf-filterbox{display:flex;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:10px;height:44px;padding:0 15px;gap:10px;flex:1;min-width:240px;max-width:380px}
.vf-filterbox input{background:none;border:0;outline:0;color:var(--text);font-size:16px;width:100%;font-family:inherit}
.vf-pill{border:1px solid var(--border);border-radius:999px;padding:9px 15px;font-size:13px;color:var(--muted);cursor:pointer;background:none;font-family:inherit}
.vf-pill.on{color:var(--text);border-color:var(--accent)}
.vf-rc{font-size:13px;color:var(--muted);margin-left:auto}
.vf-legend{display:flex;gap:24px;font-size:12.5px;color:var(--muted);flex-wrap:wrap;padding:18px 0 0}
.vf-legend i{font-style:normal;margin-right:7px}
.vf-g{color:var(--green)}.vf-o{color:var(--accent)}.vf-a{color:var(--amber)}
.vf-region{padding:44px 0 8px}
.vf-rhead{display:flex;align-items:baseline;gap:16px;margin-bottom:22px}
.vf-rhead h3{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:500}
.vf-rline{flex:1;height:1px;background:var(--border)}
.vf-rn{font-size:12.5px;color:var(--muted)}
.vf-clist{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
.vf-ci{display:block;border:1px solid var(--border);border-top:3px solid var(--border);border-radius:14px;background:var(--surface);padding:16px 18px 15px;transition:border-color .15s,transform .15s,background .15s}
.vf-ci:hover{transform:translateY(-2px);border-color:#3d3d46;background:var(--surface-2)}
.vf-ci.live{border-top-color:var(--green)}
.vf-ci.seat{border-top-color:var(--accent)}
.vf-ci.hold{border-top-color:var(--amber)}
.vf-ci:hover .vf-cn{color:var(--accent)}
.vf-citop{display:flex;align-items:center;gap:11px}
.vf-cn{font-family:var(--font-display);font-size:18px;font-weight:500;transition:color .12s;line-height:1.25}
.vf-fl{display:flex;align-items:center;justify-content:center;width:26px;height:19px;font-size:13px;line-height:1;border-radius:3px;flex:0 0 auto;margin-left:auto;border:1px solid var(--border);background:var(--surface-2)}
.vf-k{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.4;min-height:17px}
.vf-st{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:10px;font-weight:600;padding-top:10px;border-top:1px solid var(--border)}
.vf-st.live{color:var(--green)}.vf-st.hold{color:var(--amber)}
.vf-empty{padding:70px 0;text-align:center;color:var(--muted);font-size:15px}
.vf-band{border:1px solid rgba(255,107,0,.32);border-radius:18px;padding:44px 48px;background:var(--surface);margin:50px 0 80px;display:flex;align-items:center;justify-content:space-between;gap:36px;flex-wrap:wrap}
.vf-band h2{font-size:28px;margin-bottom:12px;max-width:20ch}
.vf-band p{font-size:15px;color:var(--muted);line-height:1.6;max-width:54ch;margin:0}
.vf-btn{border-radius:10px;padding:15px 28px;font-size:15px;font-weight:600;display:inline-block;background:var(--accent);color:#160a00 !important}
@media(max-width:1000px){
.vf-hero{grid-template-columns:1fr;gap:36px;padding:44px 0 30px}
.vf-hero h1{font-size:36px}
.vf-spot{grid-template-columns:1fr}
.vf-clist{grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}
}
@media(max-width:640px){.vf-clist{grid-template-columns:1fr 1fr;gap:10px}.vf-bigno{font-size:44px}}
`

export default function FoundingPage() {
  const [lattice, setLattice] = useState<LatticeSummary | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'seat' | 'live' | 'hold'>('all')

  useEffect(() => {
    fetch('/api/lattice')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setLattice(d) })
      .catch(() => {})
  }, [])

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
    document.querySelectorAll('.vf-sc').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const liveCodes = useMemo(() => new Map((lattice?.countries ?? []).map(c => [c.code, c.products])), [lattice])
  const total = WORLD_COUNTRIES.length
  const trading = liveCodes.size
  const openSeats = total - trading

  function status(code: string): 'live' | 'hold' | 'seat' {
    if (liveCodes.has(code)) return 'live'
    if (RESTRICTED_IDENTITY_COUNTRY_CODES.has(code)) return 'hold'
    return 'seat'
  }

  const regions = useMemo(() => {
    const grouped = new Map<string, { code: string; name: string }[]>()
    for (const c of WORLD_COUNTRIES) {
      const st = status(c.code)
      if (filter !== 'all' && filter !== st) continue
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) continue
      const region = REGION_BY_CODE[c.code] ?? 'Elsewhere'
      if (!grouped.has(region)) grouped.set(region, [])
      grouped.get(region)!.push(c)
    }
    return REGION_ORDER.filter(r => grouped.has(r)).map(r => ({ region: r, items: grouped.get(r)! }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter, liveCodes])

  const shown = regions.reduce((n, r) => n + r.items.length, 0)

  return (
    <div className="vf">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="vf-wrap">
        <div className="vf-hero">
          <div>
            <div className="vf-eyebrow"><span className="vf-dot" /> Founding sellers &middot; buyers arrive 6 August</div>
            <h1>Be the first from your country.</h1>
            <p>
              {trading > 0
                ? `${trading} of ${total} countries are trading on Velor. The rest are waiting.`
                : `${total} countries. Not one founding seat taken yet.`}{' '}
              Whoever arrives first from each of them keeps something no seller after them can ever earn.
            </p>
          </div>
          <div className="vf-perkbox">
            <div className="lbl">What the first seller keeps</div>
            <ul>
              <li><i>&#10003;</i><span><b>Pro, free for life.</b> Never charged, for as long as the subscription runs unbroken.</span></li>
              <li><i>&#10003;</i><span><b>Every Pro benefit, free, for life.</b> Unlimited listings, Go Live broadcasting, your dedicated AI account manager &mdash; the full paid tier, yours permanently.</span></li>
              <li><i>&#10003;</i><span><b>The founding badge.</b> Permanent, on your store and every listing.</span></li>
              <li><i>&#10003;</i><span><b>The first store on your country&apos;s page.</b> Front and centre until others arrive &mdash; and credited as the seller who opened it, always.</span></li>
              <li><i>&#10003;</i><span><b>The showreel slot.</b> Your film, on the homepage.</span></li>
              <li><i>&#10003;</i><span><b>Founding seller of your specialities.</b> Every seller after you is welcome, but only one name goes first.</span></li>
            </ul>
          </div>
        </div>

        <div className="vf-counter">
          <div className="vf-bigno">{openSeats}</div>
          <div className="vf-cap">founding seats still unclaimed, of {total} countries.</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="vf-bar"><span style={{ width: `${(trading / total) * 100}%` }} /></div>
            <div className="vf-barlbl">
              {trading} of {total} countries trading{trading === 0 ? ' — the map is wide open' : ''}
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="vf-wrap">
          <div className="vf-shead">
            <div>
              <h2>Countries waiting for their first seller</h2>
              <p>Each one already knows what it is known for. It is waiting for someone to sell it.</p>
            </div>
          </div>
          <div className="vf-spot">
            {SPOTLIGHT.map(s => (
              <Link className="vf-sc" href="/apply" key={s.code}>
                <video src={s.video} autoPlay muted loop playsInline preload="metadata" />
                <div className="vf-veil" />
                <div className="vf-badge">{status(s.code) === 'live' ? 'Trading' : 'Seat open'}</div>
                <div className="inner">
                  <h3>{s.name}</h3>
                  <div className="sp">{s.specs.map(x => <span key={x}>{x}</span>)}</div>
                  <div className="vf-cta">Open {s.name} &rarr;</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="vf-idx">
        <div className="vf-wrap">
          <div className="vf-controls">
            <div className="vf-filterbox">
              <span style={{ color: 'var(--muted)' }}>&#9906;</span>
              <input placeholder="Find your country" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            {(['all', 'seat', 'live', 'hold'] as const).map(f => (
              <button key={f} className={'vf-pill' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'seat' ? 'Seat open' : f === 'live' ? 'Trading' : 'Pending'}
              </button>
            ))}
            <span className="vf-rc">{shown} {shown === 1 ? 'country' : 'countries'}</span>
          </div>
          <div className="vf-legend">
            <span><i className="vf-g">&#9679;</i>Trading — first seller has arrived</span>
            <span><i className="vf-o">&#9679;</i>Seat open — nobody yet</span>
            <span><i className="vf-a">&#9679;</i>Pending — identity checks not yet available</span>
          </div>

          {regions.map(r => (
            <div className="vf-region" key={r.region}>
              <div className="vf-rhead"><h3>{r.region}</h3><span className="vf-rline" /><span className="vf-rn">{r.items.length}</span></div>
              <div className="vf-clist">
                {r.items.map(c => {
                  const st = status(c.code)
                  const products = liveCodes.get(c.code)
                  return (
                    <Link className={'vf-ci ' + st} href="/apply" key={c.code}>
                      <div className="vf-citop">
                        <span className="vf-cn">{c.name}</span>
                        <span className="vf-fl" title={c.code}>{flag(c.code)}</span>
                      </div>
                      {cultureHints(c.code).length > 0 && <div className="vf-k">{cultureHints(c.code).slice(0, 4).join(' · ')}</div>}
                      <div className={'vf-st ' + st}>
                        {st === 'live' ? `${products} product${products === 1 ? '' : 's'} · trading`
                          : st === 'hold' ? 'Verification pending'
                          : 'Seat open'}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
          {shown === 0 && (
            <div className="vf-empty">
              No country by that name. <Link href="/apply" style={{ color: 'var(--accent)' }}>Tell us who we&apos;re missing.</Link>
            </div>
          )}

          <div className="vf-band">
            <div>
              <h2>Nobody from your country sells on Velor yet.</h2>
              <p>Apply, verify your identity, and you open your country on Velor &mdash; with Pro free
              for life, the founding badge, and the first store buyers see on its page.</p>
            </div>
            <Link className="vf-btn" href="/apply">Apply to sell</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
