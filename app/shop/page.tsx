'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'
import { CATEGORY_NAMES as CATEGORIES } from '@/lib/categories'
import { countryImages } from '@/lib/countryImagery'

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
// Deliberately NOT full-strength product photography: heavily dimmed +
// desaturated (opacity .38, grayscale 30%, dark scrim on top) so a box
// reads as decorative placeholder texture, not an actual listing with a
// name/price. Never implies real inventory — the intro copy, the muted
// treatment, and the empty dashed card together make clear these are open
// slots, not listings, per LAW #1.
const slotsCss = `
.shslots{width:100%;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:32px 0 0;margin-bottom:8px}
.shslots-head{max-width:1400px;margin:0 auto;padding:0 40px 20px}
.shslots-head h2{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;margin:0 0 10px;color:var(--text)}
.shslots-head p{font-size:14px;color:var(--muted);line-height:1.6;max-width:80ch;margin:0}
.shslots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(1.5in,1fr));grid-auto-rows:2in;gap:0;width:100%}
.shslots-box{width:100%;height:2in;position:relative;overflow:hidden;border:1px solid var(--border);background:var(--surface)}
.shslots-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.38;filter:grayscale(30%);z-index:0}
.shslots-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.45) 100%);z-index:1}
.shslots-ribbon{position:absolute;top:50%;left:50%;width:150%;text-align:center;transform:translate(-50%,-50%) rotate(-45deg);transform-origin:center;background:var(--accent);color:#160a00;font-size:9px;font-weight:700;letter-spacing:.03em;line-height:1.3;padding:5px 0;box-shadow:0 1px 3px rgba(0,0,0,.3);z-index:2}
.shslots-card{position:absolute;left:6px;right:6px;bottom:6px;height:0.6in;background:var(--surface-2);border:1px dashed var(--border);border-radius:4px;z-index:2}
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
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (origin) params.set('origin', origin)
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
  }, [category, search, page, origin])

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
      router.push('/auth/signin?callbackUrl=/shop')
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      {originCountry && <style dangerouslySetInnerHTML={{ __html: slotsCss }} />}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px' }}>VELOR</Link>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 700, margin: '16px 0 20px', color: 'var(--text)' }}>
            {category || 'All Products'}
            {total > 0 && <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--muted)', marginLeft: '12px' }}>{total} items</span>}
            {originCountry && (
              <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--muted)', marginLeft: '12px' }}>
                from {originCountry.name} &middot; <Link href="/shop" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Clear origin filter</Link>
              </span>
            )}
          </h1>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
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
            <h2>200 seats open for {originCountry.name} products</h2>
            <p>
              Every box below is an open product slot, not a listing — nothing is for sale here yet.
              The moment a verified seller from {originCountry.name} lists a product, one box fills in
              with its photo, name, and price.
            </p>
          </div>
          <div className="shslots-grid">
            {Array.from({ length: 200 }).map((_, i) => {
              const img = slotImages.length > 0 ? slotImages[i % slotImages.length] : null
              return (
                <div className="shslots-box" key={i}>
                  {img && <img className="shslots-img" src={img.url} alt="" loading="lazy" decoding="async" />}
                  <div className="shslots-scrim" />
                  <div className="shslots-ribbon">Your products here</div>
                  <div className="shslots-card" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 40px' }}>
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
                with the country and the maker on every listing. No filler stock, no placeholder products.
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
            {products.map(p => {
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
                        <span style={{ fontSize: '11px', color: 'var(--muted)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.sellerName}</span>
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
            })}
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
      </div>
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
