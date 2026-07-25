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
// layout and inline styles closely (same gallery/detail/description/seller-
// card/rails structure, same design tokens) so what a seller sees here is an
// honest preview of the real thing, not a mockup that diverges from it. When
// the real PDP was redesigned 2026-07-25 (trust/delivery module, seller
// trust card, specs, rating breakdown, "more from this seller"/"you may also
// like"/"recently viewed" rails, mobile sticky buy bar, image lightbox) this
// page was rebuilt alongside it for the same reason -- letting this drift
// out of sync with the real page would make it a misleading preview, which
// LAW #1 doesn't allow. Every number/name shown below is either the
// pre-existing static placeholder set or clearly fictitious "Example Seller
// Co." example data -- nothing here is presented as, or could be mistaken
// for, a real listing, seller, or review (the PREVIEW banner + repeated
// "Example"/"Placeholder" labelling throughout make that explicit, same
// convention as before this rebuild).
//
// Gallery: 1 main image + 7 thumbnails (William specified this exact
// count, 2026-07-16), matching how the real product page's gallery
// actually behaves -- images.length placeholder photos, one shown large,
// all shown as a thumbnail strip, clicking a thumbnail swaps the main
// image, clicking the main image opens the same lightbox the real PDP uses.
// Thumbnails are inline SVG data URIs (no real photography implied) so this
// page has zero dependency on external image hosting.

import { useEffect, useRef, useState } from 'react'
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

function railPhoto(index: number, label: string): string {
  const tones = ['#242030', '#1f2a2a', '#2a2420', '#302620', '#1d2420']
  const bg = tones[index % tones.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <rect width="400" height="400" fill="${bg}"/>
    <text x="200" y="205" font-family="Inter, sans-serif" font-size="16" fill="#9c9ca7" text-anchor="middle">Example</text>
    <text x="200" y="228" font-family="Inter, sans-serif" font-size="13" fill="#6b6b76" text-anchor="middle">${label}</text>
  </svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const PHOTOS = Array.from({ length: 7 }, (_, i) => placeholderPhoto(i, `${i + 1} of 7`))

interface ExampleRailItem { id: string; title: string; price: number }

const SELLER_RAIL: ExampleRailItem[] = [
  { id: 'ex-1', title: 'Example striped wool throw', price: 58 },
  { id: 'ex-2', title: 'Example alpaca knit beanie', price: 24 },
  { id: 'ex-3', title: 'Example woven table runner', price: 36 },
  { id: 'ex-4', title: 'Example felted wool slippers', price: 29 },
]
const RELATED_RAIL: ExampleRailItem[] = [
  { id: 'ex-5', title: 'Example cashmere-blend scarf', price: 65 },
  { id: 'ex-6', title: 'Example tartan wool wrap', price: 48 },
  { id: 'ex-7', title: 'Example hand-dyed silk scarf', price: 39 },
  { id: 'ex-8', title: 'Example merino travel wrap', price: 52 },
]
const RECENT_RAIL: ExampleRailItem[] = [
  { id: 'ex-9', title: 'Example ceramic pour-over set', price: 44 },
  { id: 'ex-10', title: 'Example engraved oak coasters', price: 19 },
  { id: 'ex-11', title: 'Example linen table runner', price: 33 },
]

const RATING_BREAKDOWN = [
  { star: 5, count: 8 },
  { star: 4, count: 3 },
  { star: 3, count: 1 },
  { star: 2, count: 0 },
  { star: 1, count: 0 },
]

const pdpCss = `
.velor-pdp-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start;}
.velor-pdp-mobilebar{display:none;}
.velor-pdp-gallery-main{cursor:zoom-in;}
.velor-pdp-gallery-main img{transition:transform .35s ease;}
.velor-pdp-gallery-main:hover img{transform:scale(1.06);}
.velor-pdp-rail-scroll{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;-ms-overflow-style:none;padding-bottom:6px;}
.velor-pdp-rail-scroll::-webkit-scrollbar{display:none;}
.velor-pdp-rail-card{flex:0 0 auto;width:170px;scroll-snap-align:start;}
.velor-pdp-tap{min-height:44px;}
@media(max-width:900px){
  .velor-pdp-grid{grid-template-columns:1fr;gap:24px;}
  .velor-pdp-page{padding-bottom:84px;}
  .velor-pdp-mobilebar{display:flex;}
  .velor-pdp-desktop-cta{display:none;}
}
@media(max-width:600px){
  .velor-pdp-rail-card{width:148px;}
  .velor-pdp-seller-stats{grid-template-columns:1fr 1fr 1fr !important;}
}
`

function ExampleRail({ heading, items }: { heading: string; items: ExampleRailItem[] }) {
  const { symbol } = useCurrencyDisplay()
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px 40px' }}>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '19px', fontWeight: 700, margin: '0 0 16px' }}>{heading}</h2>
      <div className="velor-pdp-rail-scroll">
        {items.map((p, i) => (
          <div key={p.id} className="velor-pdp-rail-card">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1', background: '#1c1c20' }}>
                <img src={railPhoto(i, `${i + 1}`)} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, lineHeight: 1.3, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '32px' }}>{p.title}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{symbol}{p.price.toFixed(2)}</div>
              </div>
            </div>
          </div>
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

export default function ShopPreviewPage() {
  const { symbol } = useCurrencyDisplay()
  const [mainImage, setMainImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  // 2026-07-16: these action buttons used to be plain `disabled` elements,
  // which are honest about not doing anything but give a visitor ZERO
  // feedback on click -- from a prospective seller's (or reporter's) point
  // of view that reads as "the button is broken," not "this is a preview."
  // William was explicit: nothing should look broken, even on a page that's
  // deliberately non-transactional. Buttons are no longer `disabled` --
  // they're clickable and explain themselves via this inline notice instead
  // of silently swallowing the click.
  const [noticeVisible, setNoticeVisible] = useState(false)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function showPreviewNotice() {
    setNoticeVisible(true)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNoticeVisible(false), 3500)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false)
      else if (e.key === 'ArrowLeft') setMainImage(i => (i - 1 + PHOTOS.length) % PHOTOS.length)
      else if (e.key === 'ArrowRight') setMainImage(i => (i + 1) % PHOTOS.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen])

  return (
    <div className="velor-pdp-page" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: pdpCss }} />
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

      <div className="velor-pdp-grid" style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="velor-pdp-gallery-main"
            onClick={() => setLightboxOpen(true)}
            role="button"
            aria-label="Open full-size example image"
            style={{ width: '100%', maxWidth: '480px', maxHeight: '480px', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', background: 'transparent', position: 'relative' }}
          >
            <img src={PHOTOS[mainImage]} alt="Example product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '20px' }}>
              Tap to zoom
            </div>
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
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="velor-pdp-tap" style={{ width: '44px', height: '44px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>-</button>
              <span style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(9, q + 1))} className="velor-pdp-tap" style={{ width: '44px', height: '44px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          <div className="velor-pdp-desktop-cta">
            <button onClick={showPreviewNotice} className="velor-pdp-tap" style={{ width: '100%', padding: '16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '10px', opacity: .85 }}>
              Add to Cart
            </button>
            <button onClick={showPreviewNotice} className="velor-pdp-tap" style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--text)', border: '2px solid var(--border)', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '16px', opacity: .85 }}>
              Buy Now
            </button>
          </div>
          <button onClick={showPreviewNotice} className="velor-pdp-tap" style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: .85 }}>
            <span style={{ fontSize: '18px' }}>♡</span> Save to Wishlist
          </button>
          <button onClick={showPreviewNotice} className="velor-pdp-tap" style={{ marginTop: '10px', width: '100%', padding: '12px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: .85 }}>
            <span style={{ fontSize: '16px' }}>&#9993;</span> Contact Seller
          </button>
          {noticeVisible && (
            <div style={{ marginTop: '2px', marginBottom: '4px', padding: '10px 14px', background: 'rgba(255,107,0,0.1)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
              This is a preview, not a real listing — <Link href="/sell" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>list your own goods</Link> to enable real buying.
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', lineHeight: 1.4 }}>📦</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Dispatch &amp; delivery</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Example: dispatched from your listed country. Usually dispatched within 1–3 business days. Real shipping cost and estimated arrival are calculated at checkout.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', lineHeight: 1.4 }}>↩️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Returns</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  14-day right to cancel under the UK Consumer Contracts Regulations. <Link href="/help" style={{ color: 'var(--accent)', fontWeight: 600 }}>See return policy</Link>
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

          <div style={{ marginTop: '16px', padding: '18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>Example seller card</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--accent)' }}>E</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Example Seller Co.</span>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>United Kingdom · Member since 2026</div>
              </div>
            </div>
            <div className="velor-pdp-seller-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>18</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Listings</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>63</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Sold</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>4.5★</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>12 reviews</div>
              </div>
            </div>
            <div className="velor-pdp-tap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--muted)', boxSizing: 'border-box' }}>
              Visit Store (example)
            </div>
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

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Details</h2>
          <div>
            <SpecRow label="Materials" value="Example: 100% merino wool" />
            <SpecRow label="Origin" value="Example: United Kingdom" />
            <SpecRow label="Dimensions" value="Example: 180 × 30 × 2 cm" />
            <SpecRow label="Weight" value="Example: 220 g" />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>Reviews</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>4.5</div>
              <div style={{ color: 'var(--accent)', fontSize: '14px' }}>★★★★</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>12 reviews</div>
            </div>
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {RATING_BREAKDOWN.map(({ star, count }) => {
                const pct = Math.round((count / 12) * 100)
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>E</div>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Example B.</span>
            <span style={{ color: 'var(--accent)', fontSize: '13px' }}>★★★★★</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', background: 'rgba(46,204,113,0.12)', padding: '2px 8px', borderRadius: '20px' }}>VERIFIED PURCHASE</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 0 38px' }}>Placeholder review text — this is where a real buyer&apos;s review will appear once you have real sales.</p>
        </div>
      </div>

      <ExampleRail heading="More from this seller" items={SELLER_RAIL} />
      <ExampleRail heading="You may also like" items={RELATED_RAIL} />
      <ExampleRail heading="Recently viewed" items={RECENT_RAIL} />

      <div style={{ textAlign: 'center', padding: '0 20px 60px' }}>
        <Link href="/sell" style={{ display: 'inline-block', background: 'var(--accent)', color: '#160a00', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
          Claim this seat — start selling
        </Link>
      </div>

      <div className="velor-pdp-mobilebar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Price</div>
          <div style={{ fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px' }}>{symbol}42.00</div>
        </div>
        <button onClick={showPreviewNotice} className="velor-pdp-tap" style={{ flex: '0 0 auto', padding: '0 18px', height: '46px', borderRadius: '10px', fontWeight: 700, fontSize: '13.5px', border: '2px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
          Buy Now
        </button>
        <button onClick={showPreviewNotice} className="velor-pdp-tap" style={{ flex: '1.3 1 0', padding: '0 16px', height: '46px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer' }}>
          Add to Cart
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
          <button
            onClick={() => setMainImage(i => (i - 1 + PHOTOS.length) % PHOTOS.length)}
            aria-label="Previous image"
            style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '28px', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', lineHeight: 1 }}
          >
            ‹
          </button>
          <img src={PHOTOS[mainImage]} alt="Example product" style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain' }} />
          <button
            onClick={() => setMainImage(i => (i + 1) % PHOTOS.length)}
            aria-label="Next image"
            style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '28px', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', lineHeight: 1 }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
