// Seller identity verification via Stripe Identity.
//
// Velor does not accept a seller until a real, government-issued identity
// document has been verified. We deliberately do NOT store or even receive the
// document: Stripe hosts the capture, holds the images, and returns only a
// pass/fail. That keeps passport and driving-licence scans off Velor's
// infrastructure entirely, which is the single biggest data-protection win
// available to a marketplace this size.
//
// Stripe Identity is independent of Stripe Connect. It is billed to Velor's
// own Stripe account and can verify a seller in a country Stripe Connect does
// not support payouts to -- which is exactly the Payoneer-rail population.
// Verified in the Stripe docs (2026-07-08):
//   - Business location eligibility: GB is generally available. Velor Commerce
//     Ltd is registered in England and Wales.
//   - Documents from "hundreds of countries" are accepted.
//   - API: stripe.identity.verificationSessions.create({ type: 'document' })
//     returns `url` (hosted flow) and `client_secret` (modal flow).
//   - Webhooks: identity.verification_session.verified | requires_input
//       | processing | canceled
//
// RESTRICTED JURISDICTIONS: Stripe's Identity terms forbid verifying anyone
// linked directly or indirectly with the jurisdictions below. This is a legal
// prohibition, not a preference -- we must never create a VerificationSession
// for these sellers. They are held pending Payoneer's own regulated KYC
// (Payoneer operates an audited FATF/EU/US-standard KYC programme across 200
// countries and exposes KYC webhooks through its white-label API, which is
// partner-gated and not yet approved for Velor -- see docs/PAYONEER_SETUP.md).
// Source: https://docs.stripe.com/identity/use-cases

import Stripe from 'stripe'

/** ISO-2 codes Stripe Identity may not verify. */
export const RESTRICTED_IDENTITY_COUNTRY_CODES = new Set([
  'CN', // China
  'RU', // Russian Federation
  'CU', // Cuba
  'IR', // Iran
  'KP', // North Korea
  'SY', // Syria
])

/**
 * Country names as they are stored on SellerApplication.country (the /apply
 * form saves WORLD_COUNTRIES names, not codes) plus the disputed regions
 * Stripe names explicitly and which have no ISO-2 code of their own.
 */
const RESTRICTED_IDENTITY_COUNTRY_NAMES = [
  'china',
  'russia',
  'russian federation',
  'cuba',
  'iran',
  'north korea',
  "korea, democratic people's republic of",
  'syria',
  'crimea',
  'donetsk',
  'luhansk',
]

/**
 * True when Stripe Identity is legally not permitted to verify a person from
 * this country. Accepts either an ISO-2 code or a full country name, because
 * the application form and the seller record disagree about which they store.
 */
export function isRestrictedForIdentity(country: string | null | undefined): boolean {
  if (!country) return false
  const raw = country.trim()
  if (raw.length === 2 && RESTRICTED_IDENTITY_COUNTRY_CODES.has(raw.toUpperCase())) return true
  const lower = raw.toLowerCase()
  return RESTRICTED_IDENTITY_COUNTRY_NAMES.some((name) => lower.includes(name))
}

/** Stripe Identity cannot verify anyone under 16 (Stripe Identity terms). */
export const IDENTITY_MINIMUM_AGE = 16

export function isIdentityConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

function client(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key)
}

export interface StartedVerification {
  sessionId: string
  /** Stripe-hosted page the seller is sent to. Never expires silently. */
  url: string
}

/**
 * Create a hosted Stripe Identity document check for one application.
 * The applicationId is stored in metadata so the webhook can find its way home.
 */
export async function createVerificationSession(
  applicationId: string,
  contactEmail: string
): Promise<StartedVerification> {
  const session = await client().identity.verificationSessions.create({
    type: 'document',
    metadata: { applicationId, contactEmail },
    return_url: `https://velorcommerce.store/apply/verified?application=${applicationId}`,
  })
  if (!session.url) {
    // Should not happen for a hosted session, but never hand back a broken link.
    throw new Error('Stripe returned a verification session with no URL')
  }
  return { sessionId: session.id, url: session.url }
}

/** Map a Stripe webhook event type onto the status we persist. */
export function statusFromEventType(eventType: string): string | null {
  switch (eventType) {
    case 'identity.verification_session.verified':
      return 'VERIFIED'
    case 'identity.verification_session.requires_input':
      return 'FAILED'
    case 'identity.verification_session.processing':
      return 'PROCESSING'
    case 'identity.verification_session.canceled':
      return 'CANCELED'
    default:
      return null
  }
}

/** Verify a webhook came from Stripe. Throws if the signature does not match. */
export function constructIdentityEvent(rawBody: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_IDENTITY_WEBHOOK_SECRET is not set')
  return client().webhooks.constructEvent(rawBody, signature, secret)
}
