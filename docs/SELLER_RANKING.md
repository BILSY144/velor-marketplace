# Velor Marketplace — Seller Ranking System (LOCKED SPEC)

Status: FINAL and DEPLOYED 2026-07-03. Commits: d6608c3 (feature), ff7819e (fix). Build READY. Do not re-litigate; changes require an explicit new decision from William.

## What it drives (all three)

1. Storefront and search placement.
2. Buyer-facing trust badge on seller profiles (badge fields also returned in the shop product payload).
3. Internal quality signal (full component breakdown stored per seller for moderation, featured picks, payout-risk).

## Sort order

Products are ordered by seller tier band first, then by seller performance score: Enterprise sellers, then Pro sellers, then Starter sellers; within each band highest score first, then newest. Enum ordering ENTERPRISE < PRO < STARTER (ascending) naturally yields that band order. Paid always outranks free; merit sorts within each band. Buyers can still switch to price or newest sorts.

## Score (0-100) weights

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

- Daily cron /api/cron/recompute-rankings at 03:00 UTC (CRON_SECRET-guarded) recomputes every approved seller — authoritative.
- Instant refresh when a new review is posted (reviews route calls computeSellerScore for that seller).
- Order-status changes (volume, fulfilment, disputes, cancellations) are reflected by the next daily run.

## Data model

Seller gains: sellerScore (Float default 0), sellerBadge (String), sellerScoreUpdatedAt (DateTime), scoreBreakdown (Json). Applied automatically by prisma db push in the Vercel build command — no manual migration.

## Files

- lib/seller-ranking.ts — computeSellerScore, recomputeAllSellerScores
- app/api/cron/recompute-rankings/route.ts — daily cron
- app/api/shop/products/route.ts — tier-banded sort + badge fields in payload
- app/api/reviews/route.ts — instant recompute trigger
- app/seller/[sellerId]/page.tsx — badge display
- prisma/schema.prisma — Seller ranking fields
- vercel.json — daily cron schedule
