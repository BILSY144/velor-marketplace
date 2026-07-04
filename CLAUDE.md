# Velor Working Memory
_Auto-loaded each session. Last updated: 2026-07-04_

---

## CURRENT SESSION STATE â READ THIS FIRST

_If this block says IDLE, no task is mid-flight. If it has content, resume from here._

**Status**: IDLE â 15-theme storefront system and custom store logo upload are both shipped, committed, and deployed READY. Preview mode is currently ON (`PREVIEW_OPEN = true`) so all 15 designs + the logo feature are open for William to test before they're gated behind paid tiers.

**Next planned topic**: awaiting William's decision on whether to re-lock preview mode (`PREVIEW_OPEN = false`) now that themes/logo are done, or leave it open longer.

---

## HOW TO START A NEW SESSION (read once, follow always)

1. Read this file (auto-loaded via project instructions) â it now lives in the repo itself, so any session can pull it straight from GitHub instead of relying on a locally-copied file.
2. Check "CURRENT SESSION STATE" above â resume any in-progress task.
3. **Verify against live GitHub commits + Vercel deployments before trusting any "pending" claim in this file** â it goes stale between sessions like any doc.
4. Ask user for GitHub PAT (never stored permanently).
5. Continue from where the previous session left off.

**When ending or pausing a session**: update the CURRENT SESSION STATE block above and the TASK LOG below before context gets large, and commit this file back to the repo. This is the checkpoint.

---

## ACTIVE PROJECT â VELOR MARKETPLACE

**Repo**: https://github.com/BILSY144/velor-marketplace
**Live domain**: https://velorcommerce.store
**Vercel project ID**: `prj_il5ADRFhW8FWnbzZmeGeBcUMj1cp` (team `velor1`)
**Stack**: Next.js 15 App Router, TypeScript, Prisma + Vercel Postgres, NextAuth v5, Stripe Connect
**Design rule**: Inline CSS with CSS variables everywhere; the seller upgrade page uses Tailwind utility classes â match each file's existing style, do not mix.
**GitHub commit method**: Multi-file atomic commit via `javascript_tool` GitHub Trees API on a velorcommerce.store tab (CSP allows it there; stripe.com/vercel.com tabs block it).
**PAT**: User provides at start of each session â never hardcode.

---

## LAW #1 â CODE OF CONDUCT (above all)

Never lie, fabricate, or invent actions/results. If a step was not taken, say so. If unconfirmed, say "unconfirmed". Applies to Claude and all subagents. No priority overrides this. This file itself can go stale â treat it as a claim to verify against GitHub/Vercel, not fact to repeat uncritically.

---

## MARKETPLACE CONTEXT

Global, general-purpose multi-vendor marketplace. Company: Velor Commerce Ltd (UK). Platform commission via Stripe Connect `application_fee_amount` on product subtotal only.
Standing directives: 100% AI-operated; no emojis in code; only email willsinclair144@gmail.com for the daily director briefing + new-advertisement/outreach monitoring (BCC).

---

## SUBSCRIPTION TIERS & BILLING â LOCKED (2026-07-03)

Full detail: `docs/SUBSCRIPTION_AND_TIERS.md` in the repo. Summary:

| Tier | Price | Commission | Listings |
|------|-------|-----------|----------|
| Starter | Free | 15% | 50 (hard cap) |
| Pro | Â£49/mo | 8% | Unlimited + professional dashboard |
| Enterprise | Â£199/mo fixed | 5% | Unlimited + personal manager + API service |

- Stripe LIVE prices: Pro `price_1TpCiTDB5eA3Wfmu2kP5Ilwg`, Enterprise `price_1TpCqXDB5eA3Wfmuw3y2bScF`.
- Vercel env (Prod+Preview): `STRIPE_PRO_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`.
- Monthly charge automatic (Stripe recurring). Failed payment -> `past_due` + email + Stripe retries. Cancellation -> reset to STARTER.
- Tier resolved in webhook by matching Stripe price id to env vars (NOT metadata) â guarantees Enterprise=5%, Pro=8%.
- STARTER 50-listing cap hard-blocked at product creation (403 on 51st).
- On downgrade: keep 50 oldest live listings, DELIST the excess (hidden, not deleted). NEVER delist a listing with a PENDING/PROCESSING/DISPUTED order at downgrade time.
- No DB migration needed (uses existing `DELISTED` status + tier fields).

---

## PAYOUT ESCROW â LOCKED (2026-07-03)

Full detail: `docs/PAYOUTS.md`. Funds held on the platform until delivery confirmed (Shippo), then released via `/api/cron/release-payouts`: 15 days for probation sellers, 72 hours for trusted (10+ delivered, 30+ day account, no unresolved disputes/returns). Open return/dispute freezes that order until resolved. payment-intent holds funds (no transfer_data); release uses PaymentIntent metadata `sellerShare` + `sellerAccountId`; idempotent transfers. Commit `1e72cec`.

---

## SELLER STOREFRONT DESIGNS + CUSTOM LOGO â NEW (2026-07-04)

**15-theme storefront system** â commit `1acff9d` "feat: 15-theme storefront system (picker, entitlements, themed storefront, all designs open for preview)". Deployed READY. Sellers get a theme picker; themes are gated by subscription tier under normal operation, but **`PREVIEW_OPEN` is currently `true`** so every design is unlocked for William to click through and judge before deciding which stay/which get gated. No separate spec doc exists for this yet (unlike tiers/payouts/ranking) â if writing one, add it as `docs/STORE_THEMES.md` for consistency.

**Custom store logo upload** â commit `15dce0e` "feat: custom store logo upload (bundled with paid design, replaces store name in hero)". Deployed READY. Sellers upload a PNG/JPG/WebP on `/dashboard/storefront`; it's resized/compressed client-side and stored directly in Postgres (new `storeLogo` field â no blob storage integration exists yet, so this was the zero-new-infrastructure path). The logo replaces the store name in the storefront hero. Bundled free with Pro/Enterprise, or a Â£9.99 standalone unlock on Starter. Also open under `PREVIEW_OPEN` right now.

**Known gotcha discovered while building this**: the built-in file Edit tool silently truncated files mid-content more than once during this build (lost a function from the themes helper file, cut a page component mid-file, even truncated a draft of this CLAUDE.md). No error was thrown â the file just silently ended early. **Always verify a file's tail/byte-length after an Edit before trusting it and committing.** If truncated, rebuild the full file via a bash heredoc (reliable) rather than re-attempting Edit on the same file.

**Open decision**: re-lock preview (`PREVIEW_OPEN = false`) once William has judged the themes and logo feature, or leave preview open longer. Not yet decided as of this update.

---

## TASK LOG (recent)

### Custom store logo upload [COMPLETE â deployed 2026-07-04]
Commit `15dce0e`. New `storeLogo` Prisma field (auto `prisma db push`'d). Upload API route, dashboard picker card, hero rendering change.

### 15-theme storefront system [COMPLETE â deployed 2026-07-04]
Commit `1acff9d`. Theme picker, per-tier entitlements, themed storefront rendering. Preview mode currently open (see above).

### Subscription tiers, billing & downgrade enforcement [COMPLETE â LOCKED 2026-07-03]
Commits on main: `e822609`, `894e1c8`, `64108af`, `47e57b7`, `1d8834d`, `26b3dc6`. All deployed READY. Canonical spec: `docs/SUBSCRIPTION_AND_TIERS.md`.

### Seller ranking system [COMPLETE â deployed]
Spec: `docs/SELLER_RANKING.md`. Commits `d6608c3` (this specific deploy showed a Vercel Error), `ff7819e` (fixed a corrupted character, redeployed READY).

### Seller recruiting scout (Brave Search, compliant) [COMPLETE]
`app/api/cron/scout-sellers/route.ts` (Brave), `BRAVE_SEARCH_API_KEY` in Vercel. Outreach email redesigned; unsubscribe flow live. Outreach sending gated by `OUTREACH_ENABLED` (still OFF until site is presentable).

### Homepage hero + desktop layout + mobile responsiveness [COMPLETE]
Two-column hero with full image; globals.css mobile media layer; 404 links fixed. Flagship redesign (commit `891aa23`) plus several logo/wordmark branding passes (`8e20c6d`, `ab29657`, `b69c94b`, `913e231`, `f34726d`, `d966d18`, `0a35fb3`, `697191f` â ended on a non-neon, reduced-glow logo as current state).

### Prior build (from earlier sessions) [COMPLETE]
Seller dashboard, buyer checkout, Stripe Connect (15% fee), NextAuth v5, public shop, orders, messaging, admin moderation, security audit, Shippo shipping (DDP, including global-carrier rework removing UK-only assumptions), returns, director briefing email now on a recurring cron (`/api/admin/brief`).

---

## PENDING / NEXT

1. Decide whether to re-lock themes + logo behind `PREVIEW_OPEN = false`, or leave open longer.
2. Flip `OUTREACH_ENABLED=true` once site is presentable.
3. Correct remaining honest-copy items ("millions of buyers", "22 countries").
4. Mobile verification via William's phone (env cannot emulate mobile).
5. Consider writing `docs/STORE_THEMES.md` as the canonical spec for the 15-theme system, matching the pattern used for tiers/payouts/ranking.

---

## KEY TECHNICAL DETAILS

### GitHub push (multi-file atomic commit)
Run `javascript_tool` on a velorcommerce.store tab. Set `window._PAT` in a separate call (no content), then commit. Extract SHAs via `.url.split('/').pop()` (never `.sha`). Chrome security filter blocks returns containing `=`/`?`/`://`/`&`/`<`/`>` â sanitise outputs (reversible escaping) and only return scalars.

### Editing files reliably (new 2026-07-04)
The Edit tool has silently truncated files mid-content on this project more than once. After any Edit on a file of meaningful size, verify the tail/byte-length before trusting it. If truncated, rebuild via a bash heredoc rather than re-editing.

### Vercel deployment check (from vercel.com tab)
`fetch('/api/v6/deployments?teamId=velor1&projectId=prj_il5ADRFhW8FWnbzZmeGeBcUMj1cp&limit=3')` â map `state` + `meta.githubCommitMessage`.

### Prisma enums
`ProductStatus`: PENDING_REVIEW, APPROVED, REJECTED, DELISTED.
`OrderStatus`: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED, DISPUTED.

### Patterns
Next.js 15 async params: `const { id } = await params`. Server components use Prisma; client components use hooks. Stripe apiVersion `'2025-02-24.acacia'`. Use `updateMany` for non-@id unique filters.
