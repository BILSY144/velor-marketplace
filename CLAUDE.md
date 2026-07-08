# Velor Marketplace â Working Memory

_Auto-loaded each session. Rewritten 2026-07-08 as a clean, current file. The
previous 924-line version (154KB, twelve same-day check-ins, and a stale
"READ THIS FIRST" block that sent new sessions to fix an already-closed bug)
is preserved in git history at commit 9fcce1d if it is ever needed._

---

## LAW #1 â HONESTY

Never lie, fabricate, or invent actions or results. If a step was not taken,
say so. If something is unconfirmed, write "unconfirmed". Verify against a live
deployment, a live API response, or a commit SHA â never against memory, and
never against a checkpoint's own claim that something was done.

This law outranks every other instruction in this file, including deadlines.

---

## SCOPE â WHAT THIS FILE COVERS

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
their own countries â see the `velor-cultural-marketplace` skill. Generic
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
   new "SESSION UPDATE" section for every small change â edit the relevant
   section instead.

---

## EMAIL ROUTING (hard rule)

- `willsinclair144@gmail.com` â the daily director briefing, and new-seller
  alerts. Nothing else.
- `customerservice@velorcommerce.co.uk` â everything else: agent notifications,
  watchdog breaches, escalations, contact form, seller support.
- `sellers@velorcommerce.store` â outbound seller outreach and onboarding.

---

## STACK

Next.js 16 App Router, TypeScript, Prisma + Neon Postgres, NextAuth v5,
Stripe (payments, Connect payouts, Identity), Payoneer (payout rail for
Stripe-unsupported countries), Shippo, Resend, Anthropic API
(`claude-sonnet-5`).

`package.json` build runs `prisma generate && prisma db push --accept-data-loss
&& next build`. Schema additions therefore reach the database on every deploy.
Dropping a column drops its data â be careful.

---

## MONEY RULES (absolute)

- Buyer pays via Stripe. Funds are held by Velor in escrow.
- Release only after delivery is confirmed AND the hold window passes:
  15 days for new sellers, 72 hours once trusted.
- An open return or dispute freezes the funds. No exceptions.
- Idempotency key `payout_<orderId>`.
- Rail is resolved per seller country by `lib/payoutRail.ts`: Stripe Connect
  where supported, Payoneer everywhere else. **The rules are identical on both
  rails** â same delivery requirement, same holds, same dispute freeze.
- Seller tiers: Starter free / 15% commission, Pro Â£49 / 8%, Enterprise Â£199 / 5%.

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
24 hours of your verification completing" â the 24 hours is ours, the camera is
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
| `0 6-9 * * *` | `/api/reports/daily` |
| `0 8 * * *` | `/api/cron/traffic-check` |
| `0 3 * * *` | `/api/cron/recompute-rankings` |
| `0 8 * * 1` | `/api/cron/live-usage-check` |

The watchdog checks outcomes in the database, never an agent's self-reported
status, and emails breaches immediately.

Outreach: maximum 3 emails per seller, always personalised, every send logged,
unsubscribe honoured immediately. Copy is localised into 19 languages by
`lib/outreachI18n.ts`; `lib/outreachEmail.ts` is the single source of truth.
The emails promise the seller can write to Velor in their own language â that
promise is kept by `LANG_RULE` in `app/api/assistant/chat/route.ts`. Do not
weaken it.

---

## COMPLIANCE

Certificate chain, enforced in code: `/legal/seller-rules` â application
acknowledgment â listing materials declaration â certificate upload â admin
verification â gated approval (409 on admin approve without a valid
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
   08:00 and 09:00 UTC â four briefings a morning. The `velor-daily-report`
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
7. `scout-sellers` queries are still Western-weighted. William wants Eastern
   and global markets: India, Indonesia, Vietnam, Thailand, Turkey, the
   Philippines, Eastern Europe, LATAM.

---

## NEXT STEPS (William's priority order)

1. **Finish the Payoneer system.** When credentials arrive, add
   `PAYONEER_CLIENT_ID`, `PAYONEER_CLIENT_SECRET`, `PAYONEER_PROGRAM_ID`,
   `PAYONEER_API_BASE` to Vercel, then sandbox-verify `lib/payoneer.ts` before
   any live payout. Payouts to Monzo. This also unlocks the second identity
   rail for the RESTRICTED-jurisdiction sellers.
2. **Scan the website for add-ons** ahead of the 6 August buyer launch.
3. **Delete Velor's own ID-document storage** (gap 2 above). Highest standing
   risk; not blocked on anyone.
4. Verify the first real Stripe Identity round trip once a seller completes one.
5. Shop pagination bug.
6. Tune `scout-sellers` for Eastern and global markets.
7. Look at the site on a real phone.

---

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
  banner steals keyboard focus and shifts the layout â dismiss it first, or
  arrow keys and typing silently go nowhere. Never place a `javascript_tool`
  call between the click that focuses the editor and the keys that navigate
  it; `Runtime.evaluate` steals focus. Only rendered lines exist in the DOM.
  Setting `.cm-scroller.scrollTop` does not re-render.
- **Never set "the last visible text input" by JS on an edit page** â that is
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

1. Positioning is NOT handmade or artisan. It is ORIGIN. Everywhere makes something better than
   everywhere else. Culture is the reason, not the headline.
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

- Catalogue is 24 distinct products, ALL China-origin. ?origin=CN returns 24, unfiltered returns 24,
  ?origin=TV and ?origin=JP return 0 with "no products found". The origin filter works. Nothing else is in it.
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

### Contradiction to resolve before the founding-seats page ships

lib/identity.ts RESTRICTED_IDENTITY_COUNTRY_CODES = {CN, RU, CU, IR, KP, SY}. Sellers there cannot pass
Stripe Identity. CHINA IS ON THAT LIST, AND CHINA IS THE ONLY COUNTRY WITH PRODUCTS ON VELOR. Either those
24 products were seeded rather than listed by a verified seller, or a seller got through before the Identity
gate went in. ASK WILLIAM. This is also the strongest argument for finishing Payoneer: it is the second
identity rail and would move China out of "verification pending".

### Design files (user Downloads folder)

- velor-homepage-BUILD.html - full homepage. CURRENT. Hero + proof card, showreel (6 real Pexels clips,
  pointer-capture drag scroll), origins, speciality wall, product grid, escrow, founding band.
- velor-founding-seats-v2.html - founding seat page. BROKEN MID-EDIT: CSS for `.ci .d` was replaced with
  `.ci .fl`, but render() still emits `<span class="d">`. Fix by adding a CODES map + flag() helper and
  emitting `<span class="fl">` + flag(code).
- velor-lattice-pages.html - /origins/japan and /specialities/copper, full-bleed video mastheads.
- velor-speciality-vocabulary-v1.md - 48 terms, six families, country mappings. AWAITING SIGN-OFF.
  Five open questions at the bottom. Note: Paper is missing from Materials and is one of Japan strongest claims.
- velor-all-countries.html, velor-homepage-mockup.html, velor-homepage-v2.html - superseded iterations.
- velor-DESIGN-HANDOVER.md - the full version of this section.

### Next steps, in order

1. William strikes through the vocabulary list and answers its five open questions. Everything downstream
   depends on that list.
2. Fix velor-founding-seats-v2.html. Flags derived from ISO codes at runtime. No emoji in source.
3. Country video mastheads. William approved "get what you can for free" (Pexels).
   HONEST CONSTRAINT ALREADY FLAGGED TO HIM: free clips are SPECIALITY footage (a potter wheel, a loom, a
   copper hammer), not country-specific. A Turkish coffee clip on the Turkey page is fine. A generic pottery
   clip on Mongolia page implying it is Mongolian is not. So: one masthead per SPECIALITY, reused across the
   countries that share it, replaced later by the founding seller own film. Build a media manifest with a
   fallback chain: video -> poster image -> typographic masthead.
4. Still to design: product card / PDP, seller listing form (only a sketch exists), /sell page where the
   tier table now lives.
5. Only then port to the repo. Additive Prisma changes: `Speciality` table with a `kind` field, and
   `Product.specialities` array. Safe under `prisma db push`. Requires backfilling the 24 existing products
   and mapping category strings on existing seller applications.
6. Deferred: tier review. Starter commission rate, Enterprise price. Pro stays 8%.

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


Scheduled check-in 2026-07-08 19:46 UTC. Since the 19:06 check-in, one code commit landed: 269811a added app/api/admin/cj-purge-seeded/route.ts, a one-off admin cleanup endpoint with a GET that lists cjSourced products and a POST that deletes products with no orders and deactivates internal sellers. This is the first code commit since b78ff0c and targets the seeded China-origin catalogue flagged in the design section. Whether the endpoint has been run is unconfirmed; the live catalogue state was not re-verified this cycle. Next steps remain as listed in the design section and NEXT STEPS above.
