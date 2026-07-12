'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'velor-theme'

export default function ThemePreview() {
  const [theme, setTheme] = useState('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let initial = 'dark'
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') {
        initial = stored
      } else {
        const params = new URLSearchParams(window.location.search)
        const t = params.get('theme')
        if (t === 'light' || t === 'dark') initial = t
      }
    } catch (e) {}
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch (e) {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        background: 'var(--accent)',
        color: '#000',
        border: 'none',
        borderRadius: 999,
        padding: '10px 18px',
        fontWeight: 800,
        fontSize: 13,
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(0,0,0,.35)',
      }}
    >
      {theme === 'light' ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
