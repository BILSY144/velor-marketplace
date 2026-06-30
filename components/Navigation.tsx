'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(13,13,13,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 32,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.03em',
          }}>
            VELOR
          </span>
          <span style={{
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 7px',
            borderRadius: 4,
          }}>
            MARKETPLACE
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          <Link href="/shop" style={{
            color: 'var(--muted)',
            fontSize: 14,
            fontWeight: 500,
            padding: '8px 14px',
            borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            Shop
          </Link>
          <Link href="/sell" style={{
            color: 'var(--muted)',
            fontSize: 14,
            fontWeight: 500,
            padding: '8px 14px',
            borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            Sell
          </Link>
          <Link href="/about" style={{
            color: 'var(--muted)',
            fontSize: 14,
            fontWeight: 500,
            padding: '8px 14px',
            borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            About
          </Link>
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <Link href="/login" style={{
            color: 'var(--muted)',
            fontSize: 14,
            fontWeight: 500,
          }}>
            Log in
          </Link>
          <Link href="/sell" style={{
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            padding: '9px 20px',
            borderRadius: 6,
            letterSpacing: '-0.01em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Start Selling
          </Link>
        </div>
      </div>
    </header>
  );
}
