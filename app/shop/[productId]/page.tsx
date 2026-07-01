'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { name: string | null }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  images: string[]
  category: string
  stock: number
  tags: string[]
  sellerId: string
  sellerName: string
  avgRating: number | null
  reviewCount?: number
  reviews: Review[]
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  sellerId?: string
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ fontSize: '28px', color: n <= (hover || value) ? 'var(--accent)' : 'var(--border)', transition: 'color 0.1s', userSelect: 'none' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)

  useEffect(() => {
    params.then(p => setProductId(p.productId))
  }, [params])

  useEffect(() => {
    if (!productId) return
    fetch(`/api/shop/products/${productId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Product) => {
        setProduct(data)
        setReviews(data.reviews || [])
        setAvgRating(data.avgRating)
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [productId])

  function refreshReviews() {
    if (!productId) return
    fetch(`/api/shop/products/${productId}/reviews`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { reviews: Review[]; averageRating: number }) => {
        setReviews(data.reviews)
        setAvgRating(data.averageRating)
      })
      .catch(() => {})
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (reviewRating === 0) { setReviewError('Please select a star rating'); return }
    setReviewSubmitting(true)
    setReviewError('')
    try {
      const res = await fetch(`/api/shop/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      })
      const json = await res.json()
      if (!res.ok) { setReviewError(json.error || 'Something went wrong'); return }
      setReviewSuccess(true)
      setReviewRating(0)
      setReviewComment('')
      refreshReviews()
    } catch {
      setReviewError('Network error — please try again')
    } finally {
      setReviewSubmitting(false)
    }
  }
  function addToCart() {
    if (!product) return
    const existing: CartItem[] = JSON.parse(localStorage.getItem('velor-cart') || '[]')
    const idx = existing.findIndex(i => i.id === product.id)
    if (idx >= 0) {
      existing[idx].quantity += quantity
    } else {
      existing.push({ id: product.id, name: product.name, price: product.price, quantity, image: product.images[0] || '', sellerId: product.sellerId })
    }
    localStorage.setItem('velor-cart', JSON.stringify(existing))
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  function buyNow() {
    addToCart()
    router.push('/checkout')
  }

  const sym = (c: string) => c === 'GBP' ? '£' : c
  const roundedAvg = avgRating ? Math.round(avgRating * 10) / 10 : null

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ color: 'var(--text)', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Product not found</div>
      <Link href="/shop" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Back to shop</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: 'var(--muted)' }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }}>VELOR</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{product.name.slice(0, 40)}{product.name.length > 40 ? '...' : ''}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px' }}>
        <div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {product.images.slice(0, 5).map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} style={{ width: '64px', height: '64px', border: i === selectedImage ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: '6px', background: '#222', overflow: 'hidden', cursor: 'pointer', padding: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${product.name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
            <div style={{ flex: 1, aspectRatio: '1', background: '#222', borderRadius: '12px', overflow: 'hidden' }}>
              {product.images[selectedImage]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={product.images[selectedImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No image</div>
              }
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Description</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{product.description}</p>
          </div>

          {product.tags.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {product.tags.map(tag => (
                <Link key={tag} href={`/shop?search=${encodeURIComponent(tag)}`} style={{ padding: '4px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--muted)', fontSize: '13px', textDecoration: 'none' }}>{tag}</Link>
              ))}
            </div>
          )}
          <div style={{ marginTop: '56px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
              Reviews {reviews.length > 0 && <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '16px' }}>({reviews.length})</span>}
            </h2>
            {roundedAvg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <span style={{ fontSize: '40px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>{roundedAvg}</span>
                <div>
                  <div style={{ color: 'var(--accent)', fontSize: '20px', letterSpacing: '2px' }}>{'★'.repeat(Math.round(roundedAvg))}{'☆'.repeat(5 - Math.round(roundedAvg))}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '13px' }}>out of 5</div>
                </div>
              </div>
            )}
            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600 }}>{r.user.name || 'Anonymous'}</div>
                      <div style={{ color: 'var(--accent)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    </div>
                    {r.comment && <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>No reviews yet — be the first to leave one.</p>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Write a Review</h3>
              {reviewSuccess ? (
                <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid var(--green)', borderRadius: '10px', padding: '16px', color: 'var(--green)', fontWeight: 600 }}>
                  Thank you for your review!
                </div>
              ) : !session ? (
                <div style={{ color: 'var(--muted)' }}>
                  <Link href="/auth/signin" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link> to leave a review.
                </div>
              ) : (
                <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Your Rating</label>
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Your Review (optional)</label>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      maxLength={2000}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                    />
                    <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right', marginTop: '4px' }}>{reviewComment.length}/2000</div>
                  </div>
                  {reviewError && (
                    <div style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid var(--red)', borderRadius: '8px', padding: '12px', color: 'var(--red)', fontSize: '14px' }}>{reviewError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    style={{ alignSelf: 'flex-start', padding: '12px 28px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, fontSize: '14px', cursor: reviewSubmitting ? 'not-allowed' : 'pointer', opacity: reviewSubmitting ? 0.7 : 1 }}
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div style={{ position: 'sticky', top: '40px', alignSelf: 'start' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{product.category}</div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 700, lineHeight: 1.3, marginBottom: '16px' }}>{product.name}</h1>
            {roundedAvg && (
              <div style={{ color: 'var(--accent)', fontSize: '14px', marginBottom: '16px' }}>
                {'★'.repeat(Math.round(roundedAvg))} {roundedAvg}
                <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>({reviews.length} reviews)</span>
              </div>
            )}
            <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text)', marginBottom: '8px' }}>{sym(product.currency)}{product.price.toFixed(2)}</div>
            <div style={{ color: 'var(--green)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Free UK Delivery</div>
            {product.stock > 0 && product.stock < 5 && (
              <div style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Only {product.stock} left in stock</div>
            )}
            {product.stock === 0 && (
              <div style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Out of stock</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Qty:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '18px' }}>-</button>
                <span style={{ width: '36px', textAlign: 'center', fontSize: '15px', fontWeight: 600 }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))} style={{ width: '36px', height: '36px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '18px' }}>+</button>
              </div>
            </div>
            <button onClick={addToCart} disabled={product.stock === 0} style={{ width: '100%', padding: '14px', background: addedToCart ? 'var(--green)' : 'var(--accent)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: product.stock === 0 ? 'not-allowed' : 'pointer', marginBottom: '10px', transition: 'background 0.2s' }}>
              {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
            </button>
            <button onClick={buyNow} disabled={product.stock === 0} style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}>
              Buy Now
            </button>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Free delivery on all UK orders</div>
              <div>30-day hassle-free returns</div>
              <div style={{ color: 'var(--text)' }}>Sold by <span style={{ fontWeight: 600 }}>{product.sellerName}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
