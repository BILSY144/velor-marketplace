'use client'

// /origins/[slug] — a single country's buyer-facing shopping page, e.g.
// /origins/japan. Companion to /origins (the index) and distinct from
// /founding (seller-recruitment-facing). Slug resolution is via
// lib/worldCountries.ts's findCountryBySlug (name-slug or raw ISO code, case
// -insensitive). Trading status and product counts come from /api/lattice
// (the same source /founding and /origins use, computed live from APPROVED
// listings — never hand-typed). For a country with live sellers, this page
// previews a handful of products (via /api/shop/products?origin=CODE) and
// links to /shop?origin=CODE for the full catalogue. For a country with none
// yet, it uses the same honest zero-state pattern as /shop's empty state —
// never implies a seller exists where one doesn't — with a CTA into /apply.
//
// Flags are derived from ISO codes at runtime (String.fromCodePoint) — never
// write flag emoji into source (content-filter incident, 2026-07-08).
//
// Craft opener (William, 2026-07-19: "add the imagery to the page as a
// opener like the app does for each craft"): when a visitor arrives via a
// specific craft search hit (?craft=<term>, set by GlobalHeader/search/shop's
// Crafts sections), this page opens with a full-bleed cover of that craft
// the way the mobile app's CraftScreen opens each craft -- own cover photo,
// "COUNTRY x SIGNATURE CRAFT" kicker, craft name as the headline. If the
// term has no dedicated photo of its own (came from lib/cultureHints.ts
// rather than lib/countryImagery.ts's named RAW entries), it falls back to
// the country's own lead photo rather than showing no image at all -- same
// honest-fallback rule as matchCraftImagery. Wrapped in Suspense because
// useSearchParams requires it (see app/search/page.tsx for the same pattern).

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { findCountryBySlug, type WorldCountry } from '@/lib/worldCountries'
import { RESTRICTED_IDENTITY_COUNTRY_CODES } from '@/lib/identity'
import { cultureHints } from '@/lib/cultureHints'
import { countryImages } from '@/lib/countryImagery'
import { SPECIALITIES, buyerLabel } from '@/lib/specialities'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'

interface PreviewProduct {
  id: string
  name: string
  price: number
  currency: string
  images: string[]
  stock: number
}

function flag(code: string): string {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
}

const css = `
.ocp{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh}
.ocp a{color:inherit}
.ocp-wrap{max-width:1100px;margin:0 auto;padding:0 32px}
.ocp h1,.ocp h2{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.ocp-back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);text-decoration:none;padding:24px 0 0}
.ocp-hero{padding:22px 0 40px;display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap}
.ocp-fl{width:56px;height:40px;border-radius:6px;border:1px solid var(--border);background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:26px;flex:0 0 auto}
.ocp-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;font-weight:600}
.ocp-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.ocp-hero h1{font-size:42px;line-height:1.05;margin-bottom:10px}
.ocp-status{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.ocp-status.live{color:var(--green)}
.ocp-status.hold{color:var(--amber)}
.ocp-status.seat{color:var(--accent)}
.ocp-hints{font-size:15px;color:var(--muted);line-height:1.6;margin-top:14px;max-width:60ch}
.ocp-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.ocp-tag{font-size:12px;color:var(--muted);border:1px solid var(--border);border-radius:999px;padding:6px 13px;text-decoration:none;display:inline-flex;transition:border-color .15s,color .15s}
.ocp-tag:hover{border-color:#3d3d46;color:var(--text)}
.ocp-tag.claimed{color:var(--accent);border-color:var(--accent)}
.ocp-sec{padding:36px 0 70px;border-top:1px solid var(--border)}
.ocp-shead{display:flex;align-items:baseline;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap}
.ocp-shead h2{font-size:22px}
.ocp-more{font-size:13px;color:var(--accent);font-weight:600;text-decoration:none;white-space:nowrap}
.ocp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.ocp-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;display:block}
.ocp-cimg{aspect-ratio:1;background:#222;position:relative;overflow:hidden}
.ocp-cimg img{width:100%;height:100%;object-fit:contain}
.ocp-cbody{padding:12px}
.ocp-cname{font-size:13.5px;font-weight:600;line-height:1.3;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ocp-cprice{font-size:15px;font-weight:700;font-family:var(--font-display)}
.ocp-empty{max-width:640px;margin:0 auto;padding:50px 20px 30px;text-align:center}
.ocp-empty h2{font-size:30px;line-height:1.18;margin-bottom:16px}
.ocp-empty p{font-size:15px;color:var(--muted);line-height:1.65;max-width:52ch;margin:0 auto 28px}
.ocp-btnrow{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.ocp-btn{border-radius:10px;padding:14px 26px;font-size:15px;font-weight:600;display:inline-block;background:var(--accent);color:#160a00 !important;text-decoration:none}
.ocp-btn2{border-radius:10px;padding:14px 26px;font-size:15px;font-weight:600;display:inline-block;border:1px solid var(--border);color:var(--text) !important;text-decoration:none}
.ocp-404{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:40px 20px}
.ocp-pills{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.ocp-pill{display:inline-flex;align-items:center;font-size:13px;font-weight:600;border-radius:999px;padding:10px 20px;text-decoration:none !important;border:1px solid var(--border);color:var(--text) !important;transition:border-color .15s,opacity .15s}
.ocp-pill:hover{border-color:#3d3d46}
.ocp-pill-primary{background:var(--accent);border-color:var(--accent);color:#160a00 !important}
.ocp-pill-primary:hover{opacity:.9}
.ocp-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
.ocp-gitem{border-radius:12px;overflow:hidden;position:relative;aspect-ratio:1;background:var(--surface-2)}
.ocp-gitem img{width:100%;height:100%;object-fit:cover;display:block}
.ocp-gcap{position:absolute;left:0;right:0;bottom:0;padding:8px 10px;font-size:11.5px;color:#fff;line-height:1.3;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.8) 100%)}
.ocp-opener{position:relative;width:100%;height:400px;overflow:hidden;background:var(--surface-2)}
.ocp-opener img{width:100%;height:100%;object-fit:cover;display:block}
.ocp-opener-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,11,0) 0%,rgba(8,8,11,0) 66%,rgba(8,8,11,0.82) 90%,var(--bg) 100%)}
.ocp-opener-text{position:absolute;left:32px;right:32px;bottom:28px;max-width:1036px;margin:0 auto}
.ocp-opener-kick{font-family:var(--font-display);font-size:11px;letter-spacing:.2em;color:var(--accent);font-weight:700}
.ocp-opener-title{font-family:var(--font-serif);font-weight:500;font-size:44px;line-height:1.1;color:#fff;margin-top:8px}
@media(max-width:720px){.ocp-opener{height:280px}.ocp-opener-title{font-size:30px}}
`

function OriginCountryContent() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug as string
  const country: WorldCountry | undefined = useMemo(() => findCountryBySlug(slug), [slug])
  const { symbol, convert } = useCurrencyDisplay()
  const searchParams = useSearchParams()
  const craftParam = searchParams.get('craft') ?? ''

  const [productCount, setProductCount] = useState<number | null>(null)
  const [pending, setPending] = useState(true)
  const [products, setProducts] = useState<PreviewProduct[]>([])
  const [specStats, setSpecStats] = useState<Record<string, { countries: number; products: number }>>({})

  useEffect(() => {
    if (!country) { setPending(false); return }
    let cancelled = false
    setPending(true)
    fetch('/api/lattice')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { countries?: { code: string; products: number }[]; specialities?: Record<string, { countries: number; products: number }> } | null) => {
        if (cancelled || !d) return
        const match = (d.countries ?? []).find(c => c.code === country.code)
        setProductCount(match ? match.products : 0)
        setSpecStats(d.specialities ?? {})
      })
      .catch(() => { if (!cancelled) setProductCount(0) })
      .finally(() => { if (!cancelled) setPending(false) })
    return () => { cancelled = true }
  }, [country])

  useEffect(() => {
    if (!country || !productCount) return
    let cancelled = false
    fetch(`/api/shop/products?origin=${country.code}&limit=8`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setProducts(d.products ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [country, productCount])

  if (!country) {
    return (
      <div className="ocp">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="ocp-404">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}>We can&apos;t find that country.</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Try the full list instead.</p>
          <Link className="ocp-btn" href="/origins">See all countries</Link>
        </div>
      </div>
    )
  }

  const isTrading = (productCount ?? 0) > 0
  const isHold = !isTrading && RESTRICTED_IDENTITY_COUNTRY_CODES.has(country.code)
  const status: 'live' | 'hold' | 'seat' = isTrading ? 'live' : isHold ? 'hold' : 'seat'
  const hints = cultureHints(country.code)
  const specialities = SPECIALITIES.filter(s => s.associated.includes(country.code))
  const images = countryImages(country.code)

  // Exact-match the craft's own dedicated photo when it has one; otherwise
  // fall back to the country's lead photo (images[0]) rather than showing
  // no opener at all -- the same honest fallback matchCraftImagery already
  // applies when the term only exists in cultureHints.ts, not RAW.
  const craftImage = craftParam
    ? (images.find(im => im.name.toLowerCase() === craftParam.toLowerCase()) ?? images[0] ?? null)
    : null

  return (
    <div className="ocp">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {craftImage && (
        <div className="ocp-opener">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={craftImage.url} alt={craftParam} />
          <div className="ocp-opener-scrim" />
          <div className="ocp-opener-text">
            <div className="ocp-opener-kick">{country.name.toUpperCase()} &times; SIGNATURE CRAFT</div>
            <div className="ocp-opener-title">{craftParam}</div>
          </div>
        </div>
      )}

      <div className="ocp-wrap">
        <Link className="ocp-back" href="/origins">&larr; All countries</Link>

        <div className="ocp-hero">
          <div className="ocp-fl">{flag(country.code)}</div>
          <div>
            <div className="ocp-eyebrow"><span className="ocp-dot" /> Origin</div>
            <h1>{country.name}</h1>
            <div className={'ocp-status ' + status}>
              {pending ? 'Checking...'
                : status === 'live' ? `${productCount} product${productCount === 1 ? '' : 's'} trading`
                : status === 'hold' ? 'Identity verification not yet available here'
                : 'No seller yet — the seat is open'}
            </div>
            {hints.length > 0 && (
              <p className="ocp-hints">Known for: {hints.slice(0, 8).join(' · ')}</p>
            )}
            {specialities.length > 0 && (
              <div className="ocp-tags">
                {specialities.slice(0, 8).map(s => {
                  const st = specStats[s.term]
                  const claimed = !!st && st.products > 0
                  return (
                    <Link
                      key={s.term}
                      className={'ocp-tag' + (claimed ? ' claimed' : '')}
                      href={claimed ? `/shop?speciality=${encodeURIComponent(s.term)}` : '/founding'}
                      title={s.line}
                    >
                      {buyerLabel(s.term)}
                    </Link>
                  )
                })}
              </div>
            )}
            <div className="ocp-pills">
              <Link className="ocp-pill ocp-pill-primary" href={`/apply?country=${country.code}`}>Claim your country</Link>
              <Link className="ocp-pill" href="/sell">Become a seller</Link>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div className="ocp-sec">
            <div className="ocp-shead">
              <h2>What {country.name} is known for</h2>
            </div>
            <div className="ocp-gallery">
              {images.slice(0, 12).map(img => (
                <div className="ocp-gitem" key={img.id}>
                  <img src={img.url} alt={img.name} loading="lazy" />
                  <span className="ocp-gcap">{img.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isTrading ? (
          <div className="ocp-sec">
            <div className="ocp-shead">
              <h2>From {country.name}</h2>
              <Link className="ocp-more" href={`/shop?origin=${country.code}`}>
                See all {productCount} products from {country.name} &rarr;
              </Link>
            </div>
            <div className="ocp-grid">
              {products.map(p => (
                <Link className="ocp-card" href={`/shop/${p.id}`} key={p.id}>
                  <div className="ocp-cimg">
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.name} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>No image</div>
                    }
                  </div>
                  <div className="ocp-cbody">
                    <div className="ocp-cname">{p.name}</div>
                    <div className="ocp-cprice">{symbol}{convert(p.price, p.currency).toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="ocp-sec">
            <div className="ocp-empty">
              <h2>Nobody sells from {country.name} yet.</h2>
              <p>
                Velor opens with founding sellers from around the world — real makers, identity-verified,
                with the country and the maker on every listing. Whoever applies first from {country.name}{' '}
                opens it, and is credited as the seller who did, for good.
              </p>
              <div className="ocp-btnrow">
                <Link className="ocp-btn" href={`/apply?country=${country.code}`}>Be the first from {country.name}</Link>
                <Link className="ocp-btn2" href="/founding">See the founding atlas</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OriginCountryPage() {
  // Inline styles, not the .ocp class -- its rules come from the <style>
  // tag OriginCountryContent injects, which hasn't rendered yet here.
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <OriginCountryContent />
    </Suspense>
  )
}
