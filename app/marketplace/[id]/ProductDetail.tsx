'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  createdAt: string
  seller: {
    storeName: string
    user: { name: string; email: string }
  }
}

export default function ProductDetail({ id }: { id: string }) {
  const router = useRouter()
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

  function addToCart() {
    if (!product) return
    const existing = JSON.parse(localStorage.getItem('velor-cart') || '[]')
    const idx = existing.findIndex((i: any) => i.id === product.id)
    if (idx >= 0) {
      existing[idx].quantity += qty
    } else {
      existing.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: qty,
        sellerId: undefined,
        sellerName: product.seller.storeName,
      })
    }
    localStorage.setItem('velor-cart', JSON.stringify(existing))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

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
        .pd-gallery { display: flex; gap: 12px; }
        .pd-thumbs { display: flex; flex-direction: column; gap: 8px; }
        .pd-thumb { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; border: 2px solid transparent; cursor: pointer; background: #1A1A1A; }
        .pd-thumb.active { border-color: #FF6B00; }
        .pd-main-img { flex: 1; aspect-ratio: 1; background: #1A1A1A; border-radius: 12px; overflow: hidden; border: 1px solid #2A2A2A; display: flex; align-items: center; justify-content: center; }
        .pd-main-img img { width: 100%; height: 100%; object-fit: cover; }
        .pd-main-placeholder { color: #333; font-size: 80px; }
        .pd-info { display: flex; flex-direction: column; gap: 20px; }
        .pd-cat { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #FF6B00; }
        .pd-name { font-family: 'Space Grotesk', sans-serif; font-size: 32px; font-weight: 800; line-height: 1.2; color: #fff; margin: 0; }
        .pd-seller-box { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 10px; padding: 14px 16px; }
        .pd-seller-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin-bottom: 4px; }
        .pd-seller-name { font-size: 15px; font-weight: 600; color: #fff; }
        .pd-price { font-size: 40px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; color: #fff; }
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
          <span style={{ color: '#fff' }}>{product?.name ?? 'Product'}</span>
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
              <div className="pd-main-img">
                {product.images[activeImg] ? (
                  <img src={product.images[activeImg]} alt={product.name} />
                ) : (
                  <div className="pd-main-placeholder">+</div>
                )}
              </div>
            </div>

            <div className="pd-info">
              <div className="pd-cat">{product.category}</div>
              <h1 className="pd-name">{product.name}</h1>

              <div className="pd-seller-box">
                <div className="pd-seller-label">Sold by</div>
                <div className="pd-seller-name">{product.seller.storeName}</div>
              </div>

              <div className="pd-price">Â£{product.price.toFixed(2)}</div>

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
              >
                {added ? 'Added to cart' : 'Add to Cart'}
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
