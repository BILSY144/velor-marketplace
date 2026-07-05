'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getDisplayCurrency, setStoredCurrency, SUPPORTED_CURRENCIES, CURRENCY_NAMES } from '@/lib/currency'

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Beauty & Health',
  'Sports & Outdoors',
  'Jewellery & Watches',
  'Toys & Games',
  'Baby & Kids',
  'Pet Supplies',
  'Automotive',
  'Books & Education',
  'Art & Crafts',
  'Office & Stationery',
  'Travel & Luggage',
  'Food & Grocery',
  'Fitness & Gym',
]

export default function GlobalHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const [cartCount, setCartCount] = useState(0)
  const [query, setQuery] = useState('')
  const [catsOpen, setCatsOpen] = useState(false)
  const [acctOpen, setAcctOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currency, setCurrency] = useState('GBP')

  useEffect(() => {
    setCurrency(getDisplayCurrency())
    const onCurrencyChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (detail) setCurrency(detail)
    }
    window.addEventListener('velor-currency-changed', onCurrencyChange)
    return () => window.removeEventListener('velor-currency-changed', onCurrencyChange)
  }, [])

  const catsRef = useRef<HTMLDivElement>(null)
  const acctRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const readCart = () => {
      try {
        const raw = localStorage.getItem('velor-cart')
        const items = raw ? JSON.parse(raw) : []
        const count = Array.isArray(items)
          ? items.reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 1), 0)
          : 0
        setCartCount(count)
      } catch {
        setCartCount(0)
      }
    }
    readCart()
    window.addEventListener('storage', readCart)
    window.addEventListener('cart-updated', readCart)
    return () => {
      window.removeEventListener('storage', readCart)
      window.removeEventListener('cart-updated', readCart)
    }
  }, [pathname])

  useEffect(() => {
    setCatsOpen(false)
    setAcctOpen(false)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (catsRef.current && !catsRef.current.contains(e.target as Node)) setCatsOpen(false)
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/shop')
  }

  // The seller's own storefront lives at /seller/[sellerId] — this is the
  // buyer-facing page they'll want a quick link to from anywhere on the site.
  const sellerId = (session?.user as { sellerId?: string } | undefined)?.sellerId
  const isSeller = Boolean(sellerId)

  const navLink: React.CSSProperties = {
    color: 'var(--text)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    padding: '8px 2px',
    opacity: 0.9,
  }
  const menuItem: React.CSSProperties = {
    display: 'block',
    padding: '11px 16px',
    color: 'var(--text)',
    textDecoration: 'none',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
  }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, fontFamily: 'var(--font-body)' }}>
      {/* Trust micro-bar */}
      <div
        style={{
          background: '#000',
          color: 'var(--muted)',
          fontSize: 12,
          letterSpacing: '0.02em',
          textAlign: 'center',
          padding: '7px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ color: 'var(--green)', fontWeight: 700 }}>Buyer protection</span> — your money is held until you confirm delivery
        <span style={{ opacity: 0.4, margin: '0 10px' }}>|</span>
        Verified &amp; ranked sellers
        <span style={{ opacity: 0.4, margin: '0 10px' }}>|</span>
        Secure Stripe checkout
      </div>

      {/* Main bar */}
      <div
        style={{
          background: 'rgba(13,13,13,0.92)',
          backdropFilter: 'saturate(140%) blur(10px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '0 24px',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: '0.12em',
              color: 'var(--accent)',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img src="/velor-logo.png" alt="Velor" style={{ height: 28, width: 'auto' }} />
          </Link>

          {/* Primary nav (desktop) */}
          <nav
            className="velor-desktop-nav"
            style={{ display: 'flex', alignItems: 'center', gap: 22 }}
          >
            <Link href="/shop" style={navLink}>Shop</Link>
            <div ref={catsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setCatsOpen((v) => !v)}
                style={{ ...navLink, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Categories ▾
              </button>
              {catsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 40,
                    left: 0,
                    width: 440,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 10,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c}
                      href={`/shop?category=${encodeURIComponent(c)}`}
                      style={{ ...menuItem, borderRadius: 9, fontSize: 13 }}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/about" style={navLink}>How it works</Link>
          </nav>

          {/* Search */}
          <form onSubmit={submitSearch} style={{ flex: 1, maxWidth: 460, marginLeft: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: '9px 16px',
              }}
            >
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands and sellers"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </form>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
            {isSeller && (
              <Link href={`/seller/${sellerId}`} className="velor-desktop-nav" style={{ ...navLink, padding: 0 }} title="View my store">
                My Store
              </Link>
            )}
            <Link href="/account/wishlist" className="velor-desktop-nav" style={{ ...navLink, padding: 0 }} title="Wishlist">
              ♡
            </Link>
            <Link href="/checkout" style={{ ...navLink, padding: 0, position: 'relative' }} title="Cart">
              <span style={{ fontSize: 18 }}>🛒</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -10,
                    background: 'var(--accent)',
                    color: '#000',
                    fontSize: 11,
                    fontWeight: 800,
                    borderRadius: 999,
                    minWidth: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
            {/* Currency switcher */}
            <div style={{ ...navLink, display: 'flex', alignItems: 'center' }}>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value)
                  setStoredCurrency(e.target.value)
                }}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer' }}
                >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c} style={{ color: '#000' }}>
                    {c}
                  </option>
                  ))}
              </select>
            </div>
            {/* Account */}
            <div ref={acctRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setAcctOpen((v) => !v)}
                style={{ ...navLink, padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {session ? 'Account ▾' : 'Sign in ▾'}
              </button>
              {acctOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 34,
                    right: 0,
                    width: 220,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 8,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  }}
                >
                  {session ? (
                    <>
                      <Link href="/account" style={menuItem}>My account</Link>
                      <Link href="/orders" style={menuItem}>My orders</Link>
                      <Link href="/track" style={menuItem}>Track an order</Link>
                      <Link href="/messages" style={menuItem}>Messages</Link>
                      <Link href="/account/wishlist" style={menuItem}>Wishlist</Link>
                      <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                      {isSeller ? (
                        <>
                          <Link href="/dashboard" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>
                            Seller dashboard
                          </Link>
                          <Link href={`/seller/${sellerId}`} style={menuItem}>
                            View my store
                          </Link>
                        </>
                      ) : (
                        <Link href="/sell" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>
                          Start selling
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        style={{ ...menuItem, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/sign-in" style={menuItem}>Sign in</Link>
                      <Link href="/auth/sign-up" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>
                        Create account
                      </Link>
                      <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                      <Link href="/orders" style={menuItem}>Track an order</Link>
                      <Link href="/sell" style={menuItem}>Sell on Velor</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sell CTA */}
            <Link
              href="/sell"
              className="velor-desktop-nav"
              style={{
                background: 'var(--accent)',
                color: '#000',
                fontWeight: 800,
                fontSize: 13,
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              Start selling
            </Link>

            {/* Mobile toggle */}
            <button
              className="velor-mobile-toggle"
              onClick={() => setMobileOpen((v) => !v)}
              style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', fontSize: 22, cursor: 'pointer' }}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '10px 20px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link href="/shop" style={menuItem}>Shop</Link>
            <Link href="/sell" style={menuItem}>Sell on Velor</Link>
            <Link href="/about" style={menuItem}>How it works</Link>
            <Link href="/orders" style={menuItem}>My orders</Link>
            <Link href="/track" style={menuItem}>Track an order</Link>
            <Link href="/messages" style={menuItem}>Messages</Link>
            {session ? (
              isSeller
                ? (
                  <>
                    <Link href="/dashboard" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>Seller dashboard</Link>
                    <Link href={`/seller/${sellerId}`} style={menuItem}>View my store</Link>
                  </>
                )
                : <Link href="/sell" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>Start selling</Link>
            ) : (
              <>
                <Link href="/auth/sign-in" style={menuItem}>Sign in</Link>
                <Link href="/auth/sign-up" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>Create account</Link>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .velor-desktop-nav { display: none !important; }
          .velor-mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  )
}
