'use client'

// Zombie-service-worker cleanup (2026-07-17). An early-June build of this
// site registered a Workbox service worker; the PWA experiment was removed
// from the code, but the worker survived inside every visitor's browser and
// kept serving them a month-old cached copy of the whole site -- stale JS,
// stale pages, "fixed" bugs coming back, hard refresh included. William
// chased exactly this as the country-flag dead-tap bug on his phone.
//
// public/sw.js (the self-destructing worker) is the primary fix: the
// browser's own update check swaps the zombie for a kill-switch that wipes
// caches and unregisters. This component is the belt-and-braces second
// half, run from the root layout on every page load: it unregisters ANY
// service worker on the origin and deletes every Cache Storage entry, which
// also covers browsers whose worker update check is deferred. Keep both
// deployed permanently -- devices that visited in June may not come back
// for months, and this must be waiting when they do.

import { useEffect } from 'react'

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          regs.forEach((reg) => {
            reg.unregister().catch(() => {})
          })
        })
        .catch(() => {})
    }
    if (typeof caches !== 'undefined') {
      caches
        .keys()
        .then((keys) => {
          keys.forEach((key) => {
            caches.delete(key).catch(() => {})
          })
        })
        .catch(() => {})
    }
  }, [])

  return null
}
