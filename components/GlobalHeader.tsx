'use client'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty', 'Art & Crafts', 'Books', 'Toys']

export default function GlobalHeader() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = '/shop?search=' + encodeURIComponent(searchQuery.trim())
    }
  }

  const canSell = session?.user?.role === 'SELLER' || session?.user?.role === 'ADMIN'

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#111111', borderBottom: '1px solid #2A2A2A' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 800, color: '#FF6B00', letterSpacing: '-0.5px' }}>VELOR</span>
        </Link>

        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', maxWidth: '600px', margin: '0 auto' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for anything..."
            style={{ flex: 1, height: '40px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          <button type="submit" style={{ height: '40px', padding: '0 20px', background: '#FF6B00', border: 'none', borderRadius: '0 8px 8px 0', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: 'auto' }}>
          {!canSell && (
            <Link href="/sell" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#FF6B00', padding: '6px 14px', border: '1px solid #FF6B00', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
              Sell on Velor
            </Link>
          )}

          {session ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FF6B00', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', top: '44px', right: 0, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '8px', minWidth: '180px', zIndex: 200 }}>
                  {canSell && (
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', color: '#fff', textDecoration: 'none', fontSize: '14px', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
                      Seller Dashboard
                    </Link>
                  )}
                  <Link href="/orders" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', color: '#fff', textDecoration: 'none', fontSize: '14px', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
                    My Orders
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
              <Link href="/auth/login" style={{ textDecoration: 'none', fontSize: '14px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>Sign In</Link>
              <Link href="/auth/register" style={{ textDecoration: 'none', fontSize: '14px', fontWeight: 600, color: '#fff', background: '#FF6B00', padding: '8px 16px', borderRadius: '8px', fontFamily: 'Inter, sans-serif' }}>Join Free</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1E1E1E', overflowX: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '4px', height: '40px', alignItems: 'center' }}>
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat}
              href={cat === 'All' ? '/shop' : '/shop?category=' + encodeURIComponent(cat)}
              style={{ padding: '6px 14px', color: i === 0 ? '#FF6B00' : '#999', textDecoration: 'none', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: i === 0 ? '2px solid #FF6B00' : '2px solid transparent', fontFamily: 'Inter, sans-serif', lineHeight: '28px' }}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}