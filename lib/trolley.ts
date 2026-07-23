// Trolley (usetrolley.com) client -- the DEFAULT payout rail for sellers in
// countries where Stripe Connect does not support payouts (see
// lib/payoutRail.ts).
//
// REPLACES DOTS (added 2026-07-23 morning) AS THE DEFAULT RAIL, same day,
// evening: Dots.dev turned out to be a genuine dead end for this company --
// its Country field is hard-locked to United States businesses only
// ("Only US businesses are supported at the moment", confirmed both live in
// the signup UI and by Dots' own AI documentation assistant). Velor Commerce
// Ltd is UK-registered, so a Dots account can never be created -- this is
// not a pending-approval situation like Payoneer, it is permanently
// impossible. lib/dots.ts, app/api/dots/onboard/route.ts and
// app/dashboard/dots/page.tsx are left in place (never delete a working
// self-heal path without being asked) but getPayoutRail() will never assign
// DOTS to a seller again, matching how PAYONEER was handled when DOTS
// superseded it hours earlier the same day.
//
// William began Trolley's Bank Transfer Activation onboarding himself (see
// CLAUDE.md's 2026-07-23 checkpoints) and submitted it for review the same
// evening -- KYC/compliance review is Trolley's own process and is NOT
// something this file or Claude can accelerate.
//
// STATUS: adapter built ahead of live API credentials. Trolley's KYC review
// of Velor's own business (the Bank Transfer Activation submitted by
// William) is still pending -- until TROLLEY_ACCESS_KEY/TROLLEY_SECRET_KEY
// are added to Vercel, isTrolleyConfigured() returns false and callers fall
// back to the escrow-and-wait behaviour, same pattern as lib/payoneer.ts and
// lib/dots.ts.
//
// IMPORTANT -- VERIFY IN SANDBOX BEFORE FIRST LIVE PAYOUT: the endpoint
// paths, auth signing scheme, and payload field names below follow Trolley's
// published API reference (developers.trolley.com, fetched 2026-07-23) but
// have NOT been exercised against a real or sandbox account (Trolley's own
// KYC review of Velor's business was still pending at write time, so no
// credentials existed to test against). Three things specifically need
// sandbox confirmation, flagged again at their call sites:
//   1. The exact recipient-payment field names inside a batch
//      (POST /batches/:id/payments) -- `amount`, `currency`, `recipientId`
//      and a client-supplied idempotency field are documented in outline
//      but the precise idempotency field name (externalId vs
//      clientReferenceId vs memo-based) was not confirmed.
//   2. Whether the signed widget.trolley.com URL genuinely works as a full
//      standalone redirect page (not just an iframe src) -- Trolley's docs
//      state it can be "loaded inside an iframe, or as a page of its own",
//      which this file relies on for a Payoneer/Dots-style hosted-link
//      onboarding flow, but this has not been tested live.
//   3. Whether a `region` (ISO 3166-2) is genuinely required for a UK
//      address, or optional as the docs suggested -- confirm before
//      assuming a missing region silently succeeds.
//
// Required env vars (added by William in Vercel once Trolley approves the
// Bank Transfer Activation and issues live API keys -- never hardcoded):
//   TROLLEY_ACCESS_KEY
//   TROLLEY_SECRET_KEY
//   TROLLEY_API_BASE     e.g. https://api.trolley.com/v1 (sandbox vs
//                        production host, if Trolley uses separate hosts,
//                        is unconfirmed -- see docs/TROLLEY_SETUP.md)

import { createHmac } from 'crypto'

const DEFAULT_API_BASE = 'https://api.trolley.com/v1'
const WIDGET_BASE = 'https://widget.trolley.com'

const ENDPOINTS = {
  recipients: '/recipients',
  recipient: (id: string) => `/recipients/${encodeURIComponent(id)}`,
  batches: '/batches',
  batchPayments: (batchId: string) => `/batches/${encodeURIComponent(batchId)}/payments`,
  batchStart: (batchId: string) => `/batches/${encodeURIComponent(batchId)}/start-processing`,
}

export function isTrolleyConfigured(): boolean {
  return Boolean(process.env.TROLLEY_ACCESS_KEY && process.env.TROLLEY_SECRET_KEY)
}

function requireConfig() {
  if (!isTrolleyConfigured()) {
    throw new Error('Trolley is not configured: missing TROLLEY_ACCESS_KEY/TROLLEY_SECRET_KEY (has Trolley approved the Bank Transfer Activation yet?)')
  }
  return {
    accessKey: process.env.TROLLEY_ACCESS_KEY as string,
    secretKey: process.env.TROLLEY_SECRET_KEY as string,
    base: (process.env.TROLLEY_API_BASE || DEFAULT_API_BASE).replace(/\/$/, ''),
  }
}

// HMAC-SHA256 request signing per Trolley's documented scheme:
// message = timestamp + '\n' + method + '\n' + requestPath + '\n' + body + '\n'
// Authorization: prsign ACCESS_KEY:SIGNATURE, X-PR-Timestamp: timestamp
// Trolley requires the timestamp be within 30 seconds of UTC, so this must
// be computed fresh for every request -- never cached like Payoneer's OAuth
// token.
function signRequest(secretKey: string, timestamp: string, method: string, requestPath: string, body: string): string {
  const message = `${timestamp}\n${method}\n${requestPath}\n${body}\n`
  return createHmac('sha256', secretKey).update(message).digest('hex')
}

async function trolleyFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const cfg = requireConfig()
  const method = options.method || 'GET'
  const bodyStr = options.body ? JSON.stringify(options.body) : ''
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = signRequest(cfg.secretKey, timestamp, method, path, bodyStr)

  const res = await fetch(cfg.base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `prsign ${cfg.accessKey}:${signature}`,
      'X-PR-Timestamp': timestamp,
    },
    body: bodyStr || undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Trolley ${path} failed: ${res.status} ${JSON.stringify(json).slice(0, 300)}`)
  }
  return json as T
}

// Recipient creation -- the marketplace registers the seller as a Trolley
// recipient (referenceId = Seller.id) and then sends them to a hosted
// widget to enter their own bank/tax details directly with Trolley; Velor
// never sees or stores those details, same as the Payoneer/Dots pattern.
//
// INDIVIDUAL SELLERS (matches the platform-wide rule set 2026-07-21: Stripe
// and Payoneer request personal identification only, not business details,
// so anyone can sign up as a private individual): type is always
// 'individual' here for the same reason.
export async function createRecipient(params: {
  referenceId: string
  firstName: string
  lastName: string
  email: string
  country: string // ISO 3166-1 alpha-2
  street1?: string
  city?: string
  region?: string // ISO 3166-2, e.g. "ENG" -- see VERIFY-IN-SANDBOX note 3
  postalCode?: string
}): Promise<{ recipientId: string; raw: unknown }> {
  const json = await trolleyFetch<{ recipient?: { id?: string } }>(ENDPOINTS.recipients, {
    method: 'POST',
    body: {
      type: 'individual',
      referenceId: params.referenceId,
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      address: {
        country: params.country,
        street1: params.street1,
        city: params.city,
        region: params.region,
        postalCode: params.postalCode,
      },
    },
  })
  const recipientId = json.recipient?.id
  if (!recipientId) throw new Error('Trolley create-recipient response had no recipient.id field: ' + JSON.stringify(json).slice(0, 300))
  return { recipientId, raw: json }
}

export async function getRecipientStatus(recipientId: string): Promise<{ complianceStatus: string; onboarded: boolean; raw: unknown }> {
  const json = await trolleyFetch<{ recipient?: { complianceStatus?: string; payoutMethod?: unknown } }>(ENDPOINTS.recipient(recipientId))
  const complianceStatus = json.recipient?.complianceStatus || 'pending'
  // "Onboarded" for our purposes means the recipient has both passed
  // compliance AND actually added a payout method via the widget -- a
  // verified recipient with no bank details on file still cannot be paid.
  // See VERIFY-IN-SANDBOX note 1's sibling concern: confirm `payoutMethod`
  // is the right field to check for "has added a bank account" before
  // trusting this as the sole payout-readiness signal.
  const onboarded = complianceStatus === 'verified' && Boolean(json.recipient?.payoutMethod)
  return { complianceStatus, onboarded, raw: json }
}

// Builds a signed, time-limited (30-second) widget URL a seller can be
// redirected to directly (per Trolley's docs: "can also be loaded inside an
// iframe, or as a page of its own") to add their own bank details. This
// must be computed fresh right before use -- never cache or reuse this URL,
// it expires in 30 seconds. See VERIFY-IN-SANDBOX note 2.
export function getOnboardingWidgetUrl(params: { recipientReferenceId: string; locale?: string }): string {
  const cfg = requireConfig()
  const timestamp = String(Math.floor(Date.now() / 1000))
  const query = new URLSearchParams({
    key: cfg.accessKey,
    refid: params.recipientReferenceId,
    ts: timestamp,
    products: 'pay,trust',
    locale: params.locale || 'en',
  })
  const queryString = query.toString()
  const signature = createHmac('sha256', cfg.secretKey).update(queryString).digest('hex')
  return `${WIDGET_BASE}?${queryString}&sign=${signature}`
}

// Payout submission via Trolley's batch flow: create a batch, add this
// single payment to it, then start processing. clientReferenceId
// (`payout_<orderId>`, same idempotency convention as every other rail)
// is passed as the payment's external reference so a retried cron run can
// never double-pay -- see VERIFY-IN-SANDBOX note 1 for the exact field name.
export async function createPayout(params: {
  recipientId: string
  amount: number // major units, e.g. 12.34
  currency: string // ISO code, e.g. 'GBP'
  clientReferenceId: string
  description: string
}): Promise<{ payoutId: string; batchId: string; raw: unknown }> {
  const batchJson = await trolleyFetch<{ batch?: { id?: string } }>(ENDPOINTS.batches, {
    method: 'POST',
    body: { description: params.description.slice(0, 250) },
  })
  const batchId = batchJson.batch?.id
  if (!batchId) throw new Error('Trolley create-batch response had no batch.id field: ' + JSON.stringify(batchJson).slice(0, 300))

  const paymentJson = await trolleyFetch<{ payment?: { id?: string } }>(ENDPOINTS.batchPayments(batchId), {
    method: 'POST',
    body: {
      recipientId: params.recipientId,
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      externalId: params.clientReferenceId,
      memo: params.description.slice(0, 250),
    },
  })
  const payoutId = paymentJson.payment?.id
  if (!payoutId) throw new Error('Trolley add-payment response had no payment.id field: ' + JSON.stringify(paymentJson).slice(0, 300))

  await trolleyFetch(ENDPOINTS.batchStart(batchId), { method: 'POST' })

  return { payoutId, batchId, raw: { batch: batchJson, payment: paymentJson } }
}
