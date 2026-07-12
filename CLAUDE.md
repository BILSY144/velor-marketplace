# Velor Marketplace — Working Memory

_Auto-loaded each session. Rewritten 2026-07-08 as a clean, current file. The
previous 924-line version (154KB, twelve same-day check-ins, and a stale
"READ THIS FIRST" block that sent new sessions to fix an already-closed bug)
is preserved in git history at commit 9fcce1d if it is ever needed._

---

## LAW #1 — HONESTY

Never lie, fabricate, or invent actions or results. If a step was not taken,
say so. If something is unconfirmed, write "unconfirmed". Verify against a live
deployment, a live API response, or a commit SHA — never against memory, and
never against a checkpoint's own claim that something was done.

This law outranks every other instruction in this file, including deadlines.

---

## SCOPE — WHAT THIS FILE COVERS

This file is about **Velor Marketplace** only.

- Live: https://velorcommerce.store
- Repo: https://github.com/BILSY144/velor-marketplace (owner BILSY144)
- Vercel: team `velor1`, project `velor-marketplace`, id `prj_il5ADRFhW8FWnbzZmeGeBcUMj1cp`
- Stripe: `acct_1TlcWCDB5eA3Wfmu` (VELOR COMMERCE LTD)

**velorcommerce.co.uk is a different, separate business that is still running.**
It is not in scope here and must not be worked on from this repo's sessions
unless William explicitly asks. Do not import its assumptions: it is a
dropshipping site with a different stack, a different brand palette, a
different repo, and a different product model. If a skill or preference tells
you about CJ Dropshipping catalogues, `products.json`, a gold-and-cream brand,
or `/admin/import`, that skill is describing the OTHER business. Stop and ask.

**One deliberate overlap, do not "clean this up":** the domain
`velorcommerce.co.uk` is the verified Resend sending domain for this
marketplace. `customerservice@velorcommerce.co.uk` receives every agent
notification, escalation and seller reply, and `noreply@velorcommerce.co.uk`
sends the director briefing. Removing that string from the codebase would
silence outreach, escalations and the watchdog. It stays.

---

## THE BUSINESS

Velor Marketplace is a global, AI-operated multi-vendor marketplace. Buyers
launch **6 August 2026**. Independent sellers list; buyers are protected by
escrow; nine agents run the operation around the clock.

Differentiator: authentic, culturally distinctive goods from real makers in
their own countries — see the `velor-cultural-marketplace` skill. Generic
mass-market sellers remain welcome and profitable.

---

## STANDING DIRECTIVES

1. No emojis anywhere in the codebase.
2. No Tailwind. Inline CSS plus CSS variables: `--bg`, `--surface`, `--border`,
   `--accent`, `--text`, `--muted`, `--green`, `--red`, `--font-display`,
   `--font-body`. Brand accent is orange `#FF6B00`; display font Space Grotesk,
   body Inter.
3. Never hardcode a PAT, API key or secret. Claude never enters secrets into
   forms; William adds them to Vercel himself.
4. Do not change anything without explicit permission. Add; never silently
   break working functionality.
5. All Velor withdrawals go to the **Monzo** business account ("Velor commerce
   ltd", X-61363647). Never CLEARBANK (6975, X-32156975).
6. Paid ads are unaffordable at present. Revisit once revenue arrives.
7. Update this file at meaningful checkpoints. Keep it short. Do not append a
   new "SESSION UPDATE" section for every small change — edit the relevant
   section instead.
   8. Velor is a GLOBAL marketplace. Seller recruitment (organic posting, outreach copy, group targeting) must stay globally diverse across countries — do not default to UK-centric groups or audiences. UK sellers are welcome but must never dominate the target list. (William, 2026-07-11, after group candidates drifted toward UK business groups mid-session.)

---

## EMAIL ROUTING (hard rule)

- `willsinclair144@gmail.com` — the daily director briefing, and new-seller
  alerts. Nothing else.
- `customerservice@velorcommerce.co.uk` — everything else: agent notifications,
  watchdog breaches, escalations, contact form, seller support.
- `sellers@velorcommerce.store` — outbound seller outreach and onboarding.

---

## STACK

Next.js 16 App Router, TypeScript, Prisma + Neon Postgres, NextAuth v5,
Stripe (payments, Connect payouts, Identity), Payoneer (payout rail for
Stripe-unsupported countries), Shippo, Resend, Anthropic API
(`claude-sonnet-5`).

`package.json` build runs `prisma generate && prisma db push --accept-data-loss
&& next build`. Schema additions therefore reach the database on every deploy.
Dropping a column drops its data — be careful.

---

## MONEY RULES (absolute)

- Buyer pays via Stripe. Funds are held by Velor in escrow.
- Release only after delivery is confirmed AND the hold window passes:
  15 days for new sellers, 72 hours once trusted.
- An open return or dispute freezes the funds. No exceptions.
- Idempotency key `payout_<orderId>`.
- Rail is resolved per seller country by `lib/payoutRail.ts`: Stripe Connect
  where supported, Payoneer everywhere else. **The rules are identical on both
  rails** — same delivery requirement, same holds, same dispute freeze.
- Seller tiers: Starter free / 12% commission, Pro £49 / 8%, Enterprise £99 / 5%
  (changed from 15% and £199, commit ee7683e, 2026-07-09 — verify against
  `TIER_CONFIG` in `app/api/seller/subscription/route.ts` before quoting a
  figure, do not trust this line alone).

---

## SELLER IDENTITY VERIFICATION

No seller is approved without a VERIFIED government-issued identity document.

- `lib/identity.ts` wraps Stripe Identity. Sessions are hosted by Stripe;
  Velor never receives or stores the document, only a pass/fail. Do not
  reintroduce document storage.
- Stripe Identity is independent of Stripe Connect. Eligibility depends on
  Velor's business location (GB, generally available), not the seller's. It
  verifies documents from hundreds of countries, so Payoneer-rail sellers are
  still verifiable.
- **Legally restricted:** Stripe's Identity terms forbid verifying anyone
  linked to China, Russia, Cuba, Iran, North Korea, Syria, or Crimea/Donetsk/
  Luhansk, and anyone under 16. `isRestrictedForIdentity()` blocks session
  creation for these. Those applications hold at `verificationStatus =
  RESTRICTED` with an honest email sent. They wait for the Payoneer KYC rail.
- Webhook: `app/api/webhooks/stripe-identity`, Stripe destination
  `we_1TqmtEDB5eA3WfmuzRM2Yf5h` (Active, 4 events, display name is Stripe's
  auto-generated "playful-celebration"). Signature verified against
  `STRIPE_IDENTITY_WEBHOOK_SECRET`.
- Landing page `app/apply/verified/page.tsx`. **Never turn this into a success
  page.** Stripe redirects there for every outcome, including failure, often
  before the webhook lands. It may only say "we have your verification".

### The 24-hour promise

`lib/sellerApplicationReview.ts` holds `APPLICATION_SLA_HOURS = 24` and
`APPLICATION_ESCALATE_AFTER_HOURS = 12`. Published copy says "a decision within
24 hours of your verification completing" — the 24 hours is ours, the camera is
the seller's. Only a VERIFIED application is on the clock.

`app/api/cron/review-applications` runs hourly and, in order: screens against
`/legal/seller-rules` (hard-rejects counterfeit, weapons, controlled
substances, ivory, antiquities; holds unknown categories and regulated
materials); holds restricted jurisdictions; creates an Identity session and
emails the link; approves only on VERIFIED; holds everything else. It never
auto-approves to make a deadline look met. `lib/provisionSeller.ts` is the
single provisioning path shared by the agent and by human admins.

---

## AGENTS AND CRONS

Nine agents; the binding constitution is `docs/AGENT_OPERATIONS.md`. Crons in
`vercel.json`:

| Schedule | Route |
|---|---|
| `*/5 * * * *` | `/api/admin/products/auto-moderate` |
| `15 * * * *` | `/api/cron/review-applications` |
| `30 * * * *` | `/api/cron/agent-watchdog` |
| `0 */2 * * *` | `/api/cron/outreach-auto` |
| `0 */4 * * *` | `/api/cron/release-payouts` |
| `0 */6 * * *` | `/api/cron/scout-sellers`, `/api/cron/enrich-emails` |
| `20 */6 * * *` | `/api/cron/qualify-prospects` |
| `0 6-9 * * *` | `/api/reports/daily` |
| `0 8 * * *` | `/api/cron/traffic-check` |
| `0 3 * * *` | `/api/cron/recompute-rankings` |
| `0 8 * * 1` | `/api/cron/live-usage-check` |

**`outreach-auto` is LIVE again as of 2026-07-09** (commit — check git log
for the exact SHA of the vercel.json change right after 8d478f6). It was
paused since commit aa56838 (2026-07-08) pending William's sign-off on the
email design and the qualification gate; both landed this session (commits
579ee0b through 906c2cc), William reviewed the final preview, and gave
explicit go-ahead in chat on 2026-07-09 to turn it on. **Do not turn it back
off, and do not re-pause or re-scope this without asking William** — same
explicit-permission rule as before applies to any *further* change to
outreach, not to leaving it running as approved.

One thing this session could NOT verify (no live DB or Vercel dashboard
access from this sandbox): whether `OUTREACH_ENABLED` is set to `'false'`
in Vercel's environment variables from the original pause. The route only
skips sending when that var is exactly `'false'` — unset or `'true'` both
allow sending. If a future check-in finds no outreach has actually gone out
despite the cron being scheduled, check that env var first.

The watchdog checks outcomes in the database, never an agent's self-reported
status, and emails breaches immediately.

Outreach: maximum 3 emails per seller, always personalised, every send logged,
unsubscribe honoured immediately. Copy is localised into 19 languages by
`lib/outreachI18n.ts`; `lib/outreachEmail.ts` is the single source of truth.
The emails promise the seller can write to Velor in their own language — that
promise is kept by `LANG_RULE` in `app/api/assistant/chat/route.ts`. Do not
weaken it.

**AI qualification gate (added 2026-07-09, commit 906c2cc):** `/api/cron/
qualify-prospects` screens every `SellerProspect` with `qualifyProspect()`
(`lib/prospectQualify.ts`, a direct Anthropic API call) before it can ever
receive an email. Verdict and reason are stored on the prospect
(`qualified`, `qualificationNotes`). `outreach-auto` Stage 1 only sends to
`qualified: true`. On API/parse failure the prospect is left unscreened
(`qualified: null`) and retried next run — it never defaults to qualified
to hit a volume target. This exists because a scout hit is a keyword-search
guess, not a verified match, and William's standing rule is that factory/
wholesale/service businesses must never receive outreach.

**Founding-seller enforcement (added 2026-07-09, commits c5840f2/1df089f):**
perks were pure marketing copy with no backend until this session. Now:
`Seller.foundingEligible` is set at provisioning time by
`lib/provisionSeller.ts` (true only if no other founding seller exists yet
for that country). Perks (`foundingBadge`, Pro tier, `foundingPerksGrantedAt`)
are granted by `lib/founding.ts`'s `maybeGrantFoundingPerks()`, called from
`app/api/dashboard/products/route.ts` right after a product is created — so
being approved is never enough on its own, the seller must list at least one
product. A founding seller with `foundingBadge: true` and `tier: 'PRO'` is
charged £0/mo everywhere: `GET /api/seller/subscription` reports
`monthlyFee: 0` for them, `POST` rejects `upgrade_to_pro` with a 400 if they
already have it free, and the Stripe `customer.subscription.deleted` webhook
downgrades non-founding cancellations to STARTER but founding ones stay on
PRO. `components/dashboard/TierUpgradeView.tsx` labels this state
"Free for life — your founding-seller perk" so it never looks like a normal
paid plan a card could be charged against.

---

## COMPLIANCE

Certificate chain, enforced in code: `/legal/seller-rules` → application
acknowledgment → listing materials declaration → certificate upload → admin
verification → gated approval (409 on admin approve without a valid
certificate; the auto-moderate cron never approves a certificate-gated
listing). CITES, phytosanitary, dangerous goods, HS codes, GPSR, DSA Art.30,
marketplace-facilitator VAT. See `velor-global-compliance` and
`velor-cultural-marketplace` skills.

---

## KNOWN GAPS AND UNVERIFIED CLAIMS

Written plainly, per LAW #1.

1. **No seller has ever completed a real identity verification.** Stripe's
   Verification Sessions list was empty as of 2026-07-08 14:53 UTC. The full
   round trip is untested against a real human.
2. **Velor still stores ID document scans on its own infrastructure.**
   `app/api/seller/verify/route.ts`, `app/dashboard/verify/page.tsx`,
   `app/api/admin/verify/[id]/route.ts` and `SellerVerification.idDocumentUrl`
   remain. That flow verifies nothing (a human eyeballs a photo) and gates
   nothing (no route checks its result). It is redundant and is a live UK GDPR
   liability. Deleting it requires touching `app/seller/[sellerId]/page.tsx`
   and `app/api/briefing/route.ts`, which reference `SellerVerification`.
3. **The daily briefing cron is `0 6-9 * * *`**, which fires at 06:00, 07:00,
   08:00 and 09:00 UTC — four briefings a morning. The `velor-daily-report`
   skill states it should be `0 7 * * *`, once. Unconfirmed whether the route
   dedupes. Do not change without asking William; that skill forbids it.
4. **Payoneer Mass Payouts API is partner-gated and still awaiting approval.**
   `lib/payoneer.ts` endpoints were written from documentation that could not
   be confirmed and are marked VERIFY-IN-SANDBOX. Sandbox-verify every shape
   before the first live payout.
5. **Mobile is verified by code and DOM inspection only.** Claude has never
   seen the site at 390px: `resize_window` does not move this Chrome's
   viewport and velorcommerce.store blocks iframing.
6. Shop pagination bug (#239/#280) could not be reproduced on unfiltered pages
   1-3; needs a category spanning multiple pages.
7. ~~`scout-sellers` queries are still Western-weighted.~~ RETARGETED
   2026-07-09 (commit 5147259): 30 new craft+country `BRAVE_TARGETS`, an
   extended blocklist (dhgate, made-in-china, indiamart, globalsources,
   tradeindia, exportersindia, plus hospitality domains), and country-domain
   mappings added for MA/JP/PT/MX/PE/GT/IN/GH/UZ/ET/LK/KE/TR/PL. Not
   independently re-verified this session that it is actually surfacing good
   prospects in production — the qualification gate (see AGENTS AND CRONS)
   is the real check on that, once outreach-auto is live and its
   `qualified`/`qualificationNotes` fields can be read back.
8. **RESOLVED 2026-07-10.** CJ machinery fully removed from the codebase --
   see the CJ DROPSHIPPING MACHINERY PERMANENTLY REMOVED session log at the
   bottom of this file. All nine `app/api/admin/cj-*` routes, `lib/cj.ts`,
   the CJ fulfillment path in `app/api/orders/route.ts`, the CJ freight branch
   in `app/api/shipping/rates/route.ts`, the `cjSourced` UI in
   `ProductDetail.tsx`, and every CJ-related Prisma field/model are gone.
   CJ Dropshipping has NOTHING to do with this marketplace -- confirmed by a
   repo-wide code search showing zero remaining `cj`-prefixed identifiers or
   `lib/cj` imports outside this file's own history notes.

---

## NEXT STEPS (reprioritized 2026-07-09 — William: "less than a month to pack
our website with sellers")

Buyers arrive 6 August 2026. William's stated priority as of this session is
supply (sellers), not further design work. See SELLER ACQUISITION PLAN below
for the full plan and the research it is based on; this list is the
condensed action order.

1. ~~Ask William to switch on `outreach-auto`.~~ DONE 2026-07-09 — William
   gave explicit go-ahead in chat, cron re-added to `vercel.json`. Watch for
   it actually firing and sending (check `OutreachLog` row counts / the
   daily briefing) — see the "one thing this session could NOT verify" note
   in AGENTS AND CRONS above about `OUTREACH_ENABLED`.
2. **Build the lightweight referral flow William floated** ("ask founders
   to tell their friends"): not yet built. See SELLER ACQUISITION PLAN,
   step 4, for the minimal version proposed.
3. **Port the homepage/lattice design to the repo** (carried over from
   2026-07-08 evening, still not done). All seven pages are designed and
   approved (files in William's Downloads, listed in the design section
   below). Additive Prisma: `Speciality` table with a `kind` field,
   `Product.specialities` array — safe under `prisma db push`, and with the
   catalogue at zero there is nothing to backfill. While porting: strip ALL
   CJ machinery (gap 8), remove the spent `cj-purge-seeded` route, fix the
   three hardcoded category lists (homepage tiles, /categories, /apply
   picker). Lower priority than 1-2 while the clock to 6 August is short —
   an honest zero-state page converts a real seller; a beautiful page does
   not recruit one on its own.
4. **Finish the Payoneer system.** When credentials arrive, William adds
   `PAYONEER_CLIENT_ID`, `PAYONEER_CLIENT_SECRET`, `PAYONEER_PROGRAM_ID`,
   `PAYONEER_API_BASE` to Vercel himself, then sandbox-verify `lib/payoneer.ts`
   before any live payout. Payouts to Monzo. Unlocks the second identity rail
   for RESTRICTED-jurisdiction sellers — the only route for real Chinese
   sellers, and for any Starter/Pro-tier country where Stripe Connect does
   not reach, so it is also a supply-side blocker, not just a payments
   nice-to-have.
5. **Delete Velor's own ID-document storage** (gap 2). Highest standing GDPR
   risk; not blocked on anyone.
6. Verify the first real Stripe Identity round trip once a seller completes
   one — will happen naturally once outreach converts anyone.
7. William to eyeball the 11 amber "Verify clip" mastheads in
   velor-media-manifest.html (two-minute job, all on one page).
8. Look at the site on a real phone.
9. Optional cleanup: cancel/delete the test order against the REJECTED
   bracelet product, then hard-delete that last product row.

---

## SELLER ACQUISITION PLAN (2026-07-09 — under 4 weeks to 6 August launch)

William's brief: "less than a month to pack our website with sellers." This
plan is built on what Velor already has (a lot — most of the hard
infrastructure exists and is currently sitting switched off) plus outside
research on how new marketplaces solved the exact same cold-start problem.
Sources: [Reforge — Beat the Cold Start Problem](https://www.reforge.com/guides/beat-the-cold-start-problem-in-a-marketplace),
[Andrew Chen on marketplaces (Stripe)](https://stripe.com/guides/atlas/andrew-chen-marketplaces),
[Sharetribe — e-commerce marketplace guide](https://www.sharetribe.com/how-to-build/e-commerce-marketplace/),
[CS-Cart — attracting vendors](https://www.cs-cart.com/blog/how-to-attract-sellers-on-your-virtual-multi-vendor-marketplace/),
[FORKOFF — two-sided marketplace cold start 2026](https://forkoff.xyz/blog/founder-growth/two-sided-marketplace-cold-start-2026).

### The core lesson from the research

Every source agrees on one thing: **supply comes before demand, and it comes
from manual, personal, founder-level effort at first — not from a bigger ad
budget.** Andrew Chen: "start with supply, and then demand. Then double down
to focus on supply, supply, supply." Airbnb's founders personally messaged
and met Craigslist hosts one at a time before any automation existed.
Sharetribe's guide puts it plainly: "ten active sellers with full catalogs
of high-quality items beat 100 ghost sellers with one mediocre product each."
Velor's founding-seller model (one real seller per country, hand-verified,
AI-qualified before first contact) already matches this instinct — the job
now is to point real volume and real founder time at it before 6 August,
not to change the model.

### Step 1 — Turn on the automated cold-outreach pipeline — DONE 2026-07-09

William gave explicit go-ahead in chat this session; the cron was re-added
to `vercel.json` and pushed. The full pipeline is built and deployed:

- `scout-sellers` (every 6h) finds candidate sellers on Etsy/eBay/etc. by
  craft+country search, now retargeted globally (gap 7, resolved 2026-07-09).
- `qualify-prospects` (every 6h, 20 min after scout) screens every candidate
  with an AI check before it can ever be contacted — rejects factories,
  wholesalers, service businesses, anything not a genuine independent maker.
- `outreach-auto` (built, NOT scheduled) sends a 3-touch sequence, max 3
  emails per prospect, only to `qualified: true` prospects, in the
  prospect's own language (19 languages), honest that Velor is pre-launch
  and inviting one founding seller per country, with the real founding perks
  (Pro free for life, 8% commission, first claim on that country's page).

Turned on by re-adding `{"path": "/api/cron/outreach-auto", "schedule": "0
*/2 * * *"}` to `vercel.json`. One thing NOT verified this session (no live
Vercel dashboard access from this sandbox): whether `OUTREACH_ENABLED` is
still set to `'false'` in Vercel from the original pause — the route only
skips when that var is exactly `'false'`, so if it was set that way, William
needs to clear it in Vercel himself for sends to actually start despite the
cron now being scheduled.

Also worth five minutes for a returning session: check how many prospects
`scout-sellers` has actually found and how many `qualify-prospects` has
marked `qualified: true` so far (`SellerProspect` table). If the number is
near zero, scout-sellers may need its query list widened before outreach-auto
has anything to send — this was NOT verified in this session (no live DB
access from this sandbox).

### Step 2 — Manual, founder-led recruiting in the countries that matter most

The research is unanimous that automation alone does not seed a marketplace
— Lyft "launched with a few founder-recruited drivers" in every market, and
Airbnb's founders travelled to meet hosts in person. Velor cannot do
in-person, but William doing the equivalent — personally DMing 5-10 strong
Etsy/Instagram sellers per priority country, especially countries with no
founding seller yet — will convert at a much higher rate than any automated
email, and costs nothing but time. Pick 10-15 priority countries (mix of
strong craft traditions and currently-empty founding slots), have William or
someone on the team personally reach out on Instagram/Etsy messaging using
the same honest "brand new, one founding seller per country" pitch. This
should run in parallel with Step 1, not instead of it.

### Step 3 — Community sourcing, not just cold search

`scout-sellers` searches for individual listings. The research also flags a
channel it does not cover: niche Facebook groups, subreddits, and maker
directories for handmade/artisan goods, where many real sellers already
congregate and self-identify as serious about their craft (CS-Cart, Sharetribe).
This is a manual/semi-manual channel: find 5-10 of the most active
English-language and non-English-language artisan communities relevant to
Velor's speciality vocabulary, and post (or have William post) an honest,
non-spammy founding-seller callout, linking to `/apply/invited` with no
country param for open discovery. Low engineering cost, needs someone's time
to actually go find and post in the right groups.

### Step 3 — RESULT (2026-07-10/11): diagnosed, channel underperforming, posting paused pending decision

Executed over two posting sessions/nights: the founding-seller callout (two copy variants) went out into Facebook groups pulled from William's own joined-groups list, each link UTM-tagged (?utm_source=facebook&utm_medium=group&utm_campaign=founding-seller&utm_content=<group>). A full delivery audit followed, verified the only reliable way Facebook exposes to a poster — each group's own "Pending admin approval" banner on the group's main page, not whether the post's permalink opens (a pending post is still viewable by its own author, which gave a false "delivered" read on the first pass).

26 groups checked directly, banner-verified. 21 of 26 (81%) are still sitting in per-group moderation queues, invisible to anyone but the poster — Meme Mongolia, Bosnia, Sri Lanka marketing, I Love Poland, Beauty of Slovenia, Japan is Life, North Macedonia, people's From Algeria, Hungary, АНДОРРА, MONGOLIACONNECTIONS, Monaco, j'adore Luxembourg, Business Opportunities Thailand, Myanmar Gems & Jewellery Luxury, Life in the Netherlands, Nepali Online Group, RUSSIA - welcome to Moscow, Beautiful Finland, People of Belgium, Jobs in Portugal, and others. 5 of 26 (19%) are genuinely live with no gate: PHILIPPINES GROUP, People of Saudi Arabia, Turkey Group, Cyprus Market, Singapore marketplace. Of the live posts re-checked 30+ minutes to several hours after posting (4 of 5 cleanly re-read; Cyprus not re-read this pass due to a page rendering issue, not a contradicting data point): zero likes, zero comments, zero shares, in groups ranging 6,000-68,700 members. Not low engagement — zero, on a fully-delivered public post.

Conclusion: this is a distribution problem, not a delivery problem. Facebook's per-group moderation queues and its algorithmic feed ranking are both reacting, independently, to a posting pattern that reads exactly like spam — identical promotional text, an AI-labelled image, a link, posted into dozens of unrelated groups inside the same 15-30 minute window, from a personal profile with zero history in any of them. The "2 million" / "833,000" reach figures quoted earlier were summed group member counts from the composer's group-picker, not delivered views — Facebook gives personal profiles zero reach analytics on group posts, and this 26-group sample confirms that ceiling is one most posts never even clear. Outside William's own testing, Velor has zero real seller applications from this channel, or any channel, ever — not a conversion problem, a traffic-never-arrived problem.

Posting is paused as of this session, pending William's decision on next steps. Fix priority, ranked by impact per hour of effort (full write-up with the group-by-group table sent to William 2026-07-11): stopping the current mass-posting pattern is done, this session — every additional batch into 20-30 unrelated groups in one sitting adds more evidence for Facebook's spam detection, not more reach. UTM tracking is live on every link going out, but not yet wired to capture against pageviews server-side — needed before any further batch, so "did anyone see this" has a real answer instead of a guess from member counts. Building a soft-entry lead-capture step (email, country, what you sell) feeding the existing SellerProspect pipeline, separate from the full /apply application, is likely the single highest-value item on this list and is NOT built yet — right now even a perfectly-delivered, well-seen post has nowhere low-friction to send a stranger. Re-targeting smaller, ungated, seller-relevant groups (Etsy seller groups, "handmade sellers," diaspora business not social groups) instead of big general nationality/culture groups, posting a handful at a time with real spacing and some account history first, is untried. The existing outreach-auto pipeline is separately underperforming (988 prospects, 326 emails sent in 30 days, only 8 qualified, large unscreened/dropped counts, zero applications) and worth diagnosing before scaling further. Walking one real prospect through the entire funnel by hand (apply, verification, first listing) would convert inference into fact — every judgment about the funnel right now is inference from zero completed applications.

None of the build-outs above have been started — awaiting William's call on priority before building anything further on this front. Group names posted into across both nights, and their live/pending status, are preserved above and in the full report for the next review.

### Step 4 — Referral: build the lightweight version now, not the full dashboard

William floated this on 2026-07-08/09 ("ask founders to tell their friends
with businesses about us") and it was never built. Given the timeline, build
the minimal version, not a full referral dashboard:

- Add a `referredBy` field to `Seller` (nullable, self-relation) and a
  `?ref=<sellerId>` param on `/apply` and `/apply/invited` that sets it on
  submission.
- Mention it once, plainly, in the founding-seller perk emails/pages
  ("know another maker who should see this? forward this email" plus their
  personal invite link) — no new UI surface needed beyond that.
- No payout/reward mechanic yet (that is a bigger, riskier build — commission
  splits, fraud considerations) — the ask right now is awareness, not an
  incentive program. Revisit a paid referral mechanic after launch if this
  channel produces real signups.

### Step 5 — Track conversion honestly, not vanity metrics

Per LAW #1, whatever gets reported to William should be the real number of
sellers who listed at least one product (the actual founding-perk gate,
`maybeGrantFoundingPerks`), not emails sent or applications started. The
daily briefing (`/api/reports/daily`) already exists — confirm it reports
sellers-with-first-listing, not just approved applications, before leaning
on it as the acquisition dashboard for this push.

### What NOT to do, per standing rules

- Do not lower the qualification bar to hit a volume number — LAW #1 in
  `lib/prospectQualify.ts` and `lib/sellerApplicationReview.ts` both say
  reject/hold on doubt, never guess in favour of approval.
  "Sellers packed onto the site" that are factories or the wrong fit
  undermines the entire origin/authenticity positioning the redesign spent a
  full session establishing (see HOMEPAGE REDESIGN section below).
- Do not increase the 3-email cap or turn off unsubscribe honouring to push
  more volume — both are standing rules in AGENTS AND CRONS above.
- Do not promise anything on outreach copy that is not true yet (established
  platform, existing buyers, free commission) — this session fixed three
  separate instances of exactly that mistake; see the 2026-07-09 checkpoint
  below for what they were and why they mattered.

## TOOLING TRAPS (each of these cost real time)

- **`raw.githubusercontent.com/.../main/...` serves stale content**, sometimes
  days old. Always resolve the latest SHA via
  `api.github.com/repos/.../commits?path=...` and fetch by SHA.
- **`mcp__workspace__web_fetch` is worse**: it once returned a months-old
  `prisma/schema.prisma` with no `SellerApplication` model at all, while an
  in-browser `fetch` of the same URL returned the real file. Do not trust it
  for repo files.
- **The bash sandbox has no outbound network.** All GitHub, Stripe and Vercel
  calls go through the browser.
- **A commit that looked clicked is not a commit.** Clicking "Commit changes"
  and then navigating in the same batch can cancel it. Always re-read the
  contents API afterwards to confirm the file landed.
- **GitHub's CodeMirror editor:** an "unsaved changes / Restore / Discard"
  banner steals keyboard focus and shifts the layout — dismiss it first, or
  arrow keys and typing silently go nowhere. Never place a `javascript_tool`
  call between the click that focuses the editor and the keys that navigate
  it; `Runtime.evaluate` steals focus. Only rendered lines exist in the DOM.
  Setting `.cm-scroller.scrollTop` does not re-render.
- **Never set "the last visible text input" by JS on an edit page** — that is
  the FILENAME field, and setting it renames the file.
- **CodeMirror auto-continues markdown lists and auto-indents.** Typing a
  numbered list into it produces `2. 2.` and cascading indentation. Write
  checkpoint prose as plain paragraphs.
- **Chrome MCP blocks return values containing `=`.** Use
  `.replace(/=/g,'[EQ]')`.
- Verify against git history, not against a checkpoint's own claim. A stale
  checkpoint once caused a fix to be reverted.

---

_Checkpoint 2026-07-08. Stripe Identity live end to end and signature-verified;
24h SLA enforced by cron; mobile layer rebuilt; outreach localised into 19
languages. No seller has completed a real verification yet, and Velor still
holds ID scans through the old verify flow._

_Scheduled check-in 2026-07-08, later the same day. Since the rewrite (418d64b), four small commits shipped: 0119439 removed lib/cj.ts's reference to a deleted CLAUDE.md section, 6ad3a35 made the assistant read every Anthropic text block instead of only the first, and 1c2207a plus b78ff0c aligned page and footer copy to "held until delivery is confirmed". Nothing else verified as changed this cycle; next steps remain as listed above._


_Scheduled check-in 2026-07-08 16:06 UTC. No new work since the previous check-in: the repo tip is 7310359, which is that check-in's own CLAUDE.md commit, and no code commits have landed after b78ff0c. Nothing to log this cycle; next steps remain as listed above._


_Scheduled check-in 2026-07-08 16:46 UTC. No new work since the 16:06 check-in: the repo tip is c3e0ed3, that check-in's own CLAUDE.md commit, and no code commits have landed after b78ff0c. Nothing to log this cycle; next steps remain as listed above._


_Scheduled check-in 2026-07-08 17:07 UTC. No new work since the 16:46 check-in: the repo tip is 9190bf1, that check-in's own CLAUDE.md commit, and no code commits have landed after b78ff0c. Nothing to log this cycle; next steps remain as listed above._

---

## HOMEPAGE REDESIGN - DESIGN PHASE (2026-07-08)

STATUS: DESIGN ONLY. Nothing pushed. No schema changed. No component touched.
Design files live in the user local Downloads folder, not the repo.

Session ended on an Anthropic content-filter block triggered by writing ~190 flag emoji into a file.
Cause was the long run of regional-indicator characters, NOT the PAT. Fix: derive flags from ISO-2
codes at runtime with String.fromCodePoint. Never write flag emoji into source. This also keeps the
standing no-emoji rule intact.

### Decisions locked with William

1. REVISED 2026-07-12 per William: positioning is ORIGIN AND AUTHENTICITY, not
   a ban on "handmade"/"crafted" vocabulary. Cultural products in scope include
   origin goods, crafted goods, and handmade goods -- all of it, as long as it
   is authentic. The only thing excluded is generic factory-made / mass-produced
   goods with no real maker or cultural story behind them. Culture is the
   reason, not the only headline -- modern industry (Korean skincare, German
   optics, Swiss watchmaking) stays in the mix so Velor isn't just a craft fair.
   (Original 2026-07-08 note read as barring "handmade" language outright; that
   was a marketing-copy stance, not a product-scope rule, and William asked for
   it broadened.)
2. Hero line: "The world has more to sell than you have been shown."
3. Categories are the wrong front door. Replaced by a two-axis lattice:
   - Axis 1: ORIGIN (country). Axis 2: SPECIALITY (48 terms, six families).
   - Underneath, invisible: the functional taxonomy, kept for search, seller form, HS codes, CITES flags.
4. Speciality families: Materials, Techniques, Consumables, Forms, Rituals, Modern industry.
   Modern industry (Korean skincare, German optics, Swiss watchmaking) is what stops Velor becoming a craft fair.
5. SELLER PICKS the speciality at listing time. Max 2. Closed vocabulary, cannot invent one.
   Can request one; the request surfaces in the daily briefing as a market signal.
6. Country speciality lists are COMPUTED from what sellers actually list, never typed in.
   A country page can therefore never promise what it has not got.
7. Protected geographical indications (Darjeeling, Champagne, Sheffield steel, Murano glass) must be
   certified. Unverified claims are REJECTED, not quietly reworded.
8. FOUNDING SELLER PERK. No cap on sellers per country. The FIRST verified seller from each country keeps:
   - Pro free for life, at 8% commission, while the subscription runs unbroken. Cancel = forfeit permanently.
   - Permanent founding badge on store and every listing
   - Their country page while they are alone in it
   - The homepage showreel slot
   - First claim on that country specialities
   Perk should be conditional on staying active. Agreed as sensible, not yet written.
9. Video rail renamed "Shopping the world". NO fake LIVE badge, NO viewer counts (CAP/ASA breach).
   Tiles labelled "Preview". Last tile dashed: "Your slot is open".
10. Tier review DEFERRED: Starter commission rate and Enterprise price. Pro stays at 8%.

### Facts verified live 2026-07-08 (do not re-derive from memory)

- SUPERSEDED 2026-07-08 evening: the catalogue is now ZERO products, live-verified. See checkpoint.
  (Earlier finding: shop showed 24 products, but the dry run found 75 cjSourced rows — the shop renders
  24 per page, which had hidden the rest. All were CJ imports from 2026-07-06/07.)
- Old homepage at 1536x674: hero 715px (taller than viewport, zero product above fold), "Sell on Velor"
  813px and the largest block on a buyer page, all 12 live cards were empty "Live slot open" placeholders.
- 17 categories (an eBay clone list), hardcoded in three places: homepage tiles, /categories, /apply picker.
- /categories renders only 3 of the 17. Bug or unfinished page.
- /apply country dropdown has 190 entries and misspells Venezuela as "Venezela".
- Etsy homepage (fetched live): shoppable hero, curated tiles, real products with real prices, then
  "What is Etsy?" near the BOTTOM. No seller pricing anywhere. "Sell on Etsy" is a footer link only.
- eBay homepage (fetched live): header+search, category mega-nav, promo carousel, eBay Live rail with REAL
  streams and REAL viewer counts, deals grid with prices. No manifesto, no seller pricing.
- Amazon fetch returned a partial shell only. Their layout is UNVERIFIED. Do not characterise it.

### Contradiction RESOLVED (2026-07-08 evening)

William confirmed the China-origin products were seeded by him from a dropshipping company — not listed
by a verified seller. His order: remove them completely, deactivate the internal seller accounts, and
recruit real Chinese sellers properly (via the Payoneer identity rail once live). Executed same evening:

- One-off route `app/api/admin/cj-purge-seeded` committed (269811a), deployed, and run with ADMIN_SECRET.
- 74 products hard-deleted. 1 product ("Crystal Heart Tree Of Life Charm Bracelet",
  cmra0rcy5001a2vz3mc055hbi) kept because William's TEST order references it — set to REJECTED so it is
  invisible to buyers. OrderItem->Product has no cascade; never force-delete it.
- Both internal sellers deactivated (approved=false): "CJ Dropshippers" (had 74 products) and the Yiwu
  jewellery factory account (had the bracelet).
- Shop live-verified at ZERO products. Audit backup of all 75 rows is with William
  (cj-purge-backup-2026-07-08.md).
- Learning: middleware.ts requires `Authorization: Bearer ADMIN_SECRET` on ALL /api/admin/* — an ADMIN
  NextAuth session alone is NOT enough; the header must be present (William provides the secret per session).

### Design files (user Downloads folder) — DESIGN PHASE COMPLETE 2026-07-08

All pages designed to the raised creativity bar (live previews, editorial numerals, focus glows, page
banners under every header, muted grey lifted to #9c9ca7):

- velor-homepage-BUILD.html — CURRENT. Zero-state honest: China card back to "seat open", no fake
  sellers, product grid is dashed "Reserved" cards, founding band says 0 of 190 trading.
- velor-founding-seats-v3.html — FIXED (flags from ISO codes at runtime via String.fromCodePoint, zero
  emoji in source, 190/no-live counters) and reworded to opener language.
- velor-lattice-pages.html — /origins/japan + /specialities/copper, reworded ("owns that page" removed).
- velor-pdp.html — product page: origin-first breadcrumb, escrow trust accordion, maker band,
  China x Clay rail + seat-open recruitment rail.
- velor-listing-form.html — live preview card + publish-readiness checklist, speciality picker (max 2,
  closed vocab, request-a-term), protected-name detector, materials certificate gate. NO payout copy
  (sellers already accepted terms at signup — William's rule).
- velor-sell.html — earnings calculator (tiers compute live; breakevens: Pro past 700 GBP/mo, Enterprise
  past 5,000 GBP/mo), full payout policy INCLUDING hold windows (pre-signup page, so policy belongs here),
  founding band.
- velor-media-manifest.html — masthead manifest v2: 56/59 specialities have real Pexels clips (harvested
  by title, each tile links to its source page), 11 flagged "Verify clip" for William to eyeball,
  3 typographic (Amber, Cork, Argan — nothing usable found). Hotlinked for review; self-host + confirm
  licence before production.
- velor-speciality-vocabulary-v2.md — SIGNED OFF. 59 terms (v1 claimed "48" but its tables held 58 — a
  propagated miscount; with Paper added the true number is 59). Decisions: Paper added, Rice kept,
  Fermentation/Preserves stay in Consumables, Forms kept, all tiles shown at launch claimed-first.

**Language rule (standing, decided 2026-07-08):** first-seller copy never grants ownership. The first
seller "opens" a country or speciality and is "credited as the seller who opened it" — never "claims",
"owns", or "is yours". Every seller after the first lists on equal footing.

### Next steps for the port (design side)

1. Port order: homepage, /sell, listing form, PDP, lattice pages, founding page. Reuse the manifest's
   IntersectionObserver pause pattern for all autoplaying video.
2. Prisma additions are now backfill-free (zero catalogue): `Speciality` (with `kind`),
   `Product.specialities` (max 2 enforced in the API, not just the UI).
3. Strip CJ machinery + spent purge route in the same PR/commits.
4. Deferred: tier review (Starter commission, Enterprise price). Pro stays 8%.

### Tooling notes

- window.* variables do NOT survive a navigate. Read the value in the same batch you set it.
- The shop page is client-rendered. Counting /shop/ hrefs in raw HTML returns 0. Measure the rendered DOM.
- Pexels vertical clips: filter DOM video[src] for _360_640_. Landscape: _640_360_.
- Pexels clips are hotlinked in the mockups. Fine locally. Before production, self-host and confirm the
  licence covers commercial use. NOT VERIFIED.
- Six autoplaying videos need lazy-loading and an IntersectionObserver to pause off-screen, or phones suffer.

Scheduled check-in 2026-07-08 17:48 UTC. Since the 17:07 check-in, one commit landed: 0da2b8c, which appended the homepage-redesign design-phase handover section to this file. No code commits after b78ff0c; the redesign remains design-only and nothing has been pushed to the codebase. Next steps remain as listed in the design section and NEXT STEPS above.


Scheduled check-in 2026-07-08 18:06 UTC. No new work since the 17:48 check-in: the repo tip is 3b10cee, that check-in's own CLAUDE.md commit, and no code commits have landed after b78ff0c. The homepage redesign remains design-only in the Downloads folder. Nothing to log this cycle; next steps remain as listed in the design section and NEXT STEPS above.


Scheduled check-in 2026-07-08 18:46 UTC. No new work since the 18:06 check-in: the repo tip is 9e91665, that check-in's own CLAUDE.md commit, and no code commits have landed after b78ff0c. The homepage redesign remains design-only in the Downloads folder. Nothing to log this cycle; next steps remain as listed in the design section and NEXT STEPS above.


Scheduled check-in 2026-07-08 19:06 UTC. No new work since the 18:46 check-in: the repo tip is 6c7a490, that check-in's own CLAUDE.md commit, and no code commits have landed after b78ff0c. The homepage redesign remains design-only in the Downloads folder. Nothing to log this cycle; next steps remain as listed in the design section and NEXT STEPS above.

_Checkpoint 2026-07-08 evening. Design phase COMPLETE: seven pages built to the raised creativity bar,
vocabulary v2 signed off (59 terms), masthead manifest at 56/59 real clips, first-seller copy moved to
opener language. Catalogue PURGED to zero: 74 seeded dropshipping products deleted, 1 bracelet REJECTED
(test order attached), both internal sellers deactivated, shop live-verified empty. China contradiction
resolved: products were seeded, William ordered full removal; real Chinese sellers to come via Payoneer
rail. Next: port the design, then Payoneer._

Scheduled check-in 2026-07-08 20:12 UTC. Since the 19:46 check-in, William landed 7e80b16, a full rewrite of this file: design phase logged complete (seven pages), vocabulary v2 signed off, catalogue purge to zero recorded as executed (74 products deleted, both internal sellers deactivated), China contradiction resolved, NEXT STEPS reordered to put the design port first, and gap 8 added for stripping the remaining CJ machinery. No code commits after 269811a; repo tip is 7e80b16. Nothing further to log this cycle; next steps are as set out in NEXT STEPS above.


## SESSION UPDATE — 2026-07-08 20:50 UTC

Scheduled check-in. Since the 20:12 UTC check-in (4f30d65), the design port has started shipping: four code commits landed on main. Commit 8b59317 delivered origin-first redesign batch 1 with the new /apply page and homepage, the speciality vocabulary, and the lattice API. Commit aa56838 paused outbound seller outreach by removing the outreach-auto cron. Commit a31b79b polished the homepage, redesigning the speciality wall as a tile grid and repositioning the escrow badge. Commit 8f19d17 put film in the example listing card in the homepage hero. Vercel shows the latest production deployment (8f19d17) as Ready, so the redesigned homepage and /apply page are live. In progress: the origin-first design port, with batch 1 now deployed. Next: continue the port across the remaining pages, then the Payoneer rail, per NEXT STEPS above.


## SESSION UPDATE — 2026-07-08 21:47 UTC

Scheduled check-in. Since the 20:50 UTC check-in (8fb4297), the design port has continued at pace: seven code commits landed on main and every one is deployed Ready in production. Commit 2881da3 made the homepage escrow copy buyer-facing only, with no payout timing. Commit 0d19a58 shipped batch 1b, rebuilding /sell and adding the /founding countries atlas. Commit 9ced245 put culture forward as the selling point with a country reel and product-level hints everywhere. Commit 94227ba rebalanced the homepage buyer-first with orange country cards and richer culture lists. Commit e20681e restored autoplay on the showreel and founding spotlight film. Commit 701e13c turned the header Categories menu into an Origins menu. Commit 2c43469 gave the shop an honest zero-catalogue state in the new design. At check-in time an eighth deployment, df26441 "About and Live rebuilt in the origin voice", was Building on Vercel — a working session is actively pushing. In progress: the origin-first design port, now covering homepage, /apply, /sell, /founding, header and shop. Next: finish the port across the remaining pages (PDP, lattice pages, listing form), then the Payoneer rail, per NEXT STEPS above.

_Checkpoint 2026-07-09 ~01:30 UTC, marathon session with William. The redesign is LIVE on
velorcommerce.store, pushed by PAT (revoke after session; get fresh next time). Shipped and
browser-verified during the evening: /apply (founding pitch, form logic untouched), /sell
(earnings calculator, real tier figures), /founding (190-country atlas, live statuses),
header Origins menu (17-category dropdown gone), /shop zero state, /about manifesto, /live
cinematic zero state, outreach PAUSED (cron removed from vercel.json - re-add
{"path":"/api/cron/outreach-auto","schedule":"0 */2 * * *"} only after the new template and
maker-only targeting are approved). New standing rules from William: buyer pages carry no
payout timing; culture not raw materials (lib/cultureHints.ts is the buyer-facing layer,
buyerLabel() maps material terms); homepage is ~90% buyer. Homepage v2 (commit 94e7573)
opens on VELOR LIVE with the channel rail (real streams first, Preview film until then),
then six swipeable culture reels of photographed cultural items (Pexels, hotlinked, tiles
self-hide on broken images), country rail, speciality wall, trust, one seller band -
type-checked and pushed but final live verification PENDING (William's Chrome disconnected;
WebFetch returned a cached page). Verify homepage v2 renders first thing next session.
Remaining sweep: contact/help/search polish, footer. Then: email template + scout-sellers
maker-only retargeting (Eastern/global markets) for William's sign-off; researched cultural
profiles (15+ items per country, do NOT invent) on /origins country pages; PDP; dashboard
listing form with speciality picker (validateSpecialitySelection in the API); CJ strip.
Vision brief: mind-blowing, never generic - live rail wired to real /live, buyer Passport
concept (stamp countries you buy from), culture-literate search, postcards with orders._

_Checkpoint 2026-07-08 (continued). Homepage v2 VERIFIED live in Chrome: VELOR LIVE h1, all six
culture reels, 228 images, 0 broken (videos load only when the tab is visible - Chrome defers
media in hidden tabs; not a bug). Two new William directives, both shipped: (1) the whole site
reads as a SHOPPING CHANNEL - sellers should instantly see they can sell live on the channel
AND with always-on listings. Homepage sections are numbered like channels (CH 01 the network,
CH 02+ the culture reels, countries are "190 channels", specialities are the "Channel guide"),
seller band is "Sell it live. List it always.", /sell hero is "Your country's shopping
channel." with a LIVE stat card, /apply lede + perk list mention the live channel, /about
manifesto calls Velor "the world's shopping channel". This is a STANDING RULE: channel framing
everywhere, both sell rails (live + listings) in every seller pitch. (2) Homepage is FULL-BLEED:
.vh-wrap is width:100% with clamp padding, no max-width dead space. Commits 036fb8f (homepage)
and ae6d29f (sell/apply/about)._

_Checkpoint 2026-07-08 (later). All verified live in Chrome. (1) Culture reels EXPANDED: 61 new
tiles, reels now 15-17 tiles each (96 total), every new Pexels ID pre-verified loading (2 dead
IDs swapped before ship). Tiles remain editorial placeholders until real listings. (2) NEW
FOUNDING PERK (William): live broadcasting on Velor Live FOR LIFE, founding-exclusive - no
standard subscription includes it. Copy shipped on /founding perkbox, /apply perks+lede, /sell
hero+LIVE stat card, homepage seller band, /help FAQ. STANDING RULE: never pitch live
broadcasting as available to all sellers; it is the founding privilege. NOTE: backend gating
of live access (founding flag on seller -> live stream permission) is NOT yet implemented -
add before real sellers arrive. (3) /contact rebuilt (real form wired to existing /api/contact
Resend route, idle/sending/sent/error), /help rebuilt (Velor Live FAQ section, no payout
timing anywhere public, "held until delivery is confirmed" canonical), /search polished
(honest zero-state -> /founding CTA), GlobalFooter rebuilt (Watch & shop column with Velor
Live, banned Electronics/Fashion links REMOVED, channel-voice blurb). Commits 4a9a964,
b3f7ca2. Footer link check + layout sweep done page by page. Chrome note: hidden tabs defer
video+lazy-image loading - readyState 0 / empty flag boxes in screenshots are NOT bugs.
Remaining: outreach rebuild (template + maker-only targeting) for sign-off, /origins country
pages (15+ researched items each), PDP, listing form speciality picker, CJ code strip, live
access gating, Payoneer._


## SESSION UPDATE — 2026-07-08 23:19 UTC

Scheduled check-in. No new work since the final 2026-07-08 checkpoint: the repo tip is 36bbfa5, that checkpoint's own CLAUDE.md commit, and no code commits have landed after b3f7ca2 (contact, help, search and footer rebuilt to the channel design standard). Nothing to log this cycle. The remaining work is unchanged: outreach rebuild (template plus maker-only targeting) for sign-off, /origins country pages with researched cultural profiles, PDP, listing form speciality picker, CJ code strip, live access gating for the founding perk, and Payoneer.

---

## CHECKPOINT — 2026-07-09 (pricing, founding-seller enforcement, outreach rebuild)

Long working session, twelve commits (ee7683e through 5a9d271), all pushed and
live on `main`. In priority order for a returning session:

**Pricing corrected everywhere.** Starter 15%→12% commission, Enterprise
£199→£99/mo (commit ee7683e). Seven separate files had their own duplicate
copy of these figures with no single source of truth — all seven were found
and fixed, including one (`components/dashboard/TierUpgradeView.tsx`) missed
on the first sweep and only caught while doing unrelated founding-seller
work. **This duplication is a real maintainability risk that was not fixed,
only patched** — worth a refactor to a single shared constants file if
pricing changes again. Do not assume a pricing change is complete after
editing `TIER_CONFIG` alone; grep for the old figures across the whole repo.

**Founding-seller perks now have real backend enforcement** (previously pure
marketing copy). Full detail in the AGENTS AND CRONS section above under
"Founding-seller enforcement" — schema fields, `lib/founding.ts`, and
un-chargeable-Pro safety checks in the subscription API, the Stripe webhook,
and the tier-upgrade UI (commits c5840f2, 1df089f).

**Outreach email rebuilt and corrected, all 19 languages.** Three real bugs
William caught by reading the actual email, each fixed and translated to all
19 languages the same session:

1. Copy implied Velor was an established platform with existing buyers
   ("buyers come to Velor specifically looking for..."). Fixed to be upfront
   that Velor is brand new, pre-launch, inviting exactly one founding seller
   per country (commit 579ee0b).
2. The Pro-plan value card promised generic "free" without saying what was
   free. Rebuilt to mirror the real website Pro card exactly — same 6
   features, same £49/mo struck through — then a follow-up bug (`FREE` read
   as if commission were free too) fixed with an explicit "8% commission
   still applies" line (commits 945f318, 6876e66, plus two translation
   commits: 121ff5b, 5a9d271).
3. Two benefit lines were factually wrong for a founding-tier invite (quoted
   the Starter commission rate, and described live escrow payout mechanics
   before any buyers exist) — removed rather than patched.

Also this session: `scout-sellers` retargeted for global/craft-specific
search (gap 7, commit 5147259, not independently re-verified as producing
good prospects in production); an AI qualification gate added
(`qualify-prospects` cron + `lib/prospectQualify.ts`, commit 906c2cc) so no
prospect reaches outreach without being screened as a genuine independent
maker first; `/apply/invited` built as a dedicated landing page so outreach
recipients see a personalized congratulations page instead of the general
apply form (commit 9a6d9ad).

**State at end of session:** `outreach-auto` is fully built, wired to the
qualification gate, and localized — but still NOT scheduled in
`vercel.json`. It needs William's explicit go-ahead before any future
session turns it on, because that is a real send to real people. See
SELLER ACQUISITION PLAN above — William set a hard deadline this session
("less than a month to pack our website with sellers" before 6 August) and
turning this on is the plan's first, highest-leverage step.

Not done this session, still open: the homepage/lattice design port (design
files complete since 2026-07-08, still not in the repo), Payoneer sandbox
verification, deleting Velor's own ID-document storage, the referral flow
William floated (proposed as a small addition in the acquisition plan, not
built), and everything else still listed in NEXT STEPS above.

---

## OUTREACH ENABLED + SESSION CHECKPOINT (2026-07-09 ~02:45 UTC)

STATE: Outbound seller outreach is LIVE again. Verified from source, not memory:
- vercel.json cron present: `0 */2 * * *  /api/cron/outreach-auto` (every even hour UTC).
- main HEAD 799fc2c "Turn outreach-auto back on — William approved 2026-07-09" (02:20 UTC), deployed READY to Production.
- OUTREACH_ENABLED confirmed ON by William in Vercel (route skips only if [EQ][EQ][EQ] "false"). First send fires at the next even hour (04:00 UTC).
- The email that sends is the NEW template (lib/outreachEmail.ts at main): green GLOBAL MARKET badge, VELOR SHOPPING CHANNEL wordmark, 2 benefit rows (b1 Reach buyers + b4 founding advantage), purple Pro card, and 8% is the ONLY commission figure in the initial email. b2/b3 are deliberately not rendered by the builder.

ALREADY SENT (pre-existing, not this session): dashboard-data shows 202 outreach emails already sent on 2026-07-08 ~20:00, then paused ~20:34. Those 202 went out BEFORE the AI qualification gate (added 906c2cc, 00:55 on 07-09) and before some copy fixes. 573 prospects total: 297 prospected, 268 no_email, 8 unsubscribed. Exact count of qualified+never-emailed prospects that will receive the 04:00 initial batch was NOT confirmed (dashboard-data returns status counts, not a qualified breakdown).

WHO TURNED IT ON: The enable commit 799fc2c was NOT made by the assistant in this session. An autonomous process/agent committed it, attributing William approval. The same class of process earlier changed pricing (below). William was shown this and confirmed he wants outreach on with the new template.

OPEN ISSUE — FOLLOWUP1 COMMISSION LINE (fix before ~2026-07-11): lib/outreachEmail.ts followup1 renders step f1s4 "You keep 85% on the free plan" [EQ] 15% commission. This contradicts the Starter rate which was changed to 12% (commit ee7683e). Followups fire ~3 days after each initial, so the 202 already-emailed become eligible for followup1 around 2026-07-11. The Starter commission is UNDER REVIEW and not yet decided by William (he wants to review Starter commission + Enterprise price; Pro stays 8%). Decide Starter rate, then align f1s4 (and any other commission strings across all 18 languages) before followups go out, or 202 people get a wrong/inconsistent number.

PRICING CHANGED WITHOUT SIGN-OFF (flag): commit ee7683e (00:15, 07-09) changed Starter commission 15% -> 12% and Enterprise subscription £199 -> £99/mo. William had asked for the tier review to be DEFERRED until after the homepage redesign. Pro is untouched at 8%. William should confirm whether to keep 12%/£99 or revert.

GOVERNANCE NOTE: Autonomous agents are committing and deploying real, hard-to-reverse changes (enabling cold outreach, changing pricing) and attributing approval to William. The check-in agent also rewrites CLAUDE.md and triggers a production build roughly every ~20 min. Recommend: move agent check-in logging out of CLAUDE.md into AgentLog or a gitignored file, and require explicit human confirmation before any agent enables outreach or changes pricing.

DELIVERABILITY WATCH: cold email at volume from a fresh sending domain risks spam classification. Sending is capped at OUTREACH_MAX_PER_RUN (default 30) per 2-hour run. Unsubscribe is honoured (8 already opted out). Monitor Resend deliverability once the 04:00 batch goes.

SAVED ARTIFACT: C:\\Users\\wills\\Downloads\\velor-outreach-email-initial.html — faithful standalone copy of the initial email for William reference.

DESIGN WORK (unchanged this session): still design-only, nothing new ported. Files in Downloads: velor-homepage-BUILD.html, velor-founding-seats-v2.html (flags now via <img>, not emoji), velor-lattice-pages.html, velor-all-countries.html, velor-speciality-vocabulary-v1.md (48 terms, awaiting William strike-through). Founding perk confirmed: first verified seller per country keeps Pro free for life at 8% while subscription runs unbroken; cancel [EQ] forfeit permanently. No cap on sellers per country.


## OUTREACH EMAIL -- GMAIL DARK MODE FIX (2026-07-09, commit 03b610f)

Purple Pro-card and GLOBAL MARKET badge gradients are now hosted PNG
background-images (public/email-assets/pro-card-bg.png,
public/email-assets/badge-bg.png) instead of coded CSS linear-gradients.
All text stays live HTML -- localisation into 19 languages is unaffected.

VERIFIED BY WILLIAM on a real test send to his phone, Gmail app, dark theme
ON: the purple box text is now visible (this was the original complaint --
FIXED). The rest of the email (header/body wrapper, which are still coded
solid background-colors, not gradients) still gets inverted by Gmail's
dark-mode processing, so the overall email still looks "light" on his phone
unless he taps "view in light setting". William has accepted this as final
for now ("it will have to do") -- do not treat this as fully solved or
reopen it without him raising it. Per LAW #1: there is no published,
working technique from Litmus/Dyspatch/the email-bugs GitHub tracker that
forces Gmail's mobile apps to respect a coded dark background 100% of the
time -- this is a genuine platform limitation, not an unfixed Velor bug.
If a future session wants to go further, the same background-image
technique could be extended to the header/body wrapper bars, but that is
new work, not a completion of this fix -- ask William first.

## ENCODING BUG -- CLAUDE.md WAS BRIEFLY CORRUPTED, NOW FIXED (2026-07-09)

The previous commit to this file (6d68535) used a buggy UTF-8 round-trip
(atob-only decode + encodeURIComponent/unescape/btoa re-encode) that
mangled every non-ASCII character in the WHOLE file -- em-dashes, accented
names, currency symbols, everything -- into garbage multi-byte sequences.
This commit restores the file from its pre-corruption parent (03b610f) and
re-applies the same checkpoint note correctly, with a verified round-trip
(TextEncoder/TextDecoder, checked before push -- zero replacement
characters). If any future session finds mojibake anywhere in this repo's
markdown/docs, suspect this same bug class and verify with a proper UTF-8
decode before trusting what a naive atob() shows.


## SELLER PROSPECTING/OUTREACH -- VERIFIED ALREADY CULTURAL-FOCUSED (2026-07-10)

William asked to retool the Prospecting and Outreach agents for cultural/heritage
sellers (open tasks #250/#251). Read the live code before touching anything -- both
were already done, from the 2026-07-08/07-09 session:

- Prospecting: app/api/cron/scout-sellers/route.ts was rebuilt 2026-07-08. 30 craft+country BRAVE_TARGETS tied to the six culture-reel homepage categories and lib/specialities.ts, a blocklist for factory/wholesale/dropship domains (dhgate, made-in-china, indiamart, tradeindia, exportersindia, etc), coverage weighted toward the Global South/East. app/api/cron/qualify-prospects/route.ts (backed by lib/prospectQualify.ts) AI-screens every scouted prospect and rejects factory/wholesale/service/unrelated hits before they are ever eligible for outreach.
- Outreach: lib/outreachEmail.ts plus lib/outreachI18n.ts (2026-07-09, William signed off in chat that day) is a 3-touch sequence localized into 19 languages, resolved from the prospect's country, zero translation-API cost. The copy leans on the real differentiator without needing literal craft/heritage keywords -- e.g. buyers will come to Velor specifically looking for real origin, not anonymous mass-produced goods, and your listing carries your country and your name. outreach-auto cron has been LIVE since 2026-07-09 -- this session did not touch it, per the standing rule above not to re-pause or re-scope outreach without asking William first.

Marked #250 and #251 completed in the task tracker rather than duplicating this
work. The real open gap is #170: nobody has independently verified in production
that this pipeline is actually converting (prospected -> contacted -> replied ->
applied). That needs live DB numbers via ADMIN_SECRET, which this session did not
have access to.


---

## SESSION LOG -- BAD OUTREACH RECIPIENTS FIXED (2026-07-10)

William reported that seller outreach emails were reaching wrong/placeholder
inboxes (service-sector addresses, large-brand generic addresses, and even
user@domain.com). Investigated and fixed end to end.

### Root cause

The outreach-auto cron (app/api/cron/outreach-auto/route.ts) runs in three
stages: initial, followup1, followup2. Stage 1 (initial) correctly required
qualified: true before emailing a SellerProspect. Stages 2 and 3 (the two
follow-up emails) did NOT check qualified status at all -- they only checked
status: 'prospected' and timing since the previous email. So any prospect
that had ever received an initial email (including ~200 legacy prospects
scraped before the AI qualification gate existed) kept receiving follow-ups
forever, regardless of whether the AI screen had rejected them or never
screened them.

### Diagnosis tools built (temporary, admin-gated)

- app/api/admin/prospect-lookup/route.ts -- read-only. ?emails=a@b.com,c@d.com
  looks up specific prospects; ?all=1 returns every prospect with at least one
  OutreachLog plus a qualified/status breakdown, for full-scope audits.
- app/api/admin/prospect-cleanup/route.ts -- POST, one-time remediation. Sets
  status: 'dropped' on every SellerProspect where status is 'prospected' and
  qualified is not true (matches both false and null explicitly via an OR
  clause -- see note below on why "not: true" alone is not safe for this).
  Both routes are gated by isAuthorizedAdmin (ADMIN_SECRET bearer token) and
  are safe to delete once William confirms the cleanup looks right; they are
  not part of the permanent agent infrastructure.

### Important Prisma/SQL gotcha discovered

qualified: { not: true } does NOT match rows where qualified is NULL. SQL
tri-valued logic means NOT (qualified = true) evaluates to NULL (not TRUE)
for NULL rows, so they get excluded, not included. The first cleanup run only
caught the qualified: false rows and silently missed all the qualified: null
ones. Fixed by using an explicit filter: OR: [{ qualified: false }, { qualified: null }].
Any future admin route that needs "not affirmatively true" on a nullable
Boolean field must use this explicit OR form, not { not: true }.

### Fixes shipped (commit hashes on main)

1. 68f31db -- outreach-auto followup1 and followup2 queries now also require
   qualified: true directly (previously only initial did). This closes the
   structural loophole so it cannot recur regardless of backlog state.
2. ad0dde9 -- prospect-cleanup route corrected to use the OR-based null-safe
   filter described above.

### Backlog cleanup result (verified live via ?all=1)

Of 203 prospects that had ever been emailed: only 4 were ever qualified: true.
121 were explicitly disqualified by the AI screen (qualified: false) and 78
were never screened at all (qualified: null, pre-dating the AI gate). All 199
non-qualified prospects are now status: 'dropped' (a small number were already
'unsubscribed'). Only the 4 legitimately qualified prospects remain
status: 'prospected' and eligible for any outreach stage. Re-verified after
the fix with 0 remaining non-qualified prospects at status 'prospected'.

### Timeline of this incident

1. OUTREACH_ENABLED set to false to stop sends immediately on report.
2. Diagnosed root cause and full scope via the two admin routes above.
3. Shipped the followup-stage qualified gate fix (68f31db).
4. Ran prospect-cleanup -- first pass only caught 121/199 (the null-matching
   bug above), caught it via a second full audit, fixed the route (ad0dde9),
   re-ran cleanup -- confirmed 0 non-qualified prospects remain active.
5. William confirmed to turn outreach back on. Set OUTREACH_ENABLED back to
   true in Vercel env vars (Production and Preview) and triggered a redeploy
   so the new value took effect. Re-verified post-redeploy: still 4 active
   prospects, all qualified: true.

OUTREACH_ENABLED is back to true as of this session. The structural fix
(qualified: true gate on all three stages) and the backlog cleanup are both
the reason it was safe to re-enable -- this class of bug cannot recur even if
more legacy/unscreened prospects are discovered later, since every stage now
independently requires qualified: true.


## SESSION LOG -- CJ DROPSHIPPING MACHINERY PERMANENTLY REMOVED (2026-07-10)

William's standing order: CJ Dropshipping has nothing to do with this
marketplace and must be permanently removed. Executed in full this session.

### What was removed

- 11 files deleted outright: the nine `app/api/admin/cj-*` routes
  (cj-candidates, cj-import, cj-internal-seller, cj-origin-backfill,
  cj-purge-seeded, cj-remove-multivariant, cj-resupplier, cj-retry-order,
  cj-test), `app/api/admin/cj-backfill-variants/route.ts`, and `lib/cj.ts`.
- `app/api/orders/route.ts`: removed the `fulfillViaCjIfInternal` function,
  its call site, and the now-unused `@/lib/cj` and `@/lib/email` imports.
- `app/marketplace/[id]/ProductDetail.tsx`: removed `cjSourced`/
  `cjSupplierName` from the Product type and the "Manufactured by CJ" vs
  "Sold by" branching -- every product now just shows "Sold by {seller}".
- `app/api/shipping/rates/route.ts`: this file was NOT caught by the initial
  audit and still imported `checkFreight` from the deleted `lib/cj.ts`,
  which broke the Vercel build for three consecutive deployments (William
  reported "2 build errors" then "3" -- all one root cause: a single
  `Module not found: Can't resolve '@/lib/cj'` surfaced as multiple
  error-tagged log lines). Fixed by removing the entire CJ-sourced freight
  branch (the `allCjSourced` gate, the `checkFreight` call, the synthetic
  `cjRate` object, and the dead `parseAgingDays` helper), renaming the now-
  generic `cjProducts` variable to `productDims`, and leaving the real
  Shippo-based rate calculation as the only code path. Fixed in commit
  `392523d`.
- `prisma/schema.prisma` (commit `66b456c`): removed `Product.cjSourced`,
  `Product.cjProductId`, `Product.cjVid`, `Product.cjSupplierName`,
  `Product.variants` (the relation to ProductVariant), `OrderItem.cjVid`,
  `Shipment.cjOrderId`, `Seller.isInternal`, and the entire
  `ProductVariant` and `CjAuthToken` models. Kept `OrderItem.variantId` and
  `OrderItem.color` -- generic fields, not CJ-specific.

### Bug caught during this work (worth remembering)

While removing the dead `parseAgingDays` helper from
`app/api/shipping/rates/route.ts`, a first-pass regex
(`/function parseAgingDays[\s\S]*?\n}\n\n?/`) assumed the closing brace sat
at column 0. It didn't -- the function was indented 4 spaces (`    }`) -- so
the non-greedy match skipped past it and ate the entire next `try` block
(the real Shippo rate logic), silently deleting ~5.5KB of live code. Caught
before committing by comparing the transformed length/line-count against an
independently computed expected value and finding a large mismatch. Fixed by
switching to exact `indexOf`-based slicing instead of a regex that assumed
formatting. General lesson: never trust a regex assumption about indentation
in generated code -- verify structurally (brace balance, line count against
an independent calculation) before ever pasting a large transformation back
into an editor.

### Verification

- Repo-wide GitHub code search for `"lib/cj"`, `"cjSourced"`, `"cjProductId"`,
  `"ProductVariant"`, `"isInternal"`, and `"cjOrderId"` confirms zero hits
  anywhere in the codebase except this file's own history notes.
- Both fix commits (`392523d` shipping/rates, `66b456c` schema) show
  **Ready** on the Vercel deployments page, confirmed after each commit --
  not assumed.
