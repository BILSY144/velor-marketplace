# Velor Marketplace — Payout Escrow (LOCKED SPEC)

Status: FINAL and DEPLOYED 2026-07-03, amended 2026-07-06 and 2026-07-10 (see below). Commit 1e72cec + shipping-model amendment + trusted-graduation amendment. Do not re-litigate; changes require an explicit new decision from William.

## AMENDMENT — 2026-07-10 (Faster graduation to trusted: 5 orders / 14 days, was 10 / 30)

**Decision:** William asked whether the 15-day probation hold was normal (benchmarked against eBay 30 days, Etsy 14-20 days, Depop up to 10 days for new sellers — Velor's 15 days sits inside that range, not an outlier) and wanted a fairer solution for sellers without reopening risk. Probation hold (15 days) and trusted hold (72 hours) are UNCHANGED — the 15-day probation hold still exactly matches the fixed 15-day buyer return window, which is the whole point of that number and must not be shortened on its own (would create a window where a new, unproven seller is paid before a legitimate return can still be filed).

**What changed:** the bar to graduate off probation into the 72-hour trusted tier is now 5+ delivered orders and a 14+ day old account (was 10 orders / 30 days), still requiring zero unresolved disputes or returns. This shortens the typical time to fast payouts for legitimately good sellers from roughly a month to about two weeks, while leaving the return-window-aligned protection for day-one sellers exactly as it was.

**Files touched by this amendment:** `lib/payouts.ts` (`TRUSTED_MIN_DELIVERED` 10 to 5, `TRUSTED_MIN_AGE_MS` 30 days to 14 days).

---

## AMENDMENT — 2026-07-06 (Velor never buys shipping labels — zero platform capital)

**Decision:** William confirmed Velor is a pure platform and must never pay out of its own pocket for anything, including shipping. As a new company, Velor has no operating float to spend on carrier costs.

**What changed:** Velor's Shippo integration is now **read-only for rate quoting** (`/shipments/`, a free Shippo endpoint used to show buyers a live shipping cost at checkout) and for **free tracking registration** (`/tracks/`, also free). Velor's own Shippo account **never calls `/transactions/`** — the label-purchase endpoint that actually costs money — again. The seller-dashboard "Create Shipping Label" flow was removed entirely and replaced with a manual "Mark as Shipped" flow: the seller ships the order themselves, using their own carrier account and their own money, then enters carrier + tracking number (+ optional tracking URL) in the dashboard. Velor registers that tracking number with Shippo's free tracking endpoint (best-effort, non-blocking) purely so the existing delivery webhook keeps working automatically.

**What did NOT change:** The buyer is still charged the full amount (product + shipping + duties) in one Stripe PaymentIntent at checkout, and that money is still held on the platform, untouched, until delivery is confirmed and the hold window passes — exactly as below. The seller's payout still includes the full shipping amount the buyer paid, which is now correct: the seller is the one who actually paid for the physical shipping, so this is reimbursement, not a bonus. Before this amendment, Velor's own Shippo balance paid for the physical label immediately at ship time (a real cash outlay) while the seller was *also* paid the buyer's full shipping fee at payout time, with nothing ever reconciling the two — this amendment closes that gap by making sure Velor is never the one spending money on a label in the first place.

**Why this is zero-risk to the platform:** Velor never touches carrier costs. The only "float" that exists is the buyer's own money sitting in Velor's Stripe balance between charge and payout — which is the intended escrow, not platform capital.

**Files touched by this amendment:** `lib/shippo.ts` (`purchaseLabel` no longer called anywhere — kept only for reference; added `createTrack` + `normalizeCarrierToken` for free tracking registration), `app/api/dashboard/shipping/label/route.ts` (rewritten: manual carrier/tracking entry instead of Shippo label purchase), `app/dashboard/orders/page.tsx` (UI replaced: "Create Shipping Label (DDP)" button → "Mark as Shipped" form with carrier/tracking/tracking-URL fields).

---

## Principle

Protect the platform from being out of pocket for refunds/chargebacks **or for shipping**. Buyer funds are held on the Velor platform Stripe account until the order is confirmed delivered and a hold window passes, then the seller share is released by a Stripe transfer. Velor itself never spends money on carrier labels — sellers fulfil their own orders.

## Money flow (separate charges and transfers)
- Buyer pays: payment-intent charges the full amount (product + shipping + duties) to the PLATFORM account with NO transfer_data — all funds held on the platform.
- The seller share (shipping + duties + product minus tier commission) is recorded in the PaymentIntent metadata (sellerShare in pence) plus sellerAccountId.
- Shipping: the seller ships the order themselves, with their own carrier account and their own money. Velor never purchases a label or fronts any shipping cost (see amendment above).
- Delivery: the Shippo webhook stamps deliveredAt when the order becomes DELIVERED, driven by the free tracking registration made when the seller reports their tracking number.
- Release: /api/cron/release-payouts (every 4 hours) transfers sellerShare to the seller connected account once eligible, and records a Payout row.

## Hold windows (after confirmed delivery)
- Probation (new) sellers: 15 days.
- Trusted sellers: 72 hours.

## Graduation to trusted (automatic)

ALL of: 5+ delivered orders, account age 14+ days, and zero unresolved disputes or returns across their orders. (Lowered from 10 orders / 30 days on 2026-07-10 — see amendment above.)

## Freeze on issues

If a return or dispute is open on an order, that order payout is frozen until resolved, regardless of the timer. Resolved return states: RESOLVED, REJECTED, CLOSED, COMPLETED, REFUNDED, DENIED. Resolved dispute states: RESOLVED, CLOSED, WON, LOST.

## Safety
- Transfers use an idempotency key (payout_orderId) so the cron can never double-pay.
- One Payout row per order (orderId unique) is the ledger; orders with a payout are skipped.
- Sellers must complete Stripe Connect onboarding; if not connected, release is skipped and funds stay safely on the platform until they connect.
- Commission is applied by tier at sale time (Starter 15 percent, Pro 8 percent, Enterprise 5 percent) and kept by the platform.
- Velor never spends its own money on shipping labels — see amendment above. The platform's only exposure is the buyer's own held funds, which is the intended escrow.

## Files
- lib/payouts.ts — hold windows, trusted check, open-issue check
- lib/shippo.ts — rate quoting (free) + free tracking registration only; label purchase (`purchaseLabel`) exists but is not called anywhere
- app/api/dashboard/shipping/label/route.ts — seller-reported manual carrier/tracking entry, marks order SHIPPED, registers free Shippo tracking best-effort
- app/dashboard/orders/page.tsx — "Mark as Shipped" dashboard UI
- app/api/cron/release-payouts/route.ts — release job (CRON_SECRET-guarded, every 4h)
- app/api/stripe/payment-intent/route.ts — holds funds, records sellerShare + sellerAccountId
- app/api/webhooks/shippo/route.ts — stamps deliveredAt on DELIVERED
- prisma/schema.prisma — Order.deliveredAt; Payout model
- app/api/seller/payouts/route.ts — reporting; manual withdrawal disabled
- vercel.json — release-payouts cron

## Manual withdrawal

Disabled. Payouts are automatic; the old request-payout endpoint now returns an explanatory message.
