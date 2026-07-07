'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'

interface Product {
  id: string
  title: string
  description: string
  price: number
  stock: number
  images: string[]
  category: string
  createdAt: string
  seller: {
    id: string
    storeName: string
    currency?: string
    user: { name: string; email: string }
  }
  discountedPrice: number | null
  percentOff: number | null
  cjSourced?: boolean
  cjSupplierName?: string | null
  isHandmade: boolean
  makerStory: string | null
}

interface StoredCartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  sellerId?: string
  sellerName?: string
}

import { addToCart as addToSharedCart } from '@/lib/cart'

export default function ProductDetail({ id }: { id: string }) {
  const router = useRouter()
  const { symbol, convert } = useCurrencyDisplay()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    fetch(`/api/marketplace/products/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (data) { setProduct(data); setLoading(false) }
      })
      .catch(() => setLoading(false))
  }, [id])

  // Cart stores the ORIGINAL price â the automatic discount is recomputed
  // server-side at checkout from the seller's live discount codes, so what
  // the buyer is charged always matches the current rules, not a stale
  // client-supplied number. The same discount shown here is guaranteed to
  // match checkout because both read from lib/discount.ts.
  function addToCart() {
    if (!product) return
    addToSharedCart({
      id: product.id,
      productId: product.id,
      name: product.title,
      price: product.price,
      image: product.images?.[0] || '',
      quantity: qty,
      sellerId: product.seller.id,
      sellerName: product.seller.storeName,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const onSale = product?.discountedPrice != null && product.discountedPrice < product.price

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;600&display=swap');
        .pd-root { background: #0D0D0D; min-height: 100vh; font-family: 'Inter', sans-serif; color: #fff; }
        .pd-nav { padding: 20px 48px; border-bottom: 1px solid #2A2A2A; display: flex; align-items: center; gap: 8px; }
        .pd-nav a { color: #999; text-decoration: none; font-size: 13px; }
        .pd-nav a:hover { color: #FF6B00; }
        .pd-nav span { color: #444; font-size: 13px; }
        .pd-inner { max-width: 1200px; margin: 0 auto; padding: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }
        @media (max-width: 900px) { .pd-inner { grid-template-columns: 1fr; padding: 24px 16px; gap: 32px; } .pd-nav { padding: 16px; } }
        .pd-gallery { display: flex; flex-direction: column; gap: 16px; }
        .pd-thumbs { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8px; }
        .pd-thumb { width: 64px; height: 64px; border-radius: 8px; object-fit: contain; border: 2px solid transparent; cursor: pointer; background: #1A1A1A; }
        .pd-thumb.active { border-color: #FF6B00; }
        .pd-main-img { width: 100%; max-width: 420px; max-height: 420px; aspect-ratio: 1; margin: 0 auto; background: transparent; border-radius: 12px; overflow: hidden; border: 1px solid #2A2A2A; display: flex; align-items: center; justify-content: center; position: relative; }
        .pd-main-img img { width: 100%; height: 100%; object-fit: contain; }
        .pd-main-placeholder { color: #333; font-size: 80px; }
        .pd-sale-badge { position: absolute; top: 14px; left: 14px; background: #FF6B00; color: #000; font-size: 13px; font-weight: 800; padding: 5px 12px; border-radius: 6px; letter-spacing: 0.3px; }
        .pd-soldout-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2; }
        .pd-soldout-banner { background: #000; color: #fff; font-size: 15px; font-weight: 800; padding: 8px 22px; border-radius: 5px; letter-spacing: 2px; border: 1px solid #fff; }
        .pd-info { display: flex; flex-direction: column; gap: 20px; }
        .pd-cat { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #FF6B00; }
        .pd-name { font-family: 'Space Grotesk', sans-serif; font-size: 32px; font-weight: 800; line-height: 1.2; color: #fff; margin: 0; }
        .pd-seller-box { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 10px; padding: 14px 16px; }
        .pd-seller-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin-bottom: 4px; }
        .pd-seller-name { font-size: 15px; font-weight: 600; color: #fff; }
        .pd-maker-box { background: #1A1A1A; border: 1px solid #FF6B00; border-radius: 10px; padding: 14px 16px; }
        .pd-maker-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #FF6B00; margin-bottom: 6px; }
        .pd-maker-story { font-size: 14px; line-height: 1.5; color: #ccc; margin: 0; }
        .pd-price-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
        .pd-price { font-size: 40px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; color: #fff; }
        .pd-price.sale { color: #FF6B00; }
        .pd-price-was { font-size: 22px; color: #666; text-decoration: line-through; }
        .pd-save-chip { font-size: 13px; font-weight: 700; color: #000; background: #FF6B00; padding: 4px 10px; border-radius: 5px; }
        .pd-auto-note { font-size: 13px; color: #FF6B00; font-weight: 600; margin-top: -12px; }
        .pd-desc { font-size: 15px; line-height: 1.7; color: #bbb; }
        .pd-qty-row { display: flex; align-items: center; gap: 12px; }
        .pd-qty-label { font-size: 13px; color: #999; font-weight: 600; }
        .pd-qty { display: flex; align-items: center; gap: 0; border: 1px solid #2A2A2A; border-radius: 8px; overflow: hidden; }
        .pd-qty button { background: #1A1A1A; border: none; color: #fff; width: 36px; height: 36px; font-size: 18px; cursor: pointer; transition: background 0.12s; }
        .pd-qty button:hover { background: #2A2A2A; }
        .pd-qty span { width: 40px; text-align: center; font-size: 15px; font-weight: 600; border-left: 1px solid #2A2A2A; border-right: 1px solid #2A2A2A; height: 36px; line-height: 36px; }
        .pd-add-btn { background: #FF6B00; color: #000; border: none; border-radius: 10px; padding: 16px 32px; font-size: 16px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; width: 100%; }
        .pd-add-btn:hover { opacity: 0.85; }
        .pd-add-btn.success { background: #00E676; }
        .pd-checkout-btn { background: transparent; color: #fff; border: 1px solid #2A2A2A; border-radius: 10px; padding: 14px 32px; font-size: 15px; font-weight: 600; cursor: pointer; transition: border-color 0.15s; width: 100%; text-align: center; text-decoration: none; display: block; }
        .pd-checkout-btn:hover { border-color: #FF6B00; color: #FF6B00; }
        .pd-divider { border: none; border-top: 1px solid #2A2A2A; margin: 4px 0; }
        .pd-trust { display: flex; gap: 20px; }
        .pd-trust-item { font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px; }
        .pd-trust-item span { color: #00E676; font-weight: 700; font-size: 15px; }
        .pd-spinner { display: flex; align-items: center; justify-content: center; min-height: 50vh; }
        .pd-spin { width: 36px; height: 36px; border: 3px solid #2A2A2A; border-top-color: #FF6B00; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pd-404 { text-align: center; padding: 80px 48px; }
        .pd-404 h2 { font-family: 'Space Grotesk', sans-serif; font-size: 32px; color: #fff; margin-bottom: 8px; }
        .pd-404 p { color: #666; margin-bottom: 24px; }
        .pd-404 a { color: #FF6B00; text-decoration: none; font-weight: 600; }
      `}</style>

      <div className="pd-root">
        <div className="pd-nav">
          <Link href="/marketplace" className="">Marketplace</Link>
          <span>/</span>
          <span style={{ color: '#fff' }}>{product?.title ?? 'Product'}</span>
        </div>

        {loading ? (
          <div className="pd-spinner"><div className="pd-spin" /></div>
        ) : notFound ? (
          <div className="pd-404">
            <h2>Product not found</h2>
            <p>This listing may no longer be available.</p>
            <Link href="/marketplace">Back to Marketplace</Link>
          </div>
        ) : product ? (
          <div className="pd-inner">
            <div className="pd-gallery">
              <div className="pd-main-img">
                {onSale && <span className="pd-sale-badge">{product.percentOff}% OFF</span>}
                {product.stock <= 0 && (
                  <div className="pd-soldout-overlay">
                    <span className="pd-soldout-banner">SOLD OUT</span>
                  </div>
                )}
                {product.images[activeImg] ? (
                  <img src={product.images[activeImg]} alt={product.title} />
                ) : (
                  <div className="pd-main-placeholder">+</div>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="pd-thumbs">
                  {product.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className={`pd-thumb ${i === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="pd-info">
              <div className="pd-cat">{product.category}</div>
              <h1 className="pd-name">{product.title}</h1>

              <div className="pd-seller-box">
                <div className="pd-seller-label">{product.cjSourced ? 'Manufactured by' : 'Sold by'}</div>
                <div className="pd-seller-name">
                  {product.cjSourced
                    ? (product.cjSupplierName || 'CJ Dropshipping')
                    : product.seller.storeName}
                </div>
              </div>

              {product.isHandmade && (
                <div className="pd-maker-box">
                  <div className="pd-maker-label">Handmade / Artisan-made</div>
                  {product.makerStory && <p className="pd-maker-story">{product.makerStory}</p>}
                </div>
              )}

              {onSale ? (
                <>
                  <div className="pd-price-row">
                    <span className="pd-price sale">{symbol}{convert(product.discountedPrice as number, product.seller?.currency || 'GBP').toFixed(2)}</span>
                    <span className="pd-price-was">{symbol}{convert(product.price, product.seller?.currency || 'GBP').toFixed(2)}</span>
                    <span className="pd-save-chip">SAVE {product.percentOff}%</span>
                  </div>
                  <div className="pd-auto-note">Discount applied automatically â no code needed. Carries through to cart and checkout.</div>
                </>
              ) : (
                <div className="pd-price">{symbol}{convert(product.price, product.seller?.currency || 'GBP').toFixed(2)}</div>
              )}

              <p className="pd-desc">{product.description}</p>

              <hr className="pd-divider" />

              <div className="pd-qty-row">
                <div className="pd-qty-label">Quantity</div>
                <div className="pd-qty">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}>+</button>
                </div>
              </div>

              <button
                className={`pd-add-btn ${added ? 'success' : ''}`}
                onClick={addToCart}
                disabled={product.stock <= 0}
                style={product.stock <= 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                {product.stock <= 0 ? 'Out of Stock' : added ? 'Added to cart' : 'Add to Cart'}
              </button>

              <Link href="/checkout" className="pd-checkout-btn">
                Go to Checkout
              </Link>

              <div className="pd-trust">
                <div className="pd-trust-item"><span>+</span> Secure payment</div>
                <div className="pd-trust-item"><span>+</span> 30-day returns</div>
                <div className="pd-trust-item"><span>+</span> UK seller</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
