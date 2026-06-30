import Link from 'next/link';

const categories = [
  { name: 'Fitness & Gym', slug: 'fitness-gym', count: '12,400+', icon: '🏋' },
  { name: 'Electronics', slug: 'electronics', count: '28,000+', icon: '📱' },
  { name: 'Home & Garden', slug: 'home-garden', count: '31,000+', icon: '🏠' },
  { name: 'Sports & Outdoors', slug: 'sports', count: '9,800+', icon: '⚽' },
  { name: 'Beauty & Health', slug: 'beauty', count: '14,200+', icon: '💄' },
  { name: 'Toys & Games', slug: 'toys', count: '7,600+', icon: '🎮' },
  { name: 'Fashion', slug: 'fashion', count: '22,500+', icon: '👗' },
  { name: 'Automotive', slug: 'automotive', count: '5,300+', icon: '🚗' },
];

const stats = [
  { value: '10K+', label: 'Active Sellers' },
  { value: '180+', label: 'Countries' },
  { value: '500K+', label: 'Products' },
  { value: '$0', label: 'To List' },
];

const features = [
  { title: 'Global Reach', desc: 'Sell to buyers in 180+ countries with localised checkout and currency support.' },
  { title: 'Zero Listing Fees', desc: 'List unlimited products for free. We only make money when you do.' },
  { title: 'AI-Powered Tools', desc: 'Auto-generate product descriptions, pricing suggestions, and SEO titles.' },
  { title: 'Fast Payouts', desc: 'Get paid within 2 business days via bank transfer, PayPal, or crypto.' },
  { title: 'Seller Protection', desc: 'Dispute resolution, fraud prevention, and chargeback management built in.' },
  { title: 'Real-Time Analytics', desc: 'Track views, conversions, and revenue with your seller dashboard.' },
];

const steps = [
  { num: '01', title: 'Create Your Store', desc: 'Sign up free and set up your seller profile in under 5 minutes.' },
  { num: '02', title: 'List Your Products', desc: 'Upload products manually or bulk import from your existing store.' },
  { num: '03', title: 'Start Selling', desc: 'Reach millions of buyers worldwide and get paid automatically.' },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 60% 40%, rgba(255,107,0,0.12) 0%, transparent 60%), var(--bg)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 760, padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,107,0,0.15)',
            border: '1px solid rgba(255,107,0,0.3)',
            color: 'var(--accent)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '6px 16px',
            borderRadius: 100,
            marginBottom: 28,
          }}>
            The Global Marketplace for Independent Sellers
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--text)',
            marginBottom: 24,
            letterSpacing: '-0.02em',
          }}>
            Sell Anything.<br />
            <span style={{ color: 'var(--accent)' }}>Reach Everyone.</span>
          </h1>

          <p style={{
            fontSize: 18,
            color: 'var(--muted)',
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: 520,
            margin: '0 auto 40px',
          }}>
            The AI-powered marketplace where independent sellers connect with buyers in 180+ countries. Zero listing fees. Instant payouts.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sell" style={{
              background: 'var(--accent)',
              color: '#fff',
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 16,
              padding: '16px 36px',
              borderRadius: 8,
              display: 'inline-block',
              letterSpacing: '-0.01em',
            }}>
              Start Selling Free
            </Link>
            <Link href="/shop" style={{
              background: 'transparent',
              color: 'var(--text)',
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 16,
              padding: '16px 36px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              display: 'inline-block',
            }}>
              Browse Products
            </Link>
          </div>
        </div>

        {/* Decorative grid lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.3,
          zIndex: 0,
        }} />
      </section>

      {/* STATS */}
      <section style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              padding: '40px 24px',
              textAlign: 'center',
              borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 48,
                fontWeight: 800,
                color: 'var(--accent)',
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {s.value}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 12,
          }}>
            Shop by Category
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>Millions of products from independent sellers worldwide</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}>
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/shop?category=${cat.slug}`} style={{
              display: 'block',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '32px 24px',
              transition: 'border-color 0.2s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{cat.icon}</div>
              <div style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--text)',
                marginBottom: 6,
              }}>
                {cat.name}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{cat.count} products</div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '96px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 64, textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 12,
            }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 16 }}>Start selling globally in three steps</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {steps.map((step) => (
              <div key={step.num} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display), system-ui, sans-serif',
                  fontSize: 64,
                  fontWeight: 800,
                  color: 'rgba(255,107,0,0.15)',
                  lineHeight: 1,
                  marginBottom: 16,
                  letterSpacing: '-0.04em',
                }}>
                  {step.num}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display), system-ui, sans-serif',
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 10,
                }}>
                  {step.title}
                </h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: 15 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 12,
          }}>
            Built for Sellers
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>Everything you need to run a global business</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '32px',
            }}>
              <div style={{
                width: 40,
                height: 4,
                background: 'var(--accent)',
                borderRadius: 2,
                marginBottom: 20,
              }} />
              <h3 style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 10,
              }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SELLER CTA */}
      <section style={{
        margin: '0 24px 96px',
        maxWidth: 1200,
        marginLeft: 'auto',
        marginRight: 'auto',
        background: 'linear-gradient(135deg, rgba(255,107,0,0.15) 0%, rgba(255,107,0,0.05) 100%)',
        border: '1px solid rgba(255,107,0,0.25)',
        borderRadius: 20,
        padding: '72px 48px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 16,
          letterSpacing: '-0.02em',
        }}>
          Ready to Start Selling?
        </h2>
        <p style={{
          color: 'var(--muted)',
          fontSize: 18,
          marginBottom: 36,
          maxWidth: 480,
          margin: '0 auto 36px',
        }}>
          Join 10,000+ sellers already growing their business on Velor Marketplace.
        </p>
        <Link href="/sell" style={{
          background: 'var(--accent)',
          color: '#fff',
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 17,
          padding: '18px 48px',
          borderRadius: 8,
          display: 'inline-block',
          letterSpacing: '-0.01em',
        }}>
          Create Your Free Store
        </Link>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
          No credit card required. Free forever for basic listings.
        </div>
      </section>
    </>
  );
}
