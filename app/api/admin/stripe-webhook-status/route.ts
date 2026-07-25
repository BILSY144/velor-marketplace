import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

// Diagnostic + repair endpoint for two real, live-verified Stripe webhook
// gaps found 2026-07-25 (see CLAUDE.md's "Dots removed... Stripe webhook"
// checkpoint for the full incident):
//
// 1. The existing platform-account webhook endpoint
//    (velor-marketplace.vercel.app/api/stripe/webhook) was only subscribed
//    to payment_intent.succeeded and checkout.session.completed --
//    customer.subscription.created/updated/deleted, invoice.payment_failed,
//    invoice.paid, and payment_intent.payment_failed were NOT delivered,
//    even though app/api/stripe/webhook/route.ts already has case blocks
//    for all of them. Concretely: a seller completing real paid Stripe
//    Checkout for Pro never actually got upgraded to tier PRO in the DB,
//    since that only ever happens in the customer.subscription.created
//    case. Fixed via the add-events action below.
//
// 2. That same endpoint was never created with connect:true, so it can
//    never receive events on a CONNECTED (seller) Stripe account --
//    including account.updated, which app/api/stripe/webhook/route.ts
//    gained a case for in the same session to fix seller
//    Stripe-onboarding-status staleness. Adding account.updated to
//    enabled_events on a non-connect endpoint would be a silent no-op, not
//    a fix. The only real fix is a NEW endpoint created with connect:true,
//    handled via the create-connect-endpoint action below. Its signing
//    secret is only ever returned once, at creation -- this route returns
//    it in the response for the caller to immediately set as the
//    STRIPE_WEBHOOK_SECRET_CONNECT Vercel env var (see
//    app/api/stripe/webhook/route.ts's dual-secret verification, added the
//    same session specifically to support this).
//
// GET is fully read-only. Both POST actions require an explicit
// confirm:true, since either is a live Stripe account-settings change, not
// a code deploy -- per this repo's standing rule that those need a human's
// explicit go-ahead, not just a code review.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const SUBSCRIPTION_LIFECYCLE_EVENTS: Stripe.WebhookEndpointUpdateParams.EnabledEvent[] = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.paid',
  'payment_intent.payment_failed',
]

function summarize(endpoints: Stripe.WebhookEndpoint[]) {
  return endpoints.map((e) => ({
    id: e.id,
    url: e.url,
    status: e.status,
    // Non-null `application` is Stripe's own signal that this endpoint was
    // created with connect:true (receives connected-account events, e.g. a
    // seller's account.updated) rather than platform-only events --
    // reported raw, not assumed, per this repo's don't-trust-memory rule.
    application: e.application ?? null,
    enabledEvents: e.enabled_events,
    hasAccountUpdated: e.enabled_events.includes('account.updated') || e.enabled_events.includes('*'),
    missingSubscriptionEvents: SUBSCRIPTION_LIFECYCLE_EVENTS.filter(
      (ev) => !e.enabled_events.includes(ev) && !e.enabled_events.includes('*'),
    ),
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
      note: 'hasAccountUpdated must be true on a connect-scoped (application != null) endpoint for the account.updated fix to work. missingSubscriptionEvents must be empty on the platform endpoint whose url matches this app’s /api/stripe/webhook for Pro subscription upgrades/downgrades to actually apply.',
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

  let body: {
    confirm?: boolean
    action?: 'add-subscription-events' | 'create-connect-endpoint'
    endpointId?: string
    url?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.confirm !== true) {
    return NextResponse.json(
      {
        error:
          'Refusing to modify live Stripe webhook config without confirm:true. Actions: ' +
          '{"confirm":true,"action":"add-subscription-events","endpointId":"we_..."} or ' +
          '{"confirm":true,"action":"create-connect-endpoint","url":"https://..."}. GET this route first to find the right endpointId.',
      },
      { status: 400 },
    )
  }

  try {
    if (body.action === 'add-subscription-events') {
      if (!body.endpointId) {
        return NextResponse.json({ error: 'endpointId required for add-subscription-events' }, { status: 400 })
      }
      const endpoint = await stripe.webhookEndpoints.retrieve(body.endpointId)
      const already = endpoint.enabled_events.includes('*')
      const missing = already
        ? []
        : SUBSCRIPTION_LIFECYCLE_EVENTS.filter((ev) => !endpoint.enabled_events.includes(ev))
      if (missing.length === 0) {
        return NextResponse.json({ ok: true, changed: false, message: 'All subscription-lifecycle events already enabled.' })
      }
      const updated = await stripe.webhookEndpoints.update(body.endpointId, {
        enabled_events: [...endpoint.enabled_events, ...missing] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
      })
      return NextResponse.json({ ok: true, changed: true, added: missing, endpoint: summarize([updated])[0] })
    }

    if (body.action === 'create-connect-endpoint') {
      const url = body.url
      if (!url) {
        return NextResponse.json({ error: 'url required for create-connect-endpoint' }, { status: 400 })
      }
      // Avoid creating a duplicate on a retried call: if a connect-scoped
      // endpoint already exists for this exact URL with account.updated
      // enabled, report it instead of creating another.
      const existing = await stripe.webhookEndpoints.list({ limit: 100 })
      const already = existing.data.find(
        (e) => e.url === url && e.application && (e.enabled_events.includes('account.updated') || e.enabled_events.includes('*')),
      )
      if (already) {
        return NextResponse.json({
          ok: true,
          changed: false,
          message: 'A connect-scoped endpoint for this URL with account.updated already exists. No new secret to report (only shown at creation) -- if STRIPE_WEBHOOK_SECRET_CONNECT is not already set in Vercel, roll this endpoint’s secret in the Stripe dashboard and set the new value.',
          endpoint: summarize([already])[0],
        })
      }
      const created = await stripe.webhookEndpoints.create({
        url,
        connect: true,
        enabled_events: ['account.updated'],
        description: 'Connect account events (account.updated) -- created 2026-07-25 to fix Stripe-onboarding staleness. Secret must be set as STRIPE_WEBHOOK_SECRET_CONNECT in Vercel.',
      })
      return NextResponse.json({
        ok: true,
        changed: true,
        endpoint: summarize([created])[0],
        // Only ever returned here, at creation -- Stripe will not show this
        // again. Caller must set it as STRIPE_WEBHOOK_SECRET_CONNECT in
        // Vercel (Production + Preview) immediately.
        secret: created.secret,
      })
    }

    return NextResponse.json({ error: 'Unknown or missing action.' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update Stripe webhook config'
    console.error('[admin/stripe-webhook-status POST]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
