'use client'

import { useEffect, useState } from 'react'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

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
  user: { name: string }
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
  seller?: { storeName: string; currency?: string } | null
  avgRating: number | null
  reviewCount: number
  variants: Variant[]
  reviews: Review[]
  discountedPrice: number | null
  percentOff: number | null
  isHandmade: boolean
  makerStory: string | null
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

  async function toggleWishlist() {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/shop/${productId}`)
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
      router.push(`/auth/signin?callbackUrl=/shop/${productId}`)
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

  // Cart items store the ORIGINAL price, never the discounted one â the
  // automatic discount is recomputed server-side at checkout from the
  // seller's live discount codes, so the buyer is always charged against
  // the current rules rather than a client-supplied number. The discount
  // is shown here and at checkout, and both are guaranteed to match because
  // they both call the same computeListingDiscount/findAutomaticDiscounts
  // logic in lib/discount.ts.
  function addToCart() {
    if (!product) return
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
    addToCart()
    router.push('/checkout')
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price ?? 0
  const currentStock = selectedVariant ? selectedVariant.stock : product?.stock ?? 0
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

  const images = product.images.length > 0 ? product.images : ['/placeholder.png']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '18px' }}>VELOR</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{product.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '100%', maxWidth: '420px', maxHeight: '420px', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', background: 'transparent', position: 'relative' }}>
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

          {(product.avgRating ?? 0) != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '16px' }}>{'â'.repeat(Math.round(product.avgRating ?? 0))}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{product.avgRating ?? 0}</span>
              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>({product.reviewCount} reviews)</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '24px' }}>
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
              Discount applied automatically â no code needed. It will carry through to your cart and checkout.
            </div>
          )}

          {(product.variants && product.variants.length > 0) && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '10px', fontWeight: 600 }}>Variant</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>Quantity</div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>-</button>
              <span style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(currentStock, q + 1))} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>+</button>
            </div>
            {currentStock > 0 && currentStock < 5 && (
              <span style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 600 }}>Only {currentStock} left</span>
            )}
          </div>

          <button
            onClick={addToCart}
            disabled={currentStock === 0}
            style={{ width: '100%', padding: '16px', background: currentStock === 0 ? 'var(--border)' : (addedToCart ? 'var(--green)' : 'var(--accent)'), color: addedToCart ? '#000' : '#000', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: currentStock === 0 ? 'not-allowed' : 'pointer', marginBottom: '10px', transition: 'background 0.2s' }}
          >
            {currentStock === 0 ? 'Out of Stock' : addedToCart ? 'Added to Cart!' : 'Add to Cart'}
          </button>

          <button
            onClick={buyNow}
            disabled={currentStock === 0}
            style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--text)', border: '2px solid var(--border)', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: currentStock === 0 ? 'not-allowed' : 'pointer', marginBottom: '16px' }}
          >
            Buy Now
          </button>

          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            style={{ width: '100%', padding: '12px', background: 'transparent', color: isWishlisted ? 'var(--red)' : 'var(--muted)', border: '1px solid var(--border)', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: wishlistLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '18px' }}>{isWishlisted ? '♥' : '♡'}</span>
            {isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
          </button>

          <button
            onClick={() => {
              if (!session) {
                router.push(`/auth/signin?callbackUrl=/shop/${productId}`)
                return
              }
              setShowContactModal(true)
              setContactSent(false)
              setContactError('')
            }}
            style={{ marginTop: '10px', width: '100%', padding: '12px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '16px' }}>&#9993;</span>
            Contact Seller
          </button>

          {product.seller?.storeName && (
            <div style={{ marginTop: '20px', padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--muted)' }}>
              Sold by <span style={{ color: 'var(--text)', fontWeight: 600 }}>{product.seller?.storeName}</span>
            </div>
          )}

          {product.isHandmade && (
            <div style={{ marginTop: '12px', padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--accent)', fontSize: '13px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: '6px' }}>Handmade / Artisan-made</div>
              {product.makerStory && <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>{product.makerStory}</p>}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 40px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
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

        {product.reviews.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>
              Reviews
              {(product.avgRating ?? 0) != null && (
                <span style={{ marginLeft: '12px', color: 'var(--accent)', fontSize: '18px' }}>{product.avgRating ?? 0} â</span>
              )}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {product.reviews.map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{r.user.name}</span>
                    <span style={{ color: 'var(--accent)', fontSize: '13px' }}>{'â'.repeat(r.rating)}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Contact Seller</h2>
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
