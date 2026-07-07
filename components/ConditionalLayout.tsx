'use client'
import { usePathname } from 'next/navigation'
import GlobalHeader from './GlobalHeader'
import GlobalFooter from './GlobalFooter'
import CountryOriginStrip from './CountryOriginStrip'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = !pathname.startsWith('/dashboard') && !pathname.startsWith('/auth')
  return (
    <>
      {isPublic && <GlobalHeader />}
      {isPublic && <CountryOriginStrip />}
      {children}
      {isPublic && <GlobalFooter />}
    </>
  )
}