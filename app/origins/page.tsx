'use client'

// /origins — buyer-facing index of all 190 countries on Velor, the shopping
// counterpart to /founding (which is seller-recruitment-facing). Same data
// source (/api/lattice) and the same region-grouped/search/filter layout as
// /founding, but every tile links to /origins/[slug] — a shopping page for
// that country — rather than to /apply. Countries with no live sellers yet
// get an honest "not yet open" state here too; nothing implies a seller
// exists where one doesn't (see app/shop/page.tsx's zero-state for the
// established pattern this mirrors).
//
// Flags are derived from ISO codes at runtime (String.fromCodePoint) — never
// write flag emoji into source (content-filter incident, 2026-07-08).

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { WORLD_COUNTRIES, countrySlug } from '@/lib/worldCountries'
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

function flag(code: string): string {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
}

const css = `
.og{background:var(--bg);color:var(--text);font-family:var(--font-body)}
.og a{color:inherit;text-decoration:none}
.og-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
.og h1,.og h2,.og h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.og-hero{padding:70px 0 40px}
.og-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.og-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.og-hero h1{font-size:52px;line-height:1.05;margin-bottom:18px;max-width:16ch}
.og-hero p{font-size:17px;color:var(--muted);line-height:1.62;max-width:56ch;margin:0}
.og-controls{position:sticky;top:64px;z-index:20;background:var(--bg);display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:20px 0;border-bottom:1px solid var(--border);margin-top:26px}
.og-filterbox{display:flex;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:10px;height:44px;padding:0 15px;gap:10px;flex:1;min-width:240px;max-width:380px}
.og-filterbox input{background:none;border:0;outline:0;color:var(--text);font-size:16px;width:100%;font-family:inherit}
.og-pill{border:1px solid var(--border);border-radius:999px;padding:9px 15px;font-size:13px;color:var(--muted);cursor:pointer;background:none;font-family:inherit}
.og-pill.on{color:var(--text);border-color:var(--accent)}
.og-rc{font-size:13px;color:var(--muted);margin-left:auto}
.og-legend{display:flex;gap:24px;font-size:12.5px;color:var(--muted);flex-wrap:wrap;padding:18px 0 0}
.og-legend i{font-style:normal;margin-right:7px}
.og-g{color:var(--green)}.og-o{color:var(--accent)}.og-a{color:var(--amber)}
.og-region{padding:44px 0 8px}
.og-rhead{display:flex;align-items:baseline;gap:16px;margin-bottom:22px}
.og-rhead h3{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:500}
.og-rline{flex:1;height:1px;background:var(--border)}
.og-rn{font-size:12.5px;color:var(--muted)}
.og-clist{columns:3;column-gap:44px}
.og-ci{break-inside:avoid;display:block;padding:11px 0;border-bottom:1px solid var(--border)}
.og-ci:hover .og-cn{color:var(--accent)}
.og-citop{display:flex;align-items:center;gap:11px}
.og-cn{font-family:var(--font-display);font-size:19px;font-weight:500;transition:color .12s}
.og-fl{display:flex;align-items:center;justify-content:center;width:26px;height:19px;font-size:13px;line-height:1;border-radius:3px;flex:0 0 auto;margin-left:auto;border:1px solid var(--border);background:var(--surface-2)}
.og-k{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.4}
.og-st{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:5px;font-weight:600}
.og-st.live{color:var(--green)}.og-st.hold{color:var(--amber)}
.og-empty{padding:70px 0;text-align:center;color:var(--muted);font-size:15px}
.og-band{border:1px solid rgba(255,107,0,.32);border-radius:18px;padding:44px 48px;background:var(--surface);margin:50px 0 80px;display:flex;align-items:center;justify-content:space-between;gap:36px;flex-wrap:wrap}
.og-band h2{font-size:26px;margin-bottom:12px;max-width:22ch}
.og-band p{font-size:15px;color:var(--muted);line-height:1.6;max-width:54ch;margin:0}
.og-btn{border-radius:10px;padding:15px 28px;font-size:15px;font-weight:600;display:inline-block;background:var(--accent);color:#160a00 !important}
.og-btn2{border-radius:10px;padding:15px 28px;font-size:15px;font-weight:600;display:inline-block;border:1px solid var(--border);color:var(--text) !important}
@media(max-width:1000px){
.og-hero h1{font-size:34px}
.og-clist{columns:2}
}
@media(max-width:640px){.og-clist{columns:1}}
`

export default function OriginsIndexPage() {
  const [lattice, setLattice] = useState<LatticeSummary | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'seat' | 'live' | 'hold'>('all')

  useEffect(() => {
    fetch('/api/lattice')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setLattice(d) })
      .catch(() => {})
  }, [])

  const liveCodes = useMemo(() => new Map((lattice?.countries ?? []).map(c => [c.code, c.products])), [lattice])
  const total = WORLD_COUNTRIES.length
  const trading = liveCodes.size

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
    <div className="og">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="og-wrap">
        <div className="og-hero">
          <div className="og-eyebrow"><span className="og-dot" /> Shop by origin &middot; buyers arrive 6 August</div>
          <h1>Every country, one page each.</h1>
          <p>
            {trading > 0
              ? `${trading} of ${total} countries are trading on Velor right now.`
              : `${total} countries are set up and waiting for their first seller.`}{' '}
            Find a country to see who&apos;s selling from there, and what it&apos;s known for.
          </p>
        </div>

        <div className="og-controls">
          <div className="og-filterbox">
            <span style={{ color: 'var(--muted)' }}>&#9906;</span>
            <input placeholder="Find a country" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          {(['all', 'seat', 'live', 'hold'] as const).map(f => (
            <button key={f} className={'og-pill' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'seat' ? 'Not open yet' : f === 'live' ? 'Trading' : 'Pending'}
            </button>
          ))}
          <span className="og-rc">{shown} {shown === 1 ? 'country' : 'countries'}</span>
        </div>
        <div className="og-legend">
          <span><i className="og-g">&#9679;</i>Trading — shop live listings</span>
          <span><i className="og-o">&#9679;</i>Not open yet — no seller yet</span>
          <span><i className="og-a">&#9679;</i>Pending — identity checks not yet available there</span>
        </div>

        {regions.map(r => (
          <div className="og-region" key={r.region}>
            <div className="og-rhead"><h3>{r.region}</h3><span className="og-rline" /><span className="og-rn">{r.items.length}</span></div>
            <div className="og-clist">
              {r.items.map(c => {
                const st = status(c.code)
                const products = liveCodes.get(c.code)
                return (
                  <Link className="og-ci" href={`/origins/${countrySlug(c)}`} key={c.code}>
                    <div className="og-citop">
                      <span className="og-cn">{c.name}</span>
                      <span className="og-fl" title={c.code}>{flag(c.code)}</span>
                    </div>
                    {cultureHints(c.code).length > 0 && <div className="og-k">{cultureHints(c.code).slice(0, 4).join(' · ')}</div>}
                    <div className={'og-st ' + st}>
                      {st === 'live' ? `${products} product${products === 1 ? '' : 's'} · trading`
                        : st === 'hold' ? 'Verification pending'
                        : 'Not open yet'}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        {shown === 0 && (
          <div className="og-empty">
            No country by that name. <Link href="/apply" style={{ color: 'var(--accent)' }}>Tell us who we&apos;re missing.</Link>
          </div>
        )}

        <div className="og-band">
          <div>
            <h2>Want to see every seat still open?</h2>
            <p>The founding atlas shows which countries already have a first seller — and what a seller
            keeps for life by opening one that doesn&apos;t yet.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="og-btn2" href="/shop">Browse all goods</Link>
            {/* Added 2026-07-20 by the standing SEO agent: reciprocal link to
            the new /specialities index (see app/specialities/page.tsx) --
            the speciality side of the same origins x specialities lattice
            this page is the country side of. */}
            <Link className="og-btn2" href="/specialities">Shop by speciality</Link>
            <Link className="og-btn" href="/founding">See the founding atlas</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
