// Payoneer Mass Payouts client -- the payout rail for sellers in countries
// where Stripe Connect does not support payouts (see lib/payoutRail.ts).
//
// STATUS: adapter built ahead of partner approval. Payoneer's Mass Payouts
// API is partner-gated (not public self-serve): William must complete the
// partner application (docs/PAYONEER_SETUP.md) to receive OAuth credentials
// and sandbox access. Until the env vars below are set in Vercel, every
// function here is inert -- isPayoneerConfigured() returns false and callers
// fall back to the escrow-and-wait behaviour.
//
// IMPORTANT -- VERIFY IN SANDBOX BEFORE FIRST LIVE PAYOUT: the endpoint paths
// and payload field names in ENDPOINTS below follow Payoneer's documented
// Mass Payouts flow (client-credentials OAuth, program-scoped payee
// registration links, program-scoped payout submission) but have NOT been
// exercised against a live or sandbox account, because the API reference
// sits behind the partner portal. When credentials arrive, run the sandbox
// checklist in docs/PAYONEER_SETUP.md and correct any path/field drift here
// (single source of truth: this file only).
//
// Required env vars (added by William in Vercel once the partner application
// is approved -- never hardcoded):
//   PAYONEER_CLIENT_ID
//   PAYONEER_CLIENT_SECRET
//   PAYONEER_PROGRAM_ID
//   PAYONEER_API_BASE   e.g. https://api.sandbox.payoneer.com then https://api.payoneer.com

const ENDPOINTS = {
  token: '/v2/oauth2/token',
  registrationLink: (programId: string) => `/v4/programs/${programId}/payees/registration-link`,
  payeeStatus: (programId: string, payeeId: string) => `/v4/programs/${programId}/payees/${encodeURIComponent(payeeId)}/status`,
  payout: (programId: string) => `/v4/programs/${programId}/payouts`,
}

export function isPayoneerConfigured(): boolean {
  return Boolean(
    process.env.PAYONEER_CLIENT_ID &&
    process.env.PAYONEER_CLIENT_SECRET &&
    process.env.PAYONEER_PROGRAM_ID &&
    process.env.PAYONEER_API_BASE
  )
}

function requireConfig() {
  if (!isPayoneerConfigured()) {
    throw new Error('Payoneer is not configured: missing PAYONEER_* env vars (partner application not yet approved?)')
  }
  return {
    clientId: process.env.PAYONEER_CLIENT_ID as string,
    clientSecret: process.env.PAYONEER_CLIENT_SECRET as string,
    programId: process.env.PAYONEER_PROGRAM_ID as string,
    base: (process.env.PAYONEER_API_BASE as string).replace(/\/$/, ''),
  }
}

// Serverless functions do not share memory between invocations, so this cache
// only helps within one invocation burst -- harmless either way.
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const cfg = requireConfig()
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const res = await fetch(cfg.base + ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(cfg.clientId + ':' + cfg.clientSecret).toString('base64'),
    },
    body: 'grant_type=client_credentials&scope=read write',
  })
  const json = await res.json()
  if (!res.ok || !json.access_token) {
    throw new Error(`Payoneer token request failed: ${res.status} ${JSON.stringify(json).slice(0, 300)}`)
  }
  cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ? json.expires_in * 1000 : 300_000) }
  return cachedToken.token
}

async function payoneerFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const cfg = requireConfig()
  const token = await getAccessToken()
  const res = await fetch(cfg.base + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Payoneer ${path} failed: ${res.status} ${JSON.stringify(json).slice(0, 300)}`)
  }
  return json as T
}

// Payee onboarding: the marketplace submits a payee id (we use Seller.id) and
// gets back a hosted registration link where the seller completes bank/ID
// details directly with Payoneer -- Velor never sees or stores those details.
//
// INDIVIDUAL SELLERS (William, 2026-07-21: "stripe and payoneer to just
// request personal identification, nothing business. this way anyone can
// sign up"): Velor's model is that anyone can sell, including private
// individuals with no registered business. The registration request now
// DECLARES the payee as an individual (payee_type below) so Payoneer's
// hosted flow opens on personal identification, not company details.
// Field name follows Payoneer's documented Mass Payouts payee schema but,
// like everything in this file, is UNVERIFIED until sandbox access exists
// -- if the sandbox rejects it, correct the field name here (single source
// of truth), never by re-adding business questions. SANDBOX CHECKLIST
// (docs/PAYONEER_SETUP.md): (1) confirm the program is configured to
// allow INDIVIDUAL payees; (2) confirm this payload opens the individual
// registration flow end to end before any live payout.
export async function getRegistrationLink(params: {
  payeeId: string
  alreadyHaveAnAccount?: boolean
  redirectUrl?: string
}): Promise<{ registrationLink: string }> {
  const cfg = requireConfig()
  const json = await payoneerFetch<{ registration_link?: string; link?: string }>(
    ENDPOINTS.registrationLink(cfg.programId),
    {
      method: 'POST',
      body: {
        payee_id: params.payeeId,
        payee_type: 'INDIVIDUAL',
        already_have_an_account: params.alreadyHaveAnAccount ?? false,
        redirect_url: params.redirectUrl,
      },
    }
  )
  const registrationLink = json.registration_link || json.link
  if (!registrationLink) throw new Error('Payoneer registration-link response had no link field: ' + JSON.stringify(json).slice(0, 300))
  return { registrationLink }
}

export async function getPayeeStatus(payeeId: string): Promise<{ status: string; raw: unknown }> {
  const cfg = requireConfig()
  const json = await payoneerFetch<{ status?: string; payee_status?: string }>(ENDPOINTS.payeeStatus(cfg.programId, payeeId))
  return { status: json.status || json.payee_status || 'UNKNOWN', raw: json }
}

// Payout submission. clientReferenceId must be unique per order (we use
// `payout_<orderId>`, the same idempotency convention as the Stripe rail) so
// a retried cron run can never double-pay.
export async function createPayout(params: {
  payeeId: string
  amount: number // major units, e.g. 12.34
  currency: string // ISO code, e.g. 'USD'
  clientReferenceId: string
  description: string
}): Promise<{ payoutId: string; raw: unknown }> {
  const cfg = requireConfig()
  const json = await payoneerFetch<{ payout_id?: string; id?: string }>(ENDPOINTS.payout(cfg.programId), {
    method: 'POST',
    body: {
      payee_id: params.payeeId,
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      client_reference_id: params.clientReferenceId,
      description: params.description.slice(0, 250),
    },
  })
  const payoutId = json.payout_id || json.id
  if (!payoutId) throw new Error('Payoneer payout response had no id field: ' + JSON.stringify(json).slice(0, 300))
  return { payoutId, raw: json }
}
