// Dots.dev (usedots.com) client -- the DEFAULT payout rail for sellers in
// countries where Stripe Connect does not support payouts (see
// lib/payoutRail.ts). Added 2026-07-23 as a self-serve replacement for
// Payoneer, whose Mass Payouts partner application has sat unanswered since
// 13 July and whose entire registration flow (not just payouts) is blocked
// on partner-gated credentials that may not arrive before the 6 Aug launch.
// Dots requires no partner approval: an API key is available immediately on
// signup (production go-live typically 1-2 weeks per Dots' own FAQ, vs.
// Payoneer's indefinite partner queue).
//
// STATUS: adapter built ahead of a real account. William must sign up at
// https://dashboard.dots.dev himself (account creation is a prohibited
// action for Claude) and add the env vars below in Vercel; until then
// isDotsConfigured() returns false and callers fall back to the
// escrow-and-wait behaviour, same pattern as lib/payoneer.ts.
//
// IMPORTANT -- VERIFY IN SANDBOX BEFORE FIRST LIVE PAYOUT: every endpoint
// path and payload field below follows Dots' published API reference
// (docs.dots.dev, fetched 2026-07-23) but has NOT been exercised against a
// real or sandbox account. Two things specifically need sandbox
// confirmation and are flagged again at their call site:
//   1. Whether POST /v2/payout-links accepts `amount: 0` for a pure
//      onboarding/verification link with no real money attached (this file
//      tries 0 first). If the sandbox rejects a zero amount, the fallback
//      is a small nominal "welcome" amount (e.g. 100 = GBP 1.00) -- change
//      ONBOARDING_LINK_AMOUNT_MINOR below, the single place this is set.
//   2. The exact shape of GET /v2/users/{id} (whether it reports a payout
//      method/compliance status directly, or whether onboarded status must
//      instead be inferred from payout-link webhook events). Confirm
//      against a real sandbox user before trusting getUserStatus() as the
//      only signal payoutGate.ts relies on.
//
// Required env vars (added by William in Vercel once he has a Dots
// account -- never hardcoded):
//   DOTS_API_KEY
//   DOTS_API_BASE   e.g. https://api.dots.dev (sandbox/production keys are
//                   scoped by the key itself per Dots' docs, not by a
//                   separate sandbox host -- confirm this in sandbox before
//                   relying on it; if wrong, this is the one place to fix).

const DEFAULT_API_BASE = 'https://api.dots.dev'

// See VERIFY-IN-SANDBOX note 1 above.
const ONBOARDING_LINK_AMOUNT_MINOR = 0

const ENDPOINTS = {
  users: '/v2/users',
  user: (userId: string) => `/v2/users/${encodeURIComponent(userId)}`,
  payoutLinks: '/v2/payout-links',
  sendPayout: '/v2/payouts/send-payout',
}

export function isDotsConfigured(): boolean {
  return Boolean(process.env.DOTS_API_KEY)
}

function requireConfig() {
  if (!isDotsConfigured()) {
    throw new Error('Dots is not configured: missing DOTS_API_KEY (has William created a Dots account yet?)')
  }
  return {
    apiKey: process.env.DOTS_API_KEY as string,
    base: (process.env.DOTS_API_BASE || DEFAULT_API_BASE).replace(/\/$/, ''),
  }
}

async function dotsFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const cfg = requireConfig()
  const res = await fetch(cfg.base + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + cfg.apiKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Dots ${path} failed: ${res.status} ${JSON.stringify(json).slice(0, 300)}`)
  }
  return json as T
}

// Creates the Dots "user" (payee) record. Velor stores the returned id as
// Seller.dotsUserId and never collects or stores the seller's own payout
// details -- those are handled entirely on Dots' hosted onboarding link.
//
// INDIVIDUAL SELLERS: Velor's standing model (same as Stripe/Payoneer, see
// lib/payoneer.ts) is that anyone can sell, including private individuals
// with no registered business -- so this only ever asks for personal
// details (name/email), never a company.
export async function createDotsUser(params: {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
}): Promise<{ userId: string; raw: unknown }> {
  const json = await dotsFetch<{ id?: string; user_id?: string }>(ENDPOINTS.users, {
    method: 'POST',
    body: {
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
      ...(params.phoneNumber ? { phone_number: params.phoneNumber } : {}),
    },
  })
  const userId = json.id || json.user_id
  if (!userId) throw new Error('Dots create-user response had no id field: ' + JSON.stringify(json).slice(0, 300))
  return { userId, raw: json }
}

// Onboarding: a hosted link the seller opens to add their payout method and
// complete any compliance/ID-verification steps Dots requires for their
// country. Dots combines onboarding and payment into one "payout link"
// concept (see the header VERIFY-IN-SANDBOX notes) rather than Stripe/
// Payoneer's separate free-standing account-link onboarding, so this
// deliberately uses ONBOARDING_LINK_AMOUNT_MINOR (0 unless sandbox testing
// proves that rejected) -- the point of this call is verification, not a
// real payout.
export async function getOnboardingLink(params: {
  userId: string
  redirectUrl?: string
}): Promise<{ linkId: string; link: string }> {
  const json = await dotsFetch<{ id?: string; link?: string; flow_id?: string }>(ENDPOINTS.payoutLinks, {
    method: 'POST',
    body: {
      user_id: params.userId,
      amount: ONBOARDING_LINK_AMOUNT_MINOR,
      delivery: 'link',
      memo: 'Velor Marketplace -- payout account setup',
      additional_steps: ['compliance'],
      ...(params.redirectUrl ? { metadata: { redirectUrl: params.redirectUrl } } : {}),
    },
  })
  if (!json.id || !json.link) {
    throw new Error('Dots payout-links response missing id/link: ' + JSON.stringify(json).slice(0, 300))
  }
  return { linkId: json.id, link: json.link }
}

// Status check for a Dots user -- used to decide whether the payout-
// verification dashboard gate (lib/payoutGateCookie.ts) is satisfied and
// whether release-payouts may pay this seller. VERIFY IN SANDBOX (header
// note 2): confirm the field names below against a real account before
// trusting `onboarded` as authoritative.
export async function getUserStatus(userId: string): Promise<{ onboarded: boolean; raw: unknown }> {
  const json = await dotsFetch<{
    payout_method?: unknown
    compliance_status?: string
    verified?: boolean
    ide_verified?: boolean
  }>(ENDPOINTS.user(userId))
  const onboarded = Boolean(
    json.payout_method || json.verified || json.ide_verified || json.compliance_status === 'approved'
  )
  return { onboarded, raw: json }
}

// Payout submission. clientReferenceId/idempotency mirrors the Stripe/
// Payoneer convention (`payout_<orderId>`) so a retried cron run can never
// double-pay.
export async function createPayout(params: {
  userId: string
  amount: number // major units, e.g. 12.34
  currency: string // ISO code, e.g. 'USD'
  clientReferenceId: string
  description: string
}): Promise<{ payoutId: string; raw: unknown }> {
  const json = await dotsFetch<{ id?: string; transfer_id?: string }>(ENDPOINTS.sendPayout, {
    method: 'POST',
    body: {
      user_id: params.userId,
      amount: Math.round(params.amount * 100),
      currency: params.currency.toUpperCase(),
      idempotency_key: params.clientReferenceId,
      memo: params.description.slice(0, 250),
    },
  })
  const payoutId = json.id || json.transfer_id
  if (!payoutId) throw new Error('Dots send-payout response had no id field: ' + JSON.stringify(json).slice(0, 300))
  return { payoutId, raw: json }
}
