'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'

interface WishlistProduct {
  id: string
  name: string
  price: number
  images: string[]
  category: string
  sellerName: string
  avgRating: number
  reviewCount: number
}

interface WishlistItem {
  wishlistItemId: string
  addedAt: string
  product: WishlistProduct
}

export default function WishlistPage() {
  const { symbol, convert } = useCurrencyDisplay()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/account/wishlist')
      return
    }
    if (status !== 'authenticated') return

    fetch('/api/wishlist')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setItems(data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [status, router])

  async function removeItem(productId: string) {
    setRemoving(productId)
    try {
      await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      setItems(prev => prev.filter(i => i.product.id !== productId))
    } finally {
      setRemoving(null)
    }
  }

  function addToCart(item: WishlistItem) {
    const cart = JSON.parse(localStorage.getItem('velor-cart') || '[]')
    const idx = cart.findIndex((c: { id: string }) => c.id === item.product.id)
    if (idx >= 0) {
      cart[idx].quantity += 1
    } else {
      cart.push({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: 1,
        image: item.product.images[0] || '',
      })
    }
    localStorage.setItem('velor-cart', JSON.stringify(cart))
  }

  if (loading || status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>VELOR</Link>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, margin: '12px 0 4px', color: 'var(--text)' }}>
              My Wishlist
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              {items.length} saved item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/account" style={{ padding: '10px 18px', background: 'transparent', color: 'var(--muted)', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', border: '1px solid var(--border)' }}>
              My Account
            </Link>
            <Link href="/shop" style={{ padding: '10px 20px', background: 'var(--accent)', color: '#000', textDecoration: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px', color: 'var(--border)', lineHeight: 1 }}>&#9825;</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
              Your wishlist is empty
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '15px' }}>
              Save items you love and come back to them anytime.
            </p>
            <Link href="/shop" style={{ padding: '14px 32px', background: 'var(--accent)', color: '#000', textDecoration: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '15px' }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {items.map(item => (
              <div key={item.wishlistItemId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Link href={`/shop/${item.product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ aspectRatio: '1', background: '#222', overflow: 'hidden' }}>
                    {item.product.images[0]
                      ? <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px' }}>No image</div>
                    }
                  </div>
                </Link>
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                    {item.product.category}
                  </div>
                  <Link href={`/shop/${item.product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.product.name}
                    </div>
                  </Link>
                  {(item.product.avgRating ?? 0) > 0 && (
                    <div style={{ color: 'var(--accent)', fontSize: '13px', marginBottom: '8px' }}>
                      {'\u2605'.repeat(Math.round(item.product.avgRating ?? 0))} {item.product.avgRating ?? 0}
                      <span style={{ color: 'var(--muted)', marginLeft: '4px' }}>({item.product.reviewCount})</span>
                    </div>
                  )}
                  <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '14px', marginTop: 'auto' }}>
                    {symbol}{convert(item.product.price).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => addToCart(item)}
                      style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
   £{item.product.price.toFixed(2)}                 >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      disabled={removing === item.product.id}
                      title="Remove from wishlist"
                      style={{ padding: '10px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: removing === item.product.id ? 'var(--muted)' : 'var(--red)', cursor: removing === item.product.id ? 'not-allowed' : 'pointer', fontSize: '18px', lineHeight: 1, transition: 'color 0.15s' }}
                    >
                      &#9825;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
    }
