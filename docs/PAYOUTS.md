# Velor Marketplace — Payout Escrow (LOCKED SPEC)

Status: FINAL and DEPLOYED 2026-07-03. Commit 1e72cec. Do not re-litigate; changes require an explicit new decision from William.

## Principle

Protect the platform from being out of pocket for refunds/chargebacks. Buyer funds are held on the Velor platform Stripe account until the order is confirmed delivered and a hold window passes, then the seller share is released by a Stripe transfer.

## Money flow (separate charges and transfers)

1. Buyer pays: payment-intent charges the full amount (product + shipping + duties) to the PLATFORM account with NO transfer_data — all funds held on the platform.
2. The seller share (shipping + duties + product minus tier commission) is recorded in the PaymentIntent metadata (sellerShare in pence) plus sellerAccountId.
3. Delivery: the Shippo webhook stamps deliveredAt when the order becomes DELIVERED.
4. Release: /api/cron/release-payouts (every 4 hours) transfers sellerShare to the seller connected account once eligible, and records a Payout row.

## Hold windows (after confirmed delivery)

- Probation (new) sellers: 15 days.
- Trusted sellers: 72 hours.

## Graduation to trusted (automatic)

ALL of: 10+ delivered orders, account age 30+ days, and zero unresolved disputes or returns across their orders.

## Freeze on issues

If a return or dispute is open on an order, that order payout is frozen until resolved, regardless of the timer. Resolved return states: RESOLVED, REJECTED, CLOSED, COMPLETED, REFUNDED, DENIED. Resolved dispute states: RESOLVED, CLOSED, WON, LOST.

## Safety

- Transfers use an idempotency key (payout_orderId) so the cron can never double-pay.
- One Payout row per order (orderId unique) is the ledger; orders with a payout are skipped.
- Sellers must complete Stripe Connect onboarding; if not connected, release is skipped and funds stay safely on the platform until they connect.
- Commission is applied by tier at sale time (Starter 15 percent, Pro 8 percent, Enterprise 5 percent) and kept by the platform.

## Files

- lib/payouts.ts — hold windows, trusted check, open-issue check
- app/api/cron/release-payouts/route.ts — release job (CRON_SECRET-guarded, every 4h)
- app/api/stripe/payment-intent/route.ts — holds funds, records sellerShare + sellerAccountId
- app/api/webhooks/shippo/route.ts — stamps deliveredAt on DELIVERED
- prisma/schema.prisma — Order.deliveredAt; Payout model
- app/api/seller/payouts/route.ts — reporting; manual withdrawal disabled
- vercel.json — release-payouts cron

## Manual withdrawal

Disabled. Payouts are automatic; the old request-payout endpoint now returns an explanatory message.
