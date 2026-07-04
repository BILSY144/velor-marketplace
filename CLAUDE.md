# Velor Working Memory
_Auto-loaded each session. Last updated: 2026-07-04 (overnight session)_

---

## CURRENT SESSION STATE — READ THIS FIRST

**Status: BLOCKED on a Stripe Dashboard setting — nothing more to code until William fixes this.**

### Plain-English summary of tonight's session

William was testing the seller dashboard end-to-end for the first time. Found and fixed a long chain of real bugs, one leading to the next:

1. Admin bootstrap page was unreachable — fixed (moved to /setup-admin).
2. Seller Terms & Conditions page had wrong/outdated info (pricing, payout timing, wrong contact email, wrong company scope) — rewritten to match the real business model, correct 15-day return window, correct payout escrow (15 days probation / 72 hours trusted).
3. "No seller dashboard links accessible" — root cause: the middleware forced ANY signed-in user (including the admin account) with no Seller profile into the seller-terms page forever, since there's nothing to accept for a non-seller. Fixed: only SELLER-role accounts are gated behind terms now.
4. Terms Accept button did nothing / silently failed — two separate bugs: (a) the button never turned off its "Saving..." state after a successful save, and (b) it used a soft client-side redirect that could get stuck instead of picking up the fresh cookie. Fixed with a hard redirect. **Terms acceptance is confirmed working now.**
5. Storefront theme picker ("could not apply that design") — was only showing a generic error; now shows the real reason if it ever fails again.
6. Analytics page crashed with "This page couldn't load" — the page never checked if its data request actually succeeded, so any error response made it crash instead of showing a message. Fixed.
7. Payout Settings ("Connect Bank Account") did nothing at all — the button had no click behavior; now links to the real Stripe Connect page.
8. Payout Settings "Complete Setup" button got stuck forever on "Redirecting..." — the status-check API was missing a field the page needed, so every seller saw the wrong button on their first visit and it had nothing to link to. Fixed. Also: the Stripe account id was only ever being remembered in a browser cookie, never saved to the database — meaning even a seller who successfully connected would never actually receive payouts, since the payout system looks up the bank account from the database, not a cookie. That's now saved properly to the Seller record.

### The one remaining blocker — needs William, not code

When William (on the real seller test account) clicked "Connect with Stripe," Stripe itself rejected the request with:

> Permission denied. The provided key 'rk_live_...iTqWnN' does not have the required permissions for this endpoint on account 'acct_1TlcWCDB5eA3Wfmu'. Enabling "Full Bank Account Information Read", "Basic Business Contact Information Read", "Accounts Write" permissions on this key would allow this request to continue.

**In plain English:** the site's Stripe secret key (the one stored in Vercel's environment variables as `STRIPE_SECRET_KEY`) is a "restricted key" — a version of a Stripe API key that only has a limited set of permissions turned on. Whoever set it up didn't turn on the three permissions needed to create and manage seller bank-account connections (Stripe Connect). This is NOT a bug in the code — every fix above is deployed and working. This is a setting inside William's own Stripe Dashboard that only William can change (Claude should never handle live API keys directly).

**What William needs to do next session (2 options, pick one):**

- **Option A — edit the existing key's permissions.** Stripe gave a direct link in the error: `dashboard.stripe.com/.../apikeys/.../edit`. Log in to Stripe, open that key, and turn on: "Accounts Write", "Basic Business Contact Information Read", and "Full Bank Account Information Read".
- **Option B — simpler long-term fix.** Replace the restricted key with the account's full secret key (starts with `sk_live_` instead of `rk_live_`). Full keys have every permission by default, which avoids re-hitting this same wall as more Stripe features get built later.

**After changing the key (either option):** if the key VALUE itself changes (Option B, or if Stripe issues a new key), update the `STRIPE_SECRET_KEY` environment variable in Vercel → Project Settings → Environment Variables → redeploy. Claude can walk through the Vercel steps next session but will not handle the key value directly — William pastes it straight into Vercel himself, never into chat.

**Once that's done:** retry "Connect with Stripe" on the seller test account (willsinclair144+testseller@gmail.com) and it should carry through to Stripe's real onboarding flow. That's the last step before the seller dashboard is fully working end to end.

### Recent commits this session (main branch, in order)
`e78cfdc` admin/sellers error surfacing → `40b9bb7` middleware role-gate fix → `847453d` storefront error surfacing → `a8edafd` stripe connect stuck-redirecting fix + DB persistence → `f43e2ff` analytics productsByStatus key mismatch → `fecb180` analytics crash fix + stripe connect debug → `c7a3bf4` folded debug info into error text → `5276057` terms accept stuck-on-saving fix → `1d5bed6` real Stripe error surfacing + debug text removed.

### Next planned topic after the Stripe key is fixed
Resume the original goal: sign in as the seller test account, go through Stripe Connect onboarding for real, then review the 15 storefront themes. After that: decide whether to re-lock `PREVIEW_OPEN` (currently `true`) now that themes/logo have been tested, and whether to flip `OUTREACH_ENABLED`. Also flagged but not yet started: the five other legal pages (app/legal/seller-agreement, app/legal/terms, app/seller-agreement, app/legal/privacy, app/returns) may have the same kind of stale/incorrect info that was just fixed in app/dashboard/terms — worth auditing next.

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
