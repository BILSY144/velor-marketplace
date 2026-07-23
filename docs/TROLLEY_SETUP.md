# Trolley (usetrolley.com) Payout Rail — Setup Plan

Status: NOT LIVE (no TROLLEY_ACCESS_KEY/TROLLEY_SECRET_KEY yet). Added 2026-07-23 evening as the
DEFAULT payout rail for every country Stripe Connect doesn't cover — replacing Dots.dev, which
was confirmed the SAME DAY to be a permanent dead end for this company: Dots' business Country
field is hard-locked to United States businesses only ("Only US businesses are supported at the
moment", confirmed both live in the signup UI and by Dots' own AI documentation assistant), and
Velor Commerce Ltd is UK-registered, so a Dots account can never exist. lib/payoutRail.ts holds
the Stripe-country list and rail resolution used by code; lib/trolley.ts is the API client.

## Why Trolley instead of Dots or Payoneer

Dots is not merely slow or partner-gated like Payoneer — it is structurally impossible for a
UK-registered company, confirmed directly rather than assumed. Payoneer's Mass Payouts API is
partner-gated and has sat unanswered since 13 July 2026 (see CLAUDE.md's SELLER ACQUISITION /
Payoneer checkpoints). Trolley supports UK businesses and offers a real bank-transfer payout rail
via its "Bank Transfer Activation" onboarding (Business Structure → Directors → Beneficial
Owners → Shareholder Register → Review Submission) — a KYC/compliance review of Velor itself,
not a per-seller gate. William completed and submitted this activation on 2026-07-23 evening; it
is now awaiting Trolley's own review. Dots is NOT being deleted: lib/dots.ts, its schema fields,
and its onboarding route/page all remain in place (never delete a working path without being
asked), but getPayoutRail() will never assign DOTS to a seller again — it is a confirmed
permanent dead end, unlike Payoneer, which stays open as a legacy possibility if its partner
application is ever approved.

## Step 1 — Already done: William's Bank Transfer Activation submission

Completed 2026-07-23 evening at dashboard.trolley.com/activate/bank — Business Structure,
Beneficial Owners (William Sinclair, 100% owner, all required fields including his own Tax
Identification Number, entered by William himself, never by Claude — see the standing rule in
CLAUDE.md against ever entering government ID numbers), Shareholder Register, and Review
Submission all show COMPLETED / "Form Submitted" on Trolley's own dashboard. This is Trolley's
own KYC review process — nothing in this codebase or session can accelerate it. Note: Trolley's
initial signup separately auto-approved the account for **PayPal payouts only** — that is a
different, narrower product and is NOT the rail Velor needs; the Bank Transfer Activation above
is the one that matters.

## Step 2 — William's action once Trolley approves: add live API keys

1. Trolley issues live API keys once the Bank Transfer Activation is approved. Add them to
   Vercel:
   - `TROLLEY_ACCESS_KEY` (Production and Preview)
   - `TROLLEY_SECRET_KEY` (Production and Preview, marked Sensitive)
   - `TROLLEY_API_BASE` — only if Trolley's docs specify a different host for
     sandbox vs production at that point (default in lib/trolley.ts is
     `https://api.trolley.com/v1`, unconfirmed whether a separate sandbox host exists).
2. The moment `TROLLEY_ACCESS_KEY`/`TROLLEY_SECRET_KEY` exist, `isTrolleyConfigured()` returns
   true and the whole rail activates with zero further code changes — this is the same
   "adapter built ahead of credentials" pattern already used for Payoneer and Dots.
3. **REVISIT `lib/payoutGateCookie.ts` at this point** — its `payoutGateSatisfied()` currently
   exempts TROLLEY-rail sellers from the mandatory payout-verification dashboard gate ONLY while
   `trolleyConfigured` is false (see that file's own header comment, "REVISIT (TROLLEY)"). Once
   real keys exist, stop passing `trolleyConfigured=false` so TROLLEY-rail sellers are held to
   the same bar as Stripe-rail sellers (a real completed Trolley onboarding, not an exemption).

## Step 3 — Already built (2026-07-23 evening), ahead of a real account

1. `lib/trolley.ts` — API client: `isTrolleyConfigured()`, `createRecipient()`,
   `getRecipientStatus()`, `getOnboardingWidgetUrl()`, `createPayout()`. HMAC-SHA256 request
   signing per Trolley's documented scheme (`Authorization: prsign ACCESS_KEY:SIGNATURE`,
   `X-PR-Timestamp`, 30-second expiry). All VERIFY-IN-SANDBOX (see the file's own header) — the
   endpoint paths and payload fields follow Trolley's published API reference
   (developers.trolley.com, fetched 2026-07-23) but have never been exercised against a real or
   sandbox account.
2. Schema: `Seller.trolleyRecipientId` (unique), `Seller.trolleyOnboarded`,
   `Payout.trolleyPayoutId` (unique).
3. `app/api/trolley/onboard/route.ts` — GET (rail resolution + self-heal + gate-cookie sync),
   POST (creates the Trolley recipient + signed onboarding widget link, or records interest via
   `AgentLog` if not yet configured).
4. `app/dashboard/trolley/page.tsx` — seller-facing setup page, mirrors `/dashboard/dots` and
   `/dashboard/payoneer`'s structure and three-way rail-guard pattern (redirects a STRIPE-rail
   seller to `/dashboard/stripe-connect`, a legacy DOTS-rail seller to `/dashboard/dots`, a
   legacy PAYONEER-rail seller to `/dashboard/payoneer`).
5. `app/api/cron/release-payouts/route.ts` — TROLLEY branch: pays only a recipient Trolley
   itself reports `complianceStatus: 'verified'` AND has an on-file `payoutMethod`, self-heals
   `Seller.trolleyOnboarded`/`identityVerified`, idempotency via `clientReferenceId:
   payout_<orderId>` (same convention as every other rail). Positioned before the now-relabeled
   LEGACY DOTS branch, which is effectively unreachable since `getPayoutRail()` will never again
   return `'DOTS'` but is kept rather than deleted.
6. `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/dashboard/payouts/page.tsx`,
   `app/dashboard/stripe-connect/page.tsx`, `app/api/dashboard/payouts/route.ts` — all updated to
   route/label/brand TROLLEY as the live non-Stripe rail, alongside (not replacing) the existing
   DOTS/PAYONEER legacy branches for any seller row not yet self-healed onto TROLLEY.
7. The mandatory payout-verification dashboard gate (`middleware.ts`, `lib/payoutGateCookie.ts`)
   currently EXEMPTS TROLLEY-rail sellers while `isTrolleyConfigured()` is false — see Step 2.3
   above for when to remove that exemption.

## Step 4 — Sandbox verification checklist (REQUIRED before first live payout)

Three things specifically need confirming against a real account once credentials exist —
flagged again in lib/trolley.ts at their exact call sites:

1. The exact recipient-payment field names inside a batch (`POST /batches/:id/payments`) —
   `amount`, `currency`, `recipientId` and a client-supplied idempotency field are documented in
   outline but the precise idempotency field name (`externalId` vs `clientReferenceId` vs a
   memo-based approach) was not confirmed against a live account. `createPayout()` currently
   sends `externalId`.
2. Whether the signed `widget.trolley.com` URL genuinely works as a full standalone redirect
   page (not just an iframe `src`) — Trolley's docs state it can be "loaded inside an iframe, or
   as a page of its own", which `getOnboardingWidgetUrl()` relies on for a Payoneer/Dots-style
   hosted-link onboarding flow, but this has not been tested live.
3. Whether a `region` (ISO 3166-2) is genuinely required for a UK address, or optional as the
   docs suggested — confirm before assuming a missing region silently succeeds.
4. Whether `GET /recipients/:id`'s `payoutMethod` field is the right signal for "has added a
   bank account" — `getRecipientStatus()`'s `onboarded` check currently requires both
   `complianceStatus === 'verified'` AND a truthy `payoutMethod`.
5. One end-to-end sandbox payout with `clientReferenceId: payout_<orderId>`; confirm a retried
   run does not double-pay.
6. Confirm the individual (non-business) seller model Velor uses everywhere else (Stripe Express
   individual accounts, Payoneer `payee_type: 'INDIVIDUAL'`, Dots personal-only fields) produces
   an equivalent personal (not business) flow on Trolley — `createRecipient()` always sends
   `type: 'individual'`.

## Costs to expect (verify at signing)

Not independently researched this session — get an actual quote from Trolley once the Bank
Transfer Activation is approved, and compare against Payoneer's ~1% receiving fee + ~2%
cross-currency FX + ~$1.50 flat withdrawal if Payoneer's partner application is ever approved as
an alternative.

## Not independently verified

Trolley's reputation/reviews were not independently researched this session. The endpoint
shapes above are read from developers.trolley.com's published API reference (fetched
2026-07-23), not exercised against a live account — see Step 4.
