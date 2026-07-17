'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getDisplayCurrency, setStoredCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency'
import { getDisplayLanguage, setStoredLanguage, SUPPORTED_LANGUAGES } from '@/lib/language'
import { useCart } from '@/lib/cart'
import { slugifyCountryName, WORLD_COUNTRIES } from '@/lib/worldCountries'
import { countryImage } from '@/lib/countryImagery'

function navFlag(code: string): string {
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
}

// Mobile behaviour lives in the responsive layer of app/globals.css, keyed on
// the velor-* class names used below. Do not target inline styles from CSS --
// React serialises them with spaces and normalised units, so attribute
// substring selectors silently never match.

export default function GlobalHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  
  const { count: cartCount } = useCart()
  const [query, setQuery] = useState('')
  const [catsOpen, setCatsOpen] = useState(false)
  const [acctOpen, setAcctOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currency, setCurrency] = useState('GBP')
  const [language, setLanguage] = useState('en')
  const [langNote, setLangNote] = useState<string | null>(null)

  useEffect(() => {
    setCurrency(getDisplayCurrency())
    setLanguage(getDisplayLanguage())
    const onCurrencyChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (detail) setCurrency(detail)
    }
    window.addEventListener('velor-currency-changed', onCurrencyChange)
    return () => window.removeEventListener('velor-currency-changed', onCurrencyChange)
  }, [])

  const [themeMode, setThemeMode] = useState('light')

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    if (current === 'light' || current === 'dark') setThemeMode(current)
  }, [])

  const catsRef = useRef<HTMLDivElement>(null)
  const acctRef = useRef<HTMLDivElement>(null)

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

  const changeLanguage = (value: string) => {
    setLanguage(value)
    setStoredLanguage(value)
    const l = SUPPORTED_LANGUAGES.find((x) => x.code === value)
    if (l && value !== 'en') {
      // Honest, same as the app's Language screen: Velor speaks all 19 with
      // sellers today; the buyer-facing site ships English-first until launch.
      setLangNote(`Saved. Velor speaks ${l.native} with its sellers today — the site in ${l.native} arrives with the buyer launch.`)
      window.setTimeout(() => setLangNote(null), 7000)
    } else {
      setLangNote(null)
    }
  }

  const changeCurrency = (value: string) => {
    setCurrency(value)
    setStoredCurrency(value)
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
  const liveNavButton: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--accent)',
    color: '#000',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 800,
    fontFamily: 'var(--font-body)',
    padding: '6px 14px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
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
      {/* Trust micro-bar. On phones this becomes a single scrollable line
          rather than wrapping into five lines of dead space. */}
      <div
        className="velor-trustbar"
        style={{
          background: 'var(--bg)',
          color: 'var(--muted)',
          fontSize: 12,
          letterSpacing: '0.02em',
          textAlign: 'center',
          padding: '7px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ color: 'var(--green)', fontWeight: 700 }}>Buyer protection</span> — your money is held until delivery confirmation
        <span style={{ opacity: 0.4, margin: '0 10px' }}>|</span>
        Verified &amp; ranked sellers
        <span style={{ opacity: 0.4, margin: '0 10px' }}>|</span>
        Secure Stripe checkout
        <span style={{ opacity: 0.4, margin: '0 10px' }}>|</span>
        Global marketplace — prices convert live, reconfirmed at checkout
              </div>

      {/* Main bar */}
      <div
        style={{
          background: 'rgba(var(--bg-rgb), 0.92)',
          backdropFilter: 'saturate(140%) blur(10px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          className="velor-headerbar"
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
          <Link href="/" style={{ display: 'block', flexShrink: 0, marginLeft: -20 }} aria-label="Velor home">
            <img src="/velor-logo-2026.png" alt="Velor — Global Marketplace" style={{ height: 40, width: 'auto' }} />
          </Link>

          {/* Primary nav (desktop) */}
          <nav className="velor-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <Link href="/shop" style={navLink}>Shop</Link>
            <Link href="/live" style={liveNavButton}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#000', display: 'inline-block' }} />
              Live
            </Link>
            <div ref={catsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setCatsOpen((v) => !v)}
                style={{ ...navLink, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Origins ▾
              </button>
              {catsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 40,
                    left: 0,
                    width: 'min(720px, calc(100vw - 40px))',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 10,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* All 190 countries as mini shopping-channel boxes -- the app's
                      Sell-hero design (photo cover melting into black, orange
                      kicker, Fraunces name), William 2026-07-17. Rendered only
                      while open; images lazy-load as the grid scrolls. */}
                  <div style={{ maxHeight: '64vh', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingRight: 4 }}>
                    {WORLD_COUNTRIES.map((o) => {
                      const im = countryImage(o.code, 400)
                      return (
                        <Link
                          key={o.code}
                          href={`/origins/${slugifyCountryName(o.name)}`}
                          style={{ position: 'relative', display: 'block', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/11', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                        >
                          {im && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={im.url} alt={o.name} loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,11,0) 28%, rgba(8,8,11,0.94) 100%)' }} />
                          <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8 }}>
                            <div style={{ fontSize: 8.5, letterSpacing: '0.18em', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{navFlag(o.code)} SHOPPING CHANNEL</div>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#fff', lineHeight: 1.15, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                  <Link
                    href="/origins"
                    style={{ ...menuItem, borderRadius: 9, fontSize: 12.5, marginTop: 8, display: 'block', textAlign: 'center', color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: 12 }}
                  >
                    All 190 countries &rarr;
                  </Link>
                </div>
              )}
            </div>
            <Link href="/about" style={navLink}>How it works</Link>
          </nav>

          {/* Search. On phones this wraps onto its own full-width row. */}
          <form onSubmit={submitSearch} className="velor-searchform" style={{ flex: 1, maxWidth: 460, marginLeft: 'auto' }}>
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
                placeholder="Search goods, brands and sellers"
                aria-label="Search goods, brands and sellers"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  /* 16px stops iOS Safari zooming the page on focus. */
                  fontSize: 16,
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </form>

          {/* Right cluster */}
          <div className="velor-right" style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
            {isSeller && (
              <Link href={`/seller/${sellerId}`} className="velor-desktop-nav" style={{ ...navLink, padding: 0 }} title="View my store">
                My Store
              </Link>
            )}
            <Link href="/account/wishlist" className="velor-desktop-nav" style={{ ...navLink, padding: 0 }} title="Wishlist">
              ♡
            </Link>
            <Link href="/checkout" style={{ ...navLink, padding: 0, position: 'relative' }} title="Cart — prices convert live to your currency and are reconfirmed at checkout, so there is never a surprise charge.">
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

            {/* Language switcher — the 19 languages Velor speaks. Site UI is
                English-first until buyer launch; the choice is stored and an
                honest note explains, mirroring the app's Language screen. */}
            <div className="velor-currency" style={{ ...navLink, display: 'flex', alignItems: 'center', position: 'relative' }}>
              <select
                title="Velor speaks 19 languages. Your sellers can already write to Velor in theirs — the full site in your language arrives with the buyer launch."
                aria-label="Language"
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', maxWidth: 110 }}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} style={{ color: '#000' }}>
                    {l.native}
                  </option>
                ))}
              </select>
              {langNote && (
                <div style={{ position: 'absolute', top: 42, right: 0, width: 280, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 13px', fontSize: 12, lineHeight: 1.5, color: 'var(--text)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 60 }}>
                  {langNote}
                </div>
              )}
            </div>

            {/* Currency switcher (moves into the mobile panel on phones) */}
            <div className="velor-currency" style={{ ...navLink, display: 'flex', alignItems: 'center' }}>
              <select
                title="Velor is a global marketplace. Prices are converted live using current exchange rates and reconfirmed at checkout, so you never see a surprise charge."
                aria-label="Display currency"
                value={currency}
                onChange={(e) => changeCurrency(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer' }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c} style={{ color: '#000' }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Account (moves into the mobile panel on phones) */}
            <div ref={acctRef} className="velor-account-btn" style={{ position: 'relative' }}>
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

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => {
                const next = themeMode === 'light' ? 'dark' : 'light'
                document.documentElement.setAttribute('data-theme', next)
                try { window.localStorage.setItem('velor-theme', next) } catch (e) {}
                setThemeMode(next)
              }}
              className="velor-desktop-nav"
              style={{
                background: 'transparent',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: 13,
                border: '1.5px solid var(--accent)',
                padding: '9px 16px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
              aria-label="Toggle light and dark theme"
            >
              {themeMode === 'light' ? 'Dark mode' : 'Light mode'}
            </button>

            {/* Mobile toggle */}
            <button
              className="velor-mobile-toggle"
              onClick={() => setMobileOpen((v) => !v)}
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                fontSize: 22,
                cursor: 'pointer',
              }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div
          className="velor-mobile-panel"
          style={{ borderTop: '1px solid var(--border)', padding: '10px 20px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <Link href="/shop" style={menuItem}>Shop</Link>
          <div style={{ padding: '11px 16px' }}>
            <Link href="/live" style={liveNavButton}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#000', display: 'inline-block' }} />
              Live
            </Link>
          </div>
          <Link href="/sell" style={menuItem}>Sell on Velor</Link>
          <Link href="/about" style={menuItem}>How it works</Link>
          <Link href="/orders" style={menuItem}>My orders</Link>
          <Link href="/track" style={menuItem}>Track an order</Link>
          <Link href="/messages" style={menuItem}>Messages</Link>
          <Link href="/account/wishlist" style={menuItem}>Wishlist</Link>

          {/* Language + currency live here on phones, where the header row has no space. */}
          <div style={{ ...menuItem, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--muted)' }}>Language</span>
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                font: 'inherit',
                padding: '8px 10px',
                cursor: 'pointer',
              }}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} style={{ color: '#000' }}>
                  {l.native}
                </option>
              ))}
            </select>
          </div>
          {langNote && (
            <div style={{ padding: '4px 14px 10px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{langNote}</div>
          )}

          <div style={{ ...menuItem, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--muted)' }}>Currency</span>
            <select
              aria-label="Display currency"
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                font: 'inherit',
                padding: '8px 10px',
                cursor: 'pointer',
              }}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c} style={{ color: '#000' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

          {session ? (
            <>
              <Link href="/account" style={menuItem}>My account</Link>
              {isSeller ? (
                <>
                  <Link href="/dashboard" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>Seller dashboard</Link>
                  <Link href={`/seller/${sellerId}`} style={menuItem}>View my store</Link>
                </>
              ) : (
                <Link href="/sell" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>Start selling</Link>
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
              <Link href="/auth/sign-up" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>Create account</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
