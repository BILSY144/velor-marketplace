'use client'

// Seller-facing "how your goods will be presented" preview.
//
// Every one of the 200 open reserved-slot boxes on /shop?origin=CODE links
// here (see app/shop/page.tsx's shslots-box Link href) instead of to a real
// /shop/[productId] listing, because no real listing exists behind any of
// those boxes yet -- linking to the real template would just 404. William
// asked (2026-07-16) to turn that into something useful: a page a
// PROSPECTIVE SELLER can click through to and see exactly how their goods
// will look once they list, as a recruiting tool for the open seats.
//
// This intentionally mirrors app/shop/[productId]/ProductPageClient.tsx's
// layout and inline styles closely (same gallery/detail/description
// structure, same design tokens) so what a seller sees here is an honest
// preview of the real thing, not a mockup that diverges from it. Static
// placeholder content throughout, clearly labelled as an example at the
// top -- per LAW #1, never implies this is a real listing.
//
// Gallery: 1 main image + 7 thumbnails (William specified this exact
// count, 2026-07-16), matching how the real product page's gallery
// actually behaves -- images.length placeholder photos, one shown large,
// all shown as a thumbnail strip, clicking a thumbnail swaps the main
// image. Thumbnails are inline SVG data URIs (no real photography implied)
// so this page has zero dependency on external image hosting.

import { useState } from 'react'
import Link from 'next/link'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'

function placeholderPhoto(index: number, label: string): string {
  const tones = ['#2a2a31', '#302620', '#1d2420', '#242030', '#1f2a2a', '#2a2420', '#20242a']
  const bg = tones[index % tones.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="600" height="600" fill="${bg}"/>
    <text x="300" y="285" font-family="Inter, sans-serif" font-size="26" fill="#9c9ca7" text-anchor="middle">Example photo</text>
    <text x="300" y="325" font-family="Inter, sans-serif" font-size="20" fill="#6b6b76" text-anchor="middle">${label}</text>
  </svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const PHOTOS = Array.from({ length: 7 }, (_, i) => placeholderPhoto(i, `${i + 1} of 7`))

export default function ShopPreviewPage() {
  const { symbol } = useCurrencyDisplay()
  const [mainImage, setMainImage] = useState(0)
  const [qty, setQty] = useState(1)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#3a2a00', color: '#ffcf8a', textAlign: 'center', fontSize: '13px', fontWeight: 600, padding: '10px 20px', letterSpacing: '.02em' }}>
        PREVIEW — this is an example of how your goods will be presented once you list them. Not a real listing.
      </div>

      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '18px' }}>VELOR</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>Example handwoven wool scarf</span>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '100%', maxWidth: '420px', maxHeight: '420px', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', background: 'transparent', position: 'relative', margin: '0 auto' }}>
            <img src={PHOTOS[mainImage]} alt="Example product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px' }}>
            {PHOTOS.map((src, i) => (
              <div
                key={i}
                onClick={() => setMainImage(i)}
                style={{
                  width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                  border: mainImage === i ? '2px solid var(--accent)' : '2px solid var(--border)',
                  flexShrink: 0,
                }}
              >
                <img src={src} alt={`Example photo ${i + 1} of ${PHOTOS.length}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Art, Crafts &amp; Handmade</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.25 }}>Example handwoven wool scarf</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '16px' }}>★★★★</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>4.5</span>
            <span style={{ color: 'var(--muted)', fontSize: '14px' }}>(12 reviews)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '24px' }}>
            <span style={{ fontSize: '36px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: 'var(--text)' }}>{symbol}42.00</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>Quantity</div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>-</button>
              <span style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(9, q + 1))} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          <button disabled style={{ width: '100%', padding: '16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'not-allowed', marginBottom: '10px', opacity: .85 }}>
            Add to Cart
          </button>
          <button disabled style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--text)', border: '2px solid var(--border)', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'not-allowed', marginBottom: '16px', opacity: .85 }}>
            Buy Now
          </button>
          <button disabled style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: .85 }}>
            <span style={{ fontSize: '18px' }}>♡</span> Save to Wishlist
          </button>
          <button disabled style={{ marginTop: '10px', width: '100%', padding: '12px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: .85 }}>
            <span style={{ fontSize: '16px' }}>&#9993;</span> Contact Seller
          </button>

          <div style={{ marginTop: '20px', padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--muted)' }}>
            Sold by <span style={{ color: 'var(--text)', fontWeight: 600 }}>Example Seller Co.</span>
          </div>

          <div style={{ marginTop: '12px', padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--accent)', fontSize: '13px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: '6px' }}>Handmade / Artisan-made</div>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>Placeholder maker story text — this is where your own words about your craft will appear.</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 40px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Description</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '15px', whiteSpace: 'pre-wrap' }}>This is placeholder example text showing where your own description will appear once you list your goods.</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
            <span style={{ padding: '4px 12px', background: 'rgba(255,107,0,0.1)', color: 'var(--accent)', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>example</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <Link href="/sell" style={{ display: 'inline-block', background: 'var(--accent)', color: '#160a00', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Claim this seat — start selling
          </Link>
        </div>
      </div>
    </div>
  )
}
