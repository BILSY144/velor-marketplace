'use client'
import { usePathname } from 'next/navigation'
import GlobalHeader from './GlobalHeader'
import GlobalFooter from './GlobalFooter'
import CountryOriginStrip from './CountryOriginStrip'
import VelorAssistant from './VelorAssistant'
import LanguageTranslator from './LanguageTranslator'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = !pathname.startsWith('/dashboard') && !pathname.startsWith('/auth') && !pathname.startsWith('/admin') && !pathname.startsWith('/pulse')
  return (
    <>
      {isPublic && <GlobalHeader />}
      {/* Shop-by-origin flag strip sits directly under the header on every
          public page. Do not remove: it is the buyer's entry point into
          browsing by country of origin. */}
      {isPublic && <CountryOriginStrip />}
      {children}
      {isPublic && <GlobalFooter />}
      {/* Velor AI assistant on every public (buyer + prospective-seller) page.
          The seller dashboard mounts its own instance via app/dashboard/layout.tsx,
          so it is excluded here to avoid a duplicate widget. */}
      {isPublic && <VelorAssistant variant="buyer" />}
      {/* Whole-page live translation for the 19 languages -- see LanguageTranslator. */}
      {isPublic && <LanguageTranslator />}
    </>
  )
}
