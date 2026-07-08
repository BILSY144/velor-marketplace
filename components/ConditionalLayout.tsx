'use client'
import { usePathname } from 'next/navigation'
import GlobalHeader from './GlobalHeader'
import GlobalFooter from './GlobalFooter'
import VelorAssistant from './VelorAssistant'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = !pathname.startsWith('/dashboard') && !pathname.startsWith('/auth')
  return (
    <>
      {isPublic && <GlobalHeader />}
      {children}
      {isPublic && <GlobalFooter />}
      {/* Velor AI assistant on every public (buyer + prospective-seller) page.
          The seller dashboard mounts its own instance via app/dashboard/layout.tsx,
          so it is excluded here to avoid a duplicate widget. */}
      {isPublic && <VelorAssistant />}
    </>
  )
}
