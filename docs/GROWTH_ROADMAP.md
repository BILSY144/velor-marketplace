# Velor Marketplace - Growth Roadmap

This document tracks the phased plan for closing the gap between what Velor's Pro and Enterprise subscription tiers advertise and what the codebase actually delivers, plus the priority build queue that follows. It reflects real, verified state as of 2026-07-05, not aspirational copy.

## Why this roadmap exists

An audit of the codebase found "Full API access & integrations" and other Enterprise/Pro claims advertised in five places (this repo's CLAUDE.md OPEN REVIEW ITEM, docs/SUBSCRIPTION_AND_TIERS.md, app/page.tsx homepage tier card, components/dashboard/TierUpgradeView.tsx feature list and comparison table, and app/dashboard/terms/page.tsx) with little or no real implementation behind them. This roadmap is the plan to either build the real feature, clearly mark it "coming soon", or remove the claim, phase by phase.
## Phase 0.1 - Fix priority-placement sort bug (complete)

Products from higher-tier sellers (Pro, Enterprise) are meant to rank above Starter-tier listings in default sort order, as advertised under "priority placement in search." The sort comparator had the tier-weight comparison inverted, so lower tiers were actually being placed first. Fixed and deployed.

## Phase 0.2 - Rule-based AI listing optimisation MVP (complete)

"AI-powered listing optimisation" was advertised for Pro/Enterprise with no implementation. Built a genuinely functional rule-based MVP that analyses a seller's listing (title length, description completeness, image count, pricing versus category norms, missing fields) and returns concrete, specific suggestions. Not a marketing LLM wrapper - real, deterministic analysis a seller can act on immediately.

## Phase 0.3 - Differentiate analytics dashboard by tier (complete)

"Custom analytics & early access" was advertised but every tier saw an identical dashboard. Rebuilt the analytics dashboard so Starter, Pro, and Enterprise sellers genuinely see different depth and features, not just the same page with a different badge.
## Phase 0.4 - Priority support flag + Enterprise contact channel (complete)

"Dedicated account manager" and priority support were advertised for Enterprise with no real routing behind them. Built a priority support flag on Enterprise seller accounts plus a real contact channel so Enterprise sellers' support requests are genuinely distinguishable and routable, rather than the claim being pure copy.

## Phase 0.5 - Minimal real seller API access for Enterprise (complete)

"Full API access & integrations" was the least-backed Enterprise claim. Rather than promising a large public API surface Velor cannot yet support, Phase 0.5 built a genuinely real, deliberately minimal version: a Prisma ApiKey model (id, sellerId, name, keyPrefix, hashedKey, lastUsedAt, revokedAt, createdAt) with a Seller.apiKeys relation, crypto helpers in lib/apiKeys.ts (generateApiKey, hashApiKey, isValidApiKeyFormat, key format vlk_live_hex, SHA-256 hashed at rest), and an authenticated management endpoint at app/api/dashboard/api-keys/route.ts, Enterprise-tier gated, where GET lists a seller's own keys (prefix, lastUsed, revoked only, never the raw key again after creation), POST generates a new key returning the plaintext exactly once, and DELETE revokes by id. A dashboard nav link ("API Keys") was added to app/dashboard/layout.tsx so sellers can actually find the page. This phase is now fully shipped end to end.
## Phase 1 - Multi-currency for buyers and sellers (FX infrastructure complete, consumer-facing UI pending)

Separate from the tier-honesty phases above, but the next priority queue item. The backend is already built and live: lib/fx.ts (FX rate service with a cache table), a public FX rates API route, lib/currency.ts (shared currency utility), and a per-seller currency setting used on the Add Product form so sellers see and price in their own real currency. Three consumer-facing pieces remain: a currency switcher in the site header so buyers can browse in their preferred currency, converting displayed prices on shop/product/marketplace pages to match the switched currency, and fixing checkout so the buyer is charged their exact converted total rather than the seller's listed currency amount. Because the checkout piece touches live Stripe payment logic and real money, that specific change will always be made with explicit sign-off in the loop rather than shipped silently.

## Not part of this roadmap, still outstanding

Two items sit outside the phase numbering above but remain open. First, the OPEN REVIEW ITEM tracked at the top of this repo's CLAUDE.md: the three dedicated tier upgrade pages (/dashboard/upgrade/starter, /pro, /enterprise) are built, deployed, and visually verified, but William has not yet reviewed the underlying business content - price-to-value justification, whether every listed feature is genuinely deliverable today, visual differentiation between tiers, and whether the in-dashboard experience actually escalates tier to tier. That section stays in CLAUDE.md verbatim until William confirms it in conversation. Second, a review of the 15 existing storefront themes was flagged as the next planned topic in an earlier session and has not yet been started.

## Working rule for this roadmap

No phase in this document is marked complete unless the underlying feature is genuinely built, deployed, and verified live - not merely coded, and not merely copy-edited to soften a claim. Where a claim cannot yet be backed by real functionality, the correct interim fix is to mark it "coming soon" or remove it, never to leave it advertised as live.

## Phase 2 - Live shopping (proposed, not started)

William raised this on 2026-07-05: sellers going live on Velor to sell products in real time, from anywhere in the world, with easy setup. Researched before writing anything down. The data backs it - live shopping converts at 9-30% industry-wide versus 2-3% for normal ecommerce, with fashion and beauty sellers seeing up to 70% in some cases. The US market alone is forecast at roughly $68B by 2026. This is not a novelty feature, it is one of the highest-leverage things a multi-seller marketplace can add.

The important architectural decision is that Velor is a marketplace of many independent sellers, not one brand selling its own catalogue. That rules out the turnkey single-brand SaaS platforms (Bambuser, Firework, Livescale) - they are built for one company embedding video commerce on its own site, cost $1,000-$10,000/month, and do not fit a model where thousands of unrelated sellers each need their own channel. The closer analog is Whatnot, a live-auction marketplace for independent sellers, which is built on LiveKit - an open-source, WebRTC-based media server (an SFU) with usage-based pricing rather than a flat enterprise SaaS fee. That is the right foundation for Velor: build the marketplace-specific product (go-live button, product pinning, chat, checkout integration) ourselves, and buy the underlying video transport instead of trying to engineer WebRTC infrastructure in-house.

Proposed phasing, each one shippable and useful on its own rather than one giant release:

- **2.1 - Scheduled go-live MVP.** A seller starts a stream from their dashboard (camera + mic via the browser, no app needed), buyers watch on a live page reachable from the seller's storefront and a site-wide "Live now" rail. One or two products are pinned on screen during the stream with a tap-to-buy button that hands off to the existing cart/checkout flow untouched - no new payment logic, no new currency logic, it reuses everything already built in Phases 0-1.
- **2.2 - Live chat and reactions.** Buyers can chat and react during a stream. This is what makes live shopping feel live rather than like a video ad, and it is what drives the impulse-buy conversion the research keeps pointing to.
- **2.3 - Drop mechanics.** Limited-quantity reveals, countdown timers, live sold-out badges. This is the single biggest lever fashion/beauty/collectibles sellers use to hit the higher end of the conversion range.
- **2.4 - Follow and notify.** Buyers follow sellers and get notified the moment they go live, so a seller can build a returning audience instead of starting from zero every stream.
- **2.5 - Replay as shoppable VOD.** Every stream automatically becomes a shoppable recorded video on the seller's storefront afterward, so the value of a single live session keeps converting long after the seller logs off.
- **2.6 - Seller analytics for streams.** Concurrent viewers, peak viewers, chat volume, conversion per stream - slotted into the tiered analytics dashboard already built in Phase 0.3 so Pro/Enterprise sellers see real depth here too.

Deliberately not proposing a native mobile app as a prerequisite - browser-based capture (getUserMedia) and browser-based viewing covers the MVP and every phase above without an app-store dependency or review cycle. A dedicated seller mobile app can be revisited later if sellers ask for camera-roll-style always-ready streaming.

Not yet scoped in detail: moderation for live video content (real-time, higher risk than static listing moderation), the cost model at scale (LiveKit/media server hosting bills scale with concurrent viewers and stream hours, needs a real usage estimate before committing spend), and whether the go-live capability should be tier-gated (e.g. Pro/Enterprise only at launch) or open to all approved sellers from day one. These need a decision from William before Phase 2.1 implementation starts - this section documents the plan, it is not yet authorized to build.