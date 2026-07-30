'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getDisplayCurrency, setStoredCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency'
import { getDisplayLanguage, setStoredLanguage, SUPPORTED_LANGUAGES } from '@/lib/language'
import { useCart } from '@/lib/cart'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'
import { pexelsUrl, matchCraftImagery } from '@/lib/countryImagery'
import { CATEGORIES as CATEGORY_DEFS } from '@/lib/categories'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'
import NotificationBell from '@/components/NotificationBell'

function navFlag(code: string): string {
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
}

// Live inline search -- matches the app's Atlas/Search screens (always-open
// results as you type, no page reload needed to see a match). Country
// matching is instant and client-side (same alias table as /search); the
// same alias set is duplicated here rather than imported so this component
// has no dependency on the /search route existing -- if /search is ever
// removed or redesigned, the header's live results still work standalone.
const HEADER_COUNTRY_ALIASES: Record<string, string> = {
  'uk': 'GB', 'britain': 'GB', 'great britain': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
  'usa': 'US', 'america': 'US', 'united states': 'US', 'us': 'US',
  'uae': 'AE', 'emirates': 'AE', 'holland': 'NL', 'czechia': 'CZ', 'burma': 'MM',
}

function matchHeaderCountries(q: string): { code: string; name: string }[] {
  const t = q.trim().toLowerCase()
  if (t.length < 2) return []
  const alias = HEADER_COUNTRY_ALIASES[t]
  const out: { code: string; name: string }[] = []
  if (alias) {
    const c = WORLD_COUNTRIES.find((w) => w.code === alias)
    if (c) out.push(c)
  }
  for (const c of WORLD_COUNTRIES) {
    if (out.some((x) => x.code === c.code)) continue
    const n = c.name.toLowerCase()
    if (t.length === 2 ? n.startsWith(t) : (n.includes(t) || t.includes(n))) out.push(c)
    if (out.length >= 4) break
  }
  return out
}

interface HeaderSearchHit {
  id: string
  name: string
  price: number
  currency: string
  image: string | null
  category: string
}

// Mobile behaviour lives in the responsive layer of app/globals.css, keyed on
// the velor-* class names used below. Do not target inline styles from CSS --
// React serialises them with spaces and normalised units, so attribute
// substring selectors silently never match.

/* Inline SVG icons for William's 2026-07-30 header design (no emojis). */
function HIco({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const HP = {
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  tag: 'M4 4h7l9 9-7 7-9-9V4zM8.5 8.5h.01',
  broadcast: 'M12 12h.01M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-3.5 3-5.5 7-5.5s7 2 7 5.5M17 3.5a4 4 0 0 1 0 7.6M22 21c0-3-2-4.8-5-5.4',
  heart: 'M12 21C7 16.5 3.5 13.2 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .8 3.9 2a4.9 4.9 0 0 1 3.9-2 4.6 4.6 0 0 1 4.6 4.6c0 3.6-3.5 6.9-8.5 11.4z',
  cart: 'M6 7h12l1.5 14h-15L6 7zM9 10V7a3 3 0 0 1 6 0v3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',
  store: 'M4 8l1-4h14l1 4M4 8h16M5 8v12h14V8M9 20v-6h6v6',
  star: 'M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.3l7.1-.7L12 2z',
  book: 'M2 5c3-1.5 6-1.5 10 0 4-1.5 7-1.5 10 0v14c-3-1.5-6-1.5-10 0-4-1.5-7-1.5-10 0V5zM12 5v14',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.7.3-.9.7-.9 1.7M12 17h.01',
  videoplay: 'M3 5h18v14H3zM10 9l5 3-5 3V9z',
  trophy: 'M7 4h10v4a5 5 0 0 1-10 0V4zM7 5H4a3 3 0 0 0 3.5 3M17 5h3a3 3 0 0 1-3.5 3M10 16h4l1 5H9l1-5zM12 13v3M8 21h8',
  calendar: 'M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9h16M8 2v4M16 2v4',
  play: 'M8 5.5v13l11-6.5L8 5.5z',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  shieldcheck: 'M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4zM9 12l2 2 4-4',
  truck: 'M1 7h12v8H1zM13 10h5l3 3v2h-8v-5zM6 18h.01M17 18h.01',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  headset: 'M4 13a8 8 0 0 1 16 0M3 13h3v5H3zM18 13h3v5h-3zM21 16v2a3 3 0 0 1-3 3h-4',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-2 5-4 1 2-5 4-1z',
}

export default function GlobalHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { symbol, convert } = useCurrencyDisplay()


  const { count: cartCount } = useCart()
  const [query, setQuery] = useState('')
  const [megaOpen, setMegaOpen] = useState(false)
  const [liveCount, setLiveCount] = useState<number | null>(null)
  const [acctOpen, setAcctOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currency, setCurrency] = useState('GBP')
  const [language, setLanguage] = useState('en')
  const [langNote, setLangNote] = useState<string | null>(null)

  // Live search dropdown -- always-visible inline results, matching the
  // app's Atlas/Search screens. Debounced so every keystroke doesn't hit
  // the network, but results appear without leaving the page or pressing
  // Enter; Enter/submit still works and goes to the full /search page.
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<HeaderSearchHit[]>([])
  const [countryHits, setCountryHits] = useState<{ code: string; name: string }[]>([])
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Category hits are a plain filter over CATEGORY_DEFS -- no network round
  // trip, so a category name (e.g. "ceramics") shows up instantly even
  // pre-launch, when zero real products exist to match against in
  // /api/search's product-only query (William, 2026-07-19: typed "ceramics"
  // and got "Nothing by that name -- yet." -- the header only matched
  // countries and existing products, never categories themselves).
  const categoryHits = query.trim().length >= 2
    ? CATEGORY_DEFS.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4)
    : []

  // Craft hits match specific product terms (e.g. "kintsugi", "washi") against
  // lib/countryImagery.ts's per-craft photography (falling back to
  // lib/cultureHints.ts's broader term list) -- the same depth the app's
  // Atlas/Search screens already search, each hit carrying its own real photo
  // (William, 2026-07-19: "the app offers such a large product search some
  // that are not even on the website" / "cultural hints with the imagery
  // like app"). Instant like categoryHits: a plain in-memory filter.
  const craftHits = query.trim().length >= 2 ? matchCraftImagery(query.trim(), 4) : []

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSearchResults([])
      setCountryHits([])
      setSearchLoading(false)
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
      return
    }
    setSearchLoading(true)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(async () => {
      setCountryHits(matchHeaderCountries(q))
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSearchResults((data.results ?? []).slice(0, 6))
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 260)
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
    }
  }, [query])

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

  const megaRef = useRef<HTMLDivElement>(null)
  const acctRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMegaOpen(false)
    setAcctOpen(false)
    setMobileOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false)
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false)
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Real live-session count for the mega menu's "Live Now" row -- fetched
  // lazily on first open so the header adds zero requests to normal loads.
  useEffect(() => {
    if (!megaOpen || liveCount !== null) return
    fetch('/api/live')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.streams) setLiveCount((d.streams as { status: string }[]).filter((x) => x.status === 'LIVE').length)
      })
      .catch(() => {})
  }, [megaOpen, liveCount])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    setSearchOpen(false)
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/shop')
  }

  const showDropdown = searchOpen && query.trim().length >= 2
  const hasHits = countryHits.length > 0 || categoryHits.length > 0 || craftHits.length > 0 || searchResults.length > 0

  const changeLanguage = (value: string) => {
    setLanguage(value)
    setStoredLanguage(value)
    const l = SUPPORTED_LANGUAGES.find((x) => x.code === value)
    if (l && value !== 'en') {
      // Honest, same as the app's Language screen: Velor speaks all 19 with
      // sellers today; the buyer-facing site ships English-first until launch.
      setLangNote(`Translating Velor into ${l.native} — a page's first visit takes a few seconds, then it's instant.`)
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

  /* Mega-menu shared styles (William's header design, 2026-07-30). */
  const megaTitle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 13.5,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text)',
  }
  const megaSub: React.CSSProperties = {
    fontSize: 12.5,
    color: 'var(--muted)',
    marginBottom: 14,
    lineHeight: 1.5,
  }
  const megaRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '7px 8px',
    margin: '0 -8px',
    borderRadius: 10,
    color: 'var(--text)',
    textDecoration: 'none',
  }
  const megaIconBox: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 9,
    background: 'var(--surface-2)',
    color: 'var(--accent)',
    flexShrink: 0,
  }
  const megaChev: React.CSSProperties = {
    color: 'var(--muted)',
    fontSize: 17,
    lineHeight: 1,
    flexShrink: 0,
  }
  const megaViewAll: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 'auto',
    paddingTop: 14,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-display)',
    color: 'var(--accent)',
    textDecoration: 'none',
  }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, fontFamily: 'var(--font-body)' }}>
      {/* Top strip -- William's header design 2026-07-30: five value points
          with orange icons. Keeps the velor-trustbar class so the existing
          mobile single-scroll-line behaviour applies. */}
      <div
        className="velor-trustbar"
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '9px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {(
          [
            { l: '190 Countries Connected', i: HP.globe },
            { l: 'Free To List', i: HP.tag },
            { l: 'Live Seller Access', i: HP.broadcast },
            { l: 'Global Community', i: HP.users },
            { l: 'Real People. Real Culture.', i: HP.heart },
          ] as { l: string; i: string }[]
        ).map((item, idx) => (
          <span key={item.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {idx > 0 && <span style={{ opacity: 0.25, margin: '0 18px', fontWeight: 400 }}>|</span>}
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><HIco d={item.i} size={14} /></span>
            {item.l}
          </span>
        ))}
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
            maxWidth: 1680,
            margin: '0 auto',
            padding: '10px 24px',
            minHeight: 76,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Logo */}
          <Link href="/" className="velor-logo-link" style={{ display: 'block', flexShrink: 0 }} aria-label="Velor home">
            <img src="/velor-logo-2026.png" alt="Velor — Global Marketplace" style={{ height: 40, width: 'auto' }} />
          </Link>

          {/* Primary nav (desktop) -- Shop / Live / Origins open the shared
              mega menu (William's header design, 2026-07-30); The Makers'
              Circle is a direct link with the active orange underline. */}
          <nav className="velor-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            {(['Shop', 'Live'] as const).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setMegaOpen((v) => !v)}
                aria-expanded={megaOpen}
                style={{ ...navLink, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                {label} <span style={{ fontSize: 10, color: 'var(--muted)' }}>▾</span>
              </button>
            ))}
            <Link
              href="/community"
              style={{
                ...navLink,
                color: pathname?.startsWith('/community') ? 'var(--accent)' : 'var(--text)',
                borderBottom: pathname?.startsWith('/community') ? '2px solid var(--accent)' : '2px solid transparent',
                paddingBottom: 6,
                whiteSpace: 'nowrap',
              }}
            >
              The Makers&apos; Circle
            </Link>
            <button
              type="button"
              onClick={() => setMegaOpen((v) => !v)}
              aria-expanded={megaOpen}
              style={{ ...navLink, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              Origins <span style={{ fontSize: 10, color: 'var(--muted)' }}>▾</span>
            </button>
          </nav>

          {/* Search. On phones this wraps onto its own full-width row.
              Live/inline: results appear below as you type (Atlas-style),
              matching the app -- no need to press Enter or leave the page
              to see a match. Enter/submit still works and opens /search. */}
          <div ref={searchWrapRef} className="velor-searchform" style={{ position: 'relative', flex: '0 1 340px', minWidth: 150 }}>
            <form onSubmit={submitSearch}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 0,
                  padding: '9px 16px',
                }}
              >
                <span style={{ color: 'var(--muted)', fontSize: 14 }}>⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search goods, country or seller"
                  aria-label="Search goods, country or seller"
                  autoComplete="off"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text)',
                    /* 16px stops iOS Safari zooming the page on focus. */
                    fontSize: 16,
                    /* Space Grotesk in every search bar (William, 2026-07-30:
                       "a good font to fit the website") -- the site's own
                       display face, matching kickers and buttons. */
                    fontFamily: 'var(--font-display)',
                  }}
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => { setQuery(''); setSearchResults([]); setCountryHits([]) }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 15, padding: 0, flexShrink: 0 }}
                  >
                    ✕
                  </button>
                )}
                {/* Clickable submit (William, 2026-07-17) -- Enter still works too */}
                <button
                  type="submit"
                  aria-label="Search"
                  style={{
                    background: 'var(--accent)',
                    color: '#160a00',
                    border: 'none',
                    borderRadius: 0,
                    padding: '5px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    flexShrink: 0,
                    margin: '-4px -8px -4px 0',
                  }}
                >
                  Search
                </button>
              </div>
            </form>

            {/* Live results dropdown -- never a dead end: loading, hits, and
                a designed empty state (no bare "no results" flash). */}
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 48,
                  left: 0,
                  right: 0,
                  minWidth: 320,
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 8,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  zIndex: 60,
                }}
              >
                {searchLoading && !hasHits && (
                  <div style={{ padding: '18px 14px', fontSize: 13, color: 'var(--muted)' }}>Searching...</div>
                )}

                {!searchLoading && !hasHits && (
                  <div style={{ padding: '22px 16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
                      Nothing by that name -- yet.
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
                      Try a country&apos;s name, or a craft -- weaving, ceramics, leather&hellip;
                    </div>
                    <Link
                      href="/shop"
                      onClick={() => setSearchOpen(false)}
                      style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      Browse the shop &rarr;
                    </Link>
                  </div>
                )}

                {categoryHits.length > 0 && (
                  <div style={{ marginBottom: (craftHits.length > 0 || countryHits.length > 0 || searchResults.length > 0) ? 6 : 0 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, padding: '6px 10px 4px' }}>
                      Categories
                    </div>
                    {categoryHits.map((cat) => {
                      const imgUrl = cat.image ? pexelsUrl(cat.image.id, cat.image.slug, 80) : null
                      return (
                        <Link
                          key={cat.slug}
                          href={`/shop?category=${encodeURIComponent(cat.name)}`}
                          onClick={() => setSearchOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, textDecoration: 'none', color: 'var(--text)' }}
                        >
                          <span style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0 }}>
                            {imgUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imgUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{cat.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Category &rarr;</span>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {craftHits.length > 0 && (
                  <div style={{ marginBottom: (countryHits.length > 0 || searchResults.length > 0) ? 6 : 0 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, padding: '6px 10px 4px' }}>
                      Crafts
                    </div>
                    {craftHits.map((h) => (
                      <Link
                        key={h.code + h.term}
                        href={`/shop?origin=${h.code}&speciality=${encodeURIComponent(h.term)}`}
                        onClick={() => setSearchOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, textDecoration: 'none', color: 'var(--text)' }}
                      >
                        <span style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0 }}>
                          {h.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={h.image.url} alt={h.term} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.term}</span>
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{navFlag(h.code)} {h.name}</span>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Craft &rarr;</span>
                      </Link>
                    ))}
                  </div>
                )}

                {countryHits.length > 0 && (
                  <div style={{ marginBottom: searchResults.length > 0 ? 6 : 0 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, padding: '6px 10px 4px' }}>
                      Shopping channels
                    </div>
                    {countryHits.map((c) => (
                      <Link
                        key={c.code}
                        href={`/shop?origin=${c.code}`}
                        onClick={() => setSearchOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, textDecoration: 'none', color: 'var(--text)' }}
                      >
                        <span style={{ fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 }}>{navFlag(c.code)}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Channel &rarr;</span>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, padding: '6px 10px 4px' }}>
                      Goods
                    </div>
                    {searchResults.map((item) => (
                      <Link
                        key={item.id}
                        href={`/shop/${item.id}`}
                        onClick={() => setSearchOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, textDecoration: 'none', color: 'var(--text)' }}
                      >
                        <span style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: 9, color: 'var(--muted)' }}>No image</span>
                          )}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{item.category}</span>
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                          {symbol}{convert(item.price, item.currency).toFixed(2)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {hasHits && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    onClick={() => setSearchOpen(false)}
                    style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', padding: '10px 10px 6px', marginTop: 4, borderTop: '1px solid var(--border)' }}
                  >
                    See all results for &ldquo;{query.trim()}&rdquo; &rarr;
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right cluster -- two rows per William's header design 2026-07-30:
              icons + pickers above, Start selling + Dark mode below. */}
          <div className="velor-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9, flexShrink: 0, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <NotificationBell />
              <Link href="/account/wishlist" className="velor-desktop-nav" style={{ ...navLink, padding: 0, display: 'inline-flex' }} title="Wishlist" aria-label="Wishlist">
                <HIco d={HP.heart} size={19} />
              </Link>
              <Link href="/checkout" style={{ ...navLink, padding: 0, position: 'relative', display: 'inline-flex' }} title="Cart — prices convert live to your currency and are reconfirmed at checkout, so there is never a surprise charge." aria-label="Cart">
                <HIco d={HP.cart} size={19} />
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

              {/* Language switcher — the 19 languages Velor speaks, with the
                  design's globe icon. Stored choice + honest note unchanged. */}
              <div className="velor-currency" style={{ ...navLink, display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                <span style={{ display: 'inline-flex', color: 'var(--text)', opacity: 0.85 }}><HIco d={HP.globe} size={15} /></span>
                <select
                  title="Velor speaks 19 languages. Pick yours and every page translates as you browse."
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
                  style={{ ...navLink, padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <HIco d={HP.user} size={16} /> {session ? 'Account' : 'Sign in'} <span style={{ fontSize: 10, color: 'var(--muted)' }}>▾</span>
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
                      zIndex: 70,
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
                        <Link href="/auth/join" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>
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

            <div className="velor-desktop-nav" style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/sell"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1.5px solid var(--accent)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                  padding: '8px 18px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                <HIco d={HP.store} size={14} /> Start selling
              </Link>
              <button
                type="button"
                onClick={() => {
                  const next = themeMode === 'light' ? 'dark' : 'light'
                  document.documentElement.setAttribute('data-theme', next)
                  try { window.localStorage.setItem('velor-theme', next) } catch (e) {}
                  setThemeMode(next)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  color: 'var(--text)',
                  fontWeight: 700,
                  fontSize: 13,
                  border: '1px solid var(--border)',
                  padding: '8px 18px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                aria-label="Toggle light and dark theme"
              >
                <HIco d={HP.moon} size={14} /> {themeMode === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mega menu -- William's header design 2026-07-30: one shared panel
          opened by Shop / Live / Origins, with the Makers' Circle column,
          Origins column, promo panel and the five-point footer strip.
          Hidden on phones via velor-desktop-nav (mobile keeps its panel). */}
      {megaOpen && (
        <div ref={megaRef} className="velor-desktop-nav" style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 60, padding: '10px 14px 26px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 40px 90px rgba(0,0,0,0.55)', maxWidth: 1680, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.02fr 1.06fr 1.06fr 1fr 1.42fr' }}>

              {/* SHOP */}
              <div style={{ padding: '22px 20px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><HIco d={HP.cart} size={17} /></span>
                  <span style={megaTitle}>Shop</span>
                </div>
                <div style={megaSub}>Browse authentic goods from around the world</div>
                {(
                  [
                    { l: 'All Categories', img: 'cat-1', href: '/shop' },
                    { l: 'Home & Living', img: 'cat-2', href: `/shop?category=${encodeURIComponent('Home Craft & Décor')}` },
                    { l: 'Clothing & Textiles', img: 'cat-3', href: `/shop?category=${encodeURIComponent('Rugs, Cloth & Thread')}` },
                    { l: 'Jewellery & Accessories', img: 'cat-4', href: `/shop?category=${encodeURIComponent('Adornment')}` },
                    { l: 'Art & Collectibles', img: 'cat-5', href: '/shop' },
                    { l: 'Tools & Materials', img: 'cat-6', href: `/shop?category=${encodeURIComponent('Metalware')}` },
                    { l: 'Food & Beverages', img: 'cat-7', href: `/shop?category=${encodeURIComponent('Spice & Pantry Staples')}` },
                  ] as { l: string; img: string; href: string }[]
                ).map((r) => (
                  <Link key={r.l} href={r.href} style={megaRow}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/community/header/${r.img}.jpg`} alt="" aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{r.l}</span>
                    <span style={megaChev}>&rsaquo;</span>
                  </Link>
                ))}
                <Link href="/shop" style={megaViewAll}>View all categories <span aria-hidden="true">&rarr;</span></Link>
              </div>

              {/* LIVE */}
              <div style={{ padding: '22px 20px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><HIco d={HP.broadcast} size={17} /></span>
                  <span style={megaTitle}>Live</span>
                </div>
                <div style={megaSub}>Watch, chat and shop live with makers</div>
                {(
                  [
                    { l: 'Live Now', sub: liveCount === null ? 'Live sessions' : liveCount === 0 ? 'No one on air right now' : `${liveCount} live session${liveCount === 1 ? '' : 's'}`, icon: 'reddot', href: '/live' },
                    { l: "Today's Schedule", sub: "What's happening today", icon: HP.calendar, href: '/live' },
                    { l: 'Replay Shows', sub: 'Watch past sessions', icon: HP.play, href: '/live' },
                    { l: 'Top Live Sellers', sub: 'Most watched today', icon: HP.star, href: '/live' },
                    { l: 'Become a Live Seller', sub: 'Start your broadcast', icon: HP.camera, href: '/sell' },
                  ] as { l: string; sub: string; icon: string; href: string }[]
                ).map((r) => (
                  <Link key={r.l} href={r.href} style={megaRow}>
                    <span style={megaIconBox}>
                      {r.icon === 'reddot' ? (
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
                      ) : (
                        <HIco d={r.icon} size={16} />
                      )}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{r.l}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{r.sub}</span>
                    </span>
                    <span style={megaChev}>&rsaquo;</span>
                  </Link>
                ))}
                <Link href="/dashboard/live" style={{ display: 'block', borderRadius: 12, overflow: 'hidden', marginTop: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/community/header/golive.jpg" alt="Go live. Reach the world. Start a live session" style={{ width: '100%', display: 'block' }} />
                </Link>
              </div>

              {/* THE MAKERS' CIRCLE */}
              <div style={{ padding: '22px 20px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><HIco d={HP.users} size={17} /></span>
                  <span style={megaTitle}>The Makers&rsquo; Circle</span>
                </div>
                <div style={megaSub}>Connect, learn and grow with makers worldwide</div>
                {(
                  [
                    { l: 'Featured Today', sub: "Today's highlights", icon: HP.star, href: '/community/featured' },
                    { l: 'Creator Journals', sub: 'Stories from real makers', icon: HP.book, href: '/community/journals' },
                    { l: 'Ask The Maker', sub: 'Questions & answers', icon: HP.help, href: '/community/ask' },
                    { l: 'Workshop Videos', sub: 'Learn traditional skills', icon: HP.videoplay, href: '/community/videos' },
                    { l: 'Live Shopping', sub: 'Buy directly from makers', icon: HP.broadcast, href: '/community/live-shopping' },
                    { l: 'Community Challenge', sub: 'Join & win rewards', icon: HP.trophy, href: '/community/challenge' },
                  ] as { l: string; sub: string; icon: string; href: string }[]
                ).map((r) => (
                  <Link key={r.l} href={r.href} style={megaRow}>
                    <span style={megaIconBox}><HIco d={r.icon} size={16} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{r.l}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{r.sub}</span>
                    </span>
                    <span style={megaChev}>&rsaquo;</span>
                  </Link>
                ))}
                <Link
                  href="/auth/join"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, border: '1px solid rgba(212,175,55,0.55)', borderRadius: 12, padding: '12px 14px', textDecoration: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: '50%', border: '1.3px solid #D4AF37', color: '#D4AF37', flexShrink: 0 }}>
                    <HIco d={HP.globe} size={17} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: '#D4AF37' }}>Join The Circle</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>Unlock exclusive benefits for makers &amp; supporters</span>
                  </span>
                  <span style={{ ...megaChev, color: '#D4AF37' }}>&rsaquo;</span>
                </Link>
              </div>

              {/* ORIGINS */}
              <div style={{ padding: '22px 20px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><HIco d={HP.compass} size={17} /></span>
                  <span style={megaTitle}>Origins</span>
                </div>
                <div style={megaSub}>Discover the stories behind culture and craftsmanship</div>
                {(
                  [
                    { l: 'Countries', sub: 'Explore all 190 countries', img: 'org-1', href: '/shop' },
                    { l: 'Cultures', sub: 'Traditions & heritage', img: 'org-2', href: '/founding' },
                    { l: 'Crafts', sub: 'Traditional crafts', img: 'org-3', href: '/shop' },
                    { l: 'Materials', sub: 'Natural & authentic', img: 'org-4', href: '/shop' },
                    { l: 'Origins Stories', sub: 'The story behind it all', img: 'org-5', href: '/mission' },
                  ] as { l: string; sub: string; img: string; href: string }[]
                ).map((r) => (
                  <Link key={r.l} href={r.href} style={megaRow}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/community/header/${r.img}.jpg`} alt="" aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{r.l}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{r.sub}</span>
                    </span>
                    <span style={megaChev}>&rsaquo;</span>
                  </Link>
                ))}
                <Link href="/shop" style={megaViewAll}>View all origins <span aria-hidden="true">&rarr;</span></Link>
              </div>

              {/* PROMO -- image extracted from William's design; the whole
                  panel opens the Makers' Circle. */}
              <Link href="/community" aria-label="Real Makers. Real Stories. Real Culture. Explore the community" style={{ display: 'block', position: 'relative', minHeight: 420 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/community/header/promo.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </Link>
            </div>

            {/* Footer strip */}
            <div style={{ borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, padding: '16px 24px' }}>
              {(
                [
                  { t: 'Authentic & Verified', sub: 'Every seller verified', icon: HP.shieldcheck },
                  { t: 'Global Shipping', sub: 'Delivering worldwide', icon: HP.truck },
                  { t: 'Secure Payments', sub: 'Safe, trusted & protected', icon: HP.lock },
                  { t: 'Seller Support', sub: "We're here to help", icon: HP.headset },
                  { t: 'Buy With Impact', sub: 'Support real communities', icon: HP.star },
                ] as { t: string; sub: string; icon: string }[]
              ).map((f) => (
                <div key={f.t} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex', flexShrink: 0 }}><HIco d={f.icon} size={19} /></span>
                  <span>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{f.t}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{f.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
          <Link href="/shop" style={menuItem}>Shop by origin</Link>
          <Link href="/community" style={menuItem}>The Makers&apos; Circle</Link>
          <Link href="/sell" style={menuItem}>Sell on Velor</Link>
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
              <Link href="/auth/join" style={{ ...menuItem, color: 'var(--accent)', fontWeight: 700 }}>Create account</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
