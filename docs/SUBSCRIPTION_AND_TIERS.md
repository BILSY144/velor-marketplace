# Velor Marketplace — Subscription Tiers & Billing (LOCKED SPEC)

Status: FINAL and DEPLOYED. Do not re-litigate. Any change requires an explicit new decision from William.
Last locked: 2026-07-04.

**2026-07-04 update (William's decision):** Starter listing cap lowered 50 → 20 (headline features now explicitly include seller dashboard and buyer protection). Pro listing cap changed from unlimited to a 200 hard cap, and Pro now includes a free custom storefront. Enterprise unchanged except it also now explicitly lists a free custom storefront. Commission rates unchanged (15% / 8% / 5%).

## Tiers

| Tier | Price | Commission | Listings | Extras |
|------|-------|-----------|----------|--------|
| Starter | Free | 15% | Up to 20 (hard cap) | Seller dashboard, analytics, order tools, buyer protection on every sale |
| Pro | £49/mo | 8% | Up to 200 (hard cap) | Free custom storefront, professional dashboard (AI optimisation, pricing insights, advanced analytics, priority placement, dedicated support) |
| Enterprise | £199/mo (fixed, non-negotiable) | 5% | Unlimited | Everything in Pro + dedicated personal account manager + full API access/integrations + custom analytics + early feature access |

## Stripe (LIVE mode, acct_1TlcWCDB5eA3Wfmu — VELOR COMMERCE LTD)

- Velor Pro: product prod_UoqPFKqNkXMB52, price price_1TpCiTDB5eA3Wfmu2kP5Ilwg (£49/mo GBP recurring)
- Velor Enterprise: product prod_UoqXwy4RXYEoFl, price price_1TpCqXDB5eA3Wfmuw3y2bScF (£199/mo GBP recurring)

Vercel env (Production + Preview): STRIPE_PRO_PRICE_ID, STRIPE_ENTERPRISE_PRICE_ID.

## Billing behaviour (all automatic)

1. Monthly charge: Stripe recurring subscription auto-charges every month. No manual step.
2. Checkout: POST /api/seller/subscription with action 'upgrade_to_pro' or 'upgrade_to_enterprise'. priceId is chosen by action; success_url carries &plan= so the confirmation toast is plan-correct (Pro=8%, Enterprise=5%).
3. Tier resolution (webhook): tier is resolved by matching the Stripe price id against STRIPE_ENTERPRISE_PRICE_ID / STRIPE_PRO_PRICE_ID env vars — NOT price metadata. This guarantees Enterprise = 5% and Pro = 8%.
4. Failed payment: invoice.payment_failed sets subscriptionStatus = 'past_due' and emails the seller with the retry date. Stripe auto-retries (dunning).
5. Cancellation / dunning exhausted: customer.subscription.deleted resets seller to STARTER (tier=STARTER, subscriptionStatus='cancelled', subscription fields cleared).

## Listing cap enforcement

- Hard block: POST /api/dashboard/products refuses to create a 21st listing for a STARTER seller and a 201st listing for a PRO seller (403 "Listing limit reached"). LISTING_LIMITS = { STARTER: 20, PRO: 200, ENTERPRISE: null }. Enterprise sellers can never hit a cap.
- On downgrade to STARTER (subscription cancelled/deleted): keep the 20 OLDEST live (APPROVED) listings; DELIST the excess.
- DELIST = status set to DELISTED (hidden from storefront, NOT deleted). Seller keeps them and can relist after upgrading.
- PROTECTED: a listing is NEVER delisted if it has an order in PENDING, PROCESSING, or DISPUTED state at the time of downgrade. Protected excess stays live even if that keeps the seller temporarily above 20; it is only trimmed on a later downgrade once its orders have settled.
- Note: there is no self-serve Enterprise→Pro downgrade path in this app (only cancel-to-Starter or upgrade). If one is added later, the same 200-cap delisting logic used for Starter should be replicated for a Pro landing.

## No DB migration required

Uses existing ProductStatus.DELISTED and existing Seller tier/subscription fields. No prisma db push needed for any of the above.

## Commit trail (main)

- e822609 wire Enterprise tier checkout + Enterprise fee 199
- 894e1c8 Enterprise self-serve checkout on upgrade page
- 64108af plan-aware checkout success message (Pro + Enterprise)
- 47e57b7 resolve tier by Stripe price id (Enterprise=5%) + delist over-50 on downgrade
- 1d8834d never delist listings with pending/processing/disputed orders on downgrade
- (2026-07-04) Starter cap 50→20, Pro cap unlimited→200, Pro + Enterprise both list free custom storefront
