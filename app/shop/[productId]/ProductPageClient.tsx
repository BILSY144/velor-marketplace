'use client'

import { useEffect, useState } from 'react'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FounderMedal } from '@/components/FounderMedal'
import ReportContentButton from '@/components/ReportContentButton'
import FollowSellerButton from '@/components/FollowSellerButton'
import SaveToCollectionButton from '@/components/SaveToCollectionButton'
import ProductQnA from '@/components/ProductQnA'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'

interface Variant {
  id: string
  name: string
  label?: string | null
  color?: string | null
  size?: string | null
  price: number
  stock: number
  image?: string
  // Full photo set for this option (up to 6, 2026-07-28) -- when the buyer
  // picks the option, these lead the gallery ahead of the listing's photos.
  images?: string[]
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
  // 2026-07-28 Amazon-comparison pass: real per-product social proof from
  // the API (OrderItem / WishlistItem counts) -- rendered only when > 0.
  soldCount?: number
  wishlistCount?: number
  // 2026-07-28 listing-form overhaul: link-only video, made-to-order, size
  // guide -- all seller-entered, rendered only when present.
  videoUrl?: string | null
  madeToOrder?: boolean
  leadTimeDays?: number | null
  sizeGuide?: string | null
}

// YouTube/Vimeo URL -> privacy-friendly embed URL. Returns null for anything
// unrecognised (the API already validates on save; this is defence in depth).
function toEmbedUrl(raw: string): string | null {
  const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vimeo = raw.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

// ISO2 -> flag emoji (pure codepoint math, no assets) and English country
// name via Intl -- used by the origin block. Only ever called with a
// 2-letter code; anything else is skipped upstream rather than guessed.
function flagEmoji(code: string): string {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)))
}
function countryNameFromCode(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || code
  } catch {
    return code
  }
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

// Live delivery estimate with a deliver-to picker (2026-07-29, from
// William's Amazon-comparison direction -- "the big one"). Backed by
// /api/shipping/estimate, which quotes through the SAME rates engine
// checkout uses (cached 24h per seller/country/weight band), so the number
// a buyer sees here is the number checkout charges for that lane. The
// picked country persists in localStorage (velor-deliver-to); first visit
// defaults to the visitor's own country via their IP, resolved server-side.
function DeliveryEstimate({ productId, symbol, convert }: { productId: string; symbol: string; convert: (amount: number, from: string) => number }) {
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(true)
  const [est, setEst] = useState<{ available: boolean; amountGBP?: number; estimatedDays?: number | null; isEstimate?: boolean } | null>(null)
  useEffect(() => {
    let dead = false
    const saved = localStorage.getItem('velor-deliver-to') || ''
    setLoading(true)
    fetch(`/api/shipping/estimate?productId=${productId}${saved ? `&country=${saved}` : ''}`)
      .then(r => r.json())
      .then(d => { if (dead) return; setCountry(d.country || saved || 'GB'); setEst(d); setLoading(false) })
      .catch(() => { if (!dead) { setCountry(saved || 'GB'); setEst(null); setLoading(false) } })
    return () => { dead = true }
  }, [productId])
  const pick = (c: string) => {
    setCountry(c)
    try { localStorage.setItem('velor-deliver-to', c) } catch { /* private mode */ }
    setLoading(true)
    fetch(`/api/shipping/estimate?productId=${productId}&country=${c}`)
      .then(r => r.json())
      .then(d => { setEst(d); setLoading(false) })
      .catch(() => { setEst(null); setLoading(false) })
  }
  return (
    <div style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span>Deliver to</span>
      <select
        value={country}
        onChange={e => pick(e.target.value)}
        aria-label="Deliver to country"
        style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '2px 4px', fontSize: '12.5px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', maxWidth: 150 }}
      >
        {!country && <option value="">Country...</option>}
        {WORLD_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>
      <span>
        {loading ? (
          <span style={{ opacity: 0.7 }}>checking delivery...</span>
        ) : est?.available && typeof est.amountGBP === 'number' ? (
          <>
            — shipping {est.isEstimate ? 'est. ' : ''}
            <strong style={{ color: 'var(--text)' }}>{symbol}{convert(est.amountGBP, 'GBP').toFixed(2)}</strong>
            {typeof est.estimatedDays === 'number' ? ` · ~${est.estimatedDays} day${est.estimatedDays === 1 ? '' : 's'} in transit` : ''}
          </>
        ) : (
          <span>— exact cost shown at checkout</span>
        )}
      </span>
    </div>
  )
}

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

// Payment method badges (2026-07-28, William: "can we get a bit of colour
// to the secure payout section... maybe the payment companies logos").
// Small inline-SVG card chips in each brand's colours -- no external image
// requests, crisp on any DPI, and consistent across light/dark themes.
// Every method shown is genuinely supported by the Stripe checkout.
function PaymentBadges() {
  const chip: React.CSSProperties = { borderRadius: '4px', border: '1px solid rgba(0,0,0,0.12)', display: 'block' }
  return (
    <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', verticalAlign: 'middle' }}>
      {/* Visa */}
      <svg width="38" height="24" viewBox="0 0 38 24" style={chip} aria-label="Visa">
        <rect width="38" height="24" rx="4" fill="#fff" />
        <text x="19" y="16.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="800" fontStyle="italic" fill="#1A1F71">VISA</text>
      </svg>
      {/* Mastercard */}
      <svg width="38" height="24" viewBox="0 0 38 24" style={chip} aria-label="Mastercard">
        <rect width="38" height="24" rx="4" fill="#fff" />
        <circle cx="15.5" cy="12" r="7" fill="#EB001B" />
        <circle cx="22.5" cy="12" r="7" fill="#F79E1B" fillOpacity="0.92" />
        <path d="M19 6.4a7 7 0 0 1 0 11.2 7 7 0 0 1 0-11.2z" fill="#FF5F00" />
      </svg>
      {/* American Express */}
      <svg width="38" height="24" viewBox="0 0 38 24" style={chip} aria-label="American Express">
        <rect width="38" height="24" rx="4" fill="#2E77BC" />
        <text x="19" y="15.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8.5" fontWeight="800" fill="#fff">AMEX</text>
      </svg>
      {/* Apple Pay */}
      <svg width="44" height="24" viewBox="0 0 44 24" style={chip} aria-label="Apple Pay">
        <rect width="44" height="24" rx="4" fill="#000" />
        <path transform="translate(9.5,6.5) scale(0.5)" d="M13 3.2c.7-.9 1.2-2.1 1-3.2-1 .1-2.2.7-2.9 1.5-.6.8-1.2 2-1 3.1 1.1.1 2.2-.6 2.9-1.4zm1 1.7c-1.6-.1-3 .9-3.7.9-.8 0-2-.9-3.2-.9C5.4 5 3.9 5.9 3.1 7.3c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.8 0-2.4 1.9-3.5 2-3.6-1.1-1.6-2.8-1.8-3.2-1.9z" fill="#fff" />
        <text x="27.5" y="16" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="#fff">Pay</text>
      </svg>
      {/* Google Pay */}
      <svg width="44" height="24" viewBox="0 0 44 24" style={chip} aria-label="Google Pay">
        <rect width="44" height="24" rx="4" fill="#fff" />
        <text x="14" y="16" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#4285F4">G</text>
        <text x="28" y="16" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="#5F6368">Pay</text>
      </svg>
    </span>
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

// 2026-07-28 density pass (William, comparing side-by-side with a live
// Amazon PDP: "our buttons and boxes are too big and unnessary block
// looking. we can do better ... but dont make it look like were copying
// amazon. it needs to be our own"). The moves are Amazon-informed --
// compact buy column, slim stacked CTAs, hairlines instead of heavy
// bordered slabs, sticky buy box on desktop -- but the expression stays
// Velor: pill-radius CTAs matching the site's chip language, the orange
// accent, Space Grotesk numerals, and the existing card surfaces just
// lightened rather than replaced with Amazon's flat white.
const pdpCss = `
.velor-pdp-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(320px,0.8fr);gap:44px;align-items:start;}
.velor-pdp-buycol{position:sticky;top:20px;}
.velor-pdp-mobilebar{display:none;}
.velor-pdp-gallery-main{cursor:zoom-in;width:100%;}
.velor-pdp-gallery-main img{transition:transform .35s ease;}
.velor-pdp-gallery-main:hover img{transform:scale(1.05);}
.velor-pdp-rail-scroll{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;-ms-overflow-style:none;padding-bottom:6px;}
.velor-pdp-rail-scroll::-webkit-scrollbar{display:none;}
.velor-pdp-rail-card{flex:0 0 auto;width:170px;scroll-snap-align:start;}
.velor-pdp-tap{min-height:40px;}
.velor-pdp-quietlink{background:transparent;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--muted);padding:6px 2px;min-height:32px;}
.velor-pdp-quietlink:hover{color:var(--accent);}
.velor-pdp-info-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;align-items:start;}
.velor-pdp-desc-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px;align-items:start;}
@media(max-width:900px){
  .velor-pdp-grid{grid-template-columns:1fr;gap:24px;}
  .velor-pdp-buycol{position:static;}
  .velor-pdp-page{padding-bottom:84px;}
  .velor-pdp-mobilebar{display:flex;}
  .velor-pdp-desktop-cta{display:none;}
  .velor-pdp-cta-primary{display:none;}
  .velor-pdp-mobile-contact{display:flex !important;}
  .velor-pdp-tap{min-height:44px;}
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
  // Dimension picks (2026-07-28): when a listing's options carry colour
  // and/or size, buyers pick each dimension separately (Colour row + Size
  // row) and the two picks resolve to one variant. Label-only options keep
  // the flat button list.
  const [selColor, setSelColor] = useState<string | null>(null)
  const [selSize, setSelSize] = useState<string | null>(null)
  // When the picked option carries its own photos, they are placed at the
  // front of the gallery (see the `images` computation below) and the view
  // jumps to the first of them -- the buyer sees the version they actually
  // picked, then can still browse every photo via the thumbnails.
  useEffect(() => {
    if (selectedVariant?.images?.length || selectedVariant?.image) setMainImage(0)
  }, [selectedVariant?.id])
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
  const [shareCopied, setShareCopied] = useState(false)
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
      .then(data => {
        if (!data) return
        setProduct(data)
        if (data.variants?.length) {
          const first = (data.variants as Variant[]).find(v => v.stock > 0) ?? data.variants[0]
          setSelectedVariant(first)
          setSelColor(first.color ?? null)
          setSelSize(first.size ?? null)
        }
      })
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

  // Gallery photo list: the picked option's own photos (up to 6, 2026-07-28
  // seller multi-photo versions) lead, followed by the listing's photos that
  // aren't already in the option's set. No option picked (or an option with
  // no photos) -> plain listing gallery. Computed here, above the lightbox
  // effect that needs its length.
  const baseImages = product && product.images.length > 0 ? product.images : ['/placeholder.png']
  const variantPhotos = selectedVariant?.images?.length
    ? selectedVariant.images
    : selectedVariant?.image ? [selectedVariant.image] : []
  const images = variantPhotos.length > 0
    ? [...variantPhotos, ...baseImages.filter((img) => !variantPhotos.includes(img))]
    : baseImages
  // The combined list shrinks when an option is deselected -- clamp instead
  // of ever rendering images[out-of-range].
  const shownImage = mainImage < images.length ? mainImage : 0

  // Lightbox keyboard controls (Escape closes, arrows navigate). Declared
  // above any early return so hook order stays stable regardless of loading/
  // notFound state, per the Rules of Hooks.
  useEffect(() => {
    if (!lightboxOpen || !product) return
    const imgCount = images.length || 1
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false)
      else if (e.key === 'ArrowLeft') setMainImage(i => (i - 1 + imgCount) % imgCount)
      else if (e.key === 'ArrowRight') setMainImage(i => (i + 1) % imgCount)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, product, images.length])

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
  const currentStock = selectedVariant
    ? selectedVariant.stock
    : (product?.variants?.length ?? 0) > 0
      ? 0 // options exist but no valid combination picked -- can't buy yet
      : product?.stock ?? 0
  const isPreviewOnly = product?.id === PREVIEW_ONLY_PRODUCT_ID
  // Automatic discounts only ever apply to the base product listing (they
  // are scoped by productId, not by variant), so only show the "was/now"
  // treatment when no variant is selected or the product has no variants.
  const onSale = !selectedVariant && product?.discountedPrice != null && product.discountedPrice < product.price

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
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>{product.category}</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px' }}>{product.title}</span>
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
            <img src={images[shownImage]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
          {product.videoUrl && toEmbedUrl(product.videoUrl) && (
            <div style={{ width: 'min(100%, 560px, 62vh)', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
              <iframe
                src={toEmbedUrl(product.videoUrl) as string}
                title={`${product.title} — video`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px' }}>
            {images.map((img, i) => (
              <div
                key={i}
                onClick={() => setMainImage(i)}
                style={{
                  width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                  border: shownImage === i ? '2px solid var(--accent)' : '2px solid var(--border)',
                  flexShrink: 0,
                }}
              >
                <img src={img} alt={`${product.title} — photo ${i + 1} of ${images.length}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="velor-pdp-buycol">
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{product.category}</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3 }}>{product.title}</h1>

          {isPreviewOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', marginBottom: '16px', background: 'rgba(255,107,0,0.1)', border: '1px solid var(--accent)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
              <span style={{ fontSize: '15px' }}>&#9432;</span>
              Preview listing — shown to demonstrate Velor, not available for purchase.
            </div>
          )}

          {(product.reviewCount > 0 || (product.soldCount ?? 0) > 0 || (product.wishlistCount ?? 0) > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px', fontSize: '13px', flexWrap: 'wrap' }}>
              {product.reviewCount > 0 && (
                <>
                  <span style={{ color: 'var(--accent)', fontSize: '14px' }}>{'★'.repeat(Math.round(product.avgRating ?? 0))}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{product.avgRating ?? 0}</span>
                  <span style={{ color: 'var(--muted)' }}>({product.reviewCount} reviews)</span>
                </>
              )}
              {/* Real social proof only -- both counts come from live order/
                  wishlist rows and hide entirely at zero. */}
              {(product.soldCount ?? 0) > 0 && (
                <span style={{ color: 'var(--muted)' }}>{product.reviewCount > 0 ? '· ' : ''}{product.soldCount} sold</span>
              )}
              {(product.wishlistCount ?? 0) > 0 && (
                <span style={{ color: 'var(--muted)' }}>· ♡ {product.wishlistCount} wishlisted</span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {onSale ? (
              <>
                <span style={{ fontSize: '30px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: 'var(--accent)' }}>
                  {symbol}{convert(product.discountedPrice as number, product.seller?.currency || 'GBP').toFixed(2)}
                </span>
                <span style={{ fontSize: '16px', color: 'var(--muted)', textDecoration: 'line-through' }}>
                  {symbol}{convert(product.price, product.seller?.currency || 'GBP').toFixed(2)}
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#000', background: 'var(--accent)', padding: '3px 9px', borderRadius: '999px' }}>
                  SAVE {product.percentOff}%
                </span>
              </>
            ) : (
              <span style={{ fontSize: '30px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: 'var(--text)' }}>
                {symbol}{convert(currentPrice, product.seller?.currency || 'GBP').toFixed(2)}
              </span>
            )}
          </div>
          {onSale && (
            <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
              Discount applied automatically — carries through to checkout.
            </div>
          )}

          {/* Compact availability + dispatch lines (density pass): the facts a
              buyer decides on, as quiet text lines instead of boxed cards --
              all sourced from the same real fields as before. */}
          <div style={{ margin: '6px 0 14px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '13px', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: currentStock > 0 ? (product.madeToOrder ? 'var(--accent)' : 'var(--green)') : 'var(--red)' }}>
              {currentStock === 0
                ? (product.madeToOrder ? 'Not taking orders right now' : 'Out of stock')
                : product.madeToOrder
                  ? `Made to order — crafted when you buy${product.leadTimeDays ? `, ships in ~${product.leadTimeDays} days` : ''}`
                  : currentStock < 5 ? `In stock — only ${currentStock} left` : 'In stock'}
            </div>
            <div style={{ color: 'var(--muted)' }}>
              {product.seller?.country ? `Dispatched from ${product.seller.country} within 1–3 business days` : 'Usually dispatched within 1–3 business days'}
            </div>
            <DeliveryEstimate productId={product.id} symbol={symbol} convert={convert} />
          </div>

          {(product.variants && product.variants.length > 0) && (() => {
            const vs = product.variants
            const colors = Array.from(new Set(vs.map(v => v.color).filter(Boolean))) as string[]
            const sizes = Array.from(new Set(vs.map(v => v.size).filter(Boolean))) as string[]
            const dimensional = colors.length > 0 || sizes.length > 0
            const pillStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
              padding: '7px 15px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer', minHeight: '34px',
              border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              background: active ? 'rgba(255,107,0,0.12)' : 'transparent',
              color: disabled ? 'var(--border)' : active ? 'var(--accent)' : 'var(--text)',
              textDecoration: disabled ? 'line-through' : 'none',
            })
            if (!dimensional) {
              // Label-only options: flat list, one button per named option.
              return (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '7px', fontWeight: 600 }}>Option</div>
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    {vs.map(v => (
                      <button key={v.id} onClick={() => setSelectedVariant(v)} style={pillStyle(selectedVariant?.id === v.id, v.stock === 0)} disabled={v.stock === 0}>
                        {v.name}
                        {v.price !== product.price && (
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, opacity: 0.85 }}>
                            {symbol}{convert(v.price, product.seller?.currency || 'GBP').toFixed(2)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }
            // Colour and/or Size pickers -- the two picks resolve to a
            // variant; combinations with no row (or zero stock) are disabled.
            const resolve = (c: string | null, sz: string | null) =>
              vs.find(v => (colors.length === 0 || v.color === c) && (sizes.length === 0 || v.size === sz)) ?? null
            const pick = (c: string | null, sz: string | null) => {
              setSelColor(c); setSelSize(sz)
              setSelectedVariant(resolve(c, sz))
            }
            return (
              <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {colors.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '7px', fontWeight: 600 }}>
                      Colour{selColor ? <span style={{ color: 'var(--text)' }}> — {selColor}</span> : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                      {colors.map(c => {
                        const anyForColor = vs.some(v => v.color === c && v.stock > 0)
                        return (
                          <button key={c} onClick={() => pick(c, selSize)} disabled={!anyForColor} style={pillStyle(selColor === c, !anyForColor)}>
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {sizes.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '7px', fontWeight: 600 }}>
                      Size{selSize ? <span style={{ color: 'var(--text)' }}> — {selSize}</span> : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                      {sizes.map(sz => {
                        const match = colors.length > 0 && selColor ? vs.find(v => v.color === selColor && v.size === sz) : vs.find(v => v.size === sz)
                        const available = !!match && match.stock > 0
                        return (
                          <button key={sz} onClick={() => pick(selColor, sz)} disabled={!available} style={pillStyle(selSize === sz, !available)}>
                            {sz}
                            {match && match.price !== product.price && (
                              <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, opacity: 0.85 }}>
                                {symbol}{convert(match.price, product.seller?.currency || 'GBP').toFixed(2)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {!selectedVariant && (
                  <div style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 600 }}>
                    {colors.length > 0 && sizes.length > 0 ? 'Pick a colour and size to add to cart' : colors.length > 0 ? 'Pick a colour to add to cart' : 'Pick a size to add to cart'}
                  </div>
                )}
              </div>
            )
          })()}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>Qty</div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '34px', height: '34px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '16px', cursor: 'pointer' }}>-</button>
              <span style={{ width: '32px', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(currentStock, q + 1))} style={{ width: '34px', height: '34px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '16px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          {/* 2026-07-28 density pass: two slim stacked pill CTAs (the pill
              radius is Velor's own chip language from the shop page, not
              Amazon's), with Wishlist + Message Seller demoted from giant
              bordered buttons to a quiet inline link row underneath. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', maxWidth: '360px' }}>
            <button
              onClick={addToCart}
              disabled={currentStock === 0}
              className="velor-pdp-tap velor-pdp-cta-primary"
              style={{ width: '100%', padding: '0 18px', background: currentStock === 0 ? 'var(--border)' : (addedToCart ? 'var(--green)' : 'var(--accent)'), color: '#000', border: 'none', borderRadius: '999px', fontWeight: 700, fontSize: '14px', cursor: currentStock === 0 ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {currentStock === 0 ? 'Out of Stock' : addedToCart ? 'Added!' : 'Add to Cart'}
            </button>
            <button
              onClick={buyNow}
              disabled={currentStock === 0}
              className="velor-pdp-tap velor-pdp-desktop-cta"
              style={{ width: '100%', padding: '0 18px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', borderRadius: '999px', fontWeight: 700, fontSize: '14px', cursor: currentStock === 0 ? 'not-allowed' : 'pointer' }}
            >
              Buy Now
            </button>
          </div>

          {/* Quiet secondary actions -- visible on both desktop and mobile
              (this row replaces the old standalone mobile-only Message Seller
              button as well). */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="velor-pdp-quietlink"
              style={isWishlisted ? { color: 'var(--red)' } : undefined}
            >
              <span style={{ fontSize: '15px' }}>{isWishlisted ? '♥' : '♡'}</span>
              {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
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
              className="velor-pdp-quietlink"
            >
              <span style={{ fontSize: '15px' }}>&#9993;</span>
              Message Seller
            </button>
            {/* Request customisation -- artisan-marketplace move Amazon has no
                answer to: reuses the existing seller-messaging modal with the
                message prefilled, nothing new server-side. */}
            <button
              onClick={() => {
                if (isPreviewOnly) return
                if (!session) {
                  router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
                  return
                }
                setContactMessage(`Hi, I'd like to ask about a custom version of "${product.title}". `)
                setShowContactModal(true)
                setContactSent(false)
                setContactError('')
              }}
              aria-label="Request customisation"
              className="velor-pdp-quietlink"
            >
              <span style={{ fontSize: '15px' }}>&#9998;</span>
              Request Customisation
            </button>
            <button
              onClick={async () => {
                const url = `https://velorcommerce.store/shop/${productId}`
                try {
                  if (navigator.share) {
                    await navigator.share({ title: product.title, url })
                    return
                  }
                } catch { /* user dismissed the share sheet -- fall through */ }
                try {
                  await navigator.clipboard.writeText(url)
                  setShareCopied(true)
                  setTimeout(() => setShareCopied(false), 2000)
                } catch {}
              }}
              aria-label="Share this listing"
              className="velor-pdp-quietlink"
              style={shareCopied ? { color: 'var(--green)' } : undefined}
            >
              <span style={{ fontSize: '15px' }}>&#8683;</span>
              {shareCopied ? 'Link copied!' : 'Share'}
            </button>
            {/* Velor Social (2026-07-29): private collections. Renders
                nothing while the feature flag is off; the preview-only
                showcase listing stays inert like its other buttons. */}
            {!isPreviewOnly && <SaveToCollectionButton productId={productId} compact />}
          </div>

          {/* Payment trust row -- brand-colour card chips (inline SVG, see
              PaymentBadges); everything shown is genuinely supported by the
              Stripe checkout. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>🔒 Secure checkout</span>
            <PaymentBadges />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>via <span style={{ fontWeight: 800, color: '#635BFF' }}>Stripe</span></span>
          </div>

          {/* Origin block -- ties the PDP into Velor's shop-by-origin identity
              (flag strip, header dropdown, /shop?origin=CODE). Rendered only
              when the product carries a real 2-letter origin code. */}
          {product.originCountry && product.originCountry.trim().length === 2 && (
            <Link
              href={`/shop?origin=${product.originCountry.trim().toUpperCase()}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: '999px', padding: '7px 14px', marginBottom: '6px' }}
            >
              <span style={{ fontSize: '16px' }}>{flagEmoji(product.originCountry.trim())}</span>
              Made in {countryNameFromCode(product.originCountry.trim())}
              <span style={{ color: 'var(--accent)' }}>Explore more →</span>
            </Link>
          )}

          {/* Report listing (2026-07-29): upgraded from a mailto link to the
              real in-product report route (/api/reports) per the signed
              online safety policy -- recorded, ticketed, 24-48h review. */}
          <div style={{ marginTop: '4px' }}>
            <ReportContentButton contentType="LISTING" contentId={productId} label="Report this listing" />
          </div>
        </div>
      </div>

      {/* Product JSON-LD (2026-07-28): machine-readable listing data for
          search-engine rich results (price, availability, rating). Every
          value mirrors what the page itself renders from the API -- nothing
          is invented; aggregateRating is emitted only when real reviews
          exist. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            image: product.images,
            description: product.description,
            sku: product.id,
            ...(product.seller?.storeName ? { brand: { '@type': 'Brand', name: product.seller.storeName } } : {}),
            ...(product.materials ? { material: product.materials } : {}),
            ...(product.originCountry ? { countryOfOrigin: product.originCountry } : {}),
            offers: {
              '@type': 'Offer',
              url: `https://velorcommerce.store/shop/${product.id}`,
              priceCurrency: 'GBP',
              price: (onSale ? (product.discountedPrice as number) : currentPrice).toFixed(2),
              availability: currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
            },
            ...(product.reviewCount > 0
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: product.avgRating ?? 0,
                    reviewCount: product.reviewCount,
                  },
                }
              : {}),
          }),
        }}
      />

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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 24px' }}>
        {/* Density pass: the old three-point trust CARD became this quiet
            full-width strip -- hairline top/bottom, no box. Dispatch facts
            moved up into the buy column as plain text lines. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 32px', padding: '12px 2px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '18px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>📦</span>
            <span><strong style={{ color: 'var(--text)', fontWeight: 700 }}>Tracked shipping</strong> — label generated the moment you order</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>↩️</span>
            <span><strong style={{ color: 'var(--text)', fontWeight: 700 }}>Returns</strong> — set by this seller · <Link href="/returns" style={{ color: 'var(--accent)', fontWeight: 600 }}>policy</Link></span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>🔒</span>
            <span><strong style={{ color: 'var(--text)', fontWeight: 700 }}>Buyer protection</strong> — Stripe-secured, money held until delivery</span>
          </div>
        </div>
        <div className="velor-pdp-info-row">

          {/* Seller trust card -- replaces the old one-line "Sold by X". Every
              number is computed live in app/api/shop/products/[productId]
              from real Orders/Reviews/Products, never fabricated. */}
          {product.seller && (
            <div style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
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

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/seller/${product.sellerId}`} className="velor-pdp-tap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', boxSizing: 'border-box' }}>
                  Visit Store
                </Link>
                {/* Velor Social (2026-07-29, OSA pack signed + flag flipped):
                    follow the maker from their trust card. Renders nothing
                    while the feature flag is off. */}
                <FollowSellerButton sellerId={product.sellerId} compact />
              </div>
            </div>
          )}

          {(product.isHandmade || product.makerStory) && (
            <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--accent)', fontSize: '13px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: '8px' }}>
                {product.isHandmade ? 'Handmade / Artisan-made' : 'The story behind this piece'}
              </div>
              {product.makerStory && <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>{product.makerStory}</p>}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 40px' }}>
        <div className="velor-pdp-desc-row">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>Description</h2>
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
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Details</h2>
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

          {product.sizeGuide && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Size guide</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '14px', whiteSpace: 'pre-wrap', margin: 0 }}>{product.sizeGuide}</p>
            </div>
          )}
        </div>

        <div style={{ height: '24px' }} />

        {/* Public Q&A (2026-07-29, Amazon-comparison item): buyers ask the
            seller on the listing; answers are public. Hidden on the
            preview-only showcase listing like its other interactive parts. */}
        {!isPreviewOnly && (
          <ProductQnA productId={productId} sellerName={product.seller?.storeName} />
        )}

        {(product.reviews.length > 0 || session) && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
            {product.reviews.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '18px' }}>
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
                        <ReportContentButton contentType="REVIEW" contentId={r.id} />
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
          <img src={images[shownImage]} alt={product.title} style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain' }} />
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
