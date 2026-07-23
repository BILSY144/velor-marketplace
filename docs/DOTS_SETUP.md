# Dots.dev Payout Rail — Setup Plan

Status: NOT LIVE (no DOTS_API_KEY yet). Added 2026-07-23 as the DEFAULT payout rail for every
country Stripe Connect doesn't cover — replacing Payoneer as the default, whose Mass Payouts
partner application has sat unanswered since 13 July 2026 (see CLAUDE.md's SELLER ACQUISITION /
Payoneer checkpoints). Unlike Payoneer, Dots is genuinely self-serve: no partner-gated application,
no business-development conversation required to get a working API key. lib/payoutRail.ts holds the
Stripe-country list and rail resolution used by code; lib/dots.ts is the API client.

## Why Dots instead of (or alongside) Payoneer
Payoneer's Mass Payouts API is partner-gated — the application submitted 13 July never even created
a tracked support case until chased directly, and William's own account showed zero response weeks
later. Dots advertises sandbox API keys immediately on signup and a production go-live "usually
1-2 weeks" (Dots' own FAQ, fetched 2026-07-23) — a much better fit for the 6 Aug 2026 launch
deadline. Payoneer is NOT being abandoned: lib/payoneer.ts, its schema fields, and its release-
payouts branch are all still fully wired and will keep working for any seller already on that rail,
and if Payoneer's partner application is ever approved it remains available as a deliberate choice.
getPayoutRail() itself, though, will not assign PAYONEER to any seller going forward — DOTS is the
live default.

## Step 1 — William's action: create a Dots account (cannot be done by AI)
1. Sign up at https://dashboard.dots.dev (or usedots.com) — company: Velor Commerce Ltd, website
   velorcommerce.store, use case: marketplace seller payouts.
2. Generate a sandbox API key first; add it to Vercel as `DOTS_API_KEY` (Preview environment) to
   let a future session exercise the sandbox checklist below before going live.
3. Once ready for production, add the live key to Vercel Production, and set `DOTS_API_BASE` if
   Dots' docs specify a different production host at that point (unconfirmed as of this writing —
   see lib/dots.ts's header).

## Step 2 — Already built (2026-07-23), ahead of a real account
1. `lib/dots.ts` — API client: `isDotsConfigured()`, `createDotsUser()`, `getOnboardingLink()`,
   `getUserStatus()`, `createPayout()`. All VERIFY-IN-SANDBOX (see the file's own header) — the
   endpoint paths and payload fields follow Dots' published docs but have never been exercised
   against a real account.
2. Schema: `Seller.dotsUserId`, `Seller.dotsOnboarded`, `Payout.dotsPayoutId`.
3. `app/api/dots/onboard/route.ts` — GET (status + rail resolution + gate-cookie sync), POST
   (creates the Dots user + onboarding link, or records interest if not yet configured).
4. `app/dashboard/dots/page.tsx` — seller-facing setup page, mirrors `/dashboard/payoneer`'s
   structure and rail-guard pattern.
5. `app/api/cron/release-payouts/route.ts` — DOTS branch: pays only a user Dots itself reports
   onboarded, idempotency key `payout_<orderId>` (same convention as Stripe/Payoneer).
6. The mandatory payout-verification dashboard gate (`middleware.ts`, `lib/payoutGateCookie.ts`)
   requires a DOTS-rail seller to complete real Dots onboarding before using the rest of the
   dashboard — same bar as a Stripe-rail seller, closing the exemption Payoneer-rail sellers still
   have (see `lib/payoutGateCookie.ts` for why Payoneer stays exempted).

## Step 3 — Sandbox verification checklist (REQUIRED before first live payout)
Two things specifically need confirming against a real sandbox account — flagged again in
lib/dots.ts at their exact call site:

1. Whether `POST /v2/payout-links` accepts `amount: 0` for a pure onboarding/verification link with
   no real money attached (`getOnboardingLink()` tries this first). If the sandbox rejects a zero
   amount, change `ONBOARDING_LINK_AMOUNT_MINOR` in lib/dots.ts to a small nominal amount instead
   (e.g. `100` = GBP 1.00) — single source of truth, no other file needs to change.
2. The exact shape of `GET /v2/users/{id}` — whether it reports a payout method / compliance status
   directly (what `getUserStatus()` assumes), or whether onboarded status must instead be inferred
   from payout-link webhook events (`payout_link.claimed`, `user.updated.payout_method`, etc. — see
   Dots' webhook docs). If the assumption is wrong, either fix `getUserStatus()`'s field-reading, or
   add a webhook receiver that flips `Seller.dotsOnboarded` on the relevant event and have
   `getUserStatus()` become a secondary/fallback check only.
3. Exercise every endpoint in `lib/dots.ts` (create user, onboarding link, status, send-payout)
   against the sandbox and correct any path/field drift — same discipline as
   `docs/PAYONEER_SETUP.md`'s equivalent step.
4. One end-to-end sandbox payout with `idempotency_key: payout_<orderId>`; confirm a retried run
   does not double-pay.
5. Confirm the individual (non-business) seller model Velor uses everywhere else (Stripe Express
   individual accounts, Payoneer `payee_type: 'INDIVIDUAL'`) has an equivalent on Dots — `lib/dots.ts`
   currently only ever sends personal name/email/phone, never company details, but this has not
   been confirmed to produce a personal (not business) onboarding flow on Dots' hosted page.

## Costs to expect (verify at signing)
Dots' published pricing model (per their docs, not independently negotiated) is a monthly platform
fee plus per-payout fees, with custom volume pricing available on request — get an actual quote
before committing, and compare against Payoneer's ~1% receiving fee + ~2% cross-currency FX +
~$1.50 flat withdrawal if Payoneer's partner application is ever approved as an alternative.

## Not independently verified
Dots' Trustpilot page returned a 403 when fetched for reputation research (2026-07-23) — no
sentiment/reviews were confirmed either way. Treat this as an open gap, not a red flag.
