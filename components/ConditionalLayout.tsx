'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import GlobalHeader from './GlobalHeader'
import GlobalFooter from './GlobalFooter'
import VelorAssistant from './VelorAssistant'
import LanguageTranslator from './LanguageTranslator'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Explicit scroll-to-top on every route change (William, 2026-07-27:
  // "when i browse different places it takes me to the bottom of the
  // page"). Belt-and-braces alongside the globals.css scroll-behavior fix
  // -- several pages (shop/search/product/etc.) are client components that
  // fetch their real content after the initial route transition, so
  // relying solely on Next's own one-time scroll-to-top isn't always
  // reliable once that content streams in and changes page height. This
  // fires on every pathname change, public pages and dashboard/admin alike,
  // since ConditionalLayout wraps every route regardless of showChrome.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const isPublic = !pathname.startsWith('/dashboard') && !pathname.startsWith('/auth') && !pathname.startsWith('/admin') && !pathname.startsWith('/pulse')
  // /apply (the 4-step founding-seller wizard) is deliberately chromeless --
  // William's own design has no site header/footer, just the wizard itself
  // full-bleed on a dark background (William, 2026-07-31: "i want the pages
  // like for like no header or footer only what you see on the designs").
  // Scoped to the exact route (not startsWith) so /apply/invited, a
  // different page, is unaffected and keeps normal site chrome.
  const isChromelessApply = pathname === '/apply'
  // A single live room (/live/[room], e.g. /live/abc123) is deliberately
  // immersive -- full-bleed video with everything overlaid on it, the same
  // TikTok LIVE model app/live/[room]/page.tsx now follows (William,
  // 2026-07-20: "make it exactly like tiktoks set up all but name"). TikTok's
  // own LIVE view has no surrounding site chrome at all, so the global
  // header, origin strip, footer, assistant widget and translator toggle --
  // all fine on ordinary pages -- would sit on top of or squeeze the video
  // and break that model. The /live hub page itself (browsing what's on air)
  // is unaffected and keeps normal site chrome; only a specific room, which
  // always has a second path segment, is treated as immersive.
  const isImmersiveLiveRoom = pathname.startsWith('/live/')
  const showChrome = isPublic && !isImmersiveLiveRoom && !isChromelessApply
  return (
    <>
      {showChrome && <GlobalHeader />}
      {/* The shop-by-origin flag strip was RETIRED here by William
          (2026-07-30, with the new header live): "lets remove the flags as
          the search bar does that job already... and origins achieves that
          too". Country browsing now happens via header search, the mega
          menu's Origins column, and /shop. components/CountryOriginStrip.tsx
          is kept unmounted in case he ever wants the strip back. */}
      {children}
      {showChrome && <GlobalFooter />}
      {/* Velor AI assistant, buyer-facing, TEMPORARILY DISABLED (2026-08-08,
          William): the unmetered public endpoint (no auth, no per-IP cap,
          no daily budget, unlike /api/translate) was the single largest
          driver of Anthropic API spend while sellers are still onboarding
          and the site hasn't gone public yet -- see the matching note in
          app/api/assistant/chat/route.ts. Seller dashboard's own instance
          (app/dashboard/layout.tsx) is unaffected. Reintroduce once traffic
          justifies it -- ideally with the same budget gate /api/translate
          uses. */}
      {false && showChrome && <VelorAssistant variant="buyer" />}
      {/* Whole-page live translation for the 19 languages -- see LanguageTranslator. */}
      {showChrome && <LanguageTranslator />}
    </>
  )
}
