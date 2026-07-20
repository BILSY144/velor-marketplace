'use client'

// /specialities — buyer-facing index of Velor's closed 59-term speciality
// vocabulary (lib/specialities.ts, signed off by William 2026-07-08 as
// velor-speciality-vocabulary-v2.md), grouped by its six families. The
// speciality-side companion to /origins (the country-side index of the same
// origins x specialities lattice) -- see app/specialities/layout.tsx for the
// full rationale and SEO_LOG.md backlog item 33 for the standing gap this
// closes half of.
//
// Live trading state (which specialities have at least one real APPROVED
// listing) comes from /api/lattice, the same source /origins and /founding
// already use -- never hand-typed, same "never imply a seller exists where
// one doesn't" rule those pages already follow. A speciality with zero live
// products links to /founding (become the first to open it) instead of a
// /shop?speciality= filter that would show nothing -- the identical
// "claimed" pattern already shipped on app/origins/[slug]/page.tsx's own
// speciality tags, reused here rather than re-invented.
//
// Buyer-facing labels (e.g. "Clay" -> "Ceramics & porcelain") come from
// lib/specialities.ts's buyerLabel() -- the same real, already-signed-off
// mapping used everywhere else specialities are shown to buyers.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SPECIALITIES, SPECIALITY_KINDS, buyerLabel, type SpecialityKind } from '@/lib/specialities'

type LatticeSummary = {
  specialities: Record<string, { countries: number; products: number }>
}

const FAMILY_NOTE: Record<SpecialityKind, string> = {
  Materials: 'What it’s made of.',
  Techniques: 'How it’s made.',
  Consumables: 'What’s grown, brewed or pressed.',
  Forms: 'What it becomes.',
  Rituals: 'What it’s for.',
  'Modern industry': 'Where old skill meets new precision.',
}

const css = `
.sp{background:var(--bg);color:var(--text);font-family:var(--font-body)}
.sp a{color:inherit;text-decoration:none}
.sp-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
.sp h1,.sp h2,.sp h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.sp-hero{padding:70px 0 40px}
.sp-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.sp-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.sp-hero h1{font-size:52px;line-height:1.05;margin-bottom:18px;max-width:18ch}
.sp-hero p{font-size:17px;color:var(--muted);line-height:1.62;max-width:56ch;margin:0}
.sp-legend{display:flex;gap:24px;font-size:12.5px;color:var(--muted);flex-wrap:wrap;padding:20px 0 0;border-top:1px solid var(--border);margin-top:26px}
.sp-legend i{font-style:normal;margin-right:7px}
.sp-g{color:var(--green)}.sp-o{color:var(--accent)}
.sp-family{padding:44px 0 8px}
.sp-fhead{display:flex;align-items:baseline;gap:16px;margin-bottom:6px}
.sp-fhead h3{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:500}
.sp-fline{flex:1;height:1px;background:var(--border)}
.sp-fn{font-size:12.5px;color:var(--muted)}
.sp-fnote{font-size:14px;color:var(--muted);margin:0 0 22px}
.sp-clist{columns:3;column-gap:44px}
.sp-ci{break-inside:avoid;display:block;padding:11px 0;border-bottom:1px solid var(--border)}
.sp-ci:hover .sp-cn{color:var(--accent)}
.sp-cn{font-family:var(--font-display);font-size:19px;font-weight:500;transition:color .12s}
.sp-line{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.4}
.sp-st{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:5px;font-weight:600}
.sp-st.live{color:var(--green)}
.sp-band{border:1px solid rgba(255,107,0,.32);border-radius:18px;padding:44px 48px;background:var(--surface);margin:50px 0 80px;display:flex;align-items:center;justify-content:space-between;gap:36px;flex-wrap:wrap}
.sp-band h2{font-size:26px;margin-bottom:12px;max-width:22ch}
.sp-band p{font-size:15px;color:var(--muted);line-height:1.6;max-width:54ch;margin:0}
.sp-btn{border-radius:10px;padding:15px 28px;font-size:15px;font-weight:600;display:inline-block;background:var(--accent);color:#160a00 !important}
.sp-btn2{border-radius:10px;padding:15px 28px;font-size:15px;font-weight:600;display:inline-block;border:1px solid var(--border);color:var(--text) !important}
@media(max-width:1000px){
.sp-hero h1{font-size:34px}
.sp-clist{columns:2}
}
@media(max-width:640px){.sp-clist{columns:1}}
`

export default function SpecialitiesIndexPage() {
  const [lattice, setLattice] = useState<LatticeSummary | null>(null)

  useEffect(() => {
    fetch('/api/lattice')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setLattice(d) })
      .catch(() => {})
  }, [])

  const stats = lattice?.specialities ?? {}
  const liveCount = useMemo(
    () => SPECIALITIES.filter(s => (stats[s.term]?.products ?? 0) > 0).length,
    [stats]
  )

  const families = useMemo(
    () => SPECIALITY_KINDS.map(kind => ({
      kind,
      items: SPECIALITIES.filter(s => s.kind === kind),
    })),
    []
  )

  return (
    <div className="sp">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="sp-wrap">
        <div className="sp-hero">
          <div className="sp-eyebrow"><span className="sp-dot" /> Shop by speciality &middot; buyers arrive 6 August</div>
          <h1>Fifty-nine crafts, six families.</h1>
          <p>
            {liveCount > 0
              ? `${liveCount} of ${SPECIALITIES.length} specialities are trading on Velor right now.`
              : `${SPECIALITIES.length} specialities are set up and waiting for their first seller.`}{' '}
            Every seller picks a country and up to two specialities &mdash; find one to see who&apos;s opened it, or open it yourself.
          </p>
          <div className="sp-legend">
            <span><i className="sp-g">&#9679;</i>Trading &mdash; shop live listings</span>
            <span><i className="sp-o">&#9679;</i>Not opened yet &mdash; be the first</span>
          </div>
        </div>

        {families.map(f => (
          <div className="sp-family" key={f.kind}>
            <div className="sp-fhead"><h3>{f.kind}</h3><span className="sp-fline" /><span className="sp-fn">{f.items.length}</span></div>
            <p className="sp-fnote">{FAMILY_NOTE[f.kind]}</p>
            <div className="sp-clist">
              {f.items.map(s => {
                const st = stats[s.term]
                const claimed = !!st && st.products > 0
                return (
                  <Link
                    className="sp-ci"
                    href={claimed ? `/shop?speciality=${encodeURIComponent(s.term)}` : '/founding'}
                    key={s.term}
                    title={s.line}
                  >
                    <span className="sp-cn">{buyerLabel(s.term)}</span>
                    <div className="sp-line">{s.line}</div>
                    <div className={'sp-st' + (claimed ? ' live' : '')}>
                      {claimed ? `${st!.products} product${st!.products === 1 ? '' : 's'} · trading` : 'Not opened yet'}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        <div className="sp-band">
          <div>
            <h2>Prefer to browse by country instead?</h2>
            <p>Every speciality is also tied to the countries known for it &mdash; see who&apos;s trading, and
            which seats are still open, on the origins index.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="sp-btn2" href="/origins">Shop by origin</Link>
            <Link className="sp-btn" href="/founding">See the founding atlas</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
