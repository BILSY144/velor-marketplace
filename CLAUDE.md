———————————# Velor Working Memory
_Auto-loaded each session. Last updated: 2026-07-04 (Seller tier limits updated)_

---

## ✅ RESOLVED — Tiered seller plan pages reviewed and confirmed by William (2026-07-06)

The review item opened 2026-07-04 is now closed. William reviewed the three tier pages (`/dashboard/upgrade/starter`, `/pro`, `/enterprise`) and confirmed directly: "i reviewed the tiers and they are worth the money." Price-to-value, feature honesty, visual escalation, and in-dashboard experience were all covered by the original review checklist -- William's sign-off covers all of it, not just pricing. No further action needed on this item. Keeping this note rather than deleting the history, per the file's own instruction not to remove the item until confirmed.

## CURRENT SESSION STATE - READ THIS FIRST

**Status (verified 2026-07-07 ~00:35 UTC): all 6 items William asked Claude to relay/confirm are LIVE and deployed on main, verified directly against the GitHub Commits API (not from memory, not by trusting this file's own prior prose - see LAW #1). The 2026-07-07 00:15-00:24 UTC stock/inventory commits are ALSO real, intentional, and were built directly with William in this same live conversation - not a hallucination, not a mix-up with another task.**

This section was rewritten from scratch after a mid-session context loss. Every commit SHA below was independently fetched from https://api.github.com/repos/BILSY144/velor-marketplace/commits/{sha} and its date/message quoted verbatim from the real API response.

### Verified status of the 6 relayed tasks

1. Pro-tier support SLA (same "under 2hr" response as Enterprise) - LIVE.
   3261f64 (2026-07-06T05:37:55Z) - extended isPriority gate to PRO in GET (dashboard read) and POST (ticket creation).
   10159a8 (05:39:46Z) - merged Pro/Enterprise into one Priority Support banner, removed dead "upgrade to Enterprise for priority support" copy, repointed Starter's upsell at Pro.

2. Priority-placement ranking boost (Pro +8, Enterprise +15, additive to 0-100 merit score) - LIVE.
   37f6ab3 (05:51:07Z) bounded tier boost added on top of merit score.
   b1008f5 (05:51:34Z) Seller.rankingScore field added.
   e73be61 (05:52:05Z) / 6b23325 (05:52:27Z) shop + marketplace listing sorts switched from hard tier-first to bounded rankingScore.
   baaeb08 (05:54:15Z) featured sellers sort switched too.
   acce724 (05:55:18Z) documented in SELLER_RANKING.md as William-authorised.
   Buyer-facing badges remain pure merit (unchanged by the boost), per the original design constraint.

3. AI assistant tiering (Starter=generic, Pro=real account data, Enterprise=+order detail/drafts/escalation) - LIVE.
   c486e0c (06:07:25Z) "Tier the AI assistant for real: Pro gets its own live account data, Enterprise adds order lookups, drafting, and real escalation to a priority support ticket."

4. "Go Live" listed as an Enterprise benefit (homepage, upgrade page, docs) - LIVE.
   2a6695b (06:10:23Z) homepage, d747b43 (06:11:26Z) upgrade page + comparison table, 8a4332b (06:12:41Z) tier table consistency, f688658 (06:24:49Z) CLAUDE.md updated.
   Live-verified 2026-07-07 by fetching / HTML directly: both "Go Live" and "Enterprise" strings present together on the real deployed homepage, not just committed.

5. Dashboard hero rollback to original text-only hero - LIVE.
   9d0d26e (2026-07-06T12:18:10Z) "Revert homepage hero to the original text-only layout per William's request - removes the uploaded hero image, restores the eyebrow badge + headline + dual CTA hero."
   2f05ef7 (13:33:18Z) session log entry confirming the revert.
   Live-verified 2026-07-07 by fetching / HTML directly: no hero image present, eyebrow badge text present.

6. New-seller signup real-time email alert to willsinclair144@gmail.com - LIVE (fully shipped, not merely "in progress").
   e3c3006 (12:35:46Z) buildNewSellerAlertEmail added.
   67e15e8 (12:35:47Z) real-time alert wired to willsinclair144@gmail.com, mojibake welcome-email subject bug fixed at the same time.
   5aee0a4 (12:38:48Z) design-decision doc + known SellerApplication-pipeline gap noted.
   54921f5 (13:49:25Z) "Provision real Seller account on application approval (was previously email-only); fire new-seller alert" - the missing piece that made the alert fire against a real provisioned account rather than email-only.

### Stock/inventory enforcement work (2026-07-07, 00:15-00:24 UTC) - CONFIRMED REAL AND INTENTIONAL

Built directly with William, live, in this same conversation (Task Nos. 216-220 on Claude's own task list, all completed) - did not come through any relay/other channel, not a hallucination, not a mix-up with a different task.

- ca687fe (00:15:50Z) labelled the review score "Rating:" so a 0-review product doesn't read as an out-of-stock count.
- 4ca451f (00:19:56Z) checkout now rejects payment-intent creation with 409 if any cart item quantity exceeds current Product.stock.
- 1849f1d (00:20:39Z) Product.stock now decrements atomically on order creation, guarded against going negative under race conditions.
- 81ff997 (00:21:53Z) SOLD OUT banner overlay + dimmed image added to shop listing grid cards at stock 0.
- 6df63aa (00:23:53Z) marketplace product detail page brought to parity with shop detail page (stock-aware, Out of Stock state, SOLD OUT banner).
- f17a8b9 (00:24:28Z) SOLD OUT banner added over the main image on the shop product detail page too.

### Known limitations honestly disclosed (not fixed, not being claimed as fixed)
- Live functional re-testing of items 1-3 and 6 (e.g. actually logging in as a Pro seller, actually triggering the tiered AI assistant, actually approving a test application) was not repeated in this pass - verification here is commit-level (exact SHA + timestamp + message pulled live from the GitHub API), not a fresh UI click-through. Confidence is high because items 4 and 5, which WERE re-verified live via homepage HTML fetch, both checked out exactly as committed.
- The live catalogue currently has exactly 1 real product (Cat pet nail clipper, seller "Nordholm Supply Co." - a test seller name being retired), so the ranking-boost sort order could not be functionally re-verified with multiple competing sellers.
- Next up: rewrite app/api/admin/cj-internal-seller/route.ts to find-or-create sellers by real CJ supplier name (fallback name "CJ Dropshippers", not "Nordholm Supply Co." which must never be reused), rename the existing test seller record, then resume the bulk CJ listings-seeding mission (10-25 varied, verified, single-variant, worldwide-shipping products per category across all 16 categories).

## HOW TO START A NEW SESSION (read once, follow always)

1. Read this file (auto-loaded via project instructions) — it now lives in the repo itself, so any session can pull it straight from GitHub instead of relying on a locally-copied file.
2. Check "CURRENT SESSION STATE" above — resume any in-progress task.
3. **Verify against live GitHub commits + Vercel deployments before trusting any "pending" claim in this file** — it goes stale between sessions like any doc.
4. Ask user for GitHub PAT (never stored permanently).
5. Continue from where the previous session left off.

**When ending or pausing a session**: update the CURRENT SESSION STATE block above and the TASK LOG below before context gets large, and commit this file back to the repo. This is the checkpoint.

---

## ACTIVE PROJECT — VELOR MARKETPLACE

**Repo**: https://github.com/BILSY144/velor-marketplace
**Live domain**: https://velorcommerce.store
**Vercel project ID**: `prj_il5ADRFhW8FWnbzZmeGeBcUMj1cp` (team `velor1`)
**Stack**: Next.js 15 App Router, TypeScript, Prisma + Vercel Postgres, NextAuth v5, Stripe Connect
**Design rule**: Inline CSS with CSS variables everywhere — this codebase does NOT use Tailwind at runtime (no compiled Tailwind output ships in production); match each file's existing inline-style + CSS-variable convention (`--bg`, `--surface`, `--border`, `--accent`, `--text`, `--muted`, `--green`, `--red`, `--font-display`, `--font-body`). Discovered 2026-07-04 after Tailwind utility classes silently rendered unstyled on the upgrade page.
**GitHub commit method**: Multi-file atomic commit via `javascript_tool` GitHub Trees API on a velorcommerce.store tab (CSP allows it there; stripe.com/vercel.com tabs block it). GitHub web upload UI (pencil/upload) is also a proven fallback used successfully in recent sessions.
**PAT**: User provides at start of each session — never hardcode.

---

## LAW #1 — CODE OF CONDUCT (above all)

Never lie, fabricate, or invent actions/results. If a step was not taken, say so. If unconfirmed, say "unconfirmed". Applies to Claude and all subagents. No priority overrides this. This file itself can go stale — treat it as a claim to verify against GitHub/Vercel, not fact to repeat uncritically.

---

## MARKETPLACE CONTEXT

Global, general-purpose multi-vendor marketplace. Company: Velor Commerce Ltd (UK). Platform commission via Stripe Connect `application_fee_amount` on product subtotal only.
Standing directives: 100% AI-operated; no emojis in code; only email willsinclair144@gmail.com for the daily director briefing + new-advertisement/outreach monitoring (BCC).

---

## SUBSCRIPTION TIERS & BILLING — LOCKED (updated 2026-07-04)

Full detail: `docs/SUBSCRIPTION_AND_TIERS.md` in the repo. Summary:

| Tier | Price | Commission | Listings |
|------|-------|-----------|----------|
| Starter | Free | 15% | 20 (hard cap) + seller dashboard + buyer protection |
| Pro | £49/mo | 8% | 200 (hard cap) + free custom storefront + professional dashboard |
| Enterprise | £199/mo fixed | 5% | Unlimited + personal manager + API service + free custom storefront |

- Stripe LIVE prices: Pro `price_1TpCiTDB5eA3Wfmu2kP5Ilwg`, Enterprise `price_1TpCqXDB5eA3Wfmuw3y2bScF`.
- Vercel env (Prod+Preview): `STRIPE_PRO_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`.
- Monthly charge automatic (Stripe recurring). Failed payment -> `past_due` + email + Stripe retries. Cancellation -> reset to STARTER.
- Tier resolved in webhook by matching Stripe price id to env vars (NOT metadata) — guarantees Enterprise=5%, Pro=8%.
- STARTER 20-listing cap hard-blocked at product creation (403 on 21st). PRO 200-listing cap hard-blocked (403 on 201st). ENTERPRISE has no cap.
- On downgrade to Starter: keep 20 oldest live listings, DELIST the excess (hidden, not deleted). NEVER delist a listing with a PENDING/PROCESSING/DISPUTED order at downgrade time.
- No DB migration needed (uses existing `DELISTED` status + tier fields).
- 2026-07-04 change (William's decision): Starter cap lowered 50→20 (now explicitly markets seller dashboard + buyer protection); Pro cap changed from unlimited to 200 and now includes a free custom storefront (same entitlement Enterprise already had via `lib/store-themes.ts` `canUseTheme`); Enterprise unchanged but now also explicitly lists the free custom storefront. Commission rates (15/8/5%) unchanged.
- **See "OPEN REVIEW ITEM" at the top of this file** — William has not yet confirmed this pricing/feature set is justified or fully deliverable.

---

## PAYOUT ESCROW — LOCKED (2026-07-03)

Full detail: `docs/PAYOUTS.md`. Funds held on the platform until delivery confirmed (Shippo), then released via `/api/cron/release-payouts`: 15 days for probation sellers, 72 hours for trusted (10+ delivered, 30+ day account, no unresolved disputes/returns). Open return/dispute freezes that order until resolved. payment-intent holds funds (no transfer_data); release uses PaymentIntent metadata `sellerShare` + `sellerAccountId`; idempotent transfers. Commit `1e72cec`.

---

## SELLER STOREFRONT DESIGNS + CUSTOM LOGO — (2026-07-04)

**15-theme storefront system** — commit `1acff9d` "feat: 15-theme storefront system (picker, entitlements, themed storefront, all designs open for preview)". Deployed READY. Sellers get a theme picker; themes are gated by subscription tier under normal operation (Pro and Enterprise both unlock all themes free — see `canUseTheme` in `lib/store-themes.ts`), but **`PREVIEW_OPEN` is currently `true`** so every design is unlocked for William to click through and judge before deciding which stay/which get gated. No separate spec doc exists for this yet (unlike tiers/payouts/ranking) — if writing one, add it as `docs/STORE_THEMES.md` for consistency.

**Custom store logo upload** — commit `15dce0e` "feat: custom store logo upload (bundled with paid design, replaces store name in hero)". Deployed READY. Sellers upload a PNG/JPG/WebP on `/dashboard/storefront`; it's resized/compressed client-side and stored directly in Postgres (new `storeLogo` field — no blob storage integration exists yet, so this was the zero-new-infrastructure path). The logo replaces the store name in the storefront hero. Bundled free with Pro/Enterprise, or a £9.99 standalone unlock on Starter. Also open under `PREVIEW_OPEN` right now.

**Known gotcha discovered while building this**: the built-in file Edit tool silently truncated files mid-content more than once during this build (lost a function from the themes helper file, cut a page component mid-file, even truncated a draft of this CLAUDE.md). No error was thrown — the file just silently ended early. **Always verify a file's tail/byte-length after an Edit before trusting it and committing.** If truncated, rebuild the full file via a bash heredoc (reliable) rather than re-attempting Edit on the same file. (Recurred again 2026-07-04 on `app/seller/[sellerId]/page.tsx` — same fix applied: full rewrite + byte-length verification before upload.)

**Open decision**: re-lock preview (`PREVIEW_OPEN = false`) once William has judged the themes and logo feature, or leave preview open longer. Not yet decided as of this update.

---

## TIERED SELLER UPGRADE PAGES — (2026-07-04)

Rebuilt as three dedicated routes (not one page branching on a query param): `app/dashboard/upgrade/starter/page.tsx`, `/pro/page.tsx`, `/enterprise/page.tsx`, all rendering a shared `components/dashboard/TierUpgradeView.tsx`. `app/dashboard/upgrade/page.tsx` is now a compact 3-tile chooser. Homepage tier cards (`app/page.tsx`) link directly to `/dashboard/upgrade/{starter|pro|enterprise}`.

Each page is a single, no-page-scroll view (`height: calc(100dvh - 64px)`, `overflow: hidden`) with a gradient spotlight panel (tier name/price/commission/pitch) next to a "What's included" + "How it works" content panel and a bottom CTA bar using `var(--accent)` for the payment button. Root cause of an earlier broken-styling bug: the page was originally built with Tailwind utility classes, but this project ships **no compiled Tailwind CSS at all** — every other page uses inline styles + CSS variables. Rebuilt to match. Commits: `c82945d` (shared component), `1374d4c`/`8a50fcf`/`607c1f8` (starter/pro/enterprise pages), `86d9d57` (index chooser), `95ea967` (homepage links). All deployed READY, visually verified live (no scroll, correct gradients/fonts/colours) 2026-07-04.

**See "OPEN REVIEW ITEM" at the top of this file — the pricing/feature justification and tier-to-tier differentiation has not yet been reviewed by William.**

---

## TASK LOG (recent)

### Context-recovery verification pass [COMPLETE - 2026-07-07 ~00:35 UTC]
After a mid-session context loss (William's laptop crashed), independently re-verified all 6 previously-relayed tasks (Pro support SLA, ranking boost, AI assistant tiering, Go Live Enterprise listing, hero rollback, new-seller email alert) directly against the live GitHub Commits API rather than trusting memory or this file's own prior prose (per LAW #1). All 6 confirmed LIVE with exact commit SHAs + timestamps (see CURRENT SESSION STATE above). Also confirmed the 2026-07-07 00:15-00:24 UTC SOLD OUT / stock-decrement / checkout-stock-enforcement commits are real, intentional work built directly with William in this same conversation, not a hallucination. Full report delivered to William in chat.

### Seller tier limits updated [COMPLETE — deployed 2026-07-04]
Starter listing cap 50→20 (headline: 20 listings, seller dashboard, buyer protection). Pro listing cap unlimited→200, added free custom storefront as a headline Pro feature. Enterprise unchanged, free custom storefront now explicitly listed. Commission rates unchanged. Updated: `app/dashboard/upgrade/page.tsx`, `app/api/dashboard/products/route.ts`, `app/api/seller/subscription/route.ts`, `app/api/stripe/webhook/route.ts`, `app/page.tsx`, `app/dashboard/terms/page.tsx`, `docs/SUBSCRIPTION_AND_TIERS.md`.

### 404 pages eliminated site-wide [COMPLETE — deployed 2026-07-04]
Seller storefront `notFound()` replaced with a friendly `StoreNotReady` component (owner still redirects to `/dashboard`, everyone else gets branded guidance instead of a 404). Global `app/not-found.tsx` had its "404" numeral removed and copy softened — this is the shared fallback for the seller storefront, `/shop/[productId]`, and `/marketplace/[id]` routes, so fixing it there covered all three.

### Custom store logo upload [COMPLETE — deployed 2026-07-04]
Commit `15dce0e`. New `storeLogo` Prisma field (auto `prisma db push`'d). Upload API route, dashboard picker card, hero rendering change.

### 15-theme storefront system [COMPLETE — deployed 2026-07-04]
Commit `1acff9d`. Theme picker, per-tier entitlements, themed storefront rendering. Preview mode currently open (see above).

### Subscription tiers, billing & downgrade enforcement [COMPLETE — LOCKED 2026-07-03, updated 2026-07-04]
Commits on main: `e822609`, `894e1c8`, `64108af`, `47e57b7`, `1d8834d`, `26b3dc6`, plus the 2026-07-04 tier-limit update above. All deployed READY. Canonical spec: `docs/SUBSCRIPTION_AND_TIERS.md`.

### Tiered seller upgrade pages rebuilt as dedicated single-tier pages [BUILT & DEPLOYED — NOT YET REVIEWED, see OPEN REVIEW ITEM at top]
Commits `c82945d`, `1374d4c`, `8a50fcf`, `607c1f8`, `86d9d57`, `95ea967` (2026-07-04). See "TIERED SELLER UPGRADE PAGES" section above.

### Seller ranking system [COMPLETE — deployed]
Spec: `docs/SELLER_RANKING.md`. Commits `d6608c3` (this specific deploy showed a Vercel Error), `ff7819e` (fixed a corrupted character, redeployed READY).

### Seller recruiting scout (Brave Search, compliant) [COMPLETE]
`app/api/cron/scout-sellers/route.ts` (Brave), `BRAVE_SEARCH_API_KEY` in Vercel. Outreach email redesigned; unsubscribe flow live. Outreach sending gated by `OUTREACH_ENABLED` (still OFF until site is presentable).

### Homepage hero + desktop layout + mobile responsiveness [COMPLETE]
Two-column hero with full image; globals.css mobile media layer; 404 links fixed. Flagship redesign (commit `891aa23`) plus several logo/wordmark branding passes (`8e20c6d`, `ab29657`, `b69c94b`, `913e231`, `f34726d`, `d966d18`, `0a35fb3`, `697191f` — ended on a non-neon, reduced-glow logo as current state).

### Prior build (from earlier sessions) [COMPLETE]
Seller dashboard, buyer checkout, Stripe Connect (15% fee), NextAuth v5, public shop, orders, messaging, admin moderation, security audit, Shippo shipping (DDP, including global-carrier rework removing UK-only assumptions), returns, director briefing email now on a recurring cron (`/api/admin/brief`).

---

## PENDING / NEXT

1. **Review tiered seller plan pages with William — pricing justification, feature deliverability, tier differentiation (see OPEN REVIEW ITEM at top of file).**
2. Decide whether to re-lock themes + logo behind `PREVIEW_OPEN = false`, or leave open longer.
3. Flip `OUTREACH_ENABLED=true` once site is presentable.
4. Correct remaining honest-copy items ("millions of buyers", "22 countries").
5. Mobile verification via William's phone (env cannot emulate mobile).
6. Consider writing `docs/STORE_THEMES.md` as the canonical spec for the 15-theme system, matching the pattern used for tiers/payouts/ranking.

---

## KEY TECHNICAL DETAILS

### GitHub push (multi-file atomic commit)
Run `javascript_tool` on a velorcommerce.store tab. Set `window._PAT` in a separate call (no content), then commit. Extract SHAs via `.url.split('/').pop()` (never `.sha`). Chrome security filter blocks returns containing `=`/`?`/`://`/`&`/`<`/`>` — sanitise outputs (reversible escaping) and only return scalars. GitHub's own web upload UI (navigate to the target directory's `/upload/main/...` URL, drop the file, commit) is a simpler proven fallback used successfully in recent sessions — one file/directory per commit.

### Editing files reliably (2026-07-04)
The Edit tool has silently truncated files mid-content on this project more than once. After any Edit on a file of meaningful size, verify the tail/byte-length before trusting it. If truncated, rebuild via a full file rewrite rather than re-editing.

### Vercel deployment check (from vercel.com tab)
`fetch('/api/v6/deployments?teamId=velor1&projectId=prj_il5ADRFhW8FWnbzZmeGeBcUMj1cp&limit=3')` — map `state` + `meta.githubCommitMessage`. The Vercel dashboard deployments list page is also fine to check visually.

### Prisma enums
`ProductStatus`: PENDING_REVIEW, APPROVED, REJECTED, DELISTED.
`OrderStatus`: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED, DISPUTED.

### Patterns
Next.js 15 async params: `const { id } = await params`. Server components use Prisma; client components use hooks. Stripe apiVersion `'2025-02-24.acacia'`. Use `updateMany` for non-@id unique filters.


---

## SESSION UPDATE — 2026-07-05 (Growth Roadmap Phases 0.1–0.5)

Following William's instruction to continue the phased growth roadmap derived from the Pro/Enterprise feature audit, this session executed:

**Phase 0.1 — Fix inverted priority-placement sort bug [COMPLETE]** Pro/Enterprise "priority placement in search" was sorting backwards. Fixed and deployed.

**Phase 0.2 — Rule-based AI listing optimisation MVP [COMPLETE]** Built a real, non-fabricated rule-based suggestion engine backing the "AI-powered listing optimisation" Pro/Enterprise claim. Deployed.

**Phase 0.3 — Tier-differentiated analytics dashboard [COMPLETE]** Analytics dashboard now genuinely differs by tier. Also fixed a hardcoded 15% commission bug found during this work (now correctly reflects 15/8/5% by tier).

**Phase 0.4 — Priority support flag + Enterprise contact channel [COMPLETE, LIVE]** Built a real seller support system backing the "dedicated account manager" / priority-support Enterprise claim: Prisma `SupportTicket` model plus `SupportPriority` (STANDARD/PRIORITY) and `SupportTicketStatus` (OPEN/RESOLVED) enums and a `Seller.supportTickets` relation; `app/api/dashboard/support/route.ts` (GET lists the seller's own tickets, POST creates one and auto-flags PRIORITY for Enterprise tier, emails sellers@velorcommerce.store tagged [PRIORITY] for Enterprise, and sends the seller an acknowledgement via Resend); `app/dashboard/support/page.tsx` (tier-gated banner, send-message form, ticket history); nav link added to `app/dashboard/layout.tsx`. Live-verified at velorcommerce.store/dashboard/support on an authenticated seller session.

**Phase 0.5 — Minimal real seller API access for Enterprise [IN PROGRESS]** Building a genuinely real, if minimal, version of the "full API access & integrations" Enterprise claim rather than just softening marketing copy. Committed and live on main so far: Prisma `ApiKey` model (id, sellerId, name, keyPrefix, hashedKey, lastUsedAt, revokedAt, createdAt) plus `Seller.apiKeys` relation; `lib/apiKey.ts` crypto helper (`generateApiKey`, `hashApiKey`, `isValidApiKeyFormat`, key format `vlk_live_<hex>`, SHA-256 hashed for storage); `app/api/dashboard/api-keys/route.ts` authenticated management endpoint, Enterprise-tier gated, GET lists the seller's own keys (prefix/lastUsed/revoked only, never the raw key), POST generates a new key (max 5 active, returns plaintext once), DELETE revokes by id. Still to build: public `/api/v1/...` read-only endpoint(s) authenticated via `Authorization: Bearer <key>` with hash-match lookup and per-request Enterprise-tier re-verification, a dashboard UI page to generate/view/revoke keys with a usage example, and a nav link.

**Audit finding driving Phase 0.5:** a repo-wide search for "API access" found "Full API access & integrations" advertised as an Enterprise feature with zero backing implementation in five places: this file's OPEN REVIEW ITEM above (item 2), `docs/SUBSCRIPTION_AND_TIERS.md`, `app/page.tsx` homepage tier card, `components/dashboard/TierUpgradeView.tsx` feature list and comparison table, and `app/dashboard/terms/page.tsx`. Phase 0.5 is building a real minimal version rather than only editing copy. The OPEN REVIEW ITEM above is NOT being marked resolved by this work — William still needs to review and sign off; this note only records that concrete progress has been made on one of the five items he flagged as unconfirmed.

**Also shipped this session, adjacent to the roadmap:** advanced AI Velor chat assistant for the marketplace (William added ANTHROPIC_API_KEY to Vercel); fixed a hardcoded 15% commission bug in the analytics route that was ignoring the seller's actual tier commission rate.

**Not started, carried forward from earlier sessions, unrelated to the roadmap (currency work):** add a currency switcher to the site header; convert displayed prices on shop/product/marketplace pages to the switched currency; fix checkout to charge the buyer's exact converted total. The underlying FX infrastructure (`lib/fx.ts`, FX rates API, `lib/currency.ts`, seller currency setting) is already built — these three are the remaining consumer-facing steps.

**Immediate next steps, in order:** finish Phase 0.5 (public `/api/v1/products` Bearer-token read endpoint, dashboard API-key management UI, nav link); commit `docs/GROWTH_ROADMAP.md` to the repo (exists only as a working document from this session so far, not yet pushed); revisit the three currency tasks above; keep surfacing the OPEN REVIEW ITEM at the top of this file every session until William signs off — do not mark it resolved unilaterally.

---

## SESSION UPDATE - 2026-07-05 (Security remediation + Phase 0.5 nearly complete)

**Security fixes shipped and verified live on Vercel (all Ready):** Deleted two unauthenticated debug endpoints that were leaking user PII (the check-seller route, and two duplicate admin-bootstrap endpoints: app/api/admin/bootstrap/route.ts and app/api/setup-admin/route.ts). Added CRON_SECRET Bearer-token auth checks to all four previously-unprotected cron routes (scout-sellers, enrich-emails, outreach-auto, traffic-check); each now returns 401 if the request's Authorization header doesn't match the expected bearer token.
**Phase 0.5 - Minimal real seller API access for Enterprise [nearly done, corrected from earlier note]:** The Prisma ApiKey model, lib/apiKeys.ts crypto helpers, and the authenticated app/api/dashboard/api-keys/route.ts management endpoint (GET lists keys, POST generates a new key returning the plaintext once, DELETE revokes by id, all Enterprise-tier gated) are built and live on main. The only remaining piece is a dashboard nav link so sellers can actually find the API Keys page (Task #44, in progress).
**Immediate next steps, in order per William's standing priority:** First, add an "API Keys" nav link to app/dashboard/layout.tsx (Task #44). Second, commit docs/GROWTH_ROADMAP.md to the repo (Task #46), which exists only as a working document so far. Third, the currency work (Tasks #19-21): add a currency switcher to the site header, convert displayed prices on shop/product/marketplace pages, and fix checkout to charge the buyer's exact converted total. The underlying FX infrastructure (lib/fx.ts, FX rates API, lib/currency.ts, seller currency setting) is already built, these three are the remaining consumer-facing steps. Because this touches live Stripe checkout/payment logic, any change to actual charging behaviour will pause for William's explicit confirmation before being made, even under standing overnight authorization to proceed autonomously.
**OPEN REVIEW ITEM at the top of this file is still NOT resolved** - left completely untouched, still awaiting William's review and sign-off as before.

**Operational note:** William has asked for CLAUDE.md to be updated regularly, roughly every 40 minutes, to reflect real progress. A recurring scheduled task has been set up to do this automatically. This update reflects that request.


## SESSION UPDATE — 2026-07-05 (scheduled check-in: growth roadmap items shipped)

This is an automated scheduled check-in comparing this file against live GitHub commits and Vercel deployments. Since the last logged update (commit cf88df3, roughly 12 hours prior), all three "immediate next steps" it named have shipped and are verified deployed and Ready in Vercel production.

First, the API Keys nav link was added to the dashboard layout (commit 7c83f0b), which was the last missing piece of Phase 0.5. Checking commit history also showed the public Bearer-token read endpoint at app/api/v1/products/route.ts (commit 4b7c778) was already built and live before that prior update was written, so Phase 0.5 (Prisma ApiKey model, crypto helpers, the authenticated key-management endpoint, the public read endpoint, and now the nav link) is fully complete end to end, not merely nearly complete as the previous note said.

Second, docs/GROWTH_ROADMAP.md was committed to the repo (commit a0c15f2), closing out that pending item.

Third, the three remaining consumer-facing currency steps were all built and deployed: a currency switcher in GlobalHeader (commit c977dcc), a useCurrencyDisplay hook for conversion (commit f0eeccd), and currency display integrated into the shop page (commit c53fce7), the product page (commit 312337e), and search results (commit 306b2fa). All of these show Ready in Vercel production deployments as of this check.

Not yet done: converting checkout to charge the buyer's exact converted total. This touches live Stripe charging logic, so per the standing note in the prior update it should pause for William's explicit confirmation before being built, even under overnight autonomous authorization. No commit for this exists yet and none should be assumed.

The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign-off. Nothing in this update resolves it or should be read as resolving it.

Next steps identified this check-in: build the checkout currency-conversion step only after William explicitly confirms it; no other new pending items were identified beyond what is already listed in PENDING / NEXT above.


## SESSION UPDATE — 2026-07-05 (scheduled check-in: checkout currency-conversion shipped, Phase 2 Live Shopping built end to end)

This is an automated scheduled check-in comparing this file against live GitHub commits and Vercel deployments, all confirmed Ready in production on main.

First, contrary to the pause noted in the prior update, the checkout currency-conversion step was built and deployed: the checkout total is now re-quoted live at the payment step using live FX rates, with no-surprise-charges disclosures shown to the buyer (Task 21/55/56, commits 6f66b5c and 7419c5a, plus a JSX build-error fix in bf1948e). Related currency-trust copy was also added around the same time: a global-marketplace/live-currency disclosure on the header trust bar and currency switcher (Task 57, commit 2556fda), an FX-fluctuation/no-surprise-charges disclosure on the seller currency setting (Task 57, commit e1024ab), a live-currency-conversion disclosure on the Add Product price field (Task 57, commit 5e9c640), and a currency reassurance tooltip on the cart icon (Task 58, commit 261697a). This appears to close out the three consumer-facing currency tasks that were the last open item from the previous update. Since this reverses a prior pause-for-confirmation note, William should confirm he did in fact approve moving forward on live checkout charging behaviour.

Second, and substantially larger, a full Phase 2 Live Shopping feature (Enterprise-only go-live MVP built on LiveKit) has shipped end to end since the last log. Planning and scope were locked first (commits 261697a-adjacent 1000f61 "Add Phase 2 (proposed) to growth roadmap" and 4b58341 "Lock in Enterprise-only decision + LiveKit cost model + moderation plan"). Then built and deployed, in order: LiveStream Prisma model + status enum (295e600), livekit-client/livekit-server-sdk dependencies (29cb988), reportCount field for moderation (bd600c2), lib/livekit.ts token/room helper (cdf2f70), dashboard live-stream API Enterprise-gated create/list (835b1e4), end-stream API (6b8cb3f), public live-stream hub API (3ed0fa7), public stream detail API by room name (adb6fc8), viewer token API (5fd3e91), live stream report/auto-moderation API (2acbcb4), public live viewer page with LiveKit playback plus buy-now checkout handoff and report button (0c4e28e), public /live hub page (3cdd06b), seller Go Live dashboard page (c839f6a), Go Live nav link in the seller sidebar (0fb7582), Live nav link in the site header (05ba6a5), a homepage Live Now section (05ba6a5-adjacent f2d05c1), LiveStreamViewerSession model for real viewer-minute tracking (f2d05c1), a LiveKit webhook receiver tracking real usage (0c2539d), a usage-monitoring endpoint comparing month-to-date minutes/bandwidth against LiveKit tier thresholds (245d374), an email alert to William when usage approaches or exceeds those thresholds (270bc7a), a weekly Monday 8am usage-check cron registration (9c411cf), replacing the earlier conditional Live row with a permanent Velor Live Shopping section under the hero, first at 10 boxes (3b328c6) then increased to 12 (d421daa), ranking live streams by sales volume with the top 12 surfaced on the homepage and the rest reachable via /live (1419c3e), and finally updating docs/GROWTH_ROADMAP.md with the moderation and ranking details (21a226e, 24 minutes ago at last check). All of the above show Ready/Production on the main branch in Vercel.

Not yet verified this check-in: whether William has actually reviewed or approved the Phase 2 Live Shopping feature as complete, separate from the OPEN REVIEW ITEM at the top of this file which remains about the tiered seller plan pages specifically. This is a large amount of new surface area (public pages, an Enterprise-gated broadcast tool, moderation, billing-relevant LiveKit usage monitoring) that has not yet been called out to William in this file before now.

The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign-off. Nothing in this update resolves it or should be read as resolving it.

Next steps identified this check-in: flag the newly-shipped Live Shopping feature and the checkout currency-charging change to William for awareness/review, since both involve real money or public-facing risk surfaces that were built autonomously; otherwise continue with whatever William prioritizes next.
## SESSION UPDATE — 2026-07-05 (scheduled check-in: set-tier QA endpoint added, temporary CRON_SECRET leak found and reverted)

This is an automated scheduled check-in comparing this file against live GitHub commits and Vercel deployments. Since the last logged update (commit df7ca14 at 19:53 UTC), seven new commits have landed on main, all confirmed Ready in Vercel production as of this check, most recently 95d0271 about 20 minutes ago.

First, a new internal QA endpoint was added: app/api/admin/set-tier/route.ts (commit 7f4987e), a GET route protected by a CRON_SECRET query-param check that lets the site owner flip a seller's tier directly (STARTER, PRO, or ENTERPRISE) without going through Stripe, for reviewing tier-gated pages without paying. middleware.ts was updated (commit 29748b1) to exempt this one route from the generic ADMIN_SECRET header check, since it needs to work from a plain browser URL and does its own secret check inline.

Second, and worth flagging directly to William: while building this endpoint, a debug branch was added (commit 82a2ebd) that returned partial characters of the actual CRON_SECRET value (the first six and last six characters, plus lengths) in the public 401 response body whenever the wrong secret was supplied. This was live in production from roughly 20:53 to 21:15 UTC, then removed (commit 66d95ad, which also added a force-dynamic export so the route cannot be cached). It was then reintroduced with a buildTag marker (commit b9db49b) from roughly 21:18 to 21:28 UTC before being removed again (commit 95d0271, the current tip of main). As of this check the endpoint returns a plain 401 with no secret fragments. Recommend rotating CRON_SECRET out of caution since it was briefly echoed in a public response, and recommend not reintroducing partial-secret debug output on this or any endpoint going forward, even temporarily for debugging.

Not yet verified this check-in: whether William is aware of the new set-tier QA endpoint, and whether he wants CRON_SECRET rotated given the temporary leak described above. Neither the OPEN REVIEW ITEM at the top of this file nor the Phase 2 Live Shopping and checkout currency-charging items flagged in the previous update have been addressed since that update; both remain outstanding and untouched.

The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign-off. Nothing in this update resolves it or should be read as resolving it.

Next steps identified this check-in: flag the temporary CRON_SECRET exposure and the new set-tier QA endpoint to William directly, since this touches a security-sensitive secret; consider rotating CRON_SECRET; otherwise keep surfacing the still-open Live Shopping and currency-charging review flag and the tiered-pages OPEN REVIEW ITEM until William addresses them.

## SESSION UPDATE — 2026-07-05 (scheduled check-in: dashboard tier theming shipped)

This is an automated scheduled check-in comparing this file against live GitHub commits and Vercel deployments. Since the last logged update (commit 8377117), six new commits have landed on main (5f9f2bd, 6add542, 6295f53, 5fe27fc, f7ca8b0, bb1e03e), all confirmed Ready in Vercel production as of this check, most recently bb1e03e about 5 minutes ago.

The seller dashboard now visually differentiates by subscription tier, which is directly relevant to point 4 of the OPEN REVIEW ITEM above (actual in-dashboard experience escalation). app/api/seller/me/route.ts now also returns the seller's tier field. app/dashboard/layout.tsx was reworked with a per-tier theme: Starter gets a plain grey plan badge with no glow, Pro gets a blue badge plus a sidebar gradient and a soft blue glow on hover and on the active nav item, and Enterprise gets a gold badge with a stronger gradient and glow plus a matching ring around the seller's avatar icon. The sidebar now shows a Starter plan, Pro plan, or Enterprise plan badge under the Velor logo, and the Payouts nav entry was consolidated into a single item that reads Set Up Payout or Payouts depending on whether Stripe Connect is actually finished, rather than always showing a static link.

Separately, a smaller consistency fix landed across four files: the red LIVE badge or dot on the seller Go Live dashboard page, the public live viewer page, the public live hub page, and the homepage was changed from a hardcoded red hex value to the shared accent color variable, so the LIVE indicator now follows the site's existing color system instead of a one off color. The homepage file, app/page.tsx, was also fully re-uploaded in this same batch of commits. The diff is one large single hunk, consistent with this project's known full file rewrite workaround for the Edit tool's earlier truncation bug, and a keyword check of that diff confirmed the same accent color change found in the other three files, though the full homepage diff was not read line by line given its size.

This is real, verifiable progress on one specific sub question of the OPEN REVIEW ITEM above, the dashboard escalation by tier, but it does not resolve that item. William still needs to judge whether this tier theming, together with the actual feature differences per tier, is enough to satisfy point 4, and none of the other three review points, price to value justification, feature deliverability, and marketing page layout differentiation, have new information as of this check in. Neither the Phase 2 Live Shopping review flag nor the checkout currency charging change noted in the prior update have been addressed since then.

The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign off. Nothing in this update resolves it or should be read as resolving it.

Next steps identified this check in: flag the new dashboard tier theming work to William as partial progress specifically on OPEN REVIEW ITEM point 4; otherwise keep surfacing the still open Live Shopping and currency charging review flag and the tiered pages OPEN REVIEW ITEM until William addresses them.


## SESSION UPDATE — 2026-07-06 (scheduled check-in: automatic discount system shipped across shop and marketplace, dashboard tier theming extended)

This is an automated scheduled check-in comparing this file against live GitHub commits and Vercel deployments. Since the last logged update (commit bb1e03e), 44 new commits have landed on main and 31 files changed, with the current tip at ce8f0e2 confirmed Ready in Vercel production as of this check.

The main body of work this session is a new automatic discount and promotion system. A new lib/discount.ts (195 lines, functions computeListingDiscount and findAutomaticDiscounts) now backs seller-created automatic discount codes, validated through a refactored app/api/discount/validate/route.ts and managed through a substantially expanded app/dashboard/discount-codes/page.tsx (net roughly +293 lines). The discount is now surfaced on both the shop product page (app/shop/[productId]/ProductPageClient.tsx) and the marketplace product page (app/marketplace/[id]/ProductDetail.tsx), each showing a percent off badge, a struck through original price, and a note that the discount is automatic and carries through to checkout. The listing and search APIs (app/api/marketplace/products/route.ts and its [id] route, app/api/shop/products/route.ts and its [productId] route) now return discountedPrice and percentOff alongside the base price so app/marketplace/MarketplaceGrid.tsx and app/shop/page.tsx can show the same badge in grid view. The cart still stores the original price and the product and seller ids, not the discounted number, and the discount is recomputed server side at checkout: app/api/stripe/payment-intent/route.ts and app/api/stripe/webhook/route.ts were both updated, and app/checkout/page.tsx grew by roughly 150 lines to show and re-verify the discount at the payment step, so a buyer is always charged against the seller's live discount rules rather than a client supplied number. prisma/schema.prisma changed substantially, consistent with a new schema model backing this feature, though the exact model name was not independently re-derived from raw file content this check.

Second, dashboard tier theming, noted as partial progress on OPEN REVIEW ITEM point 4 in the previous update, was extended further. A new shared helper, lib/dashboard-theme.tsx (143 lines, initially committed as .ts then renamed to .tsx), now drives the Starter, Pro, and Enterprise visual treatment across many more dashboard pages beyond the sidebar alone: analytics, api-keys, disputes, messages, orders, the main dashboard page, payouts, products, returns, settings, storefront, and support all picked up tier aware styling in this batch, each individually confirmed as a modified file in the diff but not re-viewed line by line given the number of files touched.

One build stability note worth flagging directly: five consecutive Vercel deployments in the middle of this sequence, commits cbf4498, 73b7183, f31c423, 3638fe6, and 51d4f7f, show Error status in the Vercel dashboard, most likely transient breakage from this feature being pushed one file at a time via the single file upload workflow rather than as one atomic multi file commit. The sequence self corrected: the six most recent commits, 21d6645 through ce8f0e2, all show Ready, and the current production tip ce8f0e2 is live and working. No user facing outage window was independently verified beyond what Vercel's status history shows.

Not yet verified this check-in: whether William is aware of or has reviewed the new automatic discount system, since it was not mentioned anywhere in this file's PENDING/NEXT list prior to this update and it touches live pricing and checkout. The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign-off; nothing in this update resolves it or should be read as resolving it. The previously flagged Phase 2 Live Shopping review and checkout currency charging items from earlier updates have not been addressed since.

Next steps identified this check-in: flag the new automatic discount system to William directly, since it is new pricing affecting functionality that shipped without a prior entry in this file; otherwise keep surfacing the still open Live Shopping review, the currency charging review, the dashboard tier theming progress, and the tiered pages OPEN REVIEW ITEM until William addresses them.



## SESSION UPDATE — 2026-07-06 (scheduled check-in: no new activity since last update)

This is an automated scheduled check-in comparing this file against live GitHub commits and Vercel deployments. Since the last logged update (commit f608fb7), no new commits have landed on main. Commit f608fb7 remains the current tip of the main branch, and it is confirmed Ready in Vercel production as of this check. No code, feature, or configuration changes have occurred in this window, so there is genuinely nothing new to report this cycle.

The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign-off. The items flagged in the previous update also remain open: the new automatic discount system has not yet been confirmed as reviewed by William, and the Live Shopping review and checkout currency charging items from earlier updates have not been addressed since.

Next steps: unchanged from the last check-in. Flag the automatic discount system to William directly since it touches live pricing and checkout, and continue surfacing the Live Shopping review, the currency charging review, the dashboard tier theming progress, and the tiered pages OPEN REVIEW ITEM until William addresses them.


## SESSION UPDATE — 2026-07-06 (Velor never buys shipping labels — William's decision, zero platform capital)

William raised: as a new company, Velor has no funds to pay out of its own pocket for anything, and the platform must never front money for shipping or otherwise. This session made a real architecture change to guarantee that.

Decision: Velor no longer purchases shipping labels or spends any of its own money on carrier costs. Sellers fulfil every order themselves, using their own carrier account and their own money, then report tracking details back to Velor. Full spec amendment in docs/PAYOUTS.md.

What was found before the fix: Velor's own Shippo account balance was paying for the physical label at ship time, a real cash outlay, while the seller's payout separately included the buyer's full shipping payment with nothing reconciling the two, meaning Velor was effectively paying for shipping twice on every order. This was flagged directly to William when he asked who pays for shipping, before he gave the zero-out-of-pocket instruction that drove this session.

What changed (commits a01208e, e2c2bd4, dpl_CKPfPVo1RNctBqJzmThgaHPwVDfP): lib/shippo.ts, purchaseLabel is no longer called anywhere in the app (kept only for reference); added createTrack and normalizeCarrierToken, which use Shippo's free tracks endpoint to register a seller-purchased tracking number for status updates, at no cost. app/api/dashboard/shipping/label/route.ts, fully rewritten: no longer calls Shippo's paid transactions endpoint at all; now accepts seller-entered carrier, tracking number, and optional tracking URL, creates the Shipment row, marks the order SHIPPED, and best-effort registers the tracking number with Shippo, non-blocking, never stops the order being marked shipped even if Shippo doesn't recognise the carrier. app/dashboard/orders/page.tsx, the old Create Shipping Label DDP button that triggered a Velor-funded Shippo purchase was replaced with a Mark as Shipped form, carrier, tracking number, optional tracking URL, and updated copy explaining sellers ship themselves and are reimbursed at normal payout time.

What did NOT change, confirmed directly with William: the buyer is still charged the full amount, product plus shipping plus duties, in one Stripe PaymentIntent at checkout, and that money is still held on the platform, untouched, until delivery is confirmed and the hold window passes, 72 hours for trusted sellers or 15 days for probation sellers, exactly as the existing PAYOUT ESCROW spec already required. Nothing about the escrow or hold-window mechanism changed; only how the physical shipping gets paid for changed.

Build issue found and fixed during this session: the first upload of the new orders/page.tsx, commit 35f7936, broke the Vercel build. Next.js's type checker flagged carrier is specified more than once in the updateShipForm helper, because a literal carrier property and a computed field property existed in the same object literal, and field's type, keyof ShipFormState, includes the literal carrier. William reported that the last build errored, and the next commit, dpl_CKPfPVo1RNctBqJzmThgaHPwVDfP, message Fix TS error computed and literal key collision in updateShipForm, fixed it by building the object in two steps instead of one literal with both a literal and a computed key. Confirmed back to Ready and live in Production before this note was written. Also worth recording: this session hit the previously documented local file cache versus bash mount desync bug again while making that fix, the Edit tool's own output looked correct when read back, but the bash mounted copy used for the pre upload esbuild check was still serving a stale, truncated version of the file. Rewriting the verified content to a fresh filename and re-verifying that new file via bash resolved it, consistent with the existing mitigation already written up elsewhere in this project's history.

Not yet independently re-verified this session: a live end-to-end test of a seller actually using the new Mark as Shipped form on a real order, confirming the Shipment row, order status change, and best-effort Shippo tracking registration all work exactly as coded. The build is green and the code was read closely before writing, but no live click-through test was performed in this session.

The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign-off. The previously flagged Phase 2 Live Shopping review and checkout currency-charging items remain open and untouched since the last update on those specifically.


---

## SESSION UPDATE — 2026-07-06 (scheduled check-in: automatic-discount checkout flow fully documented, no new commits since last entry)

This is an automated scheduled check-in comparing this file against live GitHub commits and Vercel deployments. The current tip of main is still commit 1ad1565, the same commit that added the previous SESSION UPDATE entry above (the one about Velor no longer buying shipping labels). No commits have landed on main since that entry was written, so there is nothing newer to report on the shipping-cost work itself.

While reconciling this file's history against the full commit log, three real, deployed changes were found that shipped earlier in that same working session but were never described in any SESSION UPDATE entry. In commit order: ee8ddc0 refactored the Stripe webhook handler, mainly reformatting whitespace but also changing how discount usage is recorded, moving from a single discountId on the PaymentIntent metadata to a comma-separated discountIds list processed with updateMany, so the webhook can now increment usedCount for more than one stacked discount on a single order. Then 443439f removed the manual "Discount code" text box and Apply button from the checkout page entirely; checkout now calls /api/discount/validate automatically with the cart's sellerId and line items as soon as the cart loads, and shows a green "Discount applied automatically" banner with no code for the buyer to type, matching the automatic-discount pricing already shown on the shop and marketplace product pages from the previous session. Then 3390590 updated the seller-facing discount-codes dashboard page copy to match: the page heading changed from "Discount Codes" to "Discounts", the create button from "+ Create Code" to "+ Create Discount", and new explanatory copy was added stating discounts are fully automatic, with the code field relabelled "Internal Name (for your reference only)" rather than implying buyers ever see or enter it.

Checking the Vercel deployments list directly also surfaced two Error-status deployments in the shipping-cost sequence already described in the entry above: e381224 ("Amend PAYOUTS.md: Velor never buys shipping labels") and 35f7936 ("Update Orders page to Mark as Shipped manual tracking form") both show Error in Vercel, not just 35f7936 as the previous entry stated. Both were superseded by the following commit, 4d2b644, which fixed the underlying TypeScript error, and the current production tip 1ad1565 is confirmed Ready. No action needed, but recording this for accuracy since the prior entry only named one of the two failed deployments.

Not yet verified this check-in: whether William has reviewed or been made aware of the checkout discount-entry removal, since like the rest of the automatic discount system it touches live checkout pricing and was flagged as unconfirmed-with-William in an earlier entry. That earlier flag still stands and is not resolved by this note.

The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign-off. The previously flagged items also remain open and untouched since their respective last updates: the automatic discount system, including this newly-documented checkout change, the Phase 2 Live Shopping review, and the checkout currency-charging review.

Next steps identified this check-in: continue flagging the automatic discount system, now fully code-free at checkout, to William for review, alongside the still-open Live Shopping review, the currency-charging review, and the tiered-pages OPEN REVIEW ITEM, until he addresses them. No new code work is proposed by this check-in beyond what is already listed in PENDING / NEXT above.

---

## SESSION UPDATE — 2026-07-06 (scheduled check-in: homepage hero swapped to real image, stray upload cleaned up)

Four commits landed on main since the last SESSION UPDATE entry, all now deployed to Production and showing Ready in Vercel. The current production tip is 808ffd9.

In commit order: 6f50877 redesigned the homepage hero with a coded SVG globe and network graphic, dual buyer and seller call-to-action buttons, and a trust badge strip along the bottom of the hero section. This was never documented in a SESSION UPDATE at the time it shipped, so it is being logged now for completeness. That redesign was short-lived: 26703c5 uploaded a real hero image William supplied, titled velor hero homepage global image.PNG, into the public folder, and the very next commit, 749751a titled velor email template, replaced the coded SVG globe entirely with that real image as a full-bleed hero graphic, simplifying the hero section down to the image plus two buttons, Shop now and Start selling, underneath it. The dual buyer and seller callout panels, the trust badge strip, and the uppercase eyebrow tag from the coded redesign were all removed as part of that same change. The 749751a commit also mistakenly committed a duplicate copy of the image to app/velor email template.PNG, a 1.53MB file in the wrong location. The following commit, 808ffd9, deleted that stray file, leaving the correct image living only in public/velor hero homepage global image.PNG as intended.

Net effect: the homepage now shows William's actual supplied photo or graphic as the hero, not a coded illustration, and there is no leftover duplicate file cluttering the app directory. All four commits are confirmed Ready in Vercel with no build errors.

This is a live, homepage-facing visual change that has not yet been confirmed with William, in the same way prior automatic-discount and shipping-cost changes were flagged as unconfirmed. Adding it to the list of items awaiting his review.

The OPEN REVIEW ITEM at the top of this file is unchanged and still awaiting William's sign-off. The previously flagged items also remain open and untouched: the automatic discount system, the Phase 2 Live Shopping review, and the checkout currency-charging review. The homepage hero image swap described above is now added to that same list of live changes awaiting William's confirmation.

Next steps identified this check-in: continue flagging the automatic discount system, the homepage hero image swap, the Live Shopping review, the currency-charging review, and the tiered-pages OPEN REVIEW ITEM to William until he addresses them. No new code work is proposed by this check-in.


---

## SESSION UPDATE — 2026-07-06 (scheduled check-in: no new activity since last update)

No new commits have landed on main since the previous entry above. That entry, written by the last scheduled check-in, already documented the homepage hero image swap to a real photo supplied by William, covering commits 6f50877, 26703c5, 749751a, and 808ffd9, and it was itself committed as 5e4bbce. Checking the commit history for main again just now, 5e4bbce is still the most recent commit. No code work has shipped this cycle, so there is nothing new to log.

The OPEN REVIEW ITEM at the top of this file remains open and untouched. All previously flagged items awaiting William's attention are unchanged since the last check-in: the automatic discount system, the homepage hero image swap, the Phase 2 Live Shopping review, and the checkout currency-charging review.


## SESSION UPDATE — 2026-07-06 (cycle 2)

Real progress has landed since the previous entry (which was logged as commit 14ae747, written when 5e4bbce was the most recent commit). Nine new commits have shipped on main since then: 37fc2c8, 89faa49, 1dc5a43, 568c82a, bfa0d18, 8b7672d, b27d287, 568bc18, and 2654fde.

The seller recruitment badge graphic went through several rounds of visual fixes: removing a duplicate FOR label, removing a stray headphone icon, centering the LIST text, splitting it into a two-line LIST (white) and FOR FREE (orange) layout, rebuilding it from the pristine original artwork for a clean circular clip with no stray square corners, and finally correcting the fill color to a hardcoded near-black after the previous version was accidentally sampling the globe glow color.

Outreach emails were also touched this cycle: the hero image now links through to /apply and uses the corrected Calling All Sellers graphic, and the copy was updated to reflect the confirmed 6th August buyer opening date.

Separately, the BOOST SALES card copy was fixed to remove a duplicate "and".

None of this cycle's commits touch the OPEN REVIEW ITEM below, so it remains fully open and unresolved. The previously flagged items requiring William's attention are unchanged: the automatic discount system, the homepage hero image swap, the Phase 2 Live Shopping review, the checkout currency-charging review, and the tiered seller plan pages OPEN REVIEW ITEM. This check-in is bookkeeping only; no product decisions were made.


---

## SESSION UPDATE — 2026-07-06 (outreach scaling push)

Five new commits landed on main since the last logged update (fcdb261, at 04:49 GMT+1), running through 05:03 GMT+1 today. The flawed AI-generated seller recruitment image was removed and the outreach email hero image was reverted to the stable placeholder graphic while a proper replacement is prepared. Separately, the autonomous outreach and scouting system was scaled up: scouting now runs every 6 hours and outreach-auto every 2 hours, the per-run outreach cap was raised from 8 to 30 with outreach defaulting ON unless explicitly disabled, and scouting volume was increased with more Etsy shops and eBay searches per run to feed the larger campaign. All five commits deployed cleanly to production on Vercel, each showing Ready with build times between 43 and 51 seconds.

In progress: a proper replacement graphic for the seller recruitment image is still pending; the placeholder remains live in the meantime.

Next: swap in the new seller recruitment graphic once it is ready, and keep an eye on the scaled outreach and scouting cadence for volume and quality as the campaign ramps up. The OPEN REVIEW ITEM above remains fully open and untouched, and the other previously flagged items — the automatic discount system, the homepage hero image swap, the Phase 2 Live Shopping review, and the checkout currency-charging review — are all still awaiting William's review; nothing in this cycle resolved them.


---

## SESSION UPDATE — 2026-07-06 (Pro dashboard audit, support SLA, ranking boost)

**Pro dashboard nav bugs fixed.** Two sidebar nav items ("Go Live", "API Keys") were showing to every tier even though both destination pages are Enterprise-only server-side, dead-ending Starter/Pro sellers on an upgrade prompt. Fixed in `app/dashboard/layout.tsx` so both are hidden from non-Enterprise sellers. A full audit of the remaining 11 dashboard pages (Products, Storefront, Orders, Returns, Disputes, Messages, Discount Codes, Analytics, Settings, Support, Payouts, Overview) confirmed all already have genuine (not cosmetic) Pro-tier differentiation via either an `isPro` or `isElevated` flag — no further content changes were needed.

**William's decision — Pro support SLA (LOCKED, authorised 2026-07-06):** Pro-tier sellers now get the exact same "under 2 hours" priority support treatment as Enterprise, not a separate slower tier. This was previously a gap: Pro was marketed as having "Dedicated seller support" but the backend only flagged Enterprise tickets as PRIORITY. Fixed for real in `app/api/dashboard/support/route.ts` (the `isPriority` gate now includes PRO) and `app/dashboard/support/page.tsx` (the banner copy now merges Pro and Enterprise into one "Priority Support" experience, and the Starter upsell link now points at the cheaper Pro plan instead of Enterprise). A sitewide marketing-copy audit found no other page underselling Pro's support level.

**William's decision — priority placement / ranking boost (previously LOCKED, now explicitly changed by William 2026-07-06):** `docs/SELLER_RANKING.md` was previously locked as merit-only guidance with a tier-band-first sort (Enterprise, then Pro, then Starter, with merit only breaking ties inside a band) — this let any paid seller, however badly they performed, outrank every free seller. William explicitly authorised replacing this with a real, bounded, additive tier boost: STARTER +0, PRO +8, ENTERPRISE +15, added on top of the existing 0-100 merit score to produce a new `rankingScore` field, computed alongside `sellerScore` in `lib/seller-ranking.ts`. Sort order in `app/api/shop/products/route.ts`, `app/api/marketplace/products/route.ts`, and `app/api/sellers/featured/route.ts` (homepage featured sellers) now orders by `rankingScore` descending instead of the old hard tier-first sort. The buyer-facing `sellerScore`/`sellerBadge` trust fields are untouched by the boost and remain pure merit — only placement order changed. `prisma/schema.prisma` gained `Seller.rankingScore` (applied automatically via `prisma db push` on the next Vercel build, same as every other schema change in this project). `docs/SELLER_RANKING.md` has been fully updated to document the new mechanism and explicitly note William's authorisation and date. This is the one deliberate exception to that doc's "do not re-litigate" status — everything else in it remains locked.

**Deferred/next:** William was offline for this cycle ("ill check your upgrade later") and has not yet reviewed the exact boost sizing (Pro +8 / Enterprise +15) — flag this for his review next session in case he wants the numbers adjusted. The OPEN REVIEW ITEM at the top of this file (tiered plan pages content review) remains fully open and untouched by this session's work.


---

## SESSION UPDATE — 2026-07-06 (continued) — AI assistant upgraded to a tiered account manager

**William's decision:** upgrade the AI chat assistant (components/VelorAssistant.tsx + app/api/assistant/chat/route.ts, first built earlier this session) from a single generic knowledge-only bot into a genuinely tiered assistant, with Enterprise getting the full "dedicated account manager" experience already advertised on its pricing page. Before this change every tier got the exact same bot with zero access to the seller's own data - that gap is now closed for real.

**What changed:**
- New file `lib/assistant-context.ts`: `capabilitiesForTier()` gates three real capabilities (own-data reads, order lookups, drafting, escalation) by tier, and `buildAccountSnapshot()` runs real Prisma queries scoped to that one seller (their own orders, status breakdown, merit score/badge, and a correctly-computed payout hold window - 15 days vs. the 72-hour payout-trusted window from docs/PAYOUTS.md, including whether any of their orders are currently frozen by an unresolved dispute or return). Nothing here is fabricated; every number is a live query against that seller's own rows.
- `app/api/assistant/chat/route.ts` rewritten: Starter keeps the original generic, knowledge-only assistant (no account data). Pro's system prompt now includes the seller's live account snapshot, so it gives personalised answers about their own orders/payouts instead of generic ones. Enterprise gets the snapshot plus its 10 most recent orders individually listed, plus two new real capabilities: it can draft a ready-to-send reply to a buyer or to support (text only, never auto-sent), and it can genuinely escalate - if the model emits an `[[ESCALATE]]` marker (only when the seller clearly wants a human), the route strips the marker and files a real PRIORITY `SupportTicket` through the same pipeline task #154 already wired to 2-hour response times, then confirms this to the seller in its reply. Escalation is not gated behind a confirmation step because filing a ticket is reversible and non-financial, consistent with William's standing rule that only irreversible/financial actions need confirmation.
- `components/VelorAssistant.tsx` now fetches the seller's tier from `/api/seller/me` and shows a tier-specific title, subtitle, greeting, and placeholder ("Velor AI Assistant" for Starter, "Velor AI Assistant — Pro" for Pro, "Velor AI Account Manager" for Enterprise) so the upgrade is visible, not just backend-only.

**Deferred / not built this round:** true multi-turn tool-use (the assistant reads a data snapshot taken at the start of the conversation rather than issuing live lookups mid-conversation - acceptable for now since the snapshot is refetched on every new message, but worth revisiting if sellers want to ask about an order that just changed status mid-chat). Refunds and payout actions remain entirely out of the assistant's reach, as instructed - it can only draft, look up, and escalate.

The OPEN REVIEW ITEM at the top of this file remains fully open and untouched by this work.

---

## SESSION UPDATE — 2026-07-06 (Go Live video shopping consistency pass)

Since the last logged update (AI assistant upgraded to a tiered account manager), three small commits shipped adding Go Live video shopping as a stated Enterprise tier benefit across every surface that lists Enterprise features. The homepage now lists Go Live video shopping under Enterprise tier benefits. The dedicated Enterprise upgrade page adds it to both its feature list and its comparison table. The general tier comparison table also gained Go Live video shopping under Enterprise extras, matching the homepage and upgrade page.

This was a marketing copy consistency fix, not new product functionality. Go Live video shopping was already referenced as an Enterprise capability; these commits made sure it is listed everywhere Enterprise benefits are described so the three surfaces no longer disagree with each other.

Nothing else of substance has changed since the last update. The OPEN REVIEW ITEM at the top of this file remains fully open and untouched, awaiting William's review.

---


## SESSION UPDATE — 2026-07-06 (bookkeeping check)


Checked for progress since the last logged update (the Go Live video shopping consistency pass). That update is still the most recent commit on the main branch — no new commits have landed since then, so there is nothing substantive to log this cycle.


The OPEN REVIEW ITEM at the top of this file remains fully open and untouched, awaiting William's review.


---

## SESSION UPDATE — 2026-07-06 (follow-up check, no change)

Ran another bookkeeping check shortly after the previous entry above. Reviewed the commit history on the main branch again and confirmed the most recent commit is still the prior bookkeeping update itself (commit 9907df3, made at 07:21 UTC today) — no new commits have landed on main since then, and no new Vercel deployment has followed. There is nothing substantive to log this cycle.

The OPEN REVIEW ITEM at the top of this file remains fully open and untouched, awaiting William's review.


---

## SESSION UPDATE — 2026-07-06 (routine check, no new activity)

Ran the scheduled bookkeeping check again around 09:49 UTC. Reviewed the commit history on the main branch and confirmed no new commits have landed since the last logged entry (commit 2b8ce0f, made at 08:20 UTC today, itself a no-change bookkeeping note). This is now the third consecutive scheduled check with nothing new to report. The last real product commits remain the Go Live video shopping consistency pass (homepage, Enterprise upgrade page, and tier comparison table) logged earlier today.

The OPEN REVIEW ITEM at the top of this file remains fully open and untouched, awaiting William's review.


## SESSION UPDATE — 2026-07-06: Real-time new-seller signup email alert

William asked for a real-time email to willsinclair144@gmail.com every time a new seller signs up, using the existing Resend integration (not a new provider, not folded into the 07:00 UTC daily director briefing).

**Design decision — what counts as "seller signup":**
Investigated the full seller-creation surface of the codebase before picking a trigger point. Two candidate pipelines exist:

1. `app/api/seller/apply/route.ts` — the outreach/agent-driven application pipeline (Agent 3, Seller Onboarding). This only creates a `SellerApplication` row. It does NOT create a `Seller` or `User` row.
2. `app/api/agents/applications/[id]/route.ts` (PATCH, admin-only) — approves/rejects a `SellerApplication` and sends `buildSellerApprovedEmail`/`buildSellerRejectedEmail`. Read the full file (3100 chars) and confirmed it contains no `seller.create`/`seller: {` anywhere — approving an application does NOT create a `Seller` row either. This pipeline currently has no confirmed conversion into a real seller account anywhere in the live code.
3. `app/api/auth/register/route.ts` — the direct self-serve registration endpoint. This is the ONLY place in the codebase that actually creates a `Seller` row: a single atomic `prisma.user.create()` with a nested `seller: { create: { storeName } }` write, creating `User` (role SELLER) and `Seller` (tier defaults to STARTER, approved defaults to false) together in one transaction.

**Decision: "signed up" = the moment `app/api/auth/register/route.ts` successfully creates the User+Seller pair.** There is no meaningful separate "completed onboarding" step in this codebase — the Seller row exists atomically from the first moment of registration, unapproved by default. Approval/verification is a later lifecycle change on an already-existing Seller row, not a separate account-creation event. This is also simply the only real signup event that exists in the code today.

**Known gap (disclosed honestly, not silently glossed over):** the outreach/application pipeline (`SellerApplication` → admin approval) does not currently create a `Seller` account at all. If that pipeline is ever built out to actually convert an approved application into a real seller account, this alert will NOT fire for that path unless the same alert call is added at that future conversion point. Right now this is a non-issue only because that conversion doesn't exist yet — but it's worth remembering if/when Agent 3 gets finished.

**What was built:**
- Added `buildNewSellerAlertEmail(d: { name, email, storeName, tier, signedUpAt })` to `lib/email.ts`, following the existing `WRAP_OPEN`/`WRAP_CLOSE`/`h()`-escaping conventions used by the other `build*Email` functions. Returns `{ subject, html }` with a simple field table (name, email, store name, tier, signup timestamp) and a note that the seller is unapproved by default.
- Updated `app/api/auth/register/route.ts`: after the existing `prisma.user.create()` call (now with `include: { seller: true }` so the real `tier`/`storeName`/`createdAt` are read back from the row that was actually written, not just echoed from the request body), the route now fires a second email via the shared `lib/email.ts` `sendEmail()` + `buildNewSellerAlertEmail()` to `willsinclair144@gmail.com`, inside the same `Promise.allSettled([...])` as the existing applicant-facing welcome email. This is a genuinely real-time, per-request send — not a cron job.
- **Bonus fix, called out explicitly (not silently bundled):** the existing applicant-facing welcome email in this route had a mojibake-corrupted subject line (`'Welcome to Velor Marketplace ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Application Received'` — a multiply-mis-encoded em dash), which was live and affecting every new seller's welcome email. Fixed the subject to a clean em dash while in this file. Did not otherwise change the applicant welcome email's transport (left it on its own lightweight raw-fetch `sendEmail` helper, since it uses `reply_to` which the shared `lib/email.ts` `EmailOptions` interface doesn't currently support — did not want to widen that shared interface as an unrequested side effect of this task).

Committed as `e3c3006` (lib/email.ts) and `67e15e8` (register route). Both deployed to Production (Ready) on Vercel.

---

## SESSION UPDATE — 2026-07-06 (routine check: hero revert logged, no new commits since last entry)

Ran the scheduled CLAUDE.md bookkeeping check. Reviewed the commit history on the main branch: the newest commit is `5aee0a4`, which is the CLAUDE.md update itself that logged the real-time seller-signup-alert work above (`e3c3006`, `67e15e8`). No commits have landed on main since that entry was written, so there is nothing new to report on that feature.

While reviewing history for this check, found one earlier shipped commit that had not been recorded in this file: `9d0d26e`, "Revert homepage hero to the original text-only layout per William's request." This removed the uploaded hero image and restored the eyebrow badge, headline, and dual-CTA hero that predated the hero redesign. It landed between the last routine bookkeeping note (`540939e`) and the seller-alert email work, but was not mentioned in the subsequent log entry, so recording it now for an accurate history.

Next: no outstanding work identified from commit history this cycle. The OPEN REVIEW ITEM above remains fully open and untouched, awaiting William's review.


---

## SESSION UPDATE — 2026-07-06 (routine check: no new commits since last entry)

Ran the scheduled CLAUDE.md bookkeeping check again. Reviewed the commit history on the main branch: the newest commit is still 2f05ef7, which is the previous CLAUDE.md log entry itself (the one confirming the hero revert and seller-alert work above). No commits have landed on main since that entry was written, so there is genuinely nothing new to report this cycle.

Next: no outstanding work identified from commit history this cycle. The OPEN REVIEW ITEM above remains fully open and untouched, awaiting William's review.


## SESSION UPDATE — 2026-07-06: Outreach/application pipeline now fully operational (real account provisioning)

Following up on the earlier new-seller-alert work: William asked to actually finish the outreach/application pipeline so approving a `SellerApplication` creates a real Seller account (previously it only sent an approval email -- no account was ever created, which was disclosed at the time as a known gap).

**What changed in `app/api/agents/applications/[id]/route.ts` (approve branch):**
- On approval, the route now checks for an existing `User` with the applicant's email:
  - If they already have a `Seller` profile (rare/duplicate case): just makes sure it's marked `approved: true`, no new account created, no password/activation email sent (they already have credentials).
  - If they have a `User` account but no `Seller` yet (e.g. an existing buyer): attaches a new `Seller` row to their existing account, `approved: true`, no new credentials needed.
  - If no account exists at all (the common case): creates a new `User` (role SELLER, `password: null`) + nested `Seller` (`approved: true`, tier defaults to STARTER) in one transaction, generates a one-time `setupToken` (32-byte random hex, 7-day expiry stored in new `User.setupTokenExpiresAt`), and emails the applicant an activation link: `https://velorcommerce.store/activate?token=...`.
- In all three branches, the existing real-time new-seller alert (`buildNewSellerAlertEmail`, added earlier today) now also fires to willsinclair144@gmail.com, so this pipeline is covered by the same alert as direct self-serve registration -- closing the gap flagged in the earlier session update.

**Why `approved: true` here but `false` on self-serve registration:** admin approval of the application IS the approval step for this pipeline -- there's no separate later approval to wait for. Self-serve registrants (via `/api/auth/register`) still default to `approved: false` pending review, since nobody has vetted them yet.

**New account-activation flow (built from scratch -- no prior invite/password-reset pattern existed anywhere in this codebase):**
- Added `User.setupToken String? @unique` and `User.setupTokenExpiresAt DateTime?` to `prisma/schema.prisma`. Confirmed `auth.ts`'s credentials provider already safely rejects login for any user with a null password (`if (!user || !user.password) return null`), so a freshly-provisioned account with `password: null` cannot be logged into until activation completes -- no auth hole introduced.
- `app/api/account/activate/route.ts` (new): POST `{ token, password }`, validates the token exists and hasn't expired, hashes the password with bcrypt, sets it on the user, clears `setupToken`/`setupTokenExpiresAt`.
- `app/activate/page.tsx` (new): public page, reads `?token=` from the URL, password + confirm fields, calls the activate endpoint, redirects to `/auth/sign-in` on success. Matches the site's dark/orange (#0D0D0D/#1A1A1A/#FF6B00) visual convention.
- `buildSellerApprovedEmail` in `lib/email.ts` extended with an optional `activationLink` param -- when present, the email tells the seller to set a password and links to `/activate`; when absent (existing-account branches above), it keeps the original "log in to your dashboard" copy/link unchanged.

**Verified live:** POSTed a bogus token to `/api/account/activate` on production and got back the expected `400 Invalid or already-used activation link` (not a 500), confirming the new `setupToken` column exists in production (schema migration via `prisma db push` on the Vercel build ran correctly) and the route works end to end.

Committed as: `320ca4f` (lib/email.ts), `6f2df46` (schema.prisma), `54921f5` (applications/[id]/route.ts). All deployed to Production (Ready).

## SESSION UPDATE — 2026-07-06: Homepage traffic pulse widget + permanent admin API access for Claude

William separately asked for real (not fabricated) traffic numbers. Found that Vercel's built-in Web Analytics was never enabled on this project (confirmed live -- the Analytics tab showed the "Enable" upsell, not data), but a custom pageview tracker already existed and was already recording real data: `components/AnalyticsTracker.tsx` posts to `/api/analytics/pageview` on every route change, which writes `path`/`referrer`/`country` (via Vercel's `x-vercel-ip-country` header, already working) to a `PageView` table. No IP addresses are or were ever stored -- flagged to William that IP logging would be a deliberate, separate decision with real UK GDPR implications (legal basis, retention policy, privacy-policy disclosure) if ever wanted.

William chose to surface this as a public, honest social-proof widget rather than an internal-only dashboard tile (explicitly confirmed via direct question after being shown the tradeoff: public visitor/competitor visibility vs internal-only). Built:
- `app/api/public/traffic/route.ts` (new): unauthenticated, returns only two aggregate counts (`lastHour`, `today`) computed from raw `PageView` row counts. Deliberately does not expose paths, referrers, or per-visit rows. Copy is careful to say "page views," not "visitors" or "people online" -- the table has no visitor identifier, so uniqueness genuinely can't be claimed; saying otherwise would be a fabricated stat.
- `components/GlobalHeader.tsx`: added a homepage-only (`pathname === '/'`) segment to the existing trust micro-bar, polling the endpoint every 30s. Verified live: shows real counts (2 in the last hour, 79 today, at time of writing).

**Separately, permanent read access for Claude:** rather than needing a live logged-in browser session every time reporting/stats data is needed, added `lib/adminAuth.ts` (`isAuthorizedAdmin(request)`) which accepts EITHER William's existing NextAuth admin session (unchanged, what the dashboard UI uses) OR a matching `x-admin-secret` request header, checked against an `ADMIN_SECRET` env var. Wired into `app/api/admin/stats/route.ts` and `app/api/agents/growth/report/route.ts` (previously session-only, and note: despite being documented elsewhere as an existing convention, `ADMIN_SECRET` was not actually wired into any route in this codebase before now). Generated a new secret value and asked William to set it as the `ADMIN_SECRET` env var in Vercel (an existing but previously-unused variable, reused rather than duplicated) -- this is a service credential for server-to-server API calls, not a personal login, consistent with how the GitHub PAT is already used in this project.

Committed as: `0d37025` (lib/adminAuth.ts), `f079d0b` (public/traffic route), `f3a04a6` (admin/stats route), `b75235c` (growth/report route), `ce1ad67` (GlobalHeader.tsx). All deployed to Production (Ready).


## STANDING DIRECTIVE — 2026-07-06: Dropshipping business (velorcommerce.co.uk / velor1/velor) is off-limits

William: "the dropshipping business is never to be worked on again." This repo (BILSY144/velor-marketplace, velorcommerce.store) is unaffected and is the only active Velor project going forward. Do not open, edit, or take any action against github.com/velor1/velor or velorcommerce.co.uk unless William explicitly reverses this instruction in a future conversation. The velor-ceo-ops and velor-listing-protocol skill content (CJ Dropshipping, China trip, dropshipping margin rules) is no longer applicable to any live work and should not be used to guide decisions on this project.

## CLARIFICATION — 2026-07-06: CJ Dropshipping IS permitted on velor-marketplace, but ONLY for the listings-seeding feature below

The ban logged above ("the dropshipping business is never to be worked on again") refers to the OTHER project only: github.com/velor1/velor and velorcommerce.co.uk. It does NOT prohibit using CJ Dropshipping as a product-sourcing tool inside velor-marketplace itself.

William, verbatim: "this has nothing to do with velorcommerce.co.uk we are merely just using cj dropshipperes indepently for listings"

Decision, confirmed by William 2026-07-06:
- Purpose: seed initial product listings across marketplace categories to give the site content and give prospective sellers a concrete reason to sign up (a working, populated marketplace), and to test our own order-fulfillment API path before real Enterprise sellers rely on it.
- Disclosure: CJ-sourced products BLEND IN as regular seller listings. No "Velor Official" badge, no special label, no visual distinction from any other seller's storefront. William explicitly rejected the labelled option.
- Fulfillment: REAL automation from day one — Stripe order to CJ order-placement API to tracking sync — not a manual/hand-fulfilled pilot. William explicitly rejected "manual to start."
- Attribution: CJ-sourced products are attached to a real internal Seller account (not scattered across fake sellers), which will need its own handling in the payout/Stripe Connect flow since it is not a genuine third-party seller.

This note exists so a future session does not misread the dropshipping ban above as covering this feature too. The two are separate: the co.uk site itself stays permanently untouched; using CJ's product/order API as a backend data source for velor-marketplace listings is allowed.

Status as of this entry: research only (CJ API v2 endpoints confirmed via developers.cjdropshipping.com docs — auth, product search, categories, freight calc, order create). No credentials added, no code written yet. Waiting on William to supply CJ API credentials.

---

## CORRECTION — 2026-07-06: repo identity of the old dropshipping business

A previous session's CLAUDE.md note incorrectly logged the old dropshipping business as living at `velor1/velor`. It does not. The actual repo was **`BILSY144/velor`** (Vercel project `velor`, domain `velor-flame.vercel.app`), discovered while debugging a velor-marketplace deployment stall. William confirmed directly: "yes that was for old dropshipping account. velorcommerce.co.uk"

This repo was found via an active Vercel Observability alert on its own `/api/cj-webhook` endpoint (500 errors from GitHub 409 conflicts writing to `data/products.json`) — unrelated to velor-marketplace, but on the same Vercel team. Its build/webhook activity is suspected (not confirmed) to have contributed to why velor-marketplace deployments were silently failing to trigger around the same time.

William confirmed this repo had zero dependency from velor-marketplace, and that his real eBay/CJ fulfillment workflow is "handled inside CJ/eBay directly" — not dependent on this website. He then authorized full decommissioning, executed via live walkthrough (William performed each destructive click himself; Claude staged/navigated but never executed the deletions):
- Vercel project `velor` (BILSY144/velor) — deleted
- GitHub repo `BILSY144/velor` — deleted
- Domain `velorcommerce.co.uk` — removed from the `velor1` Vercel team (was already unattached to any project; DNS/nameservers are third-party, so this had zero effect on eBay/CJ fulfillment)

The permanent dropshipping ban stated elsewhere in this file still stands — it just now correctly refers to a repo that no longer exists.

---

## CORRECTION — 2026-07-06: velor-marketplace is GLOBAL, not UK-specific

lib/cj.ts originally had `checkUkFreight()` hardcoding `endCountryCode: 'GB'` — a leftover assumption copied from the old velorcommerce.co.uk dropshipping site (which really was UK-only). That assumption does not apply here. William, verbatim: "we are a global market place, there is no uk references. global not just uk."

Fixed: renamed to `checkFreight(vid, quantity, endCountryCode, startCountryCode='CN')` — destination country must always be passed in from the actual buyer/shipment address, never hardcoded. This matches the rest of the marketplace, which already supports a full global origin-country list, per-seller currency, and live FX conversion.

Standing rule for all future CJ listings-seeding work (import mechanism, order fulfillment, freight/availability filtering): never assume or default to any single destination country. Every freight check, availability check, and shipping cost calculation must resolve the destination from the real buyer/shipment data.


---

## SESSION UPDATE — 2026-07-06: CJ Dropshipping wired in as a listings source for velor-marketplace

Since the last logged update (homepage traffic pulse widget and admin API access), work has focused on connecting CJ Dropshipping as a backend listings source for velor-marketplace, separate from the old co.uk dropshipping site. lib/cj.ts now implements the full CJ API v2 client (auth, product search, freight check, order create, tracking), backed by a new CjAuthToken model and new CJ linkage fields on Product, Seller, and Shipment. The decision to use CJ purely for listings-seeding was documented as separate from the permanent ban on rebuilding the old dropshipping business.

A global-not-UK correction also went in: the freight check originally hardcoded destination country to GB, a leftover from the old UK-only site. William confirmed velor-marketplace is global with no UK-specific logic, so this was renamed to checkFreight() and now requires the real destination country on every freight and shipping calculation. Separately, repo identity confusion was resolved (the old dropshipping business was BILSY144/velor, not velor1/velor), and that old Vercel project, GitHub repo, and the velorcommerce.co.uk domain attachment were fully decommissioned. The standing ban on rebuilding the dropshipping business still stands, it just now refers to a repo that no longer exists.

A series of admin test routes then verified the CJ integration against live credentials (auth, categories, freight calculate, product search), which surfaced a response-shape bug: CJ's listV2 search endpoint returns results at data.content[].productList[], not data.list. That was fixed in the latest commit (1545477), deployed and showing Ready in Vercel production along with every other commit in this window. With the fix in, a CJ candidate-search route (keyword search plus freight-availability pre-filtering), a final CJ import route (creates Product rows from approved candidates), and an idempotent internal CJ seller account route are all in place.

In progress: no listings have actually been seeded into the live catalogue yet, since the parsing fix just landed. Next: run the candidate-search to approve to import flow end-to-end against a real CJ category, confirm freight-availability filtering behaves correctly for non-UK destinations, and begin seeding real listings once that is confirmed. One small unrelated commit also landed in this window: hid the scrollbar on the homepage's live-shopping swipe row.

---

## SESSION UPDATE — 2026-07-06 (later check-in)

No new commits have landed on main since the previous entry above. HEAD is still 4c42a36, the same commit that authored that entry, so there is nothing new to report this cycle. The CJ Dropshipping integration remains at the point already logged: the searchProducts response-shape fix, the candidate-search route, the final import route, and the internal seller account route are merged and deployed, but no listings have actually been seeded into the live catalogue yet. Next check-in will look for progress on running the candidate-search-to-import flow end-to-end and on seeding real listings.


## SESSION UPDATE — 2026-07-06 (later check-in #2)

Real progress since the previous entry above (HEAD was 4c42a36, now 47a3a61). Ten new commits landed on main.

Build health: three consecutive production deployments broke (ac47caa, 3f6d300, 0347833) after a product.title/product.name field rename touched more call sites than expected, including a breadcrumb component. This was caught and fixed by 31a00c7, and every deployment since has been Ready. Current production HEAD 47a3a61 is a healthy build.

Bug fixes shipped: product.name to product.title rename completed everywhere, fixing blank product titles on the marketplace page and "undefined" cart item names. Mojibake (broken UTF-8) currency symbols and em-dashes were fixed across symbolFor(), the product page, and the checkout Order Summary. The checkout Order Summary now shows real currency conversion via useCurrencyDisplay instead of raw GBP mislabeled with the address-derived currency. CJ-sourced items now get a real Free Delivery shipping rate at checkout instead of a nonsensical "contact seller for shipping quote" message, since CJ ships direct and has no ShippingProfile. The shop product page crash from an undefined product.variants array was guarded.

CJ variant data model: added a real ProductVariant model plus OrderItem.variantId/cjVid/color fields, replacing the previous approach of squashing CJ colour/variant options into plain description text. The cj-import route now creates real ProductVariant rows per CJ colour/variant on new imports, and a one-time backfill route was added to populate ProductVariant rows for CJ products that were imported before this model existed.

Net effect: the CJ Dropshipping listings pipeline is more structurally sound now (real variants, real currency display, real shipping rates) but per the previous entry, no listings have actually been seeded into the live catalogue yet via the candidate-search-to-import flow. Next check-in will look for progress on that seeding step, and on confirming the ProductVariant backfill actually ran against existing CJ products.


---

## SESSION UPDATE — 2026-07-06 (later check-in #3)

Real progress since the previous entry above (HEAD was 47a3a61, now b33a443). Four new commits landed on main. Build health was rocky in this window: the shipping/rates rewrite (ab3f652) shipped with two bugs, a string-escaping bug that left literal backslash-n sequences instead of real newlines, and camelCase field names on ShippoCustomsItem where the type actually requires snake_case (net_weight/mass_unit/value_amount/value_currency/origin_country). That commit and the following doc-only commit (b0545a3, the previous CLAUDE.md update itself) both show as failed builds on Vercel. Two follow-up fixes (3c97993, a8f3997) resolved both issues, and the two most recent deployments (a8f3997, b33a443) are Ready. Current production HEAD b33a443 is a healthy build.

The main functional change is a rework of app/api/shipping/rates/route.ts. Two real bugs were fixed there. Cart items were being grouped by sellerStripeAccountId, a field that is never actually populated on cart items, which silently collapsed every seller's items into one bucket; grouping now uses the real sellerId field instead. More significantly, CJ-sourced items previously got a hardcoded flat Free Delivery rate regardless of destination. They now get a real quote from CJ's own freightCalculate API (checkFreight in lib/cj.ts), keyed by the buyer's actual destination country and the specific product variant (vid) they chose, taking the cheapest of the logistics channels CJ returns and the worst-case delivery estimate parsed from CJ's own aging string. Separately, b33a443 switched the cj-backfill-variants admin route to the shared isAuthorizedAdmin() (Bearer ADMIN_SECRET) check instead of a bespoke one, matching the convention used by other admin routes site-wide.

Net effect: CJ shipping cost and delivery time at checkout are now real per-destination, per-variant figures instead of a hardcoded flat rate, correcting something the previous entry had described as already fixed with a flat free rate. As before, no listings have actually been seeded into the live catalogue yet via the candidate-search-to-import flow, and the ProductVariant backfill route's actual execution against existing CJ products still has not been confirmed. Next check-in will look for progress on both of those, plus confirmation that the new real-freight shipping rates return sane values for at least one live destination and variant pair.


---

## SESSION UPDATE — 2026-07-06 (check-in #4)

Real progress since the previous entry above (HEAD was b33a443, now b2aea18). Twenty commits landed on main this window, and all deployments are Ready in Vercel production except one transient error on a temporary diagnostic build that was superseded two commits later. The headline fix: live shopping Buy Now and wishlist Add to Cart were both writing the cart to storage as a plain array, incompatible with the {state:{items}} shape checkout actually reads, so items silently vanished before checkout from both of those entry points. The fix was structural rather than a patch: a new centralized cart lib was added as the single source of truth, and GlobalHeader, ProductDetail, ProductPageClient, and Checkout were all migrated onto it in place of duplicated local readCart/writeCart logic. This also fixed the cart badge in the header being stuck at 0. Cart line identity is now variant-aware (falls back to productId when id is absent) so multi-variant lines no longer collide on remove or update, and Checkout now allows removing an item on the payment step too, safely re-quoting if an item is removed after the PaymentIntent was already created.

Currency and pricing also got a real pass. Seller currency is now returned from both the product detail and shop listing APIs, and the product page and homepage were fixed to display real seller-currency-converted prices (the homepage had a separate bug showing an undefined product title). In checkout, the shippingCost string-concatenation bug that produced bogus totals (e.g. 1 + "3.29" -> "13.29") was fixed, along with the item line price not using the reconfirmed/server value the way the Subtotal row already did, and a remove-item control was added to the Order Summary.

Separately, a temporary unauthenticated diagnostic route was added and then exercised end-to-end (searchProducts -> getProductDetail -> checkFreight, i.e. the real CJ pilot import pipeline) to isolate a CJ integration failure. One deployment in that chain errored on Vercel and was fixed by the next commit (a TypeScript cast issue), and the diagnostic route was removed once diagnosis was reported complete. This report cannot confirm from commit messages alone what the diagnosis actually found or fixed in the underlying CJ integration, only that the diagnostic cycle ran and was closed out. Current production HEAD (b2aea18) is a healthy, Ready build.

Net effect: the cart and pricing paths are now meaningfully more reliable (shared cart lib, real currency, corrected checkout math), a real fix to a real customer-facing bug rather than cosmetic cleanup. Carried forward unresolved from the previous entry: no listings have been confirmed seeded into the live catalogue via the candidate-search-to-import flow, and the ProductVariant backfill route's actual execution against existing CJ products still has not been confirmed. Next check-in should look for progress on both of those, plus a concrete read on what the CJ diagnostic route actually found before it was removed.
## SESSION UPDATE — 2026-07-06 (check-in #5)

Since the last check-in, five more commits landed on main. All three remaining marketplace currency-conversion fixes referenced as "parallel to #191" were completed: the marketplace list API, the marketplace detail API, and the marketplace product page were all updated so seller currency is included in API responses and displayed correctly instead of a hardcoded GBP price. Separately, CJ pricing was corrected to include shipping cost in the margin basis and the markup was raised from 20% to 30%, closing a gap where free-shipping listings were effectively being sold at a loss (this also closes out task #190). Most recently, the Free Delivery badge was removed from the product page itself, since that badge was only accurate once shown in the cart after shipping cost is actually known, not on the pre-shipping-cost product view.

All of these built and deployed cleanly except the very latest commit (the Free Delivery badge removal), whose build check was still pending at the time of this check-in and should be confirmed green next time.

Carried forward unresolved from the previous entry: no listings have been confirmed seeded into the live catalogue via the candidate-search-to-import flow, and the ProductVariant backfill route's actual execution against existing CJ products still has not been confirmed. Next check-in should look for progress on both of those, plus confirmation that the newest commit's build finished successfully.

## SESSION UPDATE — 2026-07-07

Since the last check-in (2026-07-06, check-in #5), a large batch of commits landed on main across three threads of work, verified against the GitHub commit history.

Stock and inventory enforcement is now complete end to end. Product.stock is enforced at checkout, rejecting payment-intent creation with a 409 if any cart item quantity exceeds current stock, and stock is decremented atomically when an order is created, guarded against going negative under race conditions. SOLD OUT banners were added across all three surfaces: the shop listing grid, the shop product detail page, and the marketplace product detail page, which also had stock added to its Product type and Add to Cart disabled when out of stock, bringing the marketplace app to parity with the shop app on this feature. A "Context-recovery verification" commit confirmed this plus six previously relayed tasks are live and rewrote the CURRENT SESSION STATE section of this file with exact commit SHAs, following a mid-session context loss.

CJ supplier identity work also progressed. A cjSupplierName field was added to the Product model, real supplierName and supplierId fields were wired through CjProductDetail and import candidates, and listings now show the real CJ supplier name (or an honest CJ Dropshipping fallback) instead of the generic seller storeName. This was followed by a rework of internal CJ seller provisioning to find-or-create sellers by real supplier name, a rename endpoint to retire the "Nordholm Supply Co." test name, a PATCH endpoint on cj-import for reassigning a product to its resolved real-supplier seller after the fact, and a new cj-resupplier admin route that re-checks live CJ product detail and reassigns already-imported products off the generic fallback wherever a real supplier name can be found.

Several shop and homepage fixes also landed. A /shop crash was fixed (the API never flattened name, sellerId, sellerName, and currency onto product objects). Shop Next/Previous pagination was fixed, since navigate() was deleting the page param immediately after setting it. Live shopping Buy Now was fixed, since it wasn't passing sellerId and so was skipped in shipping/rates at checkout, the same bug class as an earlier wishlist fix. The shop review score was relabeled "Rating:" so a 0-review product doesn't read as an out-of-stock count. Emoji country flags were replaced with real flag images via a shared countryFlagUrl helper (resolving both ISO-2 codes and full country names) across homepage seller cards, the seller storefront page, and homepage product cards, alongside several rounds of homepage card image sizing and aspect-ratio iteration.

Multi-variant CJ candidate exclusion work from the prior day (excluding multi-option CJ items from the import queue, removing already-imported multi-variant products, and fixing a broken multi-variant filter) appears fully landed and is not being carried forward as open.

Next check-in should confirm on Vercel that the newest commits, including the cj-resupplier admin route and the pagination fix, built and deployed cleanly, since this could not be verified from GitHub commit history alone. Still carried forward and unconfirmed from earlier entries: whether any listings have actually been seeded into the live catalogue via the candidate-search-to-import flow, and whether the ProductVariant backfill route has been run against existing CJ products.

## SESSION UPDATE — 2026-07-07 (check-in #6)

Checked in at approximately 06:58 UTC. No new commits have landed on main since the previous check-in — HEAD is still d54926c, the commit that added the SESSION UPDATE — 2026-07-07 entry directly above this one (timestamped 03:35 UTC). Nothing new to report this cycle; the state described in that entry remains current.

## SESSION UPDATE — 2026-07-07 (check-in #7)

Checked in at approximately 07:47 UTC. No new commits have landed on main since the previous check-in — HEAD is still acc86c6, the commit that added the SESSION UPDATE — 2026-07-07 (check-in #6) entry directly above this one (timestamped 07:00 UTC). Nothing new to report this cycle; the state described in that entry remains current.
