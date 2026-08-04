import { NextResponse } from 'next/server'

// Public runtime config for the mobile app (2026-08-04, app checkout build).
// The Stripe PUBLISHABLE key is public by design (it ships in this site's own
// client bundle via NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) -- serving it here
// lets the app fetch it at boot instead of hardcoding it, so a key rotation
// never needs an app release. Nothing secret may ever be added to this route.
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
  })
}
