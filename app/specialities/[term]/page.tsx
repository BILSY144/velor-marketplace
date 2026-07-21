'use client'

// /specialities/[term] — a single speciality's buyer-facing shopping page,
// e.g. /specialities/tea-ceremony. Companion to /specialities (the index)
// and the speciality-side analogue of /origins/[slug] (mirrors its layout,
// data flow and honest zero-state pattern almost exactly -- see that file's
// own header comment for the fuller rationale, not repeated here).
//
// Added by the standing SEO agent, 2026-07-20, closing the remaining half of
// backlog item 33 (the index-only half shipped earlier the same day -- see
// app/specialities/layout.tsx). Slug resolution is via
// lib/specialities.ts's findSpecialityBySlug (added this run alongside this
// page). Trading status and product/country counts come from /api/lattice
// (the same live-computed source /origins/[slug], /specialities and
// /founding all use — never hand-typed). For a speciality with live
// listings, this page previews a handful of products (via
// /api/shop/products?speciality=<term>) and links to
// /shop?speciality=<term> for the full filtered catalogue. For a speciality
// with none yet, it uses the same honest zero-state pattern as
// /origins/[slug]'s empty state — never implies a seller exists where one
// doesn't — with a CTA into /founding.
//
// "Associated" countries (lib/specialities.ts's Speciality.associated) are
// rendered here exactly as that file's own header comment requires: as
// editorial "known for" guidance linking to the real /origins/[slug] page
// for each country, never as a claim that a seller from that country is
// currently trading this speciality on Velor. Only /api/lattice data (read
// client-side below) drives any "trading" claim.

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  findSpecialityBySlug,
  buyerLabel,
} from '@/lib/specialities'
import { WORLD_COUNTRIES, countrySlug } from '@/lib/worldCountries'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'

interface PreviewProduct {
  id: string
  name: string
  price: number
  currency: string
  images: string[]
  stock: number
}

const FAMILY_NOTE: Record<string, string> = {
  Materials: 'What it’s made of.',
  Techniques: 'How it’s made.',
  Consumables: 'What’s grown, brewed or pressed.',
  Forms: 'What it becomes.',
  Rituals: 'What it’s for.',
  'Modern industry': 'Where old skill meets new precision.',
}

const css = `
.spt{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh}
.spt a{color:inherit}
.spt-wrap{max-width:1100px;margin:0 auto;padding:0 32px}
.spt h1,.spt h2{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.spt-back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);text-decoration:none;padding:24px 0 0}
.spt-hero{padding:22px 0 40px}
.spt-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;font-weight:600}
.spt-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.spt-hero h1{font-size:42px;line-height:1.05;margin-bottom:10px}
.spt-status{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.spt-status.live{color:var(--green)}
.spt-status.seat{color:var(--accent)}
.spt-line{font-size:15px;color:var(--muted);line-height:1.6;margin-top:14px;max-width:60ch}
.spt-pills{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.spt-pill{display:inline-flex;align-items:center;font-size:13px;font-weight:600;border-radius:999px;padding:10px 20px;text-decoration:none !important;border:1px solid var(--border);color:var(--text) !important;transition:border-color .15s,opacity .15s}
.spt-pill:hover{border-color:#3d3d46}
.spt-pill-primary{background:var(--accent);border-color:var(--accent);color:#160a00 !important}
.spt-pill-primary:hover{opacity:.9}
.spt-sec{padding:36px 0 70px;border-top:1px solid var(--border)}
.spt-shead{display:flex;align-items:baseline;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap}
.spt-shead h2{font-size:22px}
.spt-more{font-size:13px;color:var(--accent);font-weight:600;text-decoration:none;white-space:nowrap}
.spt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.spt-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;display:block}
.spt-cimg{aspect-ratio:1;background:#222;position:relative;overflow:hidden}
.spt-cimg img{width:100%;height:100%;object-fit:contain}
.spt-cbody{padding:12px}
.spt-cname{font-size:13.5px;font-weight:600;line-height:1.3;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.spt-cprice{font-size:15px;font-weight:700;font-family:var(--font-display)}
.spt-empty{max-width:640px;margin:0 auto;padding:50px 20px 30px;text-align:center}
.spt-empty h2{font-size:30px;line-height:1.18;margin-bottom:16px}
.spt-empty p{font-size:15px;color:var(--muted);line-height:1.65;max-width:52ch;margin:0 auto 28px}
.spt-btnrow{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.spt-btn{border-radius:10px;padding:14px 26px;font-size:15px;font-weight:600;display:inline-block;background:var(--accent);color:#160a00 !important;text-decoration:none}
.spt-btn2{border-radius:10px;padding:14px 26px;font-size:15px;font-weight:600;display:inline-block;border:1px solid var(--border);color:var(--text) !important;text-decoration:none}
.spt-404{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:40px 20px}
.spt-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.spt-tag{font-size:12px;color:var(--muted);border:1px solid var(--border);border-radius:999px;padding:6px 13px;text-decoration:none;display:inline-flex}
.spt-tag:hover{border-color:#3d3d46;color:var(--text)}
`

export default function SpecialityTermPage() {
  const params = useParams<{ term: string }>()
  const slug = params.term as string
  const speciality = useMemo(() => findSpecialityBySlug(slug), [slug])
  const { symbol, convert } = useCurrencyDisplay()

  const [stats, setStats] = useState<{ countries: number; products: number } | null>(null)
  const [pending, setPending] = useState(true)
  const [products, setProducts] = useState<PreviewProduct[]>([])

  useEffect(() => {
    if (!speciality) { setPending(false); return }
    let cancelled = false
    setPending(true)
    fetch('/api/lattice')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { specialities?: Record<string, { countries: number; products: number }> } | null) => {
        if (cancelled || !d) return
        setStats(d.specialities?.[speciality.term] ?? { countries: 0, products: 0 })
      })
      .catch(() => { if (!cancelled) setStats({ countries: 0, products: 0 }) })
      .finally(() => { if (!cancelled) setPending(false) })
    return () => { cancelled = true }
  }, [speciality])

  useEffect(() => {
    if (!speciality || !stats?.products) return
    let cancelled = false
    fetch(`/api/shop/products?speciality=${encodeURIComponent(speciality.term)}&limit=8`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setProducts(d.products ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [speciality, stats?.products])

  if (!speciality) {
    return (
      <div className="spt">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="spt-404">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}>We can&apos;t find that speciality.</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Try the full list instead.</p>
          <Link className="spt-btn" href="/shop">Browse all goods</Link>
        </div>
      </div>
    )
  }

  const label = buyerLabel(speciality.term)
  const isTrading = (stats?.products ?? 0) > 0
  const associatedCountries = WORLD_COUNTRIES.filter(c => speciality.associated.includes(c.code))

  return (
    <div className="spt">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="spt-wrap">
        <Link className="spt-back" href="/shop">&larr; Shop</Link>

        <div className="spt-hero">
          <div className="spt-eyebrow"><span className="spt-dot" /> {speciality.kind}</div>
          <h1>{label}</h1>
          {!pending && (
            <div className={'spt-status ' + (isTrading ? 'live' : 'seat')}>
              {isTrading
                ? `${stats!.products} product${stats!.products === 1 ? '' : 's'} trading · ${stats!.countries} ${stats!.countries === 1 ? 'country' : 'countries'}`
                : 'Not opened yet — be the first'}
            </div>
          )}
          <p className="spt-line">{speciality.line} {FAMILY_NOTE[speciality.kind] ?? ''}</p>

          {associatedCountries.length > 0 && (
            <div className="spt-tags">
              {associatedCountries.map(c => (
                <Link key={c.code} className="spt-tag" href={`/origins/${countrySlug(c)}`} title={`${c.name} — known for ${speciality.term.toLowerCase()}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          <div className="spt-pills">
            <Link className="spt-pill spt-pill-primary" href="/founding">Become the first to open it</Link>
            <Link className="spt-pill" href="/sell">Become a seller</Link>
          </div>
        </div>
      </div>

      <div className="spt-wrap">
        {isTrading ? (
          <div className="spt-sec">
            <div className="spt-shead">
              <h2>{label} on Velor</h2>
              <Link className="spt-more" href={`/shop?speciality=${encodeURIComponent(speciality.term)}`}>
                See all {stats!.products} products &rarr;
              </Link>
            </div>
            <div className="spt-grid">
              {products.map(p => (
                <Link className="spt-card" href={`/shop/${p.id}`} key={p.id}>
                  <div className="spt-cimg">
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.name} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>No image</div>
                    }
                  </div>
                  <div className="spt-cbody">
                    <div className="spt-cname">{p.name}</div>
                    <div className="spt-cprice">{symbol}{convert(p.price, p.currency).toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="spt-sec">
            <div className="spt-empty">
              <h2>Nobody sells {label.toLowerCase()} on Velor yet.</h2>
              <p>
                Velor opens with founding sellers from around the world — real makers, identity-verified,
                with the country and the maker on every listing. Whoever applies first with {label.toLowerCase()}{' '}
                opens it, and is credited as the seller who did, for good.
              </p>
              <div className="spt-btnrow">
                <Link className="spt-btn" href="/founding">Be the first to open {label.toLowerCase()}</Link>
                <Link className="spt-btn2" href="/origins">Shop by origin</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
