# Velor Marketplace — Seller Ranking System (LOCKED SPEC)

Status: FINAL and DEPLOYED 2026-07-03 (commits: d6608c3 feature, ff7819e fix). Sort mechanism amended 2026-07-06 with William's explicit authorisation to add a tier ranking boost (see "Tier ranking boost" below) — this is the one specific, approved change; everything else in this spec remains locked. Any further change requires an explicit new decision from William.

## What it drives (all three)

1. Storefront and search placement (/shop, /marketplace, and the homepage "Featured Sellers" list).
2. Buyer-facing trust badge on seller profiles (badge fields also returned in the shop product payload).
3. Internal quality signal (full component breakdown stored per seller for moderation, featured picks, payout-risk).

## Sort order

Products and featured-seller lists are ordered by rankingScore descending, then newest. rankingScore = sellerScore (the 0-100 merit score below) plus a bounded tier boost. This replaced an earlier hard tier-band-first sort (Enterprise, then Pro, then Starter, merit only breaking ties within a band) that let any paid seller outrank every free seller regardless of performance. Buyers can still switch to price or newest sorts.

## Tier ranking boost (authorised by William, 2026-07-06)

- STARTER: +0
- PRO: +8
- ENTERPRISE: +15

This is additive on top of the 0-100 merit score, not a replacement for it. It is a genuine, noticeable placement advantage for paid tiers — a Pro or Enterprise seller with an average score now visibly outranks a Starter seller with an equally average score — but it is bounded so it cannot fully override merit: a strongly-performing Starter seller (e.g. score 70) still outranks a poorly-performing Enterprise seller (e.g. score 40 + 15 = 55). The boost only ever closes part of the gap, never all of it.

The boost is computed and stored server-side in the same place as the merit score (lib/seller-ranking.ts, computeSellerScore), on a separate rankingScore field. The buyer-facing sellerScore and sellerBadge fields (shown on seller profiles and in the shop payload as a trust signal) are untouched by the boost and remain pure merit — the tier boost affects where a seller is placed in a list, not the trust badge buyers see.

## Score (0-100) weights — merit only, unaffected by tier

- Average review rating: 30
- On-time fulfilment rate (shipped or delivered / paid orders): 20
- Low dispute+refund rate (inverse): 15
- Low cancellation rate (inverse): 10
- Completed-order volume (log-scaled, full marks at 200 delivered): 15
- Message response rate (sent/received, capped at 1): 10

Each component contributes 0 when the seller has no data for it, so new sellers start at 0 (bottom) and earn rank.

## Badge (unlocked at 10+ delivered orders)

- 90-100: TOP_RATED (Top Rated Seller)
- 75-89: TRUSTED (Trusted Seller)
- 60-74: ESTABLISHED (Established Seller)
- otherwise / under 10 delivered orders: NEW (no badge shown)

## Anti-gaming

Reviews are verified-purchase only. Sales credit requires delivered orders. Self-purchases are excluded by the verified-purchase + distinct-account rule.

## Recompute

- Daily cron /api/cron/recompute-rankings at 03:00 UTC (CRON_SECRET-guarded) recomputes every approved seller's sellerScore and rankingScore — authoritative.
- Instant refresh when a new review is posted (reviews route calls computeSellerScore for that seller).
- Order-status changes (volume, fulfilment, disputes, cancellations) are reflected by the next daily run.
- Tier changes (upgrade/downgrade) take effect on the seller's next recompute — not instantly — same as every other input to the score.

## Data model

Seller gains: sellerScore (Float default 0, merit only), sellerBadge (String, merit only), sellerScoreUpdatedAt (DateTime), scoreBreakdown (Json), rankingScore (Float default 0, sellerScore + tier boost — sort key only, never shown to buyers as a score). Applied automatically by prisma db push in the Vercel build command — no manual migration.

## Files

- lib/seller-ranking.ts — computeSellerScore, recomputeAllSellerScores, TIER_BOOST constant
- app/api/cron/recompute-rankings/route.ts — daily cron
- app/api/shop/products/route.ts — /shop listing sort + badge fields in payload
- app/api/marketplace/products/route.ts — /marketplace listing sort
- app/api/sellers/featured/route.ts — homepage featured-sellers sort
- app/api/reviews/route.ts — instant recompute trigger
- app/seller/[sellerId]/page.tsx — badge display
- prisma/schema.prisma — Seller ranking fields
- vercel.json — daily cron schedule
