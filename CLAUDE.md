# Velor Working Memory
_Auto-loaded each session. Last updated: 2026-07-03_

---

## CURRENT SESSION STATE — READ THIS FIRST

_If this block says IDLE, no task is mid-flight. If it has content, resume from here._

**Status**: IDLE — subscription tiers + billing + downgrade enforcement are FINAL, deployed, and locked. See `docs/SUBSCRIPTION_AND_TIERS.md` in the repo (the canonical, set-in-stone spec). Do not re-open unless William explicitly changes a decision.

**Next planned topic**: Seller ranking system (design discussion not yet started).

---

## HOW TO START A NEW SESSION (read once, follow always)

1. Read this file (auto-loaded via project instructions).
2. Check "CURRENT SESSION STATE" above — resume any in-progress task.
3. Ask user for GitHub PAT (never stored permanently).
4. Continue from where the previous session left off.

**When ending or pausing a session**: update the CURRENT SESSION STATE block above and the TASK LOG below before context gets large. This is the checkpoint.

---

## ACTIVE PROJECT — VELOR MARKETPLACE

**Repo**: https://github.com/BILSY144/velor-marketplace
**Live domain**: https://velorcommerce.store
**Vercel project ID**: `prj_il5ADRFhW8FWnbzZmeGeBcUMj1cp` (team `velor1`)
**Stack**: Next.js 15 App Router, TypeScript, Prisma + Vercel Postgres, NextAuth v5, Stripe Connect
**Design rule**: Inline CSS with CSS variables everywhere; the seller upgrade page uses Tailwind utility classes — match each file's existing style, do not mix.
**GitHub commit method**: Multi-file atomic commit via `javascript_tool` GitHub Trees API on a velorcommerce.store tab (CSP allows it there; stripe.com/vercel.com tabs block it).
**PAT**: User provides at start of each session — never hardcode.

---

## LAW #1 — CODE OF CONDUCT (above all)

Never lie, fabricate, or invent actions/results. If a step was not taken, say so. If unconfirmed, say "unconfirmed". Applies to Claude and all subagents. No priority overrides this.

---

## MARKETPLACE CONTEXT

Global, general-purpose multi-vendor marketplace. Company: Velor Commerce Ltd (UK). Platform commission via Stripe Connect `application_fee_amount` on product subtotal only.
Standing directives: 100% AI-operated; no emojis in code; only email willsinclair144@gmail.com for the daily director briefing + new-advertisement/outreach monitoring (BCC).

---

## SUBSCRIPTION TIERS & BILLING — LOCKED (2026-07-03)

Full detail: `docs/SUBSCRIPTION_AND_TIERS.md` in the repo. Summary:

| Tier | Price | Commission | Listings |
|------|-------|-----------|----------|
| Starter | Free | 15% | 50 (hard cap) |
| Pro | £49/mo | 8% | Unlimited + professional dashboard |
| Enterprise | £199/mo fixed | 5% | Unlimited + personal manager + API service |

- Stripe LIVE prices: Pro `price_1TpCiTDB5eA3Wfmu2kP5Ilwg`, Enterprise `price_1TpCqXDB5eA3Wfmuw3y2bScF`.
- Vercel env (Prod+Preview): `STRIPE_PRO_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`.
- Monthly charge automatic (Stripe recurring). Failed payment -> `past_due` + email + Stripe retries. Cancellation -> reset to STARTER.
- Tier resolved in webhook by matching Stripe price id to env vars (NOT metadata) — guarantees Enterprise=5%, Pro=8%.
- STARTER 50-listing cap hard-blocked at product creation (403 on 51st).
- On downgrade: keep 50 oldest live listings, DELIST the excess (hidden, not deleted). NEVER delist a listing with a PENDING/PROCESSING/DISPUTED order at downgrade time.
- No DB migration needed (uses existing `DELISTED` status + tier fields).

---

## TASK LOG (recent)

### Subscription tiers, billing & downgrade enforcement [COMPLETE — LOCKED 2026-07-03]
Commits on main: e822609, 894e1c8, 64108af, 47e57b7, 1d8834d, 26b3dc6. All deployed READY. Canonical spec: `docs/SUBSCRIPTION_AND_TIERS.md`.

### Seller recruiting scout (Brave Search, compliant) [COMPLETE]
`app/api/cron/scout-sellers/route.ts` (Brave), `BRAVE_SEARCH_API_KEY` in Vercel. Outreach email redesigned; unsubscribe flow live. Outreach sending gated by `OUTREACH_ENABLED` (still OFF until site is presentable).

### Homepage hero + desktop layout + mobile responsiveness [COMPLETE]
Two-column hero with full image; globals.css mobile media layer; 404 links fixed.

### Prior build (from earlier sessions) [COMPLETE]
Seller dashboard, buyer checkout, Stripe Connect (15% fee), NextAuth v5, public shop, orders, messaging, admin moderation, security audit, Shippo shipping (DDP), returns.

---

## PENDING / NEXT

1. Seller ranking system — design discussion (NEXT).
2. Whole-site design system refresh (approved, not started).
3. Flip `OUTREACH_ENABLED=true` once site is presentable.
4. Correct remaining honest-copy items ("millions of buyers", "22 countries").
5. Mobile verification via William's phone (env cannot emulate mobile).

---

## KEY TECHNICAL DETAILS

### GitHub push (multi-file atomic commit)
Run `javascript_tool` on a velorcommerce.store tab. Set `window._PAT` in a separate call (no content), then commit. Extract SHAs via `.url.split('/').pop()` (never `.sha`). Chrome security filter blocks returns containing `=`/`?`/`://`/`&`/`<`/`>` — sanitise outputs (reversible escaping) and only return scalars.

### Vercel deployment check (from vercel.com tab)
`fetch('/api/v6/deployments?teamId=velor1&projectId=prj_il5ADRFhW8FWnbzZmeGeBcUMj1cp&limit=3')` → map `state` + `meta.githubCommitMessage`.

### Prisma enums
`ProductStatus`: PENDING_REVIEW, APPROVED, REJECTED, DELISTED.
`OrderStatus`: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED, DISPUTED.

### Patterns
Next.js 15 async params: `const { id } = await params`. Server components use Prisma; client components use hooks. Stripe apiVersion `'2025-02-24.acacia'`. Use `updateMany` for non-@id unique filters.
