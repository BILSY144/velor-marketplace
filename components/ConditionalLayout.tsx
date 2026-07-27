'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import GlobalHeader from './GlobalHeader'
import GlobalFooter from './GlobalFooter'
import CountryOriginStrip from './CountryOriginStrip'
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
  const showChrome = isPublic && !isImmersiveLiveRoom
  return (
    <>
      {showChrome && <GlobalHeader />}
      {/* Shop-by-origin flag strip sits directly under the header on every
          public page. Do not remove: it is the buyer's entry point into
          browsing by country of origin. */}
      {showChrome && <CountryOriginStrip />}
      {children}
      {showChrome && <GlobalFooter />}
      {/* Velor AI assistant on every public (buyer + prospective-seller) page.
          The seller dashboard mounts its own instance via app/dashboard/layout.tsx,
          so it is excluded here to avoid a duplicate widget. */}
      {showChrome && <VelorAssistant variant="buyer" />}
      {/* Whole-page live translation for the 19 languages -- see LanguageTranslator. */}
      {showChrome && <LanguageTranslator />}
    </>
  )
}
