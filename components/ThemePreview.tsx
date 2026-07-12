'use client'

import { useEffect, useState } from 'react'

export default function ThemePreview() {
  const [enabled, setEnabled] = useState(false)
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('theme')
    if (t === 'light' || t === 'dark') {
      setEnabled(true)
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
    }
  }, [])

  if (!enabled) return null

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    const url = new URL(window.location.href)
    url.searchParams.set('theme', next)
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <button
      onClick={toggle}
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
      {theme === 'light' ? 'Preview: Light (tap for Dark)' : 'Preview: Dark (tap for Light)'}
    </button>
  )
}
