import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const _rl = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string, key: string, max: number, windowMs: number): boolean {
  const k = ip + ':' + key
  const now = Date.now()
  const entry = _rl.get(k)
  if (!entry || now > entry.reset) {
    _rl.set(k, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

export default auth((req: NextRequest & { auth?: unknown }) => {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'

  const limits: Record<string, [number, number]> = {
    '/api/chat': [20, 60_000],
    '/api/contact': [5, 60_000],
    '/api/checkout': [10, 60_000],
  }
  for (const [route, [max, win]] of Object.entries(limits)) {
    if (pathname.startsWith(route)) {
      if (!rateLimit(ip, route, max, win)) {
        return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
      }
      break
    }
  }

  if (pathname.startsWith('/dashboard')) {
    if (!req.auth) {
      const signInUrl = new URL('/auth/sign-in', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
      return NextResponse.redirect(signInUrl)
    }
    const role = (req.auth as any)?.user?.role
    if (role === 'SELLER' && !pathname.startsWith('/dashboard/terms')) {
      const termsCookie = req.cookies.get('velor_terms')
      if (!termsCookie?.value) {
        return NextResponse.redirect(new URL('/dashboard/terms', req.url))
      }
    }
  }

  if (pathname.startsWith('/api/admin')) {
    // Internal QA tool: does its own CRON_SECRET query-param check inside the
    // route handler (needs to work from a plain browser URL, so it can't rely
    // on a custom Authorization header). Exempt it from the generic
    // ADMIN_SECRET/header check below.
    if (pathname === '/api/admin/set-tier') {
      return NextResponse.next()
    }
    const secret = process.env.ADMIN_SECRET
    const authHeader = req.headers.get('authorization')
    if (!secret || authHeader !== 'Bearer ' + secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*', '/api/chat/:path*', '/api/contact/:path*', '/api/checkout/:path*'],
}
