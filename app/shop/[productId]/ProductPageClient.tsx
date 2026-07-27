'use client'

import { useEffect, useState } from 'react'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FounderMedal } from '@/components/FounderMedal'

interface Variant {
  id: string
  name: string
  price: number
  stock: number
  image?: string
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: { name: string; image?: string | null }
}

interface SellerStats {
  totalSales: number
  approvedProductCount: number
  avgRating: number | null
  reviewCount: number
  memberSinceYear: number
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  images: string[]
  category: string
  tags: string[]
  stock: number
  sellerId: string
  sellerName: string
  seller?: { storeName: string; currency?: string; country?: string | null; storeLogo?: string | null; tier?: string; sellerBadge?: string | null; foundingBadge?: boolean; countryFounded?: { countryName?: string | null } | null } | null
  avgRating: number | null
  reviewCount: number
  variants: Variant[]
  reviews: Review[]
  discountedPrice: number | null
  percentOff: number | null
  isHandmade: boolean
  makerStory: string | null
  // Real spec fields already on Product (prisma/schema.prisma) -- only ever
  // rendered when actually present; never fabricated. See RESEARCH note in
  // CLAUDE.md's 2026-07-25 PDP redesign checkpoint.
  materials?: string | null
  weightGrams?: number | null
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  originCountry?: string | null
  specialities?: string[]
  sellerStats?: SellerStats
}

import { addToCart as addToSharedCart } from '@/lib/cart'

interface StoredCartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  sellerId?: string
}

// Shared shape for anything rendered in a rail card -- either a live API
// result from /api/shop/products (title comes back aliased as `name`) or a
// locally-stored "recently viewed" snapshot (title stored directly).
interface RailItem {
  id: string
  title?: string
  name?: string
  images?: string[]
  image?: string
  price: number
  currency?: string
  discountedPrice?: number | null
  percentOff?: number | null
  avgRating?: number | null
  reviewCount?: number
  stock?: number
}

const RECENTLY_VIEWED_KEY = 'velor-recently-viewed'

// Preview-only listing (William, 2026-07-27: "put a block on anyone
// actually checking out at cart as this listing is a show piece ... let
// people enter the product page but cannot go no further" + "let people
// know this is a preview in product page"). This is William's own demo
// product ("Your Listing" / williams workshop), not real inventory --
// buyers can browse it like any other listing, but Add to Cart / Buy Now
// are disabled and a preview notice shown, here only. Every other listing
// on the site is completely unaffected.
const PREVIEW_ONLY_PRODUCT_ID = 'cms260kvd0003epq3lnituxvw'

function RailCard({ p, symbol, convert }: { p: RailItem; symbol: string; convert: (amount: number, from: string) => number }) {
  const title = p.title || p.name || 'Goods'
  const img = p.image || p.images?.[0]
  const onSale = p.discountedPrice != null && p.discountedPrice < p.price
  const cur = p.currency || 'GBP'
  return (
    <Link href={`/shop/${p.id}`} className="velor-pdp-rail-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', height: '100%' }}>
        <div style={{ aspectRatio: '1', background: '#1c1c20', position: 'relative', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '11px' }}>No image</div>
          )}
          {onSale && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent)', color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px' }}>
              {p.percentOff}% OFF
            </div>
          )}
          {(p.stock ?? 1) === 0 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: '#000', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', letterSpacing: '1px' }}>SOLD OUT</span>
            </div>
          )}
        </div>
        <div style={{ padding: '10px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 600, lineHeight: 1.3, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '32px' }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: onSale ? 'var(--accent)' : 'var(--text)' }}>
              {symbol}{convert(onSale ? (p.discountedPrice as number) : p.price, cur).toFixed(2)}
            </span>
            {onSale && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'line-through' }}>
                {symbol}{convert(p.price, cur).toFixed(2)}
              </span>
            )}
          </div>
          {p.avgRating != null && (p.reviewCount ?? 0) > 0 && (
            <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--accent)' }}>
              {'★'.repeat(Math.round(p.avgRating))} <span style={{ color: 'var(--muted)' }}>({p.reviewCount})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function Rail({ heading, items, symbol, convert, viewAllHref }: { heading: string; items: RailItem[]; symbol: string; convert: (amount: number, from: string) => number; viewAllHref?: string }) {
  if (items.length === 0) return null
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '19px', fontWeight: 700, margin: 0 }}>{heading}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
        )}
      </div>
      <div className="velor-pdp-rail-scroll">
        {items.map((p) => (
          <RailCard key={p.id} p={p} symbol={symbol} convert={convert} />
        ))}
      </div>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const pdpCss = `
.velor-pdp-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,0.95fr);gap:40px;align-items:start;}
.velor-pdp-mobilebar{display:none;}
.velor-pdp-gallery-main{cursor:zoom-in;width:100%;}
.velor-pdp-gallery-main img{transition:transform .35s ease;}
.velor-pdp-gallery-main:hover img{transform:scale(1.05);}
.velor-pdp-rail-scroll{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;-ms-overflow-style:none;padding-bottom:6px;}
.velor-pdp-rail-scroll::-webkit-scrollbar{display:none;}
.velor-pdp-rail-card{flex:0 0 auto;width:170px;scroll-snap-align:start;}
.velor-pdp-tap{min-height:44px;}
.velor-pdp-info-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;align-items:start;}
.velor-pdp-desc-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;align-items:start;}
@media(max-width:900px){
  .velor-pdp-grid{grid-template-columns:1fr;gap:24px;}
  .velor-pdp-page{padding-bottom:84px;}
  .velor-pdp-mobilebar{display:flex;}
  .velor-pdp-desktop-cta{display:none;}
  .velor-pdp-cta-primary{display:none;}
  .velor-pdp-mobile-contact{display:flex !important;}
}
@media(max-width:600px){
  .velor-pdp-rail-card{width:148px;}
  .velor-pdp-seller-stats{grid-template-columns:1fr 1fr 1fr !important;}
}
`

export default function ProductPageClient() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const productId = params?.productId as string
  const { symbol, convert } = useCurrencyDisplay()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [mainImage, setMainImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [qty, setQty] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [contactError, setContactError] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [sellerRail, setSellerRail] = useState<RailItem[]>([])
  const [relatedRail, setRelatedRail] = useState<RailItem[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<RailItem[]>([])

  // Review submission -- 2026-07-16 readiness audit finding: app/api/reviews
  // (purchase-gated, one-review-per-buyer, Prisma-backed) already existed
  // and worked, but nothing in the UI ever called it. This wires it up.
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    if (!productId) return
    fetch(`/api/shop/products/${productId}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.ok ? r.json() : Promise.reject()
      })
      .then(data => { if (data) { setProduct(data); if (data.variants?.length) setSelectedVariant(data.variants[0]) } })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [productId])

  useEffect(() => {
    if (!session || !productId) return
    fetch('/api/wishlist')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const ids = new Set<string>(data.items.map((i: { product: { id: string } }) => i.product.id))
        setIsWishlisted(ids.has(productId))
      })
      .catch(() => {})
  }, [session, productId])

  // "More from this seller" + "You may also like" rails (William, 2026-07-25
  // PDP redesign). Both reuse the existing /api/shop/products listing
  // endpoint (extended with sellerId/excludeId params for this) rather than
  // a bespoke recommendation service -- real catalogue data, no fabricated
  // "personalization".
  useEffect(() => {
    if (!product) return
    let cancelled = false
    fetch(`/api/shop/products?sellerId=${product.sellerId}&excludeId=${product.id}&limit=10`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (!cancelled && data?.products) setSellerRail(data.products) })
      .catch(() => {})
    fetch(`/api/shop/products?category=${encodeURIComponent(product.category)}&excludeId=${product.id}&limit=12`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data?.products) return
        const filtered = (data.products as RailItem[] & { sellerId?: string }[]).filter((p: RailItem & { sellerId?: string }) => p.sellerId !== product.sellerId)
        setRelatedRail((filtered.length > 0 ? filtered : data.products).slice(0, 8))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [product?.id, product?.sellerId, product?.category])

  // Recently-viewed rail -- client-side only (localStorage), same pattern
  // already used site-wide for the cart (lib/cart.ts). Records THIS product
  // on every visit, then shows everything else in the list excluding it.
  useEffect(() => {
    if (!product) return
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY)
      const list: RailItem[] = raw ? JSON.parse(raw) : []
      const entry: RailItem = {
        id: product.id,
        title: product.title,
        image: product.images[0] || '',
        price: product.price,
        currency: product.seller?.currency || product.currency || 'GBP',
      }
      const next = [entry, ...list.filter(i => i.id !== product.id)].slice(0, 12)
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next))
      setRecentlyViewed(next.filter(i => i.id !== product.id).slice(0, 8))
    } catch {}
  }, [product?.id])

  // Lightbox keyboard controls (Escape closes, arrows navigate). Declared
  // above any early return so hook order stays stable regardless of loading/
  // notFound state, per the Rules of Hooks.
  useEffect(() => {
    if (!lightboxOpen || !product) return
    const imgCount = product.images.length || 1
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false)
      else if (e.key === 'ArrowLeft') setMainImage(i => (i - 1 + imgCount) % imgCount)
      else if (e.key === 'ArrowRight') setMainImage(i => (i + 1) % imgCount)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, product])

  async function toggleWishlist() {
    // Preview-only listing -- looks and behaves like a normal wishlist
    // button but does nothing (William, 2026-07-27: "all four buttons in
    // product page need to show what they are but have zero
    // functionality").
    if (isPreviewOnly) return
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
      return
    }
    setWishlistLoading(true)
    try {
      await fetch('/api/wishlist', {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      setIsWishlisted(prev => !prev)
    } finally {
      setWishlistLoading(false)
    }
  }

  async function handleContactSeller() {
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
      return
    }
    if (!contactMessage.trim() || !product) return
    setContactSending(true)
    setContactError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, sellerId: product.sellerId, content: contactMessage }),
      })
      if (!res.ok) throw new Error('Failed')
      setContactSent(true)
      setContactMessage('')
    } catch {
      setContactError('Failed to send message. Please try again.')
    } finally {
      setContactSending(false)
    }
  }

  async function submitReview() {
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
      return
    }
    if (!reviewRating || !product) return
    setReviewSubmitting(true)
    setReviewError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating: reviewRating, comment: reviewComment.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        // The API itself decides eligibility (purchased? already reviewed?)
        // -- surface its real reason rather than a generic failure message.
        setReviewError(data.error || 'Could not submit your review. Please try again.')
        return
      }
      // Re-fetch the product from the source of truth rather than
      // constructing a fake local review object -- keeps avgRating/count and
      // the displayed name consistent with what everyone else will see.
      const refreshed = await fetch(`/api/shop/products/${productId}`)
      if (refreshed.ok) {
        const fresh = await refreshed.json()
        setProduct(fresh)
      }
      setReviewSubmitted(true)
      setReviewRating(0)
      setReviewComment('')
    } catch {
      setReviewError('Could not submit your review. Please try again.')
    } finally {
      setReviewSubmitting(false)
    }
  }
  // Cart items store the ORIGINAL price, never the discounted one â the
  // automatic discount is recomputed server-side at checkout from the
  // seller's live discount codes, so the buyer is always charged against
  // the current rules rather than a client-supplied number. The discount
  // is shown here and at checkout, and both are guaranteed to match because
  // they both call the same computeListingDiscount/findAutomaticDiscounts
  // logic in lib/discount.ts.
  // Sign-in gated, same as toggleWishlist/handleContactSeller/submitReview
  // above -- found live 2026-07-25 (William's "make sure everything is
  // actually connected" audit) that Add to Cart/Buy Now were the ONE path
  // on this page a guest could get all the way through: fill in the full
  // checkout form, pick shipping, only to hit a bare 401 from
  // /api/stripe/payment-intent (which has always required a session -- see
  // that route's own auth() check) with no sign-in prompt, just a generic
  // "Could not set up payment" error. Gating here instead closes that
  // dead-end before the buyer ever invests time filling out checkout.
  function addToCart() {
    if (!product) return
    // Preview-only listing -- never actually added to cart (William,
    // 2026-07-27). Buttons below are disabled for this product too; this
    // guard is the belt-and-braces backstop.
    if (product.id === PREVIEW_ONLY_PRODUCT_ID) return
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
      return
    }
    const cartId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id
    const price = selectedVariant ? selectedVariant.price : product.price
    const image = (selectedVariant?.image) || product.images[0] || ''
    addToSharedCart({
      id: cartId,
      productId: product.id,
      name: product.title + (selectedVariant ? ` - ${selectedVariant.name}` : ''),
      price,
      quantity: qty,
      image,
      sellerId: product.sellerId,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  function buyNow() {
    if (product?.id === PREVIEW_ONLY_PRODUCT_ID) return
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
      return
    }
    addToCart()
    router.push('/checkout')
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price ?? 0
  const currentStock = selectedVariant ? selectedVariant.stock : product?.stock ?? 0
  const isPreviewOnly = product?.id === PREVIEW_ONLY_PRODUCT_ID
  // Automatic discounts only ever apply to the base product listing (they
  // are scoped by productId, not by variant), so only show the "was/now"
  // treatment when no variant is selected or the product has no variants.
  const onSale = !selectedVariant && product?.discountedPrice != null && product.discountedPrice < product.price
  const images = product && product.images.length > 0 ? product.images : ['/placeholder.png']

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, color: 'var(--text)' }}>Goods not found</div>
        <Link href="/shop" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Back to Shop</Link>
      </div>
    )
  }

  // Rating breakdown is computed off the loaded reviews (API returns the 20
  // most recent -- same set the average/star display already uses). Flagged
  // honestly below when the seller has more reviews than are shown, rather
  // than implying this is a full-history breakdown.
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: product.reviews.filter(r => r.rating === star).length,
  }))
  const hasMoreReviews = product.reviewCount > product.reviews.length

  return (
    <div className="velor-pdp-page" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: pdpCss }} />
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '18px' }}>VELOR</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{product.title}</span>
        </div>
      </div>

      <div className="velor-pdp-grid" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            className="velor-pdp-gallery-main"
            onClick={() => setLightboxOpen(true)}
            role="button"
            aria-label="Open full-size image"
            style={{ width: 'min(100%, 560px, 62vh)', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', background: 'transparent', position: 'relative' }}
          >
            <img src={images[mainImage]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            {onSale && (
              <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--accent)', color: '#000', fontSize: '13px', fontWeight: 800, padding: '6px 14px', borderRadius: '6px', letterSpacing: '0.3px' }}>
                {product.percentOff}% OFF
              </div>
            )}
            {currentStock === 0 && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ background: '#000', color: '#fff', fontSize: '15px', fontWeight: 800, padding: '8px 22px', borderRadius: '5px', letterSpacing: '2px', border: '1px solid #fff' }}>
                  SOLD OUT
                </span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '20px' }}>
              Tap to zoom
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px' }}>
            {images.map((img, i) => (
              <div
                key={i}
                onClick={() => setMainImage(i)}
                style={{
                  width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                  border: mainImage === i ? '2px solid var(--accent)' : '2px solid var(--border)',
                  flexShrink: 0,
                }}
              >
                <img src={img} alt={`${product.title} — photo ${i + 1} of ${images.length}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{product.category}</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.25 }}>{product.title}</h1>

          {isPreviewOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', marginBottom: '16px', background: 'rgba(255,107,0,0.1)', border: '1px solid var(--accent)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
              <span style={{ fontSize: '15px' }}>&#9432;</span>
              Preview listing — shown to demonstrate Velor, not available for purchase.
            </div>
          )}

          {(product.avgRating ?? 0) != null && product.reviewCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '16px' }}>{'★'.repeat(Math.round(product.avgRating ?? 0))}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{product.avgRating ?? 0}</span>
              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>({product.reviewCount} reviews)</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '18px' }}>
            {onSale ? (
              <>
                <span style={{ fontSize: '36px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: 'var(--accent)' }}>
                  {symbol}{convert(product.discountedPrice as number, product.seller?.currency || 'GBP').toFixed(2)}
                </span>
                <span style={{ fontSize: '20px', color: 'var(--muted)', textDecoration: 'line-through' }}>
                  {symbol}{convert(product.price, product.seller?.currency || 'GBP').toFixed(2)}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#000', background: 'var(--accent)', padding: '4px 10px', borderRadius: '5px' }}>
                  SAVE {product.percentOff}%
                </span>
              </>
            ) : (
              <span style={{ fontSize: '36px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: 'var(--text)' }}>
                {symbol}{convert(currentPrice, product.seller?.currency || 'GBP').toFixed(2)}
              </span>
            )}
          </div>
          {onSale && (
            <div style={{ marginTop: '-14px', marginBottom: '20px', fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
              Discount applied automatically — no code needed. It will carry through to your cart and checkout.
            </div>
          )}

          {(product.variants && product.variants.length > 0) && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '10px', fontWeight: 600 }}>Variant</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className="velor-pdp-tap"
                    style={{
                      padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                      border: selectedVariant?.id === v.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                      background: selectedVariant?.id === v.id ? 'rgba(255,107,0,0.12)' : 'transparent',
                      color: selectedVariant?.id === v.id ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>Quantity</div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="velor-pdp-tap" style={{ width: '44px', height: '44px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>-</button>
              <span style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(currentStock, q + 1))} className="velor-pdp-tap" style={{ width: '44px', height: '44px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>+</button>
            </div>
            {currentStock > 0 && currentStock < 5 && (
              <span style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 600 }}>Only {currentStock} left</span>
            )}
          </div>

          {/* Compact action rows (William, 2026-07-25: "the big add to cart, buy
              now, save to wishlist, contact seller buttons are too big and
              really wasting space" -- then, after the first icon-only pass,
              "bring back add to wishlist and message seller buttons back too
              to mirror new sized add to cart button"). Every button carries
              the same tightened sizing as Add to Cart (0 vertical padding,
              8px radius, 44px floor via .velor-pdp-tap) and keeps a real text
              label -- paired side by side instead of stacked full-width, so
              the row is compact without falling back to unlabeled icons. */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <button
              onClick={addToCart}
              disabled={currentStock === 0}
              className="velor-pdp-tap velor-pdp-cta-primary"
              style={{ flex: 1, padding: '0 14px', background: currentStock === 0 ? 'var(--border)' : (addedToCart ? 'var(--green)' : 'var(--accent)'), color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14.5px', cursor: currentStock === 0 ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {currentStock === 0 ? 'Out of Stock' : addedToCart ? 'Added!' : 'Add to Cart'}
            </button>
            {/* No .velor-pdp-cta-primary here on purpose -- once Add to Cart
                hides under 900px (sticky mobile bar covers it), this button's
                flex:1 with no sibling naturally expands to fill the row, no
                extra mobile-only override needed. */}
            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="velor-pdp-tap"
              style={{ flex: 1, padding: '0 14px', background: 'transparent', color: isWishlisted ? 'var(--red)' : 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 700, fontSize: '14.5px', cursor: wishlistLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <span style={{ fontSize: '16px' }}>{isWishlisted ? '♥' : '♡'}</span>
              {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </div>

          <div className="velor-pdp-desktop-cta" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={buyNow}
              disabled={currentStock === 0}
              className="velor-pdp-tap"
              style={{ flex: 1, padding: '0 14px', background: 'transparent', color: 'var(--text)', border: '2px solid var(--border)', borderRadius: '8px', fontWeight: 700, fontSize: '14.5px', cursor: currentStock === 0 ? 'not-allowed' : 'pointer' }}
            >
              Buy Now
            </button>
            <button
              onClick={() => {
                if (isPreviewOnly) return
                if (!session) {
                  router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
                  return
                }
                setShowContactModal(true)
                setContactSent(false)
                setContactError('')
              }}
              aria-label="Message seller"
              title="Message seller"
              className="velor-pdp-tap"
              style={{ flex: 1, padding: '0 14px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '8px', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <span style={{ fontSize: '16px' }}>&#9993;</span>
              Message Seller
            </button>
          </div>

          {/* Message Seller must still be reachable on mobile even though Buy
              Now hides there (mobile bar covers Buy Now) -- shown on its own,
              mobile-only, via the inverse of .velor-pdp-desktop-cta. */}
          <button
            onClick={() => {
              if (isPreviewOnly) return
              if (!session) {
                router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
                return
              }
              setShowContactModal(true)
              setContactSent(false)
              setContactError('')
            }}
            className="velor-pdp-tap velor-pdp-mobile-contact"
            style={{ display: 'none', width: '100%', padding: '0 14px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}
          >
            <span style={{ fontSize: '16px' }}>&#9993;</span>
            Message Seller
          </button>
        </div>
      </div>

      {/* Full-width info row (2026-07-25, William: "theres a lot of unneccassary
          waisted space on the page we need to utilize it"). The trust/delivery
          module, seller card, and handmade story used to be stacked inside the
          narrow right-hand buy-box column, running on well past the bottom of
          the image column and leaving a large empty gap under the gallery on
          desktop. Pulling them into their own full-width row (auto-fit grid --
          2 columns normally, 3 when the handmade block is present and there's
          room, 1 on narrow screens automatically since each card has a 280px
          minimum) uses the page's actual width instead of stacking everything
          into one half of it. Returns copy is the corrected, seller-managed
          version (see the checkpoint below this comment's original -- 2026-07-25
          CLAUDE.md entry -- for why the old UK-statutory line was wrong). */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 28px' }}>
        <div className="velor-pdp-info-row">
          <div style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', lineHeight: 1.4 }}>📦</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Dispatch &amp; delivery</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {product.seller?.country ? `Dispatched from ${product.seller.country}. ` : ''}
                  Usually dispatched within 1–3 business days. Real shipping cost and estimated arrival are calculated at checkout.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', lineHeight: 1.4 }}>↩️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Returns</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Set by this seller. <Link href="/returns" style={{ color: 'var(--accent)', fontWeight: 600 }}>See our returns &amp; refunds policy</Link>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', lineHeight: 1.4 }}>🔒</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Buyer protection</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Payments secured by Stripe. All buyer–seller messages stay on Velor — never shared contact details.
                </div>
              </div>
            </div>
          </div>

          {/* Seller trust card -- replaces the old one-line "Sold by X". Every
              number is computed live in app/api/shop/products/[productId]
              from real Orders/Reviews/Products, never fabricated. */}
          {product.seller && (
            <div style={{ padding: '18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                  {product.seller.storeLogo ? (
                    <img src={product.seller.storeLogo} alt={product.seller.storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--accent)' }}>{product.seller.storeName?.[0]?.toUpperCase() ?? '?'}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link href={`/seller/${product.sellerId}`} style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', textDecoration: 'none' }}>{product.seller.storeName}</Link>
                    {/* Founding-seller medal (William, 2026-07-27, "on the
                        product page the listing images dont need the badge,
                        but it can be added in the sellers box"): moved into
                        this seller trust card next to the store name, never
                        on the listing image -- same shared medallion as
                        every other listing surface. */}
                    {product.seller.foundingBadge && (
                      <FounderMedal countryName={product.seller.countryFounded?.countryName} size={28} />
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {product.seller.country ? `${product.seller.country} · ` : ''}
                    {product.sellerStats ? `Member since ${product.sellerStats.memberSinceYear}` : ''}
                  </div>
                </div>
              </div>

              {/* Founding Seller pill removed from this ID card (William,
                  2026-07-26, "remove it completly ... in its place add the
                  stock inventory pill and the handmade pill") -- founding
                  status as TEXT is never shown here; it's the round
                  FounderMedal next to the store name above instead (William,
                  2026-07-27). This card keeps sellerBadge (an unrelated
                  seller-tier badge) plus the two replacements: live stock
                  count and handmade status, both sourced directly from the
                  same product record already loaded above -- never
                  fabricated. */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {product.seller.sellerBadge && (
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(255,107,0,0.12)', border: '1px solid var(--accent)', borderRadius: '999px', padding: '3px 10px' }}>
                    {product.seller.sellerBadge}
                  </span>
                )}
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: currentStock > 0 ? 'var(--green)' : 'var(--red)', background: currentStock > 0 ? 'rgba(46,204,113,0.12)' : 'rgba(220,38,38,0.12)', border: `1px solid ${currentStock > 0 ? 'var(--green)' : 'var(--red)'}`, borderRadius: '999px', padding: '3px 10px' }}>
                  {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
                </span>
                {product.isHandmade && (
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(255,107,0,0.12)', border: '1px solid var(--accent)', borderRadius: '999px', padding: '3px 10px' }}>
                    Handmade
                  </span>
                )}
              </div>

              <div className="velor-pdp-seller-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{product.sellerStats?.approvedProductCount ?? 0}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Listings</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{product.sellerStats && product.sellerStats.totalSales > 0 ? product.sellerStats.totalSales : 'New'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{product.sellerStats && product.sellerStats.totalSales > 0 ? 'Sold' : 'Seller'}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{product.sellerStats?.avgRating != null ? `${product.sellerStats.avgRating}★` : '—'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{product.sellerStats?.reviewCount ? `${product.sellerStats.reviewCount} reviews` : 'No reviews yet'}</div>
                </div>
              </div>

              <Link href={`/seller/${product.sellerId}`} className="velor-pdp-tap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', boxSizing: 'border-box' }}>
                Visit Store
              </Link>
            </div>
          )}

          {product.isHandmade && (
            <div style={{ padding: '18px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--accent)', fontSize: '13px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: '8px' }}>Handmade / Artisan-made</div>
              {product.makerStory && <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>{product.makerStory}</p>}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 40px' }}>
        <div className="velor-pdp-desc-row">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Description</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '15px', whiteSpace: 'pre-wrap' }}>{product.description}</p>
            {product.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{ padding: '4px 12px', background: 'rgba(255,107,0,0.1)', color: 'var(--accent)', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          {(product.materials || product.originCountry || product.weightGrams || product.lengthCm || product.widthCm || product.heightCm || (product.specialities && product.specialities.length > 0)) && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Details</h2>
              <div>
                {product.materials && <SpecRow label="Materials" value={product.materials} />}
                {product.originCountry && <SpecRow label="Origin" value={product.originCountry} />}
                {(product.lengthCm || product.widthCm || product.heightCm) && (
                  <SpecRow label="Dimensions" value={`${product.lengthCm ?? '—'} × ${product.widthCm ?? '—'} × ${product.heightCm ?? '—'} cm`} />
                )}
                {product.weightGrams && <SpecRow label="Weight" value={`${product.weightGrams} g`} />}
                {product.specialities && product.specialities.length > 0 && <SpecRow label="Speciality" value={product.specialities.join(', ')} />}
              </div>
            </div>
          )}
        </div>

        <div style={{ height: '24px' }} />

        {(product.reviews.length > 0 || session) && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
            {product.reviews.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                  Reviews
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>{product.avgRating ?? 0}</div>
                    <div style={{ color: 'var(--accent)', fontSize: '14px' }}>{'★'.repeat(Math.round(product.avgRating ?? 0))}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {ratingCounts.map(({ star, count }) => {
                      const pct = product.reviews.length ? Math.round((count / product.reviews.length) * 100) : 0
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <span style={{ width: '32px', color: 'var(--muted)' }}>{star}★</span>
                          <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)' }} />
                          </div>
                          <span style={{ width: '24px', color: 'var(--muted)', textAlign: 'right' }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {hasMoreReviews && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '20px' }}>
                    Showing the {product.reviews.length} most recent of {product.reviewCount} reviews
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px', marginTop: hasMoreReviews ? 0 : '20px' }}>
                  {product.reviews.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                          {r.user.image ? (
                            <img src={r.user.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            r.user.name?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{r.user.name}</span>
                        <span style={{ color: 'var(--accent)', fontSize: '13px' }}>{'★'.repeat(r.rating)}</span>
                        {/* Every review requires a real completed OrderItem for
                            this product (app/api/reviews POST) -- so this
                            badge is always true, never decorative. */}
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', background: 'rgba(46,204,113,0.12)', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.02em' }}>VERIFIED PURCHASE</span>
                        <span style={{ color: 'var(--muted)', fontSize: '12px', marginLeft: 'auto' }}>{new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Write a review -- 2026-07-16 readiness audit: /api/reviews already
                existed (purchase-gated via order status, one review per buyer)
                but nothing in the UI ever called it. Shown to any signed-in
                user; the API itself is the source of truth on eligibility --
                someone who hasn't bought this product gets an honest 403
                surfaced below rather than a form that pretends to work. */}
            <div style={{ borderTop: product.reviews.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: product.reviews.length > 0 ? '24px' : '0' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>Write a Review</h3>
              {!session ? (
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                  <Link href={`/auth/sign-in?callbackUrl=/shop/${productId}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                  {' '}to write a review. Only buyers who have purchased this item can leave one.
                </p>
              ) : reviewSubmitted ? (
                <div style={{ padding: '14px 16px', background: 'rgba(0,230,118,0.08)', border: '1px solid var(--green)', borderRadius: '10px', color: 'var(--green)', fontWeight: 600, fontSize: '14px' }}>
                  Thanks -- your review has been posted.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        aria-label={`Rate ${star} out of 5 stars`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '26px', lineHeight: 1, color: star <= (reviewHoverRating || reviewRating) ? 'var(--accent)' : 'var(--border)' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this item (optional)"
                    rows={4}
                    style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }}
                  />
                  {reviewError && (
                    <p style={{ color: 'var(--red)', fontSize: '13px', margin: '0 0 12px' }}>{reviewError}</p>
                  )}
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={reviewSubmitting || reviewRating === 0}
                    style={{ padding: '12px 24px', background: reviewSubmitting || reviewRating === 0 ? 'var(--border)' : 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: reviewSubmitting || reviewRating === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Rail heading={`More from ${product.seller?.storeName || 'this seller'}`} items={sellerRail} symbol={symbol} convert={convert} viewAllHref={`/seller/${product.sellerId}`} />
      <Rail heading="You may also like" items={relatedRail} symbol={symbol} convert={convert} viewAllHref={`/shop?category=${encodeURIComponent(product.category)}`} />
      <Rail heading="Recently viewed" items={recentlyViewed} symbol={symbol} convert={convert} />

      {/* Sticky mobile buy bar -- hidden on desktop via .velor-pdp-mobilebar's
          media query in pdpCss; the full-width Add to Cart / Buy Now buttons
          above stay in the normal flow on desktop only (.velor-pdp-desktop-cta),
          since on mobile a buyer scrolling through reviews/specs otherwise
          loses the buy box entirely -- primary action always reachable in the
          bottom thumb zone, matching standard mobile commerce UX. */}
      <div className="velor-pdp-mobilebar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{onSale ? 'Sale price' : 'Price'}</div>
          <div style={{ fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px' }}>
            {symbol}{convert(onSale ? (product.discountedPrice as number) : currentPrice, product.seller?.currency || 'GBP').toFixed(2)}
          </div>
        </div>
        <button
          onClick={buyNow}
          disabled={currentStock === 0}
          className="velor-pdp-tap"
          style={{ flex: '0 0 auto', padding: '0 18px', height: '46px', borderRadius: '10px', fontWeight: 700, fontSize: '13.5px', border: '2px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: currentStock === 0 ? 'not-allowed' : 'pointer' }}
        >
          Buy Now
        </button>
        <button
          onClick={addToCart}
          disabled={currentStock === 0}
          className="velor-pdp-tap"
          style={{ flex: '1.3 1 0', padding: '0 16px', height: '46px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', border: 'none', background: currentStock === 0 ? 'var(--border)' : (addedToCart ? 'var(--green)' : 'var(--accent)'), color: '#000', cursor: currentStock === 0 ? 'not-allowed' : 'pointer' }}
        >
          {currentStock === 0 ? 'Out of Stock' : addedToCart ? 'Added!' : 'Add to Cart'}
        </button>
      </div>

      {lightboxOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setLightboxOpen(false) }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '24px', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
          {images.length > 1 && (
            <button
              onClick={() => setMainImage(i => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
              style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '28px', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', lineHeight: 1 }}
            >
              ‹
            </button>
          )}
          <img src={images[mainImage]} alt={product.title} style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain' }} />
          {images.length > 1 && (
            <button
              onClick={() => setMainImage(i => (i + 1) % images.length)}
              aria-label="Next image"
              style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '28px', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', lineHeight: 1 }}
            >
              ›
            </button>
          )}
        </div>
      )}

      {showContactModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowContactModal(false) } }}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', position: 'relative' }}>
            <button
              onClick={() => { setShowContactModal(false); setContactSent(false); setContactError(''); setContactMessage('') }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
            >
              &times;
            </button>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Message Seller</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 24px' }}>
              Message <span style={{ color: 'var(--text)', fontWeight: 600 }}>{product.seller?.storeName}</span> about these goods
            </p>
            {contactSent ? (
              <div style={{ padding: '20px', background: 'rgba(0,230,118,0.08)', border: '1px solid var(--green)', borderRadius: '10px', color: 'var(--green)', fontWeight: 600, textAlign: 'center', fontSize: '15px' }}>
                Message sent! The seller will reply in your inbox.
              </div>
            ) : (
              <>
                <textarea
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleContactSeller() } }}
                  placeholder="Ask about availability, shipping, customisation..."
                  rows={5}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box' }}
                />
                {contactError && (
                  <p style={{ color: 'var(--red)', fontSize: '13px', margin: '8px 0 0' }}>{contactError}</p>
                )}
                <button
                  onClick={handleContactSeller}
                  disabled={contactSending || !contactMessage.trim()}
                  style={{ marginTop: '16px', width: '100%', padding: '14px', background: contactSending || !contactMessage.trim() ? 'var(--border)' : 'var(--accent)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: contactSending || !contactMessage.trim() ? 'not-allowed' : 'pointer' }}
                >
                  {contactSending ? 'Sending...' : 'Send Message'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
