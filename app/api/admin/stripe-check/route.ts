import { NextRequest, NextResponse } from 'next/server'

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() })
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true
  const tokenParam = request.nextUrl.searchParams.get('token')
  if (tokenParam === secret) return true
  return false
}

// Read-only diagnostic: looks up a Stripe PaymentIntent's real status directly
// from Stripe, for reconciling orders that may have failed to record locally
// (e.g. a client-side POST to /api/orders that errored after payment
// succeeded). Never mutates anything on Stripe's side.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors() })
  }

  const paymentIntentId = request.nextUrl.searchParams.get('paymentIntentId')
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId query param required' }, { status: 400, headers: cors() })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500, headers: cors() })
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    })
    const json = await res.json()
    if (!res.ok) {
      return NextResponse.json({ ok: false, stripeError: json }, { status: res.status, headers: cors() })
    }
    return NextResponse.json(
      {
        ok: true,
        id: json.id,
        status: json.status,
        amount: json.amount,
        currency: json.currency,
        amount_received: json.amount_received,
        created: json.created,
        receipt_email: json.receipt_email,
        metadata: json.metadata,
        latest_charge: json.latest_charge,
      },
      { headers: cors() }
    )
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: cors() }
    )
  }
}
