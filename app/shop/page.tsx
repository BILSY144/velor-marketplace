'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'
import { CATEGORY_NAMES as CATEGORIES } from '@/lib/categories'
import { countryImages } from '@/lib/countryImagery'
import { buyerLabel } from '@/lib/specialities'

// Full-bleed "open product slots" grid shown only on origin-filtered shop
// pages (i.e. the pages Velor's flag strip in GlobalHeader actually links
// to — /shop?origin=CODE — not /origins/[slug], which is a separate page).
// Boxes are 2in tall (fixed) and at least 1.5in wide, but each column
// STRETCHES (minmax(1.5in,1fr)) to fill whatever row width is left over —
// William asked for the grid wall-to-wall with no ragged right edge, and
// said box width can flex to make that true, so width is not a fixed
// real-world inch on every screen the way height is. Tiled left-to-right
// with zero gap across the full page width, not centered/narrow. Shown
// regardless of whether the country already has real listings (same
// "every country page" rule as the founding atlas).
//
// Each box's background is one of that country's own verified cultureHints
// photos (lib/countryImagery.ts — the same real, live-checked Pexels photos
// already shown on /origins/[slug]'s "known for" gallery), cycled by index
// so adjacent boxes never repeat the same photo. This is what naturally
// varies box art from one flag page to the next (Armenia's boxes use
// Armenia's photos, Japan's use Japan's) without a separate manual mapping.
// Deliberately NOT full-strength product photography, but William asked
// for better definition (2026-07-16) than the original near-invisible
// treatment, so this is a lighter touch: opacity .72, only 8% grayscale, a
// slight contrast boost, and a scrim that's nearly clear at the top and
// only darkens toward the bottom where it meets the ribbon/card. A box
// still reads as decorative placeholder texture, not an actual listing with a
// name/price. Never implies real inventory — the intro copy, the muted
// treatment, and the templated (generic, not fabricated) card text together
// make clear these are open slots, not listings, per LAW #1.
//
// Card text (2026-07-16, William): three generic lines — goods name, price,
// seller name — in an italic serif (Playfair Display) rather than a blocky
// sans, so the card reads as an example template. The price uses `symbol`
// from useCurrencyDisplay (the SAME hook the real product grid below uses),
// not a currency guessed from the origin country — most of the 190 flag
// countries have no mapped currency in lib/currencyData.ts's
// COUNTRY_TO_CURRENCY (~28 are covered), so "price in the country's own
// currency" would silently fall back to GBP on most flag pages anyway.
// Tying it to the buyer's own selected display currency instead means it's
// consistent on every flag page AND doubles as a live check that the
// currency switcher actually re-renders prices (it does — GlobalHeader's
// selector calls setStoredCurrency, which fires 'velor-currency-changed',
// which this hook listens for).
//
// Card text colour (2026-07-16): uses var(--text) rather than a hardcoded
// white or the theme's var(--muted). var(--text) already flips to near-black
// (#1a1a1d) in light mode and near-white (#f4f4f2) in dark mode, which is
// exactly "black on light, light on dark" without picking new one-off
// colours. Deliberately NOT var(--muted) for the smaller seller-name line —
// var(--muted) in light mode is #6b6b76, almost the same grey as this card's
// own fixed #6f6f6f background, so it would be nearly invisible. Hierarchy
// between the three lines is done with size/weight/caps instead of opacity,
// so contrast against the fixed grey card stays solid in both themes.
//
// Click target (updated 2026-07-16, William): every box links to
// /shop/preview (app/shop/preview/page.tsx), a static seller-facing
// preview of the real product-page template populated with clearly
// labelled example content — NOT the real /shop/[productId] template with
// a fake id, which is what this originally did and just 404'd (see git
// history on this file for that first version). William's goal here is
// for a prospective seller clicking an open box to see exactly how their
// goods will be presented once they list, as a recruiting tool for the
// open seats — a dead-end 404 didn't serve that. /shop/preview mirrors
// ProductPageClient's layout/styles closely and is unambiguously marked
// as an example at the top, so it never implies fabricated real
// inventory, per LAW #1.
const slotsCss = `
.shslots{width:100%;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:32px 0 0;margin-bottom:8px}
.shslots-head{max-width:1400px;margin:0 auto;padding:0 40px 20px}
.shslots-head h2{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;margin:0 0 10px;color:var(--text)}
.shslots-head p{font-size:14px;color:var(--muted);line-height:1.6;max-width:80ch;margin:0}
.shslots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;max-width:1400px;margin:0 auto;padding:0 40px 36px}
`

interface Product {
  id: string
  name: string
  price: number
  currency: string
  images: string[]
  category: string
  stock: number
  sellerId: string
  sellerName: string
  avgRating: number | null
  reviewCount: number
  discountedPrice: number | null
  percentOff: number | null
  isHandmade: boolean
  sellerFounding?: boolean
}

// The 16 categories used site-wide (matches components/GlobalHeader.tsx nav
// and the Category dropdown on the seller's Add Product form exactly). This
// list is used directly as the value stored on Product.category, so a
// listing routes straight to the matching category filter here.

function ShopContent() {
  const { symbol, convert } = useCurrencyDisplay()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [wishlistPending, setWishlistPending] = useState<string | null>(null)

  const category = searchParams.get('category') || ''
  const origin = searchParams.get('origin') || ''
  const originCountry = origin ? WORLD_COUNTRIES.find((c) => c.code === origin.toUpperCase()) : null
  const slotImages = originCountry ? countryImages(originCountry.code, 400) : []
  const speciality = searchParams.get('speciality') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (origin) params.set('origin', origin)
      if (speciality) params.set('speciality', speciality)
      params.set('page', String(page))
      const res = await fetch(`/api/shop/products?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setProducts(data.products)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [category, search, page, origin, speciality])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setSearchInput(search) }, [search])

  useEffect(() => {
    if (!session) return
    fetch('/api/wishlist')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const ids = new Set<string>(data.items.map((i: { product: { id: string } }) => i.product.id))
        setWishlistIds(ids)
      })
      .catch(() => {})
  }, [session])

  async function toggleWishlist(e: React.MouseEvent, productId: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      router.push('/auth/sign-in?callbackUrl=/shop')
      return
    }
    setWishlistPending(productId)
    const isIn = wishlistIds.has(productId)
    try {
      await fetch('/api/wishlist', {
        method: isIn ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      setWishlistIds(prev => {
        const next = new Set(prev)
        isIn ? next.delete(productId) : next.add(productId)
        return next
      })
    } finally {
      setWishlistPending(null)
    }
  }

  function navigate(updates: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k))
    // Only reset to page 1 when the update is a filter change (search/category).
    // Pagination itself calls navigate({ page: ... }) and must NOT have that
    // value immediately stripped back off, or Next/Previous silently no-ops.
    if (!('page' in updates)) p.delete('page')
    router.push(`/shop?${p}`)
  }

  const sym = (c: string) => c === 'GBP' ? '£' : c + ' '

  const renderProductCard = (p: Product) => {
              const onSale = p.discountedPrice !== null && p.discountedPrice < p.price
              return (
              <div key={p.id} style={{ position: 'relative' }}>
                <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ background: 'var(--surface)', border: onSale ? '1px solid var(--accent)' : '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ aspectRatio: '1', background: '#222', position: 'relative', overflow: 'hidden' }}>
                      {p.images[0]
                        ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: p.stock <= 0 ? 0.45 : 1 }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px' }}>No image</div>
                      }
                      {onSale && (
                        <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--accent)', color: '#000', fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '4px', letterSpacing: '0.3px' }}>
                          {p.percentOff}% OFF
                        </div>
                      )}
                      {p.isHandmade && (
                        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'var(--surface)', color: 'var(--text)', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.3px', border: '1px solid var(--accent)' }}>
                          HANDMADE
                        </div>
                      )}
                      {p.stock <= 0 && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ background: '#000', color: '#fff', fontSize: '13px', fontWeight: 800, padding: '6px 18px', borderRadius: '4px', letterSpacing: '1.5px', border: '1px solid #fff' }}>
                            SOLD OUT
                          </span>
                        </div>
                      )}
                      {p.stock > 0 && p.stock < 5 && (
                        <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--red)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                          ONLY {p.stock} LEFT
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{p.category}</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                      {(p.avgRating ?? 0) !== null && (
                        <div style={{ color: 'var(--accent)', fontSize: '13px', marginBottom: '8px' }}>
                          Rating: {'★'.repeat(Math.round(p.avgRating ?? 0))} {p.avgRating ?? 0}
                          <span style={{ color: 'var(--muted)', marginLeft: '4px' }}>({p.reviewCount})</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
                          {onSale ? (
                            <>
                              <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--accent)' }}>
                                {symbol}{convert(p.discountedPrice as number, p.currency).toFixed(2)}
                              </span>
                              <span style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'line-through' }}>
                                {symbol}{convert(p.price, p.currency).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{symbol}{convert(p.price, p.currency).toFixed(2)}</span>
                          )}
                        </span>
                        <span title={p.sellerFounding ? 'Founding Seller' : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', color: p.sellerFounding ? '#E9C46A' : 'var(--muted)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.sellerFounding && (<svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="6" fill="none" stroke="#E9C46A" strokeWidth="1.3" /><text x="7" y="9.6" textAnchor="middle" fontSize="7" fontWeight="800" fill="#E9C46A">1</text></svg>)}{p.sellerName}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={e => toggleWishlist(e, p.id)}
                  disabled={wishlistPending === p.id}
                  title={wishlistIds.has(p.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: onSale ? undefined : '10px',
                    right: onSale ? '10px' : undefined,
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'rgba(13,13,13,0.78)',
                    border: 'none',
                    cursor: wishlistPending === p.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '17px',
                    color: wishlistIds.has(p.id) ? 'var(--red)' : 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(4px)',
                    transition: 'color 0.15s',
                    zIndex: 1,
                    lineHeight: 1,
                  }}
                >
                  {wishlistIds.has(p.id) ? '♥' : '♡'}
                </button>
              </div>
              )
            }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      {originCountry && <style dangerouslySetInnerHTML={{ __html: slotsCss }} />}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px' }}>VELOR</Link>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 700, margin: '16px 0 20px', color: 'var(--text)' }}>
            {category || 'All Goods'}
            {total > 0 && <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--muted)', marginLeft: '12px' }}>{total} items</span>}
            {originCountry && (
              <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--muted)', marginLeft: '12px' }}>
                from {originCountry.name} &middot; <Link href="/shop" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Clear origin filter</Link>
              </span>
            )}
            {speciality && (
              <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--muted)', marginLeft: '12px' }}>
                in {buyerLabel(speciality)} &middot; <Link href="/shop" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Clear speciality filter</Link>
              </span>
            )}
          </h1>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search goods..."
              onKeyDown={e => { if (e.key === 'Enter') navigate({ search: searchInput }) }}
              style={{ flex: 1, background: '#111', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--text)', fontSize: '15px', outline: 'none', maxWidth: '400px' }}
            />
            <button
              onClick={() => navigate({ search: searchInput })}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
            >
              Search
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate({ category: '' })}
              style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: !category ? 'var(--accent)' : 'transparent', color: !category ? '#000' : 'var(--muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => navigate({ category: c })}
                style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: category === c ? 'var(--accent)' : 'transparent', color: category === c ? '#000' : 'var(--muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {originCountry && (
        <div className="shslots">
          <div className="shslots-head">
            <h2>{products.length > 0 ? String(products.length) + ' of 200 seats filled for ' + originCountry.name + ' goods' : '200 seats open for ' + originCountry.name + ' goods'}</h2>
            <p>
              {products.length > 0
                ? 'The filled boxes are real listings from verified ' + originCountry.name + ' sellers. Every dashed box is still an open seat — the moment another verified seller lists, it fills in with their photo, name, and price.'
                : 'Every box below is an open goods slot, not a listing — nothing is for sale here yet. The gold box is the founding seat. The moment a verified seller from ' + originCountry.name + ' lists their goods, one box fills in with its photo, name, and price.'}
            </p>
          </div>
          <div className="shslots-grid">
            {products.map(renderProductCard)}
            {products.length === 0 && (
              <Link key="founding-seat" href="/apply" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ background: 'var(--surface)', border: '1px dashed #B98A2F', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ aspectRatio: '1', background: 'linear-gradient(160deg, #241a08, #120d04)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="58%" height="58%" viewBox="0 0 200 200" aria-hidden="true">
                      <circle cx="100" cy="100" r="96" fill="none" stroke="#E9C46A" strokeWidth="2.5" />
                      <circle cx="100" cy="100" r="88" fill="none" stroke="#E9C46A" strokeWidth="1" opacity="0.6" />
                      <g stroke="#E9C46A" strokeWidth="2" fill="none" strokeLinecap="round" transform="translate(-9,0)">
                        <path d="M52 128 q-10 -22 2 -44" /><path d="M54 124 q-8 -4 -14 -1 q4 -8 14 -6" /><path d="M52 108 q-8 -4 -14 -1 q4 -8 14 -6" /><path d="M52 92 q-7 -5 -13 -3 q3 -8 13 -5" />
                      </g>
                      <g stroke="#E9C46A" strokeWidth="2" fill="none" strokeLinecap="round" transform="translate(9,0)">
                        <path d="M148 128 q10 -22 -2 -44" /><path d="M146 124 q8 -4 14 -1 q-4 -8 -14 -6" /><path d="M148 108 q8 -4 14 -1 q-4 -8 -14 -6" /><path d="M148 92 q7 -5 13 -3 q-3 -8 -13 -5" />
                      </g>
                      <text x="100" y="90" textAnchor="middle" fontSize="12" letterSpacing="2.5" fill="#E9C46A" fontWeight="600">VELOR</text>
                      <text x="100" y="119" textAnchor="middle" fontSize="26" fontWeight="800" letterSpacing="1" fill="#E9C46A">No. 001</text>
                      <text x="100" y="138" textAnchor="middle" fontSize="9.5" letterSpacing="2.6" fill="#E9C46A" opacity="0.85">EST. 2026</text>
                    </svg>
                  </div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#E9C46A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>The founding seat</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3, marginBottom: '8px' }}>The first {originCountry.name} listing goes here</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#E9C46A' }}>Pro free for life</span>
                      <span style={{ fontSize: '11px', color: '#E9C46A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>No. 001</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
            {Array.from({ length: Math.max(0, 200 - products.length - (products.length === 0 ? 1 : 0)) }).map((_, i) => {
              const img = slotImages.length > 0 ? slotImages[i % slotImages.length] : null
              return (
                <Link key={'seat-' + i} href="/shop/preview" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ aspectRatio: '1', background: '#222', position: 'relative', overflow: 'hidden' }}>
                      {img && <img src={img.url} alt={img.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45, filter: 'grayscale(20%)' }} />}
                      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '150%', textAlign: 'center', transform: 'translate(-50%,-50%) rotate(-45deg)', background: 'var(--accent)', color: '#160a00', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.3, padding: '6px 0', borderTop: '1.5px solid #160a00', borderBottom: '1.5px solid #160a00', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Your goods here</div>
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Your craft</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3, marginBottom: '8px', color: 'var(--muted)' }}>Goods name</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)' }}>{symbol}0.00</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Seller name</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {!originCountry && (<div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 40px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: '12px', height: '340px', opacity: 0.4 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          search ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '14px', color: 'var(--text)' }}>No results found</div>
              <p>Nothing matches &quot;{search}&quot; yet — the world is still arriving.</p>
            </div>
          ) : (
            /* Zero-catalogue state: the shelves are real and empty, and that is
               the story — honest, and pointed at the founding moment. */
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '70px 20px 90px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 12, letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 22 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                Buyers arrive 6 August
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 18px' }}>
                The shelves are built.<br />The world is on its way.
              </h2>
              <p style={{ fontSize: 15.5, color: 'var(--muted)', lineHeight: 1.65, maxWidth: '52ch', margin: '0 auto 34px' }}>
                Velor opens with founding sellers from around the world — real makers, identity-verified,
                with the country and the maker on every listing. No filler stock, no placeholder goods.
                What appears here first will have earned its place.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/founding" style={{ background: 'var(--accent)', color: '#160a00', borderRadius: 10, padding: '14px 26px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                  See which countries open first
                </Link>
                <Link href="/#specialities" style={{ border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '14px 26px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                  Browse the specialities
                </Link>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 30 }}>
                Make something your country is known for? <Link href="/apply" style={{ color: 'var(--accent)', textDecoration: 'none' }}>The founding seat is open.</Link>
              </p>
            </div>
          )
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {products.map(renderProductCard)}
          </div>
        )}

        {pages > 1 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
            {page > 1 && (
              <button
                onClick={() => navigate({ page: String(page - 1) })}
                style={{ padding: '8px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
              >
                Previous
              </button>
            )}
            <span style={{ padding: '8px 16px', color: 'var(--muted)', fontSize: '14px', display: 'flex', alignItems: 'center' }}>Page {page} of {pages}</span>
            {page < pages && (
              <button
                onClick={() => navigate({ page: String(page + 1) })}
                style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer', fontWeight: 700 }}
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>)}
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <ShopContent />
    </Suspense>
  )
}
