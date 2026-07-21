# Payoneer Payout Rail — Setup Plan

Status: NOT LIVE. Site copy (Seller Agreement, dashboard terms, Help FAQ, privacy policy) already
says "Stripe where supported, Payoneer where not, confirmed at onboarding" — deliberately worded so
nothing promises Payoneer is available today. This document is the plan to make it real.
lib/payoutRail.ts holds the Stripe-country list and rail resolution used by code.

## Why
Stripe Connect supports seller payouts in roughly 40+ countries. Many countries with the strongest
artisan and independent-seller bases (most of Africa, South Asia outside SG/MY/TH, Latin America
outside MX/BR, Eastern Europe outside the EU) are not on that list. Payoneer covers roughly 150-200
countries and is how eBay, Walmart, Airbnb, Fiverr and Upwork pay sellers in those markets.

## Step 1 — William's action: partner application (cannot be done by AI)
1. Log in to the existing Payoneer account.
2. Apply for the Mass Payouts / Mass Payout and Services API partner program at
   developer.payoneer.com ("Become a partner" / contact sales route).
3. Be ready to provide: company registration for Velor Commerce Ltd, business model description
   (global marketplace paying third-party sellers), expected payout volumes (be honest: launching
   6 Aug 2026, low volume initially, growing), and the website (velorcommerce.store).
4. Expect a business-development conversation rather than instant self-serve, and possibly a
   manual/CSV-based Mass Payouts phase before full API credentials (OAuth 2.0 + sandbox) are granted.

## Step 2 — Build (after credentials): seller onboarding flow
1. At seller onboarding, resolve rail with getPayoutRail(seller.country).
2. STRIPE rail: existing Stripe Connect flow, unchanged.
3. PAYONEER rail: submit payee profile via Payoneer API -> receive registration link -> seller
   completes bank/ID details on Payoneer's hosted page -> store payoneerPayeeId on Seller.
4. Schema: add Seller.payoutRail (STRIPE | PAYONEER), Seller.payoneerPayeeId, keep
   stripeAccountId as-is.
5. Payout release (app/api/cron/release-payouts): branch on rail — Stripe transfer as today, or
   Payoneer Mass Payout by payee ID. Idempotency keys on both rails.

## Step 3 — Interim policy (before Payoneer is approved)
Sellers from non-Stripe countries CAN apply and list; their payouts accrue in escrow (funds are
already held until delivery + hold period anyway). Onboarding copy must say: "Payoneer payouts are
being set up for your country — your earnings are held safely and paid out as soon as your Payoneer
onboarding completes." Do not approve high-volume sellers from non-Stripe countries until the rail
is live, to cap the escrow liability.

## Costs to expect (verify at signing)
~1% receiving fee on marketplace payouts; up to ~2% FX on cross-currency withdrawal; ~$1.50 flat
same-currency bank withdrawal; annual account fee waived above $2,000/yr received. Benchmark against
Wise Platform (~0.4-0.6% FX) before committing exclusively.

## Step 4 — Sandbox verification checklist (REQUIRED before first live payout)
Added 2026-07-21 per William's standing rule: sellers are asked for PERSONAL identification only —
never business status. Anyone can sign up, including private individuals.

1. Confirm the Mass Payouts PROGRAM is configured to allow INDIVIDUAL payees (not company-only).
2. Verify lib/payoneer.ts getRegistrationLink() payload (payee_type: 'INDIVIDUAL') opens the
   individual registration flow — personal ID + bank only. If the sandbox rejects the field name,
   correct it in lib/payoneer.ts (single source of truth); never fix it by re-adding business
   questions to the seller flow.
3. Exercise every endpoint shape in ENDPOINTS against the sandbox (token, registration-link,
   payee status, payout) and correct any path/field drift.
4. Verify getPayeeStatus() returns ACTIVE for a completed individual registration — the
   release-payouts cron only pays payees whose live status is ACTIVE.
5. One end-to-end sandbox payout with client_reference_id payout_<orderId>; confirm idempotent
   retry does not double-pay.
