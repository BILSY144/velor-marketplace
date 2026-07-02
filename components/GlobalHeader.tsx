'use client'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const CATEGORIES = [
  'All',
  'Fitness & Gym',
  'Electronics',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Health',
  'Toys & Games',
  'Fashion',
  'Automotive',
  'Jewellery & Watches',
  'Baby & Kids',
  'Pet Supplies',
  'Books & Education',
  'Art & Crafts',
  'Office & Stationery',
  'Travel & Luggage',
  'Food & Grocery',
]

interface SearchResult {
  id: string
  name: string
  price: number
  image: string | null
  category: string
  sellerId: string
  sellerName: string
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  )
}

export default function GlobalHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function updateCount() {
      try {
        const cart = JSON.parse(localStorage.getItem('velor-cart') || '[]')
        const count = Array.isArray(cart) ? cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : 0
        setCartCount(count)
      } catch {
        setCartCount(0)
      }
    }
    updateCount()
    window.addEventListener('storage', updateCount)
    return () => window.removeEventListener('storage', updateCount)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setActiveCategory(params.get('category') || 'All')
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const runLiveSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    setSearching(true)
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(q))
      const data = await res.json()
      setSearchResults(data.results ?? [])
      setShowDropdown(true)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearchQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runLiveSearch(val), 300)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowDropdown(false)
      router.push('/search?q=' + encodeURIComponent(searchQuery.trim()))
    }
  }

  function handleResultClick() {
    setShowDropdown(false)
    setSearchQuery('')
  }

  const canSell = session?.user?.role === 'SELLER' || session?.user?.role === 'ADMIN'
  const isShopPage = pathname.startsWith('/shop')

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0D0D0D', borderBottom: '1px solid #2A2A2A' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>

        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 800, color: '#FF6B00', letterSpacing: '-0.5px' }}>VELOR</span>
        </Link>

        <div ref={searchRef} style={{ flex: 1, maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex' }}>
            <input
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Search for anything..."
              style={{ flex: 1, height: '40px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
            <button
              type="submit"
              style={{ height: '40px', padding: '0 20px', background: '#FF6B00', border: 'none', borderRadius: '0 8px 8px 0', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}
            >
              Search
            </button>
          </form>

          {showDropdown && (
            <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '10px', overflow: 'hidden', zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: '420px', overflowY: 'auto' }}>
              {searching && (
                <div style={{ padding: '16px', color: '#999', fontSize: '13px', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>Searching...</div>
              )}
              {!searching && searchResults.length === 0 && (
                <div style={{ padding: '16px', color: '#999', fontSize: '13px', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>No results found</div>
              )}
              {!searching && searchResults.map(item => (
                <Link
                  key={item.id}
                  href={'/marketplace/' + item.id}
                  onClick={handleResultClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid #222', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#222'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#111', flexShrink: 0 }}>
                    {item.image
                      ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: '#222' }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#999', fontFamily: 'Inter, sans-serif' }}>{item.category} Â· {item.sellerName}</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF6B00', fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0 }}>Â£{item.price.toFixed(2)}</div>
                </Link>
              ))}
              {!searching && searchResults.length > 0 && (
                <Link
                  href={'/search?q=' + encodeURIComponent(searchQuery)}
                  onClick={handleResultClick}
                  style={{ display: 'block', padding: '12px 14px', textAlign: 'center', color: '#FF6B00', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', textDecoration: 'none', borderTop: '1px solid #2A2A2A' }}
                >
                  See all results for "{searchQuery}"
                </Link>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: 'auto' }}>
          {!canSell && (
            <Link href="/sell" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#FF6B00', padding: '6px 14px', border: '1px solid #FF6B00', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
              Sell on Velor
            </Link>
          )}

          <Link
            href="/checkout"
            style={{ textDecoration: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#fff' }}
          >
            <CartIcon />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#FF6B00', color: '#fff', fontSize: '10px', fontWeight: 700, fontFamily: 'Inter, sans-serif', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' }}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {session ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FF6B00', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', top: '44px', right: 0, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '8px', minWidth: '180px', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #2A2A2A', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', color: '#999', fontFamily: 'Inter, sans-serif' }}>Signed in as</div>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user?.name || session.user?.email}</div>
                  </div>
                  {canSell && (
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', color: '#fff', textDecoration: 'none', fontSize: '14px', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
                      Seller Dashboard
                    </Link>
                  )}
                  <Link href="/orders" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', color: '#fff', textDecoration: 'none', fontSize: '14px', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
                    My Orders
                  </Link>
              <Link href="/messages" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', color: '#fff', textDecoration: 'none', fontSize: '14px', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
                Messages
              </Link>
                  <button
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', color: '#FF1744', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" style={{ textDecoration: 'none', fontSize: '14px', color: '#999', fontFamily: 'Inter, sans-serif' }}>Sign In</Link>
              <Link href="/auth/register" style={{ textDecoration: 'none', fontSize: '14px', fontWeight: 600, color: '#fff', background: '#FF6B00', padding: '8px 16px', borderRadius: '8px', fontFamily: 'Inter, sans-serif' }}>Join Free</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1E1E1E', overflowX: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '4px', height: '40px', alignItems: 'center' }}>
          {CATEGORIES.map(cat => {
            const isActive = isShopPage && cat === activeCategory
            return (
              <Link
                key={cat}
                href={cat === 'All' ? '/shop' : '/shop?category=' + encodeURIComponent(cat)}
                style={{
                  padding: '6px 14px',
                  color: isActive ? '#FF6B00' : '#999',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 600,
                  whiteSpace: 'nowrap',
                  borderBottom: isActive ? '2px solid #FF6B00' : '2px solid transparent',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '28px',
                  transition: 'color 0.15s',
                }}
              >
                {cat}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
