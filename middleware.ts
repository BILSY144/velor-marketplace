import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Edge-safe only (no Prisma/DB import) -- see lib/payoutGateCookie.ts.
import { PAYOUT_GATE_COOKIE } from '@/lib/payoutGateCookie'

// Setup pages exempt from the payout-verification gate below -- a seller
// must always be able to reach these regardless of gate status, or they
// could never satisfy it in the first place. TROLLEY is the default
// non-Stripe rail as of 2026-07-23 evening (DOTS/PAYONEER kept only for
// legacy sellers not yet self-healed onto it) -- /dashboard/trolley was
// missing from this list until 2026-07-23, which meant the moment Trolley
// went live (isTrolleyConfigured() started returning true) every
// TROLLEY-rail seller got stuck in an infinite redirect loop between here
// and /dashboard/stripe-connect and could never actually complete
// onboarding -- a dead end, not friction. Fixed same day; see that
// checkpoint in CLAUDE.md.
const PAYOUT_GATE_EXEMPT_PREFIXES = ['/dashboard/stripe-connect', '/dashboard/trolley', '/dashboard/dots', '/dashboard/payoneer']

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
    '/api/stripe/payment-intent': [10, 60_000],
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

      // Payout-verification gate (William, 2026-07-23): a seller must finish
      // real payout-rail verification (Stripe Connect onboarding for
      // STRIPE-rail sellers, real Dots onboarding for DOTS-rail sellers --
      // the default non-Stripe rail since the same day, see
      // lib/payoutRail.ts -- or, for a legacy few, the Payoneer exemption in
      // lib/payoutGateCookie.ts while that rail isn't live) BEFORE using the
      // rest of the dashboard, not whenever they get round to it. Previously
      // nothing enforced this at all: an approved seller could sign in and
      // use Products/Orders/Settings/etc. having never touched a payout
      // rail. The gate cookie (set/cleared server-side by lib/payoutGate.ts's
      // setPayoutGateCookie) is refreshed every time /api/stripe/connect/
      // account, /api/dots/onboard, or /api/payoneer/onboard is called --
      // and app/dashboard/layout.tsx already calls one of those on every
      // dashboard mount (to drive its own rail-aware payout nav item), so the
      // cookie self-heals on normal navigation without any extra fetch. A
      // dedicated GET /api/seller/payout-gate also exists for any page that
      // wants to check/refresh gate status directly. The escape-hatch
      // redirect below always targets /dashboard/stripe-connect, which
      // itself rail-guards and forwards a DOTS or PAYONEER seller onward --
      // same indirection pattern that page already used before this cookie
      // existed.
      const gateExempt = PAYOUT_GATE_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))
      if (!gateExempt) {
        const payoutCookie = req.cookies.get(PAYOUT_GATE_COOKIE)
        const currentUserId = (req.auth as any)?.user?.id
        // Cookie value must match the CURRENTLY signed-in user's id, not just
        // be present -- fixed 2026-07-23 after William found he could reach
        // the dashboard on a never-verified test seller because a previous,
        // already-satisfied account had left this cookie in the same
        // browser. See lib/payoutGate.ts's setPayoutGateCookie for the full
        // story; do not revert to a plain presence check.
        if (!payoutCookie?.value || payoutCookie.value !== currentUserId) {
          return NextResponse.redirect(new URL('/dashboard/stripe-connect', req.url))
        }
      }
    }
  }

  if (pathname.startsWith('/api/admin')) {
    // Internal QA tool: does its own CRON_SECRET query-param check inside the
    // route handler (needs to work from a plain browser URL, so it can't rely
    // on a custom Authorization header). Exempt it from the generic
    // ADMIN_SECRET/header check below.
    if (pathname === '/api/admin/set-tier' || pathname === '/api/admin/products/auto-moderate') {
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
  matcher: ['/dashboard/:path*', '/api/admin/:path*', '/api/chat/:path*', '/api/contact/:path*', '/api/stripe/payment-intent'],
}
