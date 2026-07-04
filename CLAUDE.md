# Velor Working Memory
_Auto-loaded each session. Last updated: 2026-07-04 (Seller tier limits updated)_

---

## ⚠️ OPEN REVIEW ITEM — AWAITING WILLIAM (added 2026-07-04, DO NOT REMOVE UNTIL CONFIRMED)

**Tiered seller plan pages need William's review before this is considered done.** The dedicated single-tier pages (`/dashboard/upgrade/starter`, `/pro`, `/enterprise`) are built, deployed, and visually verified — but the underlying business content has NOT been reviewed by William yet. Keep this section in the file and raise it proactively next session until he confirms it's resolved. Review needs to cover:

1. **Price-to-value justification** — does what's actually offered on each tier (Starter free/15% commission, Pro £49/mo/8%, Enterprise £199/mo fixed/5%) genuinely justify that price jump? Walk through each feature bullet with William, not just the price/commission numbers.
2. **Can Velor actually deliver everything listed** — audit each tier page's feature list against what is REALLY built today vs. aspirational copy. Flag anything unconfirmed, especially: "AI-powered listing optimisation" (Pro), "priority placement in search" (Pro), "dedicated account manager" (Enterprise), "full API access & integrations" (Enterprise), "custom analytics & early access" (Enterprise). Do not let unbuilt features stay listed as if live — either build them, clearly mark them "coming soon", or remove them.
3. **Layout/design differentiation between tiers** — confirm the three dedicated pages don't just look like the same template with different colours and numbers. Each tier's page should visually communicate escalating premium-ness (Starter → Pro → Enterprise), not just swap a gradient.
4. **Actual in-dashboard experience escalation** — beyond the marketing page, confirm each tier genuinely unlocks a more advanced settings/dashboard experience than the one below it (not just a higher listing cap and lower commission %). E.g. does Pro's dashboard look/behave more advanced than Starter's? Does Enterprise expose real extra tools (API keys page, account manager contact, advanced analytics dashboard) or just a bullet point on a pricing page?

**Status: NOT started.** This is a content/product review task for William, not a code task — surface it at the start of the next session and don't mark it resolved until he explicitly signs off.

---

## CURRENT SESSION STATE — READ THIS FIRST

**Status: Stripe Connect onboarding is now FULLY WORKING end-to-end. No blockers remaining from the overnight session.**

### What was wrong and how it was fixed (in order)

1. **Restricted API key lacked permissions.** The live `STRIPE_SECRET_KEY` was a restricted key (`rk_live_...`) missing "Accounts Write" and two other Connect-related permissions. Rather than keep hunting for the exact permission rows, William created a brand new **standard secret key** (`sk_live_...`, named `velor-marketplace-prod`) via Stripe Dashboard → Developers → API keys → Standard keys → "Create secret key" → "Powering an integration you built". Pasted into Vercel Project Settings → Environment Variables → `STRIPE_SECRET_KEY`, then redeployed. This has full permissions by default.
2. **Stripe account had never signed up for Connect.** After the key swap, a new, more specific error appeared: "You can only create new accounts if you've signed up for Connect." Fixed by going to `dashboard.stripe.com/connect` and completing the Connect signup flow (business model = **Marketplace** — "You collect payments and pay recipients", matching Velor's actual architecture of the platform collecting payment and paying out 85% to sellers).
3. **"Go live" checklist had 2 incomplete steps.** In the Connect setup guide sidebar, under "Go live": "Verify your identity" was done, but "Confirm your integration choices" and "Get your API keys" were not. Completed both — confirmed integration summary (Stripe-hosted Express onboarding, platform liable for refunds/chargebacks, sellers redirected to Express Dashboard) and acknowledged the responsibilities checklist (refunds/chargebacks, onboarding/compliance, support for payment/risk inquiries).
4. **End-to-end verification, live, on the test seller account** (`willsinclair144+testseller@gmail.com`): clicked "Connect with Stripe" → real Stripe Express onboarding loaded (`connect.stripe.com/setup/e/...`) → completed phone verification, business details, and real bank account details (this is a LIVE account, not test mode, so real bank details were required) → redirected back into the Velor dashboard → re-accepted seller terms (cookie had expired from an earlier sign-out) → Payouts page now shows **"Connected"** with green indicators for Charges, Payouts, and Verified.

### Net result

The full seller money flow is now confirmed working: seller connects Stripe → onboarding completes → account shows Connected/Charges/Payouts/Verified → ready to receive 85% payouts on future sales (Velor keeps 15% platform fee), matching the model chosen during Connect signup.

### Next planned topic (not started yet)

Review the 15 storefront themes — this was the original long-standing goal before the seller-onboarding bug hunt took over. Nothing has been done on this yet this session.

### Other still-open items (lower priority, not confirmed as next by William)

- Audit the five other legal/agreement pages for stale/incorrect info, same issue already fixed in `app/dashboard/terms/page.tsx`: `app/legal/seller-agreement/page.tsx`, `app/legal/terms/page.tsx`, `app/seller-agreement/page.tsx`, `app/legal/privacy/page.tsx`, `app/returns/page.tsx`.
- Whether to re-lock `PREVIEW_OPEN` (currently `true` in `lib/store-themes.ts`) now that themes/logo have been tested.
- Whether to flip `OUTREACH_ENABLED`.

---

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
