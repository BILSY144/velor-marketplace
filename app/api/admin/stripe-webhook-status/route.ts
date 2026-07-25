import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Diagnostic + repair endpoint for the account.updated Stripe-onboarding
// staleness gap (see the case 'account.updated' comment in
// app/api/stripe/webhook/route.ts, added 2026-07-25). The code alone is a
// no-op unless this app's live Stripe webhook endpoint is actually
// subscribed to Connect "events on connected accounts" -- there is no way
// to know that from reading code, only by asking Stripe's own API, which is
// what this route does. Read-only by default; the fix only ever runs on an
// explicit POST with confirm:true, since changing a live Stripe webhook
// endpoint's subscribed events is an account-settings change, not a code
// deploy.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

function summarize(endpoints: Stripe.WebhookEndpoint[]) {
  return endpoints.map((e) => ({
    id: e.id,
    url: e.url,
    status: e.status,
    // Non-null `application` is Stripe's own signal that this endpoint was
    // created with connect:true (receives connected-account events, e.g.
    // this seller's account.updated) rather than platform-only events --
    // reported raw, not assumed, per this repo's don't-trust-memory rule.
    application: e.application ?? null,
    enabledEvents: e.enabled_events,
    hasAccountUpdated: e.enabled_events.includes('account.updated') || e.enabled_events.includes('*'),
  }))
}

export async function GET(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    return NextResponse.json({
      ok: true,
      endpoints: summarize(endpoints.data),
      note: 'hasAccountUpdated must be true on the endpoint whose url matches this app’s /api/stripe/webhook for the 2026-07-25 fix to actually take effect. If none show true, POST here with {"confirm":true,"endpointId":"<id>"} to add it.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list webhook endpoints'
    console.error('[admin/stripe-webhook-status GET]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { confirm?: boolean; endpointId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.confirm !== true || !body.endpointId) {
    return NextResponse.json(
      { error: 'Refusing to modify a live Stripe webhook endpoint without {"confirm":true,"endpointId":"we_..."}. GET this route first to find the right endpointId.' },
      { status: 400 },
    )
  }

  try {
    const endpoint = await stripe.webhookEndpoints.retrieve(body.endpointId)
    if (endpoint.enabled_events.includes('account.updated') || endpoint.enabled_events.includes('*')) {
      return NextResponse.json({ ok: true, changed: false, message: 'account.updated already enabled on this endpoint.' })
    }
    if (!endpoint.application) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'This endpoint was not created with connect:true, so it cannot receive events for connected accounts (Stripe.application is null). Adding account.updated to enabled_events would have no effect -- a NEW endpoint with connect:true is required instead. Not created automatically; confirm with William before creating a new live webhook endpoint.',
        },
        { status: 409 },
      )
    }
    const updated = await stripe.webhookEndpoints.update(body.endpointId, {
      enabled_events: [...endpoint.enabled_events, 'account.updated'] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
    })
    return NextResponse.json({ ok: true, changed: true, endpoint: summarize([updated])[0] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update webhook endpoint'
    console.error('[admin/stripe-webhook-status POST]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
