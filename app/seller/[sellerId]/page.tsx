import { prisma } from '@/lib/prisma'
import { getTheme } from '@/lib/store-themes'
import { auth } from '@/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { countryFlagUrl } from '@/lib/countryFlag'

// Shown instead of a bare 404 when a store link points to a seller who
// hasn't finished setup or isn't approved yet — friendlier than a generic
// "page not found" and keeps people inside the Velor experience.
function StoreNotReady() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '18px',
          color: 'var(--accent)',
          letterSpacing: '0.1em',
          marginBottom: '28px',
        }}
      >
        VELOR
      </div>

      <h1
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: '26px',
          margin: '0 0 12px',
        }}
      >
        This store isn&apos;t set up yet
      </h1>

      <p
        style={{
          color: 'var(--muted)',
          fontSize: '15px',
          lineHeight: 1.6,
          maxWidth: '440px',
          margin: '0 0 32px',
        }}
      >
        This seller hasn&apos;t finished setting up their storefront, or it&apos;s still
        awaiting approval. Check back soon, or explore other sellers on Velor.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
        <Link
          href="/shop"
          style={{
            background: 'var(--accent)',
            color: '#000',
            fontWeight: 800,
            fontSize: '15px',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 999,
          }}
        >
          Browse the marketplace
        </Link>
        <Link
          href="/"
          style={{
            background: 'transparent',
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 999,
            border: '1px solid var(--border)',
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'var(--accent)', fontSize: '16px' }}>
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'★'.repeat(5 - full - (half ? 1 : 0))}
      </span>
      <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
        {rating.toFixed(1)} ({count})
      </span>
    </span>
  )
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ sellerId: string }>
}) {
  const { sellerId } = await params

  const seller = await prisma.seller.findFirst({
    where: { id: sellerId, approved: true },
    include: {
      user: { select: { name: true } },
      products: {
        where: { status: 'APPROVED' },
        include: {
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!seller) {
    // Public storefronts only render once a seller is approved. If the person
    // hitting this URL is the seller themselves (e.g. clicked "My Store" from
    // the header before approval finished), send them to their dashboard.
    // Anyone else gets a friendly "not set up yet" page instead of a bare 404.
    const session = await auth()
    if (session?.user?.sellerId === sellerId) {
      redirect('/dashboard')
    }
    return <StoreNotReady />
  }

  const theme = getTheme((seller as unknown as { storeTheme?: string }).storeTheme)
  const tk = theme.tokens
  const sellerLogo = (seller as unknown as { storeLogo?: string }).storeLogo || null

  const allReviews = seller.products.flatMap((p) => p.reviews)
  const totalReviews = allReviews.length
  const avgRating =
    totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

  const memberSince = new Date(seller.createdAt).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: tk.bg,
        color: tk.text,
        fontFamily: tk.fontBody,
        ['--bg' as string]: tk.bg,
        ['--surface' as string]: tk.surface,
        ['--border' as string]: tk.border,
        ['--accent' as string]: tk.accent,
        ['--text' as string]: tk.text,
        ['--muted' as string]: tk.muted,
        ['--font-display' as string]: tk.fontDisplay,
        ['--font-body' as string]: tk.fontBody,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '48px 0',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px' }}>
            {/* Avatar */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                color: '#000',
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
              }}
            >
              {sellerLogo ? <img src={sellerLogo} alt={seller.storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(seller.storeName)}
            </div>

            {/* Info */}
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--text)',
                  margin: '0 0 8px 0',
                }}
              >
                {sellerLogo ? '' : seller.storeName}
              </h1>

              {seller.sellerBadge && seller.sellerBadge !== 'NEW' && (() => {
                const b = ({ TOP_RATED: ['Top Rated Seller', '#FFD54A', 'rgba(255,213,74,0.12)'], TRUSTED: ['Trusted Seller', '#C7CDD6', 'rgba(199,205,214,0.12)'], ESTABLISHED: ['Established Seller', '#CD8B5A', 'rgba(205,139,90,0.12)'] } as Record<string, string[]>)[seller.sellerBadge as string]
                if (!b) return null
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '10px', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: b[1], background: b[2], border: '1px solid ' + b[1] + '55' }}>{b[0]}</div>
                )
              })()}

              {totalReviews > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <StarRating rating={avgRating} count={totalReviews} />
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  flexWrap: 'wrap',
                  fontSize: '13px',
                  color: 'var(--muted)',
                  marginBottom: '14px',
                }}
              >
                {countryFlagUrl(seller.country) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <img
                      src={countryFlagUrl(seller.country)!}
                      alt={seller.country || ''}
                      style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2, display: 'inline-block' }}
                    />
                  </span>
                )}
                <span>{seller.products.length} products</span>
                <span>Member since {memberSince}</span>
              </div>

              {seller.description && (
                <p
                  style={{
                    color: '#aaa',
                    fontSize: '15px',
                    maxWidth: '560px',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {seller.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 28px 0',
          }}
        >
          Products ({seller.products.length})
        </h2>

        {seller.products.length === 0 ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '15px',
            }}
          >
            No products listed yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {seller.products.map((product) => {
              const pAvg =
                product.reviews.length > 0
                  ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
                  : null

              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        aspectRatio: '1',
                        background: '#111',
                        overflow: 'hidden',
                      }}
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#333',
                            fontSize: '13px',
                          }}
                        >
                          No image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: '6px',
                        }}
                      >
                        {product.category}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: '10px',
                          lineHeight: 1.3,
                        }}
                      >
                        {product.title}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: 800,
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                          }).format(product.price)}
                        </span>
                        {pAvg !== null && (
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            <span style={{ color: 'var(--accent)' }}>{'★'}</span>{' '}
                            {pAvg.toFixed(1)} ({product.reviews.length})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
