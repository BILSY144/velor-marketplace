// SELF-DESTRUCTING SERVICE WORKER (2026-07-17).
//
// An early-June build of this site registered a Workbox service worker at
// this exact URL (/sw.js). The PWA experiment was removed from the code,
// but a service worker lives on INSIDE every visitor's browser until it is
// actively replaced -- so those visitors (William's phone included) kept
// being served a month-old cached copy of the whole site: stale JS bundles,
// stale pages, bugs that "came back" after they were fixed, hard refresh
// included. Deleting sw.js is NOT enough: with the file gone the browser's
// update check 404s and the zombie worker survives forever.
//
// This file is the standard kill-switch. Browsers re-check /sw.js on
// navigation; the moment a device fetches this version it will:
//   1. take over immediately (skipWaiting),
//   2. delete every cache this origin has ever created,
//   3. unregister itself,
//   4. reload every open tab so the page leaves service-worker control.
// After that the site loads straight from the network like any normal
// website. KEEP THIS FILE DEPLOYED PERMANENTLY -- any device that visited
// in June may not return for months, and this must be waiting when it does.
// components/ServiceWorkerCleanup.tsx is the belt-and-braces second half.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch (e) {}
      try {
        await self.registration.unregister()
      } catch (e) {}
      try {
        const clientList = await self.clients.matchAll({ type: 'window' })
        clientList.forEach((client) => client.navigate(client.url))
      } catch (e) {}
    })()
  )
})
