'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'velor-theme'

export default function ThemePreview() {
  useEffect(() => {
    let initial = 'light'
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
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  return null
}
