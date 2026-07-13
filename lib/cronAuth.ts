import { NextRequest, NextResponse } from 'next/server'

// Shared auth check for every Vercel Cron / internal-agent-only route
// (app/api/cron/*, plus a couple of admin routes that use the same
// Authorization: Bearer <CRON_SECRET> convention Vercel Cron sends
// automatically). Call this first in every such route and return its
// result immediately if non-null.
//
// FAILS CLOSED. Two real bugs used to live in the per-route copies of this
// check, both stemming from treating an unset CRON_SECRET as "no check
// needed" instead of "misconfigured, refuse everything":
//
// 1. Several routes wrote `if (process.env.CRON_SECRET && authHeader !==
//    ...)`. If CRON_SECRET is ever unset (a cleared/renamed Vercel env var,
//    a fresh Preview environment that never got it, etc.), `false && ...`
//    short-circuits and the whole check is skipped -- the route becomes
//    completely open, no header required at all. app/api/cron/
//    release-payouts/route.ts (a real-money payout release) had this exact
//    pattern.
// 2. Every route, even the ones without that guard, compared authHeader
//    against the template literal `Bearer ${process.env.CRON_SECRET}`. If
//    CRON_SECRET is unset, that literal coerces to the actual string
//    "Bearer undefined" -- so a request carrying the literal header
//    `Authorization: Bearer undefined` would satisfy `authHeader ===
//    \`Bearer ${undefined}\`` even on routes that WERE doing a plain `!==`
//    check with no guard at all.
//
// Both only matter if CRON_SECRET is ever missing at runtime -- which it
// currently is not (William has it set in Vercel) -- but a route that is
// only safe because an env var happens to be present is not actually safe.
// This helper refuses outright the moment the secret itself is missing,
// before ever looking at what the caller sent.
export function requireCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cronAuth] CRON_SECRET is not set in this environment -- refusing all cron/agent requests until it is configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
