'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  currency: string
  images: string[]
  category: string
  avgRating: number | null
  reviewCount: number
  sellerName: string
}

interface FeaturedSeller {
  id: string
  name: string
  image: string | null
  productCount: number
  avgRating: number | null
  reviewCount: number
}

const HERO_HEADLINES = [
  { top: 'The Marketplace', bottom: 'Built for Sellers.' },
  { top: 'Zero Fees.', bottom: 'Infinite Reach.' },
  { top: 'Your Products.', bottom: 'The World.' },
]


const CATEGORIES = [
  { name: 'Fitness & Gym', desc: 'Equipment & accessories' },
  { name: 'Electronics', desc: 'Gadgets & tech' },
  { name: 'Home & Garden', desc: 'Furnishings & decor' },
  { name: 'Sports & Outdoors', desc: 'Gear & clothing' },
  { name: 'Beauty & Health', desc: 'Skincare & wellness' },
  { name: 'Toys & Games', desc: 'For all ages' },
  { name: 'Fashion', desc: 'Clothing & accessories' },
  { name: 'Automotive', desc: 'Parts & accessories' },
  { name: 'Jewellery & Watches', desc: 'Fine & fashion jewellery' },
  { name: 'Baby & Kids', desc: 'Clothing, gear & essentials' },
  { name: 'Pet Supplies', desc: 'Food, toys & accessories' },
  { name: 'Books & Education', desc: 'Learning & literature' },
  { name: 'Art & Crafts', desc: 'Creative supplies & kits' },
  { name: 'Office & Stationery', desc: 'Desks, tools & supplies' },
  { name: 'Travel & Luggage', desc: 'Bags, cases & accessories' },
  { name: 'Food & Grocery', desc: 'Pantry & specialty foods' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Store',
    desc: 'Sign up free, set up your seller profile, and agree to our marketplace terms. Takes under 5 minutes.',
  },
  {
    step: '02',
    title: 'List Your Products',
    desc: 'Upload products with images, set your own prices, and go live instantly for buyers worldwide to discover.',
  },
  {
    step: '03',
    title: 'Get Paid',
    desc: 'Buyers purchase via Stripe. Funds hit your account within 48 hours after delivery confirmation.',
  },
]

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false)
  const sym = product.currency === 'GBP' ? '£' : product.currency === 'USD' ? '$' : '€'

  return (
    <Link
      href={`/shop/${product.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
          transform: hovered ? 'translateY(-4px)' : 'none',
          boxShadow: hovered ? '0 12px 40px rgba(255,107,0,0.15)' : 'none',
        }}
      >
        <div
          style={{
            aspectRatio: '1',
            background: '#1E1E1E',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--border)',
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              --
            </div>
          )}
        </div>
        <div style={{ padding: '16px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              marginBottom: 6,
            }}
          >
            {product.category}
          </div>
          <div
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text)',
              lineHeight: 1.3,
              marginBottom: 8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </div>
          {product.avgRating ?? 0 ? (
            <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>
              {'\u2605'.repeat(Math.round(product.avgRating ?? 0))}{' '}
              <span style={{ color: 'var(--muted)' }}>({product.reviewCount})</span>
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text)',
              }}
            >
              {sym}{product.price.toFixed(2)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>by {product.sellerName}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function SellerCard({ seller }: { seller: FeaturedSeller }) {
  const [hovered, setHovered] = useState(false)
  const initial = seller.name.charAt(0).toUpperCase()

  return (
    <Link
      href={`/sellers/${seller.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 12,
          padding: '24px',
          transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
          transform: hovered ? 'translateY(-4px)' : 'none',
          boxShadow: hovered ? '0 12px 40px rgba(255,107,0,0.12)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: hovered ? 'rgba(255,107,0,0.15)' : 'var(--surface)',
            border: `2px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          {seller.image ? (
            <img
              src={seller.image}
              alt={seller.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: hovered ? 'var(--accent)' : 'var(--muted)',
                transition: 'color 0.2s',
              }}
            >
              {initial}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              color: hovered ? 'var(--accent)' : 'var(--text)',
              marginBottom: 4,
              transition: 'color 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {seller.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 10 }}>
            <span>{seller.productCount} products</span>
            {seller.avgRating && (
              <span style={{ color: 'var(--accent)' }}>
                {seller.avgRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            fontSize: 18,
            color: hovered ? 'var(--accent)' : 'var(--border)',
            transition: 'color 0.2s',
            flexShrink: 0,
          }}
        >
          
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [fadeHero, setFadeHero] = useState(true)
  const [catHover, setCatHover] = useState<string | null>(null)
  const [featuredSellers, setFeaturedSellers] = useState<FeaturedSeller[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeHero(false)
      setTimeout(() => {
        setHeroIdx((i) => (i + 1) % HERO_HEADLINES.length)
        setFadeHero(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/api/shop/products?limit=8')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/sellers/featured')
      .then((r) => r.json())
      .then((d) => setFeaturedSellers(d.sellers || []))
      .catch(() => {})
  }, [])

  const hero = HERO_HEADLINES[heroIdx]

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      {/* HERO */}
      <section
        style={{
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,107,0,0.08) 0%, transparent 70%), var(--bg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div
          style={{
            maxWidth: '100%',
            margin: '0 auto',
            padding: '0 48px',
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 56,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: 560, flex: '1 1 420px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,107,0,0.12)',
                border: '1px solid rgba(255,107,0,0.3)',
                borderRadius: 100,
                padding: '6px 16px',
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Now live in 22 countries and growing
              </span>
            </div>

            <div
              style={{
                opacity: fadeHero ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            >
              <h1
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(48px, 7vw, 84px)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  margin: 0,
                  letterSpacing: '-2px',
                  color: 'var(--text)',
                }}
              >
                {hero.top}
                <br />
                <span style={{ color: 'var(--accent)' }}>{hero.bottom}</span>
              </h1>
            </div>

            <p
              style={{
                fontSize: 18,
                color: 'var(--muted)',
                marginTop: 24,
                marginBottom: 40,
                lineHeight: 1.7,
                maxWidth: 560,
              }}
            >
              The global marketplace where independent sellers reach millions of buyers. Zero
              listing fees. Secure Stripe payouts. Ship worldwide.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/sell" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 10,
                    padding: '16px 36px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Space Grotesk, sans-serif',
                    letterSpacing: '-0.3px',
                  }}
                >
                  Start Selling Free
                </button>
              </Link>
              <Link href="/shop" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'transparent',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '16px 36px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Space Grotesk, sans-serif',
                    letterSpacing: '-0.3px',
                  }}
                >
                  Browse Products
                </button>
              </Link>
            </div>
          </div>

          <div style={{ flex: '1 1 620px', minWidth: 300 }}>
            <img
              src="/velor-global-market.png"
              alt="Velor Global Marketplace"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: 16,
                border: '1px solid var(--border)',
              }}
            />
          </div>
        </div>

      </section>


      {/* TRENDING PRODUCTS */}
      {products.length > 0 && (
        <section style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 40,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--accent)',
                    marginBottom: 8,
                  }}
                >
                  Live Marketplace
                </div>
                <h2
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 36,
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text)',
                    letterSpacing: '-1px',
                  }}
                >
                  Trending Right Now
                </h2>
              </div>
              <Link
                href="/shop"
                style={{
                  textDecoration: 'none',
                  color: 'var(--accent)',
                  fontSize: 14,
                  fontWeight: 600,
                  borderBottom: '1px solid var(--accent)',
                  paddingBottom: 2,
                }}
              >
                View all products
              </Link>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 20,
              }}
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED SELLERS */}
      {featuredSellers.length > 0 && (
        <section
          style={{
            padding: '80px 0',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 40,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--accent)',
                    marginBottom: 8,
                  }}
                >
                  Top Sellers
                </div>
                <h2
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 36,
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text)',
                    letterSpacing: '-1px',
                  }}
                >
                  Featured Sellers
                </h2>
              </div>
              <Link
                href="/sellers"
                style={{
                  textDecoration: 'none',
                  color: 'var(--accent)',
                  fontSize: 14,
                  fontWeight: 600,
                  borderBottom: '1px solid var(--accent)',
                  paddingBottom: 2,
                }}
              >
                View all sellers
              </Link>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
              }}
            >
              {featuredSellers.map((s) => (
                <SellerCard key={s.id} seller={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section
        style={{
          padding: '80px 0',
          background: products.length === 0 && featuredSellers.length === 0 ? 'var(--surface)' : 'var(--bg)',
          borderTop: products.length > 0 || featuredSellers.length > 0 ? 'none' : '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--accent)',
                marginBottom: 8,
              }}
            >
              What We Sell
            </div>
            <h2
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 36,
                fontWeight: 800,
                margin: 0,
                color: 'var(--text)',
                letterSpacing: '-1px',
              }}
            >
              Shop by Category
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
            }}
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                style={{ textDecoration: 'none' }}
                onMouseEnter={() => setCatHover(cat.name)}
                onMouseLeave={() => setCatHover(null)}
              >
                <div
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${catHover === cat.name ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '28px 24px',
                    transition: 'border-color 0.2s, transform 0.2s',
                    transform: catHover === cat.name ? 'translateY(-2px)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 16,
                      fontWeight: 700,
                      color: catHover === cat.name ? 'var(--accent)' : 'var(--text)',
                      marginBottom: 6,
                      transition: 'color 0.2s',
                    }}
                  >
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{cat.desc}</div>
                  <div
                    style={{
                      marginTop: 16,
                      fontSize: 18,
                      color: catHover === cat.name ? 'var(--accent)' : 'var(--border)',
                      transition: 'color 0.2s',
                    }}
                  >
                    
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--accent)',
                marginBottom: 8,
              }}
            >
              For Sellers
            </div>
            <h2
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 36,
                fontWeight: 800,
                margin: 0,
                color: 'var(--text)',
                letterSpacing: '-1px',
              }}
            >
              Start Selling in 3 Steps
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 32,
            }}
          >
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ position: 'relative' }}>
                {i < 2 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 20,
                      left: 'calc(100% - 16px)',
                      width: 32,
                      fontSize: 20,
                      color: 'var(--border)',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }}
                  >
                    
                  </div>
                )}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: 32,
                    height: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 52,
                      fontWeight: 800,
                      color: 'rgba(255,107,0,0.15)',
                      marginBottom: 16,
                      lineHeight: 1,
                    }}
                  >
                    {step.step}
                  </div>
                  <h3
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 20,
                      fontWeight: 700,
                      color: 'var(--text)',
                      marginBottom: 12,
                      marginTop: 0,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: 14, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
          }}
        >
          {[
            { title: 'Free to List', desc: 'No upfront costs ever' },
            { title: 'Fast Payouts', desc: 'Within 48 hours' },
            { title: 'Global Buyers', desc: '22 countries and growing' },
            { title: 'Seller Protection', desc: 'Disputes handled for you' },
            { title: 'AI-Powered Tools', desc: 'Grow your store faster' },
          ].map((t, i) => (
            <div
              key={t.title}
              style={{
                padding: '28px 20px',
                borderRight: i < 4 ? '1px solid var(--border)' : 'none',
                textAlign: 'center',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                {t.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SELLER CTA */}
      <section
        style={{
          padding: '100px 40px',
          background:
            'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(255,107,0,0.1) 0%, transparent 70%)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--accent)',
              marginBottom: 16,
            }}
          >
            Join 10,000+ Sellers
          </div>
          <h2
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              margin: '0 0 20px',
              lineHeight: 1.1,
              letterSpacing: '-1px',
            }}
          >
            Ready to Sell to
            <br />
            <span style={{ color: 'var(--accent)' }}>the Entire World?</span>
          </h2>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 16,
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            Create your free seller account in minutes. No fees, no limits, no middleman. Just you,
            your products, and millions of buyers.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sell" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 10,
                  padding: '16px 40px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                Start Selling — It's Free
              </button>
            </Link>
            <Link href="/shop" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '16px 40px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                Explore Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px) {
          .hero-cards { display: none !important; }
        }
      `}</style>
    </div>
  )
  }
