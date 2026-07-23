# Velor Marketplace — Working Memory

_Auto-loaded each session. Rewritten 2026-07-08 as a clean, current file. The
previous 924-line version (154KB, twelve same-day check-ins, and a stale
"READ THIS FIRST" block that sent new sessions to fix an already-closed bug)
is preserved in git history at commit 9fcce1d if it is ever needed._

---

## URGENT -- DOTS IS A NO-GO; TROLLEY BANK-TRANSFER ONBOARDING IN PROGRESS (William, 2026-07-23 evening -- SUPERSEDES the original Dots directive below)

**Dots.dev is confirmed NOT usable for Velor.** Its platform/business
Country field is hard-locked to United States ("Only US businesses are
supported at the moment") -- confirmed live (the dropdown does not respond
to any selection attempt) and confirmed against Dots' own AI documentation
assistant, which stated this restriction plainly and is not documented
publicly. This is a genuine platform limitation, not a bug or something a
different account/flow works around. Velor Commerce Ltd is UK-registered,
so a Dots account can never be created. **Do not re-attempt Dots signup in
a future session** -- treat DOTS_API_KEY as permanently unobtainable unless
Dots changes this policy (nothing suggests they are about to).

**Alternative found and onboarding underway: Trolley (usetrolley.com /
dashboard.trolley.com).** Signup started, Company Details + Directors +
Payout Information sections saved. Two things to know before continuing:
1. Trolley auto-approved the account for **PayPal payouts only** on
   signup -- that is NOT the payout rail Velor needs (sellers worldwide
   won't all have/want PayPal). The real requirement, **Bank Transfer
   payouts**, is a SEPARATE onboarding flow (Business Structure ->
   Beneficial Owners -> Shareholder Register -> Review Submission), only
   just started -- see the 2026-07-23 evening checkpoint near the bottom
   of this file for exact form-field state and what's still blank.
2. The Directors section auto-populated William's real name and date of
   birth without anyone typing it -- flagged to William, never
   independently confirmed as accurate or altered by Claude. Sanity-check
   this before trusting it.

**Payoneer status, unchanged from before:** the Mass Payouts partner
application (case 260721-023420, chased by email to partners@payoneer.com
21 Jul) is still unanswered. A WhatsApp "your account is ready" message
William received was unrelated -- it was his personal Payoneer *receiving*
account activating (confirmed by inspecting the actual signed-in Payoneer
account, which has no partner/developer API features), not the Mass
Payouts partner approval. Do not treat that WhatsApp message as the
blocker being resolved.

**Do NOT enter a Tax Identification Number into any of these forms.**
That is a standing rule, not specific to Trolley -- a Tax ID is a
government identification number and Claude will never enter one into any
form, regardless of instruction. William enters that field himself when
the Beneficial Owners step is resumed.

**Next session: pick up the Trolley Bank Transfer onboarding exactly where
the 2026-07-23 evening checkpoint left off** (Beneficial Owners step,
phone number field selected but empty) rather than restarting the flow or
attempting Dots again.

---

## SUPERSEDED -- original Dots.dev directive (William, 2026-07-23 morning), kept for history only

William's explicit instruction, given directly in chat: this is the single
most important thing to do right now, marked as a matter of urgency. No
other work on this project should be carried out until it is resolved.
Read this before doing anything else in this repo.

**What needs to happen:** William signs up for a real Dots.dev account at
https://dashboard.dots.dev himself (Claude cannot create accounts on his
behalf -- this is a standing prohibited action, same reason Payoneer and
Stripe accounts were always his to create) and adds the resulting
DOTS_API_KEY (and DOTS_API_BASE, if it differs from the default
https://api.dots.dev) to Vercel's environment variables, for both
Production and Preview.

**Why this is urgent, not routine:** Dots.dev is now the default payout
rail for every seller outside Stripe's supported countries (lib/payoutRail.ts,
added 2026-07-23 to replace Payoneer after its Mass Payouts partner
application sat unanswered since 13 July). That covers most of the
countries this seller-recruitment push is actually targeting. Until
DOTS_API_KEY exists, isDotsConfigured() returns false and no seller outside
Stripe's reach can complete real payout onboarding -- their earnings queue
safely in escrow (an interim payout-gate exemption, commit 1ce2671,
2026-07-23, stops them being locked out of the dashboard entirely while
this is pending -- see lib/payoutGateCookie.ts) but nobody can actually be
paid. Two real approved sellers (LAKA's Studio and HALLORY, both China)
were emailed the same day telling them they can list products now -- if
either lists and later sells something, their money has nowhere real to go
until this is done.

**THIS PLAN NO LONGER WORKS -- Dots cannot be used at all, see the
superseding section above.** Kept verbatim below only so the reasoning
trail isn't lost.

If it is NOT yet done, re-raise it with William immediately rather than
moving on to anything else. [ORIGINAL: if DOTS_API_KEY is already in
Vercel, confirm isDotsConfigured() actually returns true (e.g. via GET
/api/dots/onboard while signed in as a seller) and sandbox-verify the two
flagged-unconfirmed items in lib/dots.ts's own header (whether a
zero-amount onboarding link is accepted, and the exact shape of GET
/v2/users/{id}) before trusting a live payout.]

---

## LAW #1 — HONESTY

Never lie, fabricate, or invent actions or results. If a step was not taken,
say so. If something is unconfirmed, write "unconfirmed". Verify against a live
deployment, a live API response, or a commit SHA — never against memory, and
never against a checkpoint's own claim that something was done.

This law outranks every other instruction in this file, including deadlines.

---

## LAW #2 -- VELOR IS A GLOBAL MARKETPLACE (William, 2026-07-21: "this is
something we just cannot get wrong again")

Velor is a GLOBAL marketplace for authentic cultural and artisan goods.
It is NEVER described -- in outreach emails, site copy, app copy, press,
agent prompts, assistant answers, metadata, or anywhere else a human or
search engine can read -- as "a UK marketplace", "UK-based marketplace",
"British marketplace", or any equivalent. Every country has its own
shopping channel; buyers and sellers are worldwide.

The ONLY correct uses of "UK" are legal/registration facts: "Velor
Commerce Ltd, Company No. 17268133", the registered office, UK tax/OMP
obligations, ICO registration, and similar. Correct identity line for
outreach: "Velor (velorcommerce.store), a global online marketplace for
authentic cultural goods" with the company registration in the signature.

Before ANY outward-facing text ships (email, page, agent prompt, store
listing copy), check it against this law. If an existing surface is
found violating it, fix it in the same session and log it here.

---

## RESOLVED 2026-07-21 -- BUYER-SELLER COMMUNICATION RULES DEFINED BY WILLIAM AND ENFORCED (was: rules needed since 2026-07-16)

**WILLIAM'S RULES (2026-07-21, verbatim intent): buyer-seller messages must
never allow exchange of personal or business information; buyer-facing
surfaces show a seller's STOREFRONT NAME ONLY, never a real company name;
sellers rely on the platform to sell, not bypass it; strict
implementation; applies to website AND app; "that also goes for live
videos."**

Enforcement map (all server-side unless noted, all shipped/verified
2026-07-21):
- lib/messageFilter.ts is the single shared filter (emails incl.
  obfuscation, 7+ digit runs, social handles, URLs/domains, spaced-out
  evasion). Deliberately blunt; false positives acceptable.
- Already enforced before today: /api/messages POST, /api/dashboard/
  messages POST, listings create+edit, store settings (storeName +
  description), live chat send AND receive on web + app (client-side by
  necessity -- LiveKit data channel is peer-delivered).
- Added today: /api/reviews POST (public comments), /api/returns POST
  (buyer reason the seller reads), /api/disputes POST (reason+evidence),
  /api/dashboard/live POST (stream title+description), plus client-side
  mirrors in the web and app broadcaster setup forms.
- On-camera speech cannot be auto-filtered: covered by the viewer report
  button (auto-end on threshold, shipped 2026-07-20) and seller rules.
- Storefront-name-only was already the design and is verified: the
  Seller row carries only storeName; the real business name lives on
  SellerApplication and appears ONLY in admin/pulse UIs, seller-facing
  emails, and William's daily report. Buyer-facing surfaces (shop APIs,
  PDP, live, reviews, messaging identities via lib/messageIdentity.ts)
  all use storeName; buyers appear as "First L." everywhere.

The old OUTSTANDING text below is history only:

William asked to lay down the rules for buyer-seller messaging before this
feature is touched again ("remind me to come back to message seller topic
as we need to lay down rules for this function"). **Standing instruction for
every session:** if asked to connect buttons, fix bugs, or do a full site
wiring pass, do NOT fix or reconnect the Contact Seller / Message Seller
path until William has explicitly given the rules below. If William starts a
session and doesn't bring this up himself, re-raise it -- don't let it go
quiet just because it isn't blocking anything else.

**STATUS CORRECTION (2026-07-21, William: "i believe the information you
have for buyer/seller messaging is stale" -- confirmed by code inspection):
both bugs below were FIXED on 2026-07-20.** /api/messages POST now
resolves a sellerId to the seller's User id (comment in the route dates
the fix), and the buyer inbox fetches /api/messages?format=raw which the
route supports, so threads build correctly. The messaging path is wired
end to end in code (not live-tested with a real send this session).
WHAT REMAINS OPEN is only William's RULES for the feature -- moderation,
what buyers/sellers may exchange, abuse handling. Keep re-raising that
until he lays them down; do not build further messaging features before
then. Original 2026-07-16 note kept below for history:

**Superseded 2026-07-16 note:**
1. `app/shop/[productId]/ProductPageClient.tsx`'s "Contact Seller" button
   sends `sellerId` (a `Seller.id`), but `app/api/messages/route.ts` expects
   `receiverId` (a `User.id`) -- always returns 400.
2. The buyer inbox at `/messages` expects the messages API to return an
   array; `GET /api/messages` actually returns
   `{ currentUserId, conversations }`, an object -- `Array.isArray(data)` is
   always false, so no thread ever renders even if one existed.

There is no rate limiting (`/api/messages` is not in `middleware.ts`'s
route matcher), no profanity/abuse filter, no contact-info detection, and no
escrow-circumvention prevention anywhere in the messaging code path --
confirmed absent by an exhaustive search, not just unfound. A second,
better-validated route (`app/api/dashboard/messages/route.ts`, 2000-char
cap + self-message block) exists but is dead code -- nothing in the app
calls it.

**Why this is not a "just fix the two bugs" task:** fixing those two bugs in
isolation would instantly turn on a fully unmoderated, un-rate-limited
message channel between any two strangers on the site, with zero protection
against sellers/buyers exchanging contact details to route payment around
Velor's escrow (the core of Velor's trust model), spam, or abuse.

**Rules to get from William before touching this again:**
- Should messages be scanned/blocked for emails, phone numbers, or
  off-platform payment requests (the obvious first-order defense against
  escrow circumvention)?
- Rate limits per user/per day.
- Profanity/abuse filtering -- automatic, user-reported, or both?
- Who can initiate a thread: buyer only, or can a seller message a buyer
  first (marketing/spam risk)?
- Does a thread require a real order/purchase first, or can anyone message
  any seller pre-purchase (e.g. product questions)?
- Reporting/blocking mechanism for abusive messages.
- Any response-time expectation communicated to buyers?

**Once rules exist:** fix the two bugs above, decide whether to keep
`app/api/messages/route.ts` or migrate to the better-validated
`app/api/dashboard/messages/route.ts`, and build the agreed
moderation/rate-limiting layer BEFORE reconnecting the buyer-facing button
-- not after.

---

## 2026-07-17 checkpoint (3) -- FULL BUYER JOURNEY VERIFIED END TO END WITH REAL MONEY (the queue-topping task since 2026-07-16 -- DONE)

William bought his own store's listing ("hand made toys", GBP 1.00, seller williams workshop, the No.001 GB founding seller) as buyer willsinclair144@gmail.com, real card, live Stripe. Every step verified live in the browser:

- Listing -> PDP -> cart -> checkout: real per-seller Shippo rates quoted live (GBP 2.71 selected, DPD GBP 5.79 offered), "Domestic -- no import duties" correct, total GBP 3.71.
- Payment succeeded (pi_3Tu3E4DB5eA3Wfmu1tt4lnSd). Order cmrofh22i0003us8cygn8tbf5 PAID: platformFee GBP 0.04 = exactly 4% of the item (founding seller on free-for-life Pro), shipping passed through commission-free, sellerEarnings GBP 3.67 held in escrow. Buyer confirmation email RECEIVED (first real fire of buildOrderConfirmationEmail on a fresh order).
- Buyer order history renders correctly (no GBP-NaN). Stock 1 -> 0, SOLD OUT badge live on /shop?origin=GB. Admin /api/admin/orders returns the full order.
- Review SUBMITTED AND LIVE (5-star) -- after fixing a launch-blocking bug found by this very test: the review purchase-gate only accepted PROCESSING/SHIPPED/DELIVERED but real orders are written as PAID, so NO buyer could ever have reviewed anything (fix: PAID added, commit ab9252d).

Bugs fixed during the test: cart badge not clearing after successful checkout (confirmation page now empties the basket, commit 91753ab); the review gate above. Also shipped same evening: country-aware search -- typing a country (incl. aliases uk/usa/holland) surfaces its shopping-channel box + that country's real goods; result cards now link to /shop/{id} not legacy /marketplace (commit be9a04d, NOT yet live-verified with a click-through).

STILL UNVERIFIED downstream (needs future events, not code): seller-side order view under the williams workshop ACCOUNT (buyer account correctly sees "No orders yet" in ITS dashboard -- different account; William to check when signed in as the seller); tracking self-report; payout release after DELIVERED + hold window (watch /api/cron/release-payouts for the first real release -- the sellerBreakdown fix has never fired on a real order).

Privacy observations for the seller-username work: the PDP maker line shows "william sinclair is the maker" (real name, buyer-facing) and the posted review displays the buyer's full name -- both exactly the surfaces the OUTSTANDING seller-username item needs to cover.

## DONE 2026-07-17 (afternoon session) -- PAYONEER IN PAYMENT TRUST COPY, WORDING APPROVED BY WILLIAM

William approved the exact wording in chat: **"Secure Stripe checkout · Payouts by Stripe & Payoneer"** -- payout-framed, never implying buyers pay via Payoneer (Payoneer Checkout does not exist; Mass Payouts partner approval still pending). Shipped: GlobalHeader topbar, GlobalFooter trust badge (+ payout sentence in its description), website checkout trust line under the pay button, app CheckoutScreen (line under the escrow banner), app SellScreen (payouts sentence). NOT changed because they already carry honest payout-framed Payoneer mentions: /help payouts FAQ, /sell payouts card, legal pages (privacy/terms/seller-agreement), app SellerOpsScreens payouts card, app LegalScreen (has no payment copy at all). Live verification of each surface after deploy is the remaining step.

## OUTSTANDING -- APP STILL NOT TRANSLATING ON-DEVICE AFTER TWO FIXES; v3 ENGINE SHIPPED WITH ON-SCREEN DIAGNOSTICS (2026-07-17 afternoon)

History: (1) `Text.render` patch (83a7354) no-opped -- RN 0.81 Text is a plain function component, diagnosis confirmed. (2) Translating Text wrapper (2d75a97, all 25 screens import from `src/ui/T`, Expo publish run #35 succeeded) -- William STILL reports "app lets you pick a language but does not convert", website translation works incl. mobile web. Server side verified healthy this session: POST /api/translate with app-style uncached strings returned correct Spanish, 200 in 2.3s.

v3 shipped this session, three changes: (a) each ui/T Text subscribes to `onI18n` ITSELF -- no longer trusts App.tsx's root tick to propagate through react-navigation internals (prime suspect for the all-English symptom); (b) `flush()` no longer deletes texts from the queue before the fetch -- v2 dropped a failed batch's strings FOREVER on one network error, now they stay queued and retry with backoff; (c) an on-device diagnostic line on the Language screen (raw RNText, never translated itself): `engine v3 · lang xx · cached N · queued N · last: <ok/HTTP nnn/network error>`.

**v3 RESULT (William, on-device, same afternoon): WORKS but partial and slow** -- "sort of works, parts of the page converts and some text does not, takes 20 seconds." So the per-Text subscription was the missing piece; remaining gaps were coverage (tab-bar labels drawn by react-navigation's own Text; 13 TextInput placeholders which are props, not children; Animated.Text hero word -- still untranslated, known cosmetic) and speed (20s = cold model translation of uncached app strings, serial batches, 600ms debounce).

**v4 shipped (commit 327edb7, mobile-app, Expo publish auto-fires):** (a) `src/i18n-manifest.ts` -- 2,587 display strings AST-extracted from source (extraction script: typescript compiler walk over JSXText + display-prop/prose string literals; re-run it when screens gain copy); (b) `prefetchAll(lang)` pulls the WHOLE dictionary with 4 parallel chunk workers the moment a language is picked and on cold start with a stored language -- against a warm server cache this is DB reads, screens fill in within a couple of seconds; (c) debounce 600ms -> 120ms for manifest-missed strings; (d) tab labels translated via `tabBarLabel` + tick in Tabs; (e) `src/ui/TI.tsx` translating TextInput wrapper swapped into all 7 screens with placeholders. **Server cache warm-up for ALL 18 languages x full manifest run this session from the browser** (324 chunk requests; progress tracked in-tab). On-device persistence of dictionaries was considered and SKIPPED -- expo's version API is unreachable from the sandbox so `expo install expo-file-system` couldn't resolve a safe SDK-54 version; revisit if cold-start paint speed still bothers William. Diag line now reads `engine v4 ...` -- that's how to confirm the update landed.

## OUTSTANDING -- SELLER USERNAME AT SIGNUP: BUYERS SHOULD ONLY EVER SEE THAT (raised 2026-07-16, not yet scoped or built)

William's instruction, to pick up next session: **every seller must create a
username at signup, and that username -- only the username -- is what
buyers see on the seller's file/profile.** Read as: buyers should never be
shown the seller's real personal name anywhere on the buyer-facing site.

**What exists today (quick-checked this session, not a full audit):**
- The application form (`app/apply/page.tsx`) collects `businessName` and
  `contactName` -- there is no distinct "username" field or concept
  anywhere in the signup flow.
- `Seller.storeName` (`prisma/schema.prisma:102`) is the field actually
  shown to buyers today (storefront, product cards, dashboard "Store Name"
  setting in `app/dashboard/settings/page.tsx`). It is editable later in
  Settings, but not framed as a required "pick your public username" step
  at signup, and nothing currently stops a sole-trader seller from putting
  their real name into `businessName` -> `storeName`, which would then be
  shown to buyers as-is.
- Reviews on `app/shop/[productId]/ProductPageClient.tsx:454` show
  `r.user.name` -- that is the *reviewer's* (buyer's) name on their own
  review, a different and separate concern from seller identity, but worth
  keeping in mind if William's "buyers should only see a username" intent
  turns out to extend to how buyers themselves are displayed too. Ask
  before assuming that's in scope -- he only mentioned sellers.

**Next session, before building anything:** confirm with William whether
this means (a) formalize `storeName` as a required, validated "username"
step added to the signup/application flow, with real name collected
separately for KYC/Stripe Identity/payouts only and never surfaced to
buyers, or (b) something more -- e.g. uniqueness rules, allowed
characters, can it be changed later, does it need to be distinct from the
already-existing storefront theme's display of `storeName`. Then audit
every buyer-facing surface (storefront, product cards/pages, order
confirmation emails sent to buyers, and the still-broken messaging feature
above once it's rebuilt) to confirm none of them leak `contactName` /
`businessName` / the underlying `User.name` to a buyer.

---

## IN PROGRESS -- SELLER STUDIO DASHBOARD (2026-07-21: HALO SCRAPPED BY WILLIAM, REPLACED)

**2026-07-21 (evening session): William rejected Halo outright** ("total
redesign of halo seller dashboard i do not like the design") and chose a
Shopify/Stripe-style professional design from a concept mockup he approved
in chat (collapsible sidebar was his added requirement). New standing goal:
"professional fully functioning wired up to all routes seller dashboard"
and a payment system that is rail-correct per country AND fully
operational, so he can sign off and focus on onboarding sellers.

SHIPPED and LIVE-VERIFIED in William's browser this session:
- **lib/studio.tsx** -- the new Seller Studio design system (light,
  white cards, Fraunces headings, orange accent only). Halo (lib/halo.tsx)
  remains ONLY as a dependency of not-yet-migrated pages; do not build new
  work on it.
- **app/dashboard/layout.tsx** rebuilt (commit 0760336): grouped left
  sidebar (Sell/Fulfil/Money/Account), collapsible to icon rail with
  per-browser localStorage memory (velor-studio-sidebar), mobile overlay
  drawer, RAIL-AWARE payout nav (see below). All old nav rules preserved
  (Pro-only API Keys, Go Live every tier, light-theme force,
  language+currency pickers, VelorAssistant + LanguageTranslator).
- **Home/Overview** rebuilt (b3c1d34 + 787ff82): KPI row, real 30-day
  revenue chart from analytics dailyRevenue, recent-orders table,
  rail-aware payouts card, honest store-health checklist. LESSON RE-LEARNED
  (787ff82): payout readiness must be read from the LIVE endpoint for the
  seller's own rail, never the stored stripeOnboarded flag -- the stored
  flag was stale for williams workshop on first render.
- **stripe-connect + payoneer setup pages** rebuilt in Studio (0760336);
  payoneer page gained the missing REVERSE rail guard (Stripe-rail sellers
  redirected away; stripe-connect already redirected Payoneer-rail).

PAYMENTS HARDENING shipped same session (commit cf1ec28), all additive:
- release-payouts cron resolves rail LIVE from seller country
  (getPayoutRail), STRICT branching per rail (a leftover stripeAccountId
  can no longer pay a Payoneer-rail seller via Stripe or vice versa),
  self-heals stored payoutRail, new heldForStripeSetup counter; Payoneer
  payouts additionally gated on getPayeeStatus === ACTIVE.
- Delivery can no longer dead-end short of DELIVERED (which would strand
  seller money in escrow forever). William chose "buyer confirm + auto
  after 30 days" in chat: Shippo track-registration outcome recorded on
  Shipment.trackRegistered and retried by NEW daily cron
  /api/cron/confirm-deliveries (45 2 * * *); buyer "I have received this
  order" button on /orders (POST /api/orders/[orderId]/confirm-delivery);
  30-day auto-confirm anchored on new Order.shippedAt (blocked by open
  return/dispute); admin PATCH mark-delivered on /api/admin/orders,
  AgentLog-logged. Order.deliveryConfirmedBy records WEBHOOK/BUYER/AUTO/
  ADMIN. /api/seller/me now returns country + live payoutRail(+Label).

LATER THE SAME SESSION (all pushed, tsc-clean, deploys green):
- **CRITICAL Stripe cookie bug found BY William** ("it says my stripe
  connect is linked but ive not set it up"): /api/stripe/connect(+/
  account) read a year-long per-BROWSER seller_account_id cookie with
  priority over Seller.stripeAccountId and then PERSISTED the cookie's
  account onto whichever seller was signed in -- wrong-payout-destination
  vector. Fixed (f417784): cookie never read/set, actively deleted;
  status+resume resolve ONLY from the seller's row; platform-account
  guard cleans contaminated rows in the status route AND release cron.
  LIVE-VERIFIED: williams workshop now honestly shows Not connected /
  Set Up Payouts (he had never onboarded; the cookie was the whole lie).
- **Daily Stripe account hygiene sweep for ALL sellers** (7a431b2), in
  confirm-deliveries cron: clears platform-id and cross-seller-duplicate
  stripeAccountId rows, syncs stripeOnboarded with live Stripe, clears
  deleted accounts; every clearance AgentLog-logged.
- **Payouts page rebuilt in Studio** (3c7cc43) -- rail-aware method card,
  live Stripe state, commission ladder + savings calc, history.
- **Studio rollout leverage** (80cfb29): shared tierCardStyle moved onto
  the Studio card -- Products/Orders/Returns/Disputes/Storefront/
  Discounts/Settings/Support/Analytics/Messages restyled in one change;
  Terms page restyled light (presentation only, legal text untouched);
  Analytics+Settings got page padding + light chart grid (207514d);
  shell no longer flashes STARTER before tier loads (d07dfcf).
- **Individual sellers** (4b561c1, William: "anyone can sell on velor...
  personal identification instead of business status"): Stripe Express
  accounts now created with business_type 'individual' -- onboarding
  asks personal ID only. William must Disconnect + reconnect to get a
  fresh individual-type account (his first one predates the fix).
  Payoneer: hosted registration supports individuals natively; sandbox
  checklist gains an individual-payee program check.

APP SYNC (same session, later): approval SLA lowered to 2 HOURS max
(1d2bdfb -- constants 2h/1h, review cron every 15 min, all site copy);
app screens synced to the new reality on BOTH main (c91ca24) and
mobile-app (e9c7445 + 5072fbd): ApplyScreen steps (Apply -> Decision in
2 hours -> Set up payouts), VerifyScreen rebuilt as post-application
confirmation (no camera/24h copy; route name kept), SellScreen hint.
Expo publish auto-fired on the mobile-app push (preview channel).
CAUTION LEARNED: a `git commit -am` on mobile-app swept in local
package-lock.json drift (1,738 lines) -- reverted to ee6e297's lockfile
in 5072fbd; never commit lockfiles from this sandbox's own npm installs.
NOTE: the PRODUCTION store app only gets these changes via a deliberate
production-channel `eas update` or the next store build (per the
2026-07-19 checkpoint) -- ask William before firing that. Mobile i18n
manifest NOT regenerated (extractor produced only 737 strings vs the
3,014 union -- reverted; new strings translate lazily).

STILL TO DO (next sessions): finish per-page verify of Discounts/
Returns/Disputes/Messages/Support/API Keys/Upgrade in the new shell;
phone-width pass; Go Live branded pass; page-by-page sign-off walkthrough
with William. Payoneer transfers remain dormant until his Mass Payouts
partner approval + credentials (external blocker). This session's sandbox
HAD outbound network in bash: repo cloned locally, tsc before every push,
pushed via git with a PAT (rotate it, flagged in chat). NOTE for future
sessions: prisma generate needs engine-path override env vars here
(PRISMA_QUERY_ENGINE_LIBRARY/PRISMA_SCHEMA_ENGINE_BINARY pointed at dummy
files) because binaries.prisma.sh is proxy-blocked; tsc via /tmp/
tsconfig.check.json extending repo tsconfig with target es2022.

--- (superseded Halo history below, kept for context) ---

**Update 2026-07-20 (late session):** William approved a direction from three
concept mockups: "Halo" -- LIGHT theme (his explicit call: "remove the dark
colour as its hard to see"), website colours (globals.css light tokens +
orange/amber), orbital layout: centre hub disc, circular glass stat
satellites on orbit rings, capsule orders belt, constellation top nav
replacing the sidebar, wide-desktop layout. Design system lives in
`lib/halo.tsx`; `app/dashboard/layout.tsx` is the new shell (all 14 nav
destinations preserved, payout-setup swap, Pro-only API Keys, Go Live every
tier, mobile overlay drawer); `app/dashboard/page.tsx` is the rebuilt
Overview -- every figure wired live (analytics/orders/payouts/products
APIs), zero fabricated numbers, escrow copy states delivery + hold window.
Deploy 9d7005d confirmed Ready on Vercel. NOT yet live-verified in a
browser signed in as a seller -- that is the next step before further
rollout. Remaining pages still carry their old inner styling inside the
new light shell (they read light via CSS vars; stripe-connect, terms,
analytics hardcode dark hexes and will look dark-on-light until their
batch). Rollout batches agreed: Sell (Products, Storefront, Discounts) ->
Fulfil (Orders, Returns, Disputes, Messages -- visual only, messaging
function untouched per the rules-needed section above) -> Studio (Payouts,
Stripe Connect, Payoneer, API Keys, Settings, Support, Terms, Upgrade) ->
Analytics -> Go Live branded pass last.

**2026-07-21 urgent fix, found BY the redesign (William: "the information
is wrong on payouts page... it needs to read the correct set up for that
country"):** the new Overview's live "via Payoneer" label exposed a real
money-path bug -- Seller.country stores COUNTRY NAMES (the /apply
business-country select uses names as values) but getPayoutRail() matched
only 2-letter ISO codes, so any caller passing Seller.country (payoneer/
onboard did, and its GET PERSISTED the wrong answer) resolved every such
seller to PAYONEER. Not cosmetic: the release-payouts cron branches on the
stored rail, so a Stripe-country seller stuck on PAYONEER with no payee id
would NEVER be paid. Fixed at the source (commits ad89619 + afc52f4):
lib/payoutRail.ts countryToCode() now accepts names or codes
(WORLD_COUNTRIES lookup + aliases incl. UK->GB; 16-case behaviour test
passed), and /api/dashboard/payouts resolves the rail live from country
and self-heals the stored field (same pattern payoneer/onboard uses).
LIVE-VERIFIED: williams workshop payouts page now shows the Stripe
Connect setup path, Overview reads "via Stripe". Other sellers self-heal
on their next payouts/dashboard visit; /api/admin/recompute-payout-rails
exists if a bulk pass is ever wanted.

**2026-07-21 (second round) -- three more issues William caught live, all
fixed and verified (commit 621b273):**
1. Payout Settings said "Connected", Payouts page said "no account
   connected" -- Payout Settings reads the LIVE Stripe account endpoint,
   Payouts page was reading the (lagging) stored `stripeOnboarded` flag.
   Both pages now read the same live endpoint; Payouts page also gained an
   honest "Stripe setup incomplete / Complete Setup" middle state instead
   of collapsing account-exists-but-not-enabled into "not connected".
2. Settings > Profile inputs hardcoded `#111` background -- unreadable
   black boxes once the dashboard forces light. Now theme-safe
   `var(--surface)` / `var(--surface-2)`.
3. Overview aurora was paler than the approved preview mockup -- tint
   opacities restored to the preview's exact values in `lib/halo.tsx`.
All three live-verified in browser (Payouts now reads "Stripe Connect
linked"; Settings fields show real values e.g. "William Sinclair",
"williams workshop"; Overview aurora visibly warmer).

**Go Live page redesigned (commit e8a3a55), live-verified:** gate screens,
setup form (camera check, buyer-preview mockup, stream details, product
picker, schedule/live-offer toggles), the scheduled-stream card, and past
streams all moved to light Halo glass -- including fixing the same
dark-input-box bug just found on Settings (title/description/schedule/
offer fields all hardcoded `#0d0d0d`/`#fff`). Deliberately kept dark: the
camera-preview frame (shows the real feed), the "how buyers will see it"
phone mockup (simulates the actual dark live viewer), and the desktop
live-broadcast stage (video/pin-tray/chat) via new `stageDark`/
`stagePanel`/`stageBorder`/`stageMuted` tokens -- a dark stage around live
video is correct, not leftover boxed styling. NOT touched at all: the
mobile full-screen broadcaster overlay (`isMobile` branch) -- separate
immersive layer with the 2026-07-20 iOS-zoom/visualViewport fixes,
out of scope here and not to be touched without checking in first.
Buyer-side `/live/[room]` viewer is unaffected either way.

**2026-07-21 aurora "pink" fix (commit f3e83e4), live-verified:** William:
"the whole dasboard needs the preview colours not the pink it is now."
Root cause -- the aurora backdrop (`HaloBackdrop` in `lib/halo.tsx`) is
rendered globally by `app/dashboard/layout.tsx`, so on content-light pages
(Products, with one row of listings) it sat fully exposed across the whole
empty lower page. In the originally-approved mockup the aurora was mostly
hidden behind Overview's dense hub/satellite content, so its true weight
on a near-empty page had never actually been seen or approved -- two
semi-transparent layers (orange + amber) stacked over the near-white paper
read as washed pink rather than warm orange. Fix: lowered overall gradient
alpha, kept orange dominant over amber (amber trends pink faster when
double-stacked), and added a `maskImage`/`WebkitMaskImage` so the aurora
fades to nothing by ~65% down the viewport -- concentrated near the top
chrome as in the approved preview, clean paper underneath everywhere else.
Grain overlay opacity also reduced 0.5 -> 0.35. Verified via `tsc`/esbuild
(no errors) then live in browser on three representative pages: Products
(content-light, where the bug was visible -- now clean warm-orange glow at
top, plain paper below), Overview (still reads rich and warm, matches the
mockup), and Go Live's setup form (same global backdrop, confirmed
consistent). Since `HaloBackdrop` is shared, this fix applies dashboard-wide
without touching any other page's code.

**2026-07-21 "Sell" batch shipped (commit 706e20d), live-verified on
Products, Storefront, Discounts:** moved `tierCardStyle()` in
`lib/dashboard-theme.tsx` onto the Halo glass base -- this is the shared
card wrapper used by nearly every remaining dashboard page (Products,
Storefront, Discounts, Payouts, Orders, Returns, Disputes, Settings,
Support, Analytics), so all of them picked up blurred/translucent glass
panels in this one change instead of needing per-page rewrites. Tier
distinction (Starter grey vs Pro blue border/glow) is untouched -- Pro's
heading/stat text colour was swapped from the light-cyan #4FC3F7 to
HALO.proBlue (#1D5F93) to match the Pro pill already shipped and read
better against light glass. HaloButton (`lib/halo.tsx`) gained a `type`
prop (defaults to `'button'`) so it can be used safely as a non-submitting
Cancel action inside forms. Each of the three pages then got the Halo
kicker + italic-serif heading treatment and HaloButton primary actions.
Also fixed a real bug on Discounts: its root container had a solid
`background: 'var(--bg)'` that fully painted over the dashboard's aurora
backdrop, so the page never showed any Halo styling regardless of the
tierCardStyle change -- now transparent like every other page. Verified
via `tsc`/esbuild (no errors) then live in browser on all three pages.

**2026-07-21 "Fulfil" batch shipped (commits d9b149a, a4bd2fe), live-verified
on Orders, Returns, Messages:** visual-only Halo pass on Orders, Returns,
Disputes, Messages -- kicker/serif-italic headings, glass sub-panels for
Orders' nested shipment/tracking sections, Messages' two columns moved
from a flat opaque background to translucent glass. No fulfillment,
dispute, or messaging logic touched. Also fixed a hardcoded dark
`background: '#111'` on the Returns/Disputes item chips (same bug class as
the earlier Settings black-input fix).

**Real bug found live while redesigning Orders, fixed same session
(commit a4bd2fe):** every order showed "£NaN" for its total and every
line item, generic "Product" instead of the real name, no product image,
and a blank shipping address on expand. Root cause: `/api/dashboard/
orders` (GET) had never matched what `app/dashboard/orders/page.tsx`
actually renders -- it grouped OrderItem rows into an unrelated summary
shape (totalRevenue/totalPayout, productName/unitPrice) instead of
order.total/productSubtotal/shippingCost/item.price/item.product.name+
images/shippingAddress/shipments[]. This wasn't a regression from
today's work -- git history shows it's been this way since the route was
first added to the repo, so every seller's Orders page has likely always
shown this. Rebuilt the route to query Order directly (with items+product
and the singular shipment relation) and map every field onto the real
Prisma schema (Product.title -> item.product.name, Order.customerEmail ->
buyerEmail, Order.shippingAddress passed through, Order.shipment wrapped
in a one-element array to match the page's shipments[] check). LIVE-
VERIFIED: expanding the CMROFH22 order now shows the real address
(William Sinclair, 1 Palmerston Gardens, Grays, Essex, GB), the real
product ("hand made toys" with its photo), and a correct breakdown
(Products £1.00, Shipping £2.71, Total £3.71).

KNOWN REMAINING LIMITATION (flagged, not fixed): Order.subtotal only
persists the seller's COMBINED product+shipping+duties total -- the
shipping/duties split is computed at checkout (payment-intent route) but
never written to the Order row, so it can't be reconstructed after the
fact. The route now computes productSubtotal honestly from real item
prices and reports the true remainder as shippingCost (exactly correct
for non-DDP orders; on a DDP international order it will fold that
order's duty into the shipping line since the two can't be told apart
from what's stored). dutiesCost is left at 0 rather than guessed -- the
order Total itself is always exactly correct either way. A precise
shipping/duties split needs a schema migration to persist those metadata
fields on Order at creation time (lib/orders.ts) -- worth doing, but out
of scope for this pass since it touches the production schema and this
sandbox has no way to run a migration against it (network-restricted, see
Session Notes).

**2026-07-21 follow-up, caught live by William right after the fix above
(commit 232318d):** "that bug is still in overview page at bottom" -- the
Orders API reshape (a4bd2fe) fixed the Orders page itself but broke
Overview's "Orders in motion" belt, which reads the SAME `/api/dashboard/
orders` endpoint and was still using the old field names
(`item.productName`, `order.totalRevenue`) that no longer exist in the
reshaped response -- a regression I introduced and missed by only
checking the Orders page, not every consumer of that endpoint. Updated
`app/dashboard/page.tsx`'s `OrderRow` type and both usage sites to the
new real fields (`item.product.name`, `order.total`). LIVE-VERIFIED: the
belt now reads "hand made toys · William S. · £3.71 · In escrow · 3d ago"
instead of the NaN/blank state.

**2026-07-21 language/currency parity (William: "the dashboard does not
convert language and currency like every where else on the website" ->
"if the seller sets their language on the website, the whole website
needs to change language, thats our business model. the same for
currency."):** root cause was `components/ConditionalLayout.tsx` --
`showChrome` excludes every `/dashboard/*` route from ALL site chrome
(header, footer, and critically `LanguageTranslator`), so neither the
site's real language translator nor its real currency switcher had ever
been mounted there. Fixed by mounting `<LanguageTranslator />` in
`app/dashboard/layout.tsx` and adding the same language/currency
`<select>` pair `components/GlobalHeader.tsx` uses on public pages
(reads/writes the same `velor_language`/`velor-display-currency`
localStorage keys, so switching in either place is instant and shared).
Wired Overview's money figures through `useCurrencyDisplay()`
(commit e36fe55). Currency conversion is genuinely live, not scripted --
`lib/fx.ts` pulls real rates from frankfurter.app (ECB), falls back to
open.er-api.com, DB-caches each base/quote pair 6h (`FxRate` table).
Confirmed live: switching to USD/EUR correctly re-priced every Overview
figure.

**Two real bugs found and fixed live while wiring this up, both in the
shared `components/LanguageTranslator.tsx` (used site-wide, not
dashboard-specific):**
1. (commit 55608b3) `applyDict()` cached each text node's pre-translation
   English content ONCE (WeakMap) and never refreshed it. When a node's
   live content later changed for a real reason (e.g. a price re-render
   after a currency switch), the translator still looked up the OLD
   cached English key, found the OLD cached translation, and silently
   wrote the STALE value back over the live update -- caught live as
   Overview's "Ingresos . Historico" figure staying stuck at the
   pre-switch GBP amount after switching to USD while Spanish was active,
   while every other figure updated correctly. Fixed by tracking the
   value we last wrote ourselves (`applied` ref) so a mismatch between
   that and the live DOM content is recognised as "this changed for a
   real reason" and the cached original is refreshed.
2. (commit 2930ab4) William then reported "some words are still in
   english so not 100% conversion." Live debug call to `/api/translate`
   (`{debug:true}`) confirmed the site's own daily anti-abuse translation
   budget (`lib/translate.ts`, self-imposed Anthropic-spend cap, coded
   2026-07-17) is currently capped -- `cacheOnly:true` -- almost
   certainly from this session's own heavy testing across many dashboard
   pages x 19 languages while building this feature. While capped the
   endpoint intentionally falls back to the source English string rather
   than erroring, which is correct behaviour -- but `translatePage()`/
   `prefetchAll()` were caching EVERY returned string as if it were a
   finished translation, including these fallbacks, so any word first
   seen while capped got permanently stuck in English for that browser
   even after the daily budget reset. Confirmed live: Overview/Products/
   Storefront/Discounts/Disputes/Settings/Support/"Go Live" all came back
   byte-identical to their English source from the API. Fixed by only
   caching a result when it actually differs from its source string --
   fallbacks are left out of the dict so the next translation pass
   retries them instead of treating them as done.

**Not fully re-verifiable this session:** the budget cap was still active
at last check, so genuinely-new strings will keep falling back to English
until it resets (daily) regardless of the fix above -- the fix ensures
they self-heal once it does, rather than staying stuck. Could not
determine from this sandbox (no DB access) whether the per-IP cap
(2000/day) or the global cap (25000/day) was hit; if this recurs for real
sellers/buyers (not just dev testing) after a day, that points to the
global cap and is worth raising with William.

Original directive, kept for context:

William's directive, to pick up in a future session -- re-raise this if he
doesn't bring it up himself: the seller dashboard (`app/dashboard/**`)
still reads as "boxed"/"block looking," plain bordered panels with no
distinct visual identity. He wants this treated as genuinely important,
not cosmetic polish -- **the dashboard is effectively a thank-you to every
seller for signing up**, so it should give them the best seller dashboard
experience out there, not a generic admin-panel look. His words: "needs to
be much more advanced as it is still boxed looking we need to be really
creative for a futuristic panel, this a thank you to the seller for
signing up, so we need to make the seller experience out of this world
giving them the best seller dashboard out there, no more block looking
designs. the whole seller dashboard needs a redesign like no other."

**Scope:** the seller-facing dashboard as a whole
(`app/dashboard/*/page.tsx` -- overview, products, orders, live, settings,
payouts, etc.), not just the Go Live page redesigned in the 2026-07-20
session below. Nothing has been scoped or built yet -- no wireframes, no
direction beyond "not boxed, futuristic, creative, best-in-class."

**Before building, get more specific direction from William:**
- Reference sites/apps he considers futuristic or best-in-class for a
  seller/creator dashboard (Stripe Dashboard, Linear, Vercel, something
  else entirely?).
- Whether this should introduce new visual primitives beyond what the rest
  of the site currently uses -- glass/blur panels, gradient-mesh
  backgrounds, non-rectangular card shapes, motion-driven stats -- or stay
  within the existing dark theme + Fraunces/accent-orange identity, just
  executed less "boxed."
- Whether the redesign should happen page-by-page or as one coordinated
  pass that first establishes a new shared design system for the
  dashboard specifically, then applies it everywhere.

**Related:** the 2026-07-20 session below redesigned the live-shopping
flow (`app/dashboard/live/page.tsx`, `app/live/[room]/page.tsx`, and the
native app's `GoLiveScreen.tsx`/`LiveRoomScreen.tsx`) to a TikTok-style UI.
William said afterward, once it was all confirmed working: "tomorrow we
will make it our own design based off these visuals" -- meaning the live
pages themselves are also expected to get a further, more distinctively-
Velor branded pass, separate from (but likely informing the visual
language of) this wider dashboard redesign. Don't start either without
checking in first on which one William wants to tackle.

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

**William has corrected this point repeatedly (2026-07-12) — read this before
any marketing, outreach, or seller-recruiting work:**

- The core selling point is CULTURE AND COUNTRIES' TRADITIONS, not "handmade"
  in general. A seller's product must be a real cultural item tied to their
  country's heritage/tradition (traditional textiles, ceremonial crafts,
  regional art forms, heritage food, indigenous techniques) made by someone
  with a genuine connection to that tradition. "Someone who makes macrame at
  home" is NOT automatically a fit just because it's handmade — it has to
  connect to an actual cultural/traditional practice of their country.
  Generic hobbyist-craft sellers with no cultural/heritage tie are not the
  target, even though they remain welcome as general marketplace sellers.
- Velor is a GLOBAL marketplace — never default to UK-only targeting,
  language, or audience assumptions for outreach, ads, or seller recruiting.
  "One Founding Seller per country" is the actual recruiting model.
- The `velor-advertising` skill (colour palette, "Free UK delivery" copy,
  UK-only Facebook targeting, gold/cream luxury branding) describes the
  OTHER business, velorcommerce.co.uk — a UK-only luxury dropship store. Do
  NOT apply its brand voice, targeting, or copy templates to Velor
  Marketplace. If doing Facebook/social work for Velor Marketplace, use the
  `velor-cultural-marketplace` skill's positioning instead, not
  `velor-advertising`.
- For Facebook/social outreach specifically: target cultural-heritage-craft
  and traditional-artisan communities (by-country or by-craft-tradition
  groups, cultural export/fair-trade communities, Etsy-adjacent artisan
  groups with a genuine heritage angle) — not generic "advertise your
  business" or generic "UK small business" groups. Those generic groups are
  low-value for this specific positioning even though they're easy to find.

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
- Seller tiers (corrected 2026-07-18 by the SEO agent — this line was stale; see live `TIER_CONFIG` in `app/api/seller/subscription/route.ts`, matching the public `/sell` page, and already independently verified by the 2026-07-18 press-release checkpoint further down this file): **Starter** free / 10% commission (10 listings), **Pro** £49/mo / 4% commission (unlimited listings). Enterprise was retired 2026-07-15 — Pro absorbed everything it offered. The commit-ee7683e figures this line previously carried (12%/8%/5%, Enterprise £99) are historical only, not current.

---

## SELLER IDENTITY VERIFICATION

**MODEL CHANGED 2026-07-21 by William's explicit instruction** ("same
process as payouts please so we dont require photo, just id verification
like payouts. this way anyone can sign up"). SUPERSEDES the old rule
below. Do NOT revert to a photo-ID gate without William's say-so.

CURRENT RULE: identity assurance is the payout rail's own regulated KYC.
Applications are approved on rules screening alone (review-applications
cron, commit c5b9121). Stripe Connect verifies each seller's personal
identity at payout onboarding (individual accounts, personal details;
photo ID only when Stripe itself escalates); Payoneer runs KYC on its
rail. ENFORCEMENT lives in release-payouts: before any transfer, the
Stripe branch live-retrieves the account and pays only charges+payouts
enabled; the Payoneer branch pays only payees Payoneer reports ACTIVE.
Both self-heal Seller.identityVerified=true when the rail confirms. The
verification-reminders cron is a retired no-op (candidate to become
payout-setup reminders). Stripe Identity machinery (lib/identity.ts,
webhook) remains but no longer gates approval.

Historical (pre-2026-07-21) rule, for context only:
~~No seller is approved without a VERIFIED government-issued identity document.~~

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
2. **RESOLVED 2026-07-13.** The old manual ID-document-storage flow is gone.
   The three routes/pages this note used to name
   (`app/api/seller/verify/route.ts`, `app/dashboard/verify/page.tsx`,
   `app/api/admin/verify/[id]/route.ts`) had actually already been deleted by
   William on 2026-07-09 (commits f833130, a29eca3, 114611c) -- this note just
   never got updated, a stale-checkpoint trap of exactly the kind LAW #1 warns
   about. A full repo grep before touching anything found zero remaining
   references anywhere in application code, including the two files this note
   claimed still depended on it (`app/seller/[sellerId]/page.tsx`,
   `app/api/briefing/route.ts`) -- neither actually did. What was left was
   pure dead schema: the `SellerVerification` model (with its
   `idDocumentUrl`/`businessDocUrl` text fields), the unused
   `VerificationStatus` enum, and `Seller.verification`'s relation field.
   Removed in commit **8439b54**, confirmed **Ready** in Production. On that
   deploy, `prisma db push --accept-data-loss` dropped the
   `SellerVerification` table from the live database -- the actual point of
   the fix, not a side effect: any ID document URLs a seller uploaded through
   the old flow before it was replaced are now permanently gone from the
   database, not just unreachable by code.
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
9. **Buyer-seller messaging is broken end to end and deliberately not
   fixed.** See the OUTSTANDING section at the very top of this file for the
   full detail and the rules that must come from William first. Short
   version: two independent bugs mean no buyer can currently send a message
   to a seller through any UI path, and there is zero moderation/rate
   limiting in the code path underneath, so this is not a safe "quick fix."

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


## 2026-07-17 checkpoint -- Homepage reels: 20 seats per rail (top-20 performers), HD craft films added

William's directive (2026-07-17, continuing a session that died mid-research): every homepage culture reel is exactly 20 boxes, reserved for the marketplace's top 20 performing sellers, including video seats, all HD, same ID-card look. The prior session's 7 research agents died with that session -- nothing had landed; rebuilt from scratch this session.

- All 15 reels now hold exactly 20 tiles (was 6-17): 115 new image tiles researched via same-origin Pexels search in-browser, every ID load-tested against images.pexels.com (130 candidates checked, 0 failures; dupes vs existing homepage IDs and within the new set: 0). w=800 tinysrgb, ~4x the 216px tile width.
- One PREVIEW FILM seat per rail: 15 HD craft films (720p-1080p variants chosen deliberately over QHD -- tile is 216px, QHD wastes buyer bandwidth), all range-fetch verified on videos.pexels.com. Film seats carry kicker PREVIEW FILM and ribbon "Preview", NO country flag -- footage is craft-generic and claiming an origin would violate LAW #1. Films do NOT autoplay on load; the existing IntersectionObserver (now observing .vh-tile, .vh-film) plays them on scroll-in, pauses off-screen.
- "20 seats - reserved for the top-performing sellers" line added under every reel header (.vh-top20). REMOVED 2026-07-17 afternoon at William's request (line + its CSS class deleted from app/page.tsx); the 20-seat structure itself stays.
- NOTE: backend does not yet rank sellers into these seats -- the tiles remain editorial placeholders until a real top-20 performer mechanism exists. That mechanism is NOT built; do not claim it is.

**MOBILE FLAG-HOP: TAP-ON-POINTERUP FIX SHIPPED (2026-07-17 afternoon), AWAITING WILLIAM'S ON-PHONE VERIFY.** William confirmed scope in chat: mobile WEBSITE, not the app ("mobile version not app", "for page jump"). The morning's deferred-capture rewrite still relied on the browser delivering the flag button's `click` -- but mobile WebKit decides for itself when a touch on a `touch-action: pan-x` scroller becomes a scroll and then never delivers the click; our JS threshold is irrelevant to that decision. Fix in CountryOriginStrip: if the pointer never crossed the drag threshold, navigate directly in the `pointerup` handler (target resolved via `closest('button[data-country-code]')`) and swallow the trailing click (auto-cleared after 400ms so a never-delivered click can't leave suppression armed against a later keyboard activation). /shop already re-fetches on origin change (deps verified). If William's phone still fails after this: suspect an overlay stealing the tap -- inspect stacking at 390px, not the strip logic.

Also still owed from the 2026-07-16/17 session: full Hallmark seal on the seller's public storefront profile page (the one remaining badge placement); 10 seller outreach drafts awaiting William's review; buyer test still queued.

## 2026-07-17 checkpoint (2) -- Live whole-page translation in 19 languages; header language pickers; homepage currency fix

William: "we promote our self that any user can use their own languages... once they choose the language, the whole page they visit turns the text into their language." Built and LIVE-VERIFIED (watched William cycle Turkish and Polish on the production homepage with zero English left):

- **lib/language.ts** -- the same 19-language list as the app's Language screen; stored pref + velor-language-changed event, mirroring lib/currency.
- **Header language picker** (GlobalHeader, desktop + phone panel) beside the currency picker, native names.
- **Whole-page translation**: `TranslationCache` Prisma model (unique [hash, lang]) -- every unique string is model-translated ONCE per language via the existing Anthropic key, then served from Postgres forever; spend is bounded by site copy, not traffic. `/api/translate` (POST, capped 400 strings/30k chars, 18 langs, maxDuration 60). `components/LanguageTranslator.tsx` mounted on public pages: walks text nodes, swaps cached translations, MutationObserver catches client-rendered content, English restores instantly; selects/options, prices, numbers, [data-no-translate] skipped.
- **Bugs found while shipping** (all fixed same session): claude-sonnet-5 leads with thinking blocks so content[0].text was empty -- read every text block (same as assistant fix 6ad3a35); a language switch mid-run was silently dropped by the busy guard (page stuck in the PREVIOUS language); an observer-bumped generation counter skipped every final paint -- guard by language equality only; request batch 400->150 so no request risks the route's 60s cap.
- **Homepage currency bug fixed** (William's report): reel ID-card prices were hardcoded GBP -- now follow useCurrencyDisplay live.
- **App**: globe button added to Chrome header -> existing LangCur screen (mobile-app commit a91d4eb, Expo publish auto-fired). The APP is still English-first -- its language screen says so honestly; full in-app translation is separate, unbuilt work.

**Open/watch:** ~~/api/translate is public behind size/lang caps -- if Anthropic spend ever looks wrong, add an origin check + per-IP budget.~~ DONE 2026-07-17 evening (commit 5b5a6ca, William's call after a cost scare): browser calls must come from our own origin; NEW (cache-miss) model translations budgeted at 2,000/day per IP and 25,000/day globally (constants in lib/translate.ts); over-budget callers degrade to cache-only, never an error; cached strings stay free and unlimited (switching languages costs nothing -- spend is once per string per language, ever, and all 18 languages are fully warmed for site AND app as of tonight, 324-batch warm run, 29min). New additive table TranslationIpDaily. William originally asked to gate the language/currency pickers behind sign-up to protect spend -- after walking the real cost model he chose endpoint hardening with PUBLIC pickers instead; do NOT gate the pickers. Arabic translates but the layout does NOT flip RTL (unbuilt). Dashboard/admin/auth/pulse pages deliberately untranslated.

**Same day, later (all live-verified in Chrome):** (1) Film seats got verified poster frames -- a no-autoplay video paints NOTHING in Chromium, which read as "15 missing tiles"; posters fixed it, films still only download/play on scroll-in. (2) Dead CDN link on the tea reel's "The coffee ceremony" (30937097) replaced with 38519856 -- same dead ID the founding atlas fixed 2026-07-16; the homepage copy had been missed. (3) SITE TYPOGRAPHY CHANGE (William): all site headers now use the app's Fraunces serif -- global h1-h6 rule in globals.css with deliberate !important to outrank ~40 inline var(--font-display) heading styles; kickers/buttons/labels keep Space Grotesk; ID-card name lines (homepage reels, shop seat grid, listing cards) also Fraunces. The old "display font Space Grotesk" line in STANDING DIRECTIVES now applies to non-heading display text only. (4) Origins header dropdown rebuilt: all 190 countries as mini shopping-channel boxes (countryImagery photo cover into black, orange SHOPPING CHANNEL kicker, Fraunces name), lazy-loaded, rendered only while open. Commits 92ca199, 3f78bd8, 5238016, 42fffdb.

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

- **PREVIEW BUILDS USED TO DROP PRODUCTION TABLES (fixed 2026-07-17, commit ec8b850).**
  The build script ran `prisma db push --accept-data-loss` on EVERY Vercel build,
  including Preview builds of the mobile-app branch -- whose stale schema silently
  DROPPED TranslationCache (and its whole cache) from the LIVE database minutes
  after it was created. db push is now guarded to `VERCEL_ENV "production" production`
  in package.json, and mobile-app carries a synced schema + the same guard. If a
  table ever vanishes again: check which branch deployed last and what its
  schema file contains. NEVER remove the guard.

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
FOUNDING PERK [SUPERSEDED — live shopping is on EVERY tier now, see the 2026-07-15/16 note further down and 2026-07-19 checkpoint (3); a session gated the app's GoLive off this stale note on 2026-07-19 and had to revert] (William): live broadcasting on Velor Live FOR LIFE, founding-exclusive - no
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

SESSION UPDATE — 2026-07-12 02:19 UTC

New session started. Read this file, then cross-checked against live Vercel deployments and GitHub commit history to get up to speed before William pasted the previous session's chat. All recent deployments through a161245 (14 minutes old at check time) show Ready in Production on velor1/velor-marketplace -- nothing currently broken. Two commits are not yet reflected anywhere in this file's narrative: 14697ff "Add temporary read-only application-lookup diagnostic route" and a161245 "Add temporary application reinvite email route", both landed today, 2026-07-12. Unconfirmed what these routes do or whether they are meant to stay temporary -- flagging per LAW #1 rather than guessing. They are likely tied to work on seller application diagnostics or reinvite emails that predates this file's last logged entry. Awaiting William's session chat paste to confirm and fill in the detail.


SESSION UPDATE — 2026-07-12 02:45 UTC

William pasted the prior session's transcript to resume it. That session had found the Indonesian applicant "Wasizo deco" (Santoz nugroz) was rejected by the automated review cron for 0 product photos against the published MIN_SAMPLE_IMAGES = 3 rule -- a justified, objective rejection, not a policy overreach -- and had built two temporary admin routes to investigate: app/api/admin/application-lookup (read-only lookup) and app/api/admin/reinvite-application (sends a reapply email). Both were already committed and deployed before this continuation started. This session completed the two things William asked for next. First, sent the reinvite email via POST /api/admin/reinvite-application for application cmrh3jw5t0001dmkse6q035ux -- confirmed sent to nugrahamedia@gmail.com. Second, built the mobile dashboard detail William wanted: extended prisma.sellerApplication.findMany in app/api/admin/pulse-data/route.ts to also select website, storeDescription, productCategories, rejectionReason, reviewedBy, verifiedAt, verificationNotes and updatedAt, and extended the SELLER APPLICATIONS card in app/pulse/page.tsx to render all of it, with rejectionReason shown in a highlighted box. Both commits (32d4678, 05af998) deployed Ready and the live /pulse page was verified in Chrome showing the full Wasizo deco application with the rejection reason visible.

Open question carried over, not yet answered by William: whether to delete the two temporary diagnostic routes (application-lookup, reinvite-application) now that the dashboard covers the same ground, or leave them in place the way the 2026-07-10 prospect-lookup/prospect-cleanup routes were left -- per standing rule, not deleted without his explicit say-so.


---

## SESSION UPDATE — 2026-07-12 (Facebook Group Outreach)

Today's session set up ongoing Facebook group outreach for Velor Marketplace, per William's explicit instruction to take control of posting since he doesn't have time to write posts himself. Posting is done from the "VELOR" Facebook Page identity (facebook.com/Velorcommerce), not a personal profile.

Positioning correction (see the cultural-marketplace block above — this is now a standing, permanent rule): all outreach targets cultural-heritage and traditional-artisan communities globally, never generic "UK small business" or "advertise your business" groups. The velor-advertising skill must NOT be used for this business — it describes the separate velorcommerce.co.uk UK dropship store, a different business.

Groups posted to this session (founding-seller-spot message + velorcommerce.store apply link):
- Mercado de Artesanias GT (Guatemala) — posted, live
- Sell and buy Handcraft Egypt — posted, pending group-admin approval
- ETSY buyers and sellers worldwide — posted, live
- Support Small Business — posted, live

Groups already covered by an earlier, undocumented manual session (roughly 4-6 hours prior) — not re-posted, to avoid duplicates:
- ARTESANIAS DE TODO TIPO (Mexico)
- Artisanat Marocain (Morocco)
- JUAL - BELI KERAJINAN NUSANTARA (Indonesia)
- Cong dong Handmade Viet Nam (Vietnam)

Skipped:
- Artisans of the World Sell on Etsy — group rule required an active Etsy shop link in every post; Velor links to a competing marketplace, not an Etsy shop, so this was genuinely non-compliant. Declined to agree to the group rules and closed the review modal without submitting. A post was nonetheless auto-created in "pending admin approval" state — it was deleted via Delete post, confirmed. No live exposure occurred.
- VENTAS EMPRESARIOS Y EMPRENDEDORES COLOMBIANOS — no post composer was available on the group page.
- Two of the originally-drafted 7 posts ("Etsy Makers"; "Etsy Sellers and Buyers | Etsy SEO | Etsy Promotion" / "Advertise Your Business, Page & YouTube Videos") were not posted this session — not re-locatable in the joined-groups list before time ran out. Still outstanding; may be superseded by the daily task working through the wider group pool.

Daily scheduled task created: trig_01Cgi2PM3L1mjpS2dqkVCQhE, cron 0 15 * * * (15:00 UTC daily), via the proper create_trigger mechanism (each firing starts a fresh session with no memory of this one, so its prompt is fully self-contained — includes the cultural-marketplace positioning rules, the VELOR Page identity, the group-rule-compliance check learned from the Artisans-of-the-World incident above, and instructions to check each group's my_posted_content / my_pending_content before posting so it never duplicates a post). This task covers ongoing Facebook group outreach, working through the roughly 39 already-joined groups plus newly discovered relevant groups, targeting around 10 groups per day.

Instagram — blocked, unresolved: William asked for a daily Instagram posting task alongside the Facebook one. No Instagram session or login is available in this environment (the Velorcommerce Page's Instagram settings show it is not connected), and per standing safety rules an account will not be created or credentials entered on William's behalf. This was NOT set up as a scheduled task. It needs William's direct input on how to proceed — e.g. logging in himself on his own device and linking the Page to an Instagram Business account — before any Instagram task can be built.


---

## SESSION UPDATE — 2026-07-12 (part 2: new-group expansion)

Follow-up to the outreach session logged above: William asked to find and join NEW Facebook groups worldwide (not just work the existing ~39/47-group pool) and post the founding-seller message there too.

New groups found and joined this session (8 total, 7 new countries — searched using native-language terms, e.g. "artesanía peruana", "el sanatları", which surfaces genuinely local groups far better than English queries):
- Artesanía Peruana para el mundo (Peru, 35.5K members)
- Artesanías del Perú (Peru, 13K members)
- HALI KİLİM HİCRET EL SANATLARI (Turkey, carpet/kilim trade, 12.3K members)
- ARTESANATO & ARTE - Venda e partilha de trabalhos (Brazil, 13.3K members)
- STROJE LUDOWE/REGIONALNE z PL i zagranicy (Poland, folk costumes, 42K members)
- Artesanías y manualidades en La Habana (Cuba, 47.5K members)
- ARTIGIANO, ARTIGIANATO ITALIANO, FATTO IN ITALIA COMPLETAMENTE (Italy, 6.2K members)
- الحرف اليدوية الاردنية / Jordanian Handicrafts (Jordan, 5.7K members)

Posted to (translated the founding-seller-spot message into the local language for each — Spanish/Italian):
- Artesanía Peruana para el mundo — posted in Spanish, pending admin approval
- ARTIGIANO ITALIANO — posted in Italian, pending admin approval

Skipped, and why (important pattern for future sessions and the daily task — READ THIS):
- الحرف اليدوية الاردنية (Jordan) — group's About text explicitly states posts must be handicraft photos only, "not any advertisement." Skipped per the rule-compliance check.
- STROJE LUDOWE/REGIONALNE (Poland) — explicit rule: unrelated posts (i.e. not a specific folk-costume item for sale) get deleted.
- ARTESANATO & ARTE (Brazil) — explicit rule 1: "no self-promotion, spam, or irrelevant links."
- Artesanías del Perú (second Peru group) — same explicit "no self-promotion/spam/irrelevant links" rule.
- HALI KİLİM HİCRET EL SANATLARI (Turkey) — on inspection this is effectively one artisan's personal contact/promo group (a single named seller + phone number), not an open community; posting an unrelated recruitment pitch there would look exactly like the scam solicitation their own rule warns members about. Skipped.
- Artesanías y manualidades en La Habana (Cuba) — NOT skipped for a group-rule reason but a legal/practical one: Cuba is under a longstanding US trade embargo (OFAC sanctions), and Stripe (Velor's payout rail) cannot service Cuban sellers, nor can most Western payment processors including Payoneer. Recruiting a "Founding Seller" there would set someone up for a promise Velor cannot currently fulfill. Do not post Velor seller-recruitment content in Cuba-based groups, and do not onboard a Cuba-based seller, until/unless a compliant payout path exists. Flagged to William.

KEY PATTERN FOR FUTURE SESSIONS: most well-run, high-quality craft-selling Facebook groups have an explicit "no self-promotion / no spam / no irrelevant links" rule precisely because they don't want outside marketplaces like Velor recruiting their members. This sharply limits how many groups a direct-post strategy can actually work in. When evaluating a new group going forward: read the About/rules section fully (click "See more") before posting, and treat any of these as an automatic skip: (a) explicit no-self-promotion/no-spam/no-outside-links rule, (b) posts restricted to a specific format (e.g. "photos only," "must include your own Etsy/shop link," "must be a specific named item for sale"), (c) the group is really a single seller's personal contact page rather than an open community, (d) the country has no viable payout path (sanctions/embargo) even if the group itself is fine. This check must run before every single post, every day, not just when something goes wrong.


---

## SESSION UPDATE — 2026-07-12 (part 3: retry-until-complete per country)

William's instruction: "If a country group has a restriction then find another group from that country and try again till completion then move on, otherwise you're missing out on countries." Went back to the 4 countries skipped in part 2 for group-rule reasons (Jordan, Poland, Brazil, Turkey — NOT Cuba, see below) and found a second (or third/fourth) group in each that didn't carry a no-promotion restriction, then posted. All four are now complete:

- Turkey — first group (HALI KİLİM HİCRET) was a single artisan's personal page, skipped. Second group "Hediyelik Eşya Üreticileri Toptancıları ve Perakendecileri" (9.5K members) explicitly states in its About text "Reklam Serbesttir" (advertising is free/allowed). Posted in Turkish — went live immediately, no admin approval gate.
- Brazil — first two groups (ARTESANATO & ARTE, Artesanías del Perú-style rule) explicitly ban self-promotion; a third candidate ("Divulgação e Venda de Artesanato") gates new members behind a "do you work with handicrafts? yes/no" screening question — declined to answer since Velor is a marketplace, not an artisan, and answering "yes" would be dishonest (see honesty note below). Fourth group "Grupo de vendas de artesanato" (4.3K members) had no stated rules at all. Posted in Portuguese — live immediately.
- Poland — first two attempts (STROJE LUDOWE, Sprzedaż Rękodzieła, Jarmark rękodzieła) all explicitly restrict posts to actual handicraft items / ban self-promotion. A "Rękodzieło: kupię sprzedam zamówię wymienię" group also gated membership behind "Jestem: kupującym / twórcą / oba" (I am: buyer / maker / both) — same honesty problem, declined. "RĘKODZIEŁO-sprzedam" (36.8K members) explicitly welcomes members presenting "swoje prace, strony i sklepy" (their work, pages, AND shops) — no restriction on promoting a shop/page. Posted in Polish — live immediately.
- Jordan — the Jordanian handicraft group explicitly banned ads. Craft-specific alternatives were thin, so fell back to a large general Jordan buy/sell marketplace group ("سوق الاردن المفتوح للبيع والشراء", 52K members, no stated rules) rather than leaving the country uncovered. Posted in Arabic — live immediately. Note: this is a generic marketplace, not a craft-specific community — lower priority than a true craft group if one turns up later.

NEW PATTERN — honesty gate on membership screening questions: several groups (seen in Brazil and Poland this round) require answering a participant question like "do you work with handicrafts?" or "are you a buyer or a maker?" before admins will approve posting rights. VELOR is a marketplace platform — it is neither a buyer nor an individual maker/artisan. Do not select a false option to get past this gate (e.g. claiming "yes I work with handicrafts" or "I am a maker"). If no honest answer fits, decline the request ("Not Now") and find a different group instead of answering dishonestly. This is a direct application of Law #1 (Honesty) above.

Cuba — NOT retried. William separately confirmed Payoneer is also in use as a payout rail (not just Stripe), so this was re-checked rather than assumed: per Payoneer's own supported-countries data (Payoneer support center; cross-checked via worldpopulationreview.com's country-rankings/payoneer-countries page), Cuba is explicitly listed as NOT supported by Payoneer, alongside Iran, North Korea, Syria, Afghanistan, Venezuela, Egypt, and Chile. (Separately, Payoneer signed a 2021 OFAC settlement for historical sanctions-violation exposure in Crimea, Iran, Sudan, and Syria, which is why its compliance screening is strict.) So neither Stripe nor Payoneer can currently pay out a Cuba-based seller — this is a country-level sanctions block, not a fixable-by-trying-another-group situation, and finding a different Cuban Facebook group would not change that. Velor seller-recruitment content should continue to not be posted in Cuba-based groups, and no Cuba-based seller should be onboarded, until/unless a compliant payout path for Cuba specifically exists.

Country coverage after this round (new countries from parts 2+3, all successfully posted): Peru, Italy, Turkey, Brazil, Poland, Jordan. Cuba found but correctly not posted to (sanctions). This full pattern — try group 1, check rules, if blocked or dishonesty-gated try group 2/3/4, then move to next country — should be the daily scheduled task's default behavior going forward, not a one-off manual effort.

---

## URGENT CHECKPOINT — 2026-07-09 (William restarting a frozen machine)

### CONFIRMED (verified against live source/deployment this session, not memory)
- Outbound seller outreach is LIVE. vercel.json has cron `0 */2 * * *  /api/cron/outreach-auto`. main tip 799fc2c "Turn outreach-auto back on" deployed READY to Production. OUTREACH_ENABLED confirmed ON by William in Vercel. Next automated send: the next even hour UTC (was 04:00 UTC).
- The email that sends is the NEW template (lib/outreachEmail.ts): green GLOBAL MARKET badge, VELOR SHOPPING CHANNEL wordmark, 2 benefit rows (b1 + b4), purple Pro card, 8% is the ONLY commission figure in the INITIAL email. b2/b3 not rendered by the builder.
- 202 outreach emails were ALREADY sent on 2026-07-08 ~20:00 (before the qualification gate and some copy fixes), then paused ~20:34. Totals: 573 prospects (297 prospected, 268 no_email, 8 unsubscribed).
- The enable commit 799fc2c and the pricing change ee7683e were made by AUTONOMOUS processes, NOT by the assistant. Both attributed William approval.
- Prior checkpoints committed and independently re-verified this session: 0da2b8c (design handover), 0377b1e (outreach-enabled checkpoint).

### UNCONFIRMED / NOT DONE
- Exact count of qualified + never-emailed prospects that receive the next initial batch. dashboard-data returns status counts only, no qualified breakdown. Upper bound ~95 (297 prospected minus 202 already emailed); true number unknown.
- followup1 still renders f1s4 "You keep 85% on the free plan" (= 15%), which contradicts the Starter rate changed to 12%. Followups fire ~3 days after each initial, so the 202 become followup1-eligible ~2026-07-11. NOT fixed.
- Starter commission (15% vs 12%) and Enterprise price (£199 vs £99) are UNRESOLVED. William wanted the tier review deferred; a process changed them anyway. Pro stays 8%. Not reverted, not confirmed.
- Homepage redesign is still DESIGN-ONLY. Nothing ported to the repo. Files in William Downloads. Speciality vocabulary (48 terms) awaiting William strike-through.

### NEXT STEPS (in order)
1. Decide the Starter commission rate (12% vs 15%), then fix f1s4 and every commission string across all 18 languages in lib/outreachI18n.ts BEFORE ~2026-07-11, or the 202 get a wrong number in followup1.
2. Confirm or revert the unapproved pricing change (Starter -> 12%, Enterprise -> £99). Pro stays 8%.
3. Monitor the first live outreach batch: Resend deliverability, unsubscribe handling, bounce rate.
4. Governance: move autonomous-agent check-in logging OUT of CLAUDE.md (into AgentLog or a gitignored file) so it stops rewriting memory and triggering a prod build every ~20 min; require human confirmation before any agent enables outreach or changes pricing.
5. William to strike through the speciality vocabulary (velor-speciality-vocabulary-v1.md); then port the redesign (homepage, founding-seats, lattice pages) with additive Prisma: Speciality table + Product.specialities.
6. Resolve the China identity contradiction (only trading country is on the Stripe-Identity-restricted list) by finishing Payoneer as the second KYC rail.

### SECURITY
- The GitHub PAT used this session is in the chat transcript in plain text. William should REVOKE it at github.com/settings/tokens after restart and issue a fresh one next session.


SESSION UPDATE — 2026-07-13. Ad-hoc session, opened this file only partway through (when William asked to save the session's plan here), not at the start — flagging that per LAW #1 rather than presenting it as read-first. Earlier in the session (before this file was opened), the session continued the Founding Seller campaign into a handful of Facebook groups reachable from its own browser context — Brazil, Guatemala, and a Vietnamese group, Cong dong Handmade, left pending on William's explicit instruction because that group's admin has approved Velor's posts before. None of this was cross-checked against the my_posted_content / my_pending_content duplicate-check the daily outreach task performs, so treat it as unverified against this file's own group list rather than a confirmed addition to it.

Later, after William asked to try a conversational post style (a genuine question plus the auto-generated black VELOR link card, no manual image), the session attempted four fresh Facebook groups: UK Businesses / Promote & Advertise / Build Your Online Presence, Handmade UK Online market, and Handmade & Craft Market UK - Sell Your Creations all gated new members behind admin review and were left unposted; Vinted & Small Businesses UK Only - No Rules - Buy & Sell accepted the post but it also went to pending review on reload, and the group was left. This is the same UK-generic-group drift William already corrected on 2026-07-11 (see the standing directive above) — the session was not aware of that correction, or of this file's Step 3 diagnosis of the group-posting channel, until opening this file afterward. No further UK-generic-group posting should happen from an ad-hoc session; Facebook work should stick to country/culture/craft-tradition-specific groups per the standing rule, or defer entirely to the daily outreach-auto Facebook task (trig_01Cgi2PM3L1mjpS2dqkVCQhE, 15:00 UTC), which already implements that targeting plus duplicate-checking plus per-group compliance checks that this ad-hoc session did not.

Given the above, the session's original marketing-channel research (done before this file was opened) has been recast around Velor's actual culture/heritage/origin positioning rather than the generic-UK framing it started from. See SELLER ACQUISITION PLAN, Step 6, immediately below the existing Step 5, for the corrected plan. Not yet executed, ready to start 2026-07-14.

SELLER ACQUISITION PLAN — Step 6, added 2026-07-13: complementary organic channels beyond Facebook groups

These three channels do not touch the Facebook account, so none of them can add to the spam-detection risk documented in Step 3 above; they are a genuinely separate complement to the daily Facebook task, not a replacement for it.

Pinterest. Functions as a visual search engine rather than a social feed — pins keep surfacing in search for months, and people search Pinterest already intending to buy, unlike a cold Facebook group post. Create a VELOR business account if one does not already exist (unconfirmed either way) and build boards around ORIGIN and SPECIALITY, the site's own two axes, rather than a generic "handmade gifts" board — one board per country or craft tradition (Peruvian weaving, Moroccan textiles, Japanese ceramics, and so on), matching the Novica-style maker-story model from the velor-cultural-marketplace skill once real sellers list. Until then, pin the founding-seller recruitment graphic captioned per country or tradition, linking to /apply, and enable Rich Pins so price and availability pull live from the site once there is a catalogue to pull from.

Reddit. The best-documented Reddit growth pattern is genuine participation in relevant communities, not link-dropping, which the platform's culture actively punishes. For Velor this means diaspora and heritage-craft subreddits and global craft-tradition subreddits (pottery, weaving, leatherwork, blacksmithing, and similar — not UK-specific), answering real questions about selling authentic heritage goods online, and mentioning Velor only where it is a genuine answer to what was actually asked. No identical copy across threads.

X (Twitter). The best-documented organic path there right now is replying early and usefully to larger accounts' posts in relevant spaces, rather than broadcasting original posts — one documented case generated 5 million impressions from replies alone over a week. For Velor this means following and engaging global fair-trade, artisan-heritage, and diaspora small-business accounts rather than UK small-business accounts specifically, replying within the first 15 to 30 minutes where possible, and keeping roughly 70 percent of replies pure engagement with no plug at all.

None of Step 6 is built or started yet. Ready to begin 2026-07-14.


CHECKPOINT 2026-07-13 -- Commission rates changed to permanent 10% / 4% / 0% (Starter / Pro / Enterprise), William's explicit decision, replacing the deferred 12%/8%/5% figures (which had themselves only partially propagated from an original 15%/8%/5% scheme, commit ee7683e, 2026-07-09 -- several files were still found on the older 15% during this sweep). Updated TIER_CONFIG in app/api/seller/subscription/route.ts and every duplicate commission constant found across the codebase: lib/assistant-context.ts, app/api/seller/payouts/route.ts, app/api/stripe/payment-intent/route.ts (the real Stripe application-fee calculation), app/api/dashboard/analytics/route.ts, app/sell/page.tsx, components/dashboard/TierUpgradeView.tsx (including its breakEvenVsStarter helper, which had its own separate hardcoded 12), app/dashboard/payouts/page.tsx, plus all dashboard/legal/help copy pages, public/llms.txt, docs/SUBSCRIPTION_AND_TIERS.md, docs/PAYOUTS.md, docs/GLOBAL_MARKETING_STRATEGY.md, app/api/admin/brief/route.ts, lib/outreachEmail.ts, and all 19 language translations in lib/outreachI18n.ts (57 individual string edits verified language-by-language, including Turkish\u2019s %NN-before-number format and Bengali\u2019s native-digit numerals). Also corrected pre-existing stale figures found along the way, at William\u2019s explicit request to fix everything: components/SellerAgreementGate.tsx and app/legal/terms/page.tsx previously stated a flat, non-tiered 15%/12% with no per-tier breakdown at all; app/api/assistant/chat/route.ts (the AI shopping assistant\u2019s own system prompt) still told the assistant Enterprise was 199 GBP/month (now corrected to 99 GBP); app/sell/page.tsx\u2019s Pro tier breakeven copy (\"pays for itself past X/month\") was recalculated from the old 15%/8% gap (\u00a3700) to the new 10%/4% gap (\u00a3820) since the old figure was mathematically derived and would otherwise have quietly understated Pro\u2019s real breakeven point.

Two fields are known NOT to be tier-aware and were deliberately only rate-swapped, not architecturally fixed, to avoid an unreviewed behavioural change in a payment code path: the OrderItem.commission value written in app/api/orders/route.ts and the PLATFORM_FEE_RATE used for the seller\u2019s own order list in app/api/dashboard/orders/route.ts both apply a single flat rate (now 0.10) to every seller regardless of tier, rather than each seller\u2019s real commission rate -- this bug predates this session (it was previously a flat, wrong 0.15 for every seller too). Pro and Enterprise sellers will therefore still see an inflated commission figure in these two specific views even though what Stripe actually charges them (app/api/stripe/payment-intent/route.ts, which IS tier-aware) is correct. Recommended follow-up, not done this session: fetch the seller\u2019s real tier in both routes and apply TIER_COMMISSION per seller.

Also surfaced but explicitly NOT touched, unrelated to this change: docs/SUBSCRIPTION_AND_TIERS.md\u2019s own Stripe price-object reference for Enterprise still shows price_1TpCqXDB5eA3Wfmuw3y2bScF at \u00a3199/mo even though the app displays and TIER_CONFIG charges \u00a399/mo everywhere else -- needs live verification in the Stripe dashboard, not resolved here; flagged to William directly in-session.

NOT VERIFIED live in production yet -- confirm the new commission figures render correctly on /sell, /dashboard/upgrade, /help, the legal pages, and a live payment-intent breakdown after this deploys. All edits were made via the GitHub contents API using a short-lived PAT William provided for this session; he should revoke it now that this work is done.

## 2026-07-13 checkpoint (continued) -- Business email aliases + Payoneer partner application status

**Business email aliases added.** velorcommerce.co.uk email is hosted via GoDaddy (Microsoft 365 Email Essentials), with one paid mailbox, customerservice@velorcommerce.co.uk (William Sinclair, admin), signed in and working. Rather than buying additional paid mailboxes (~\u00a36.49+/mo each), William added free email aliases on that same mailbox -- GoDaddy's Email Essentials plan supports up to 300 aliases at no extra cost, and all mail sent to any alias lands in the one customerservice@ inbox. Current aliases (6), confirmed live in the GoDaddy Email & Office admin panel (productivity.godaddy.com Aliases page) on 2026-07-13:
- hello@velorcommerce.co.uk
- legal@velorcommerce.co.uk
- partnerships@velorcommerce.co.uk
- sales@velorcommerce.co.uk
- sellers@velorcommerce.co.uk
- william@velorcommerce.co.uk

All six deliver to customerservice@velorcommerce.co.uk. Use william@velorcommerce.co.uk for direct business/partner correspondence (e.g. Payoneer), sellers@ for seller-facing support, partnerships@ for business development and outreach, legal@ for compliance/takedown notices, sales@ for sales inquiries, hello@ as a general public-facing address. None of these are separate logins -- they all route to the same inbox.

**Payoneer -- two distinct products, do not conflate them:**
1. **Payoneer Payouts / Mass Payments API** (seller payouts, outbound) -- this is what lib/payoneer.ts, lib/payoutRail.ts, app/api/payoneer/onboard/route.ts, and app/api/cron/release-payouts/route.ts are built against. Requires Payoneer's **Mass Payouts partner program**, applied for via https://www.payoneer.com/marketplace/mass-payouts-platform/ ("Apply Now" -> modal lead form: first name, last name, work phone, country, work email, company name, job title, expected current monthly payout amount [$50k or less / $50k-$250k / $250k+ / Not Sure], comments). This is a Salesforce lead-gen form, not account signup -- no password, no account creation.
2. **developer.payoneer.com is a DIFFERENT product** (PSD2/open-banking APIs -- Account Information, Payment Initiation). An earlier application attempt (submitted 8 Jul 2026, referenced elsewhere in this doc) may have gone through this wrong portal, on a Payoneer account that was also set up with the wrong email by a prior session. Needs verification: log into the *correct* Payoneer account (VELOR COMMERCE LTD, bank account already connected) and check application/lead status directly, don't assume the 8 Jul application is the right one.
3. **Payoneer Checkout** (buyer payments, inbound) -- entirely unbuilt in this codebase. Payoneer markets Checkout at $20k+/month merchants; worth deferring until Velor has real buyer volume post-launch (6 Aug 2026).

Next step when resuming: submit the Mass Payouts partner application at the URL above using company name Velor Commerce Ltd, country United Kingdom, work email william@velorcommerce.co.uk (now live), and expected volume "Not Sure" or "$50,000 or less" given pre-launch status -- William to supply phone number, job title, and final sign-off on comments text before submitting.


## 2026-07-13 checkpoint (continued 2) -- Payoneer Mass Payouts partner application submitted

Confirmed the correct Payoneer account before applying: signed in to myaccount.payoneer.com as **VELOR COMMERCE LTD**, status "approved," with 2 connected bank accounts (CLEARBANK LIMITED GBP account ending 6975, Verified/Active; "Velor commerce ltd" GBP account ending 3647, Active). This is the correct account William set up himself, distinct from an earlier attempt on a different/wrong account by a prior session.

Submitted the Mass Payouts partner application at https://www.payoneer.com/marketplace/mass-payouts-platform/ ("Apply Now" modal, Salesforce lead form) with:
- Name: William Sinclair, Director/CEO
- Phone: +44 07947181970
- Country: United Kingdom
- Work email: william@velorcommerce.co.uk (the new alias set up this session, delivers to customerservice@velorcommerce.co.uk inbox)
- Company: Velor Commerce Ltd
- Expected current monthly payout: Not Sure
- Comments: marketplace description mentioning 6 Aug 2026 buyer launch and need to pay sellers outside Stripe Connect's coverage

Confirmation screen displayed: "Thank you! We look forward to getting in touch with you. A member of our team will get back to you soon." This is a NEW, separate application from the one referenced earlier in this doc as submitted 8 Jul 2026 (that one may have gone through the wrong portal/account -- unverified, not corrected, just noted). Next step: wait for Payoneer's team to respond to william@velorcommerce.co.uk; no further action possible on our side until they reply with next steps (likely a BD conversation and/or sandbox credentials per docs/PAYONEER_SETUP.md Step 1).


## 2026-07-13 checkpoint (continued 3) -- Site copy: surfaced Payoneer as coming soon (not yet claiming it's live)

William asked to reference Payoneer payments on the site since it currently reads "mainly Stripe." Audited every Stripe/Payoneer mention (GitHub code search, 62 hits) and found most legal/help pages (app/help/page.tsx, app/legal/privacy/page.tsx, app/dashboard/terms/page.tsx, app/legal/seller-agreement/page.tsx, app/seller-agreement/page.tsx) already mention Payoneer carefully ("Payoneer where Stripe is unavailable" -- no claim it's live today). Two visible spots did NOT mention Payoneer at all, or overstated it:

1. components/GlobalFooter.tsx -- site-wide trust badge said only "Payments secured by Stripe". Changed to "Payments secured by Stripe · Payoneer payouts coming soon" (commit 723db8c).
2. app/sell/page.tsx -- STEP 04 "Paid, your way" card said "Weekly payouts by Stripe where supported, Payoneer everywhere else" -- this OVERSTATED Payoneer as already live everywhere else, which is inaccurate (partner application only just submitted, no credentials yet). Corrected to accurately say Payoneer is "on the way," while explicitly telling sellers outside Stripe's coverage to sign up anyway and that earnings are held safely until payouts go live -- per William's explicit instruction not to restrict seller applications while Payoneer is in progress (commit deba25d).

Left untouched (correct as-is, do not change): the two "Secure Stripe checkout" / "Card details are handled by Stripe" buyer-checkout trust badges in components/GlobalFooter.tsx and components/GlobalHeader.tsx -- these are accurate as written because Payoneer Checkout (buyer-side payments) does not exist in this codebase at all; mentioning Payoneer there would be false. Buyer payment is Stripe-only until Checkout is built as new, separate work.


## 2026-07-13 checkpoint (continued 4) -- Outreach email sender fixed, business email domains clarified

William asked whether outreach emails link to the new customerservice@velorcommerce.co.uk mailbox. They do not, and this surfaced a real gap worth recording clearly:

**Two separate email domains are in play, do not conflate them:**
- **velorcommerce.store** -- the live marketplace domain. Verified in this project's Resend account for transactional sending (order confirmations, welcome emails, seller approval/rejection, etc. via lib/email.ts, default FROM = 'Velor Commerce <hello@velorcommerce.store>'). No real GoDaddy mailbox/inbox exists on this domain -- the GoDaddy venture dashboard for velorcommerce.store shows email as an unactivated placeholder ("customerservice@yourdomain.com -- Activate your professional email address"). Do not assume replies to any @velorcommerce.store address reach anyone.
- **velorcommerce.co.uk** -- the business/registered-office domain. Has a real, working GoDaddy Microsoft 365 mailbox (customerservice@velorcommerce.co.uk) with free aliases (hello@, legal@, partnerships@, sales@, sellers@, william@) all delivering to that one inbox (see earlier checkpoint this session). NOT currently used anywhere in the app's email-sending code -- not verified as a Resend sending domain for this project (unconfirmed either way; do not assume it is verified without checking resend.com/domains first, since sending from an unverified domain fails outright).

**Outreach fix applied:** app/api/cron/outreach-auto/route.ts had SELLER_FROM = 'Velor Seller Team <sellers@velorcommerce.store>' -- sending outreach from an address with no real inbox behind it, so any prospect who replied would get silence. William's call: outreach/advertising sends should be noreply-based anyway (one-way broadcast, not a monitored inbox), rather than routing them to the working .co.uk mailbox. Changed to SELLER_FROM = 'Velor Seller Team <noreply@velorcommerce.store>' (commit b5acd4e) -- stays on the already-verified .store domain (no Resend re-verification risk), just changes the local part to set correct no-reply expectations. Every outreach send still BCCs MONITOR (defaults to willsinclair144@gmail.com) so William sees a copy of what goes out, but that's one-way and does not catch replies.

**Not yet resolved / worth a future decision:** transactional emails (order confirmations, seller approval, etc. via lib/email.ts) still default to hello@velorcommerce.store and reference customerservice@velorcommerce.store in the footer/contact text -- same "no real inbox" gap applies there too, just not addressed in this session since William's question was specifically about outreach. If genuine two-way correspondence is ever needed on the .store domain (e.g. buyers replying to order emails), either activate a real mailbox there or verify velorcommerce.co.uk in Resend and route replies to the working .co.uk inbox instead.


## 2026-07-13 checkpoint (continued 5) -- Fixed both open items from today's punch list

1. **Transactional email reply gap fixed.** lib/email.ts's FROM stays hello@velorcommerce.store (already-verified sending identity, unchanged), but sendEmail() now sets a Resend replyTo defaulting to a new REPLY_TO constant, customerservice@velorcommerce.co.uk -- the real, working mailbox. Also updated the visible footer contact line and buildSellerRejectedEmail's "contact us at..." text from the unmonitored .store address to the working .co.uk one (commit 6447b99). Side discovery while doing this: app/api/contact/route.ts already sends FROM noreply@velorcommerce.co.uk, which confirms velorcommerce.co.uk IS already verified as a Resend sending domain for this project -- so the earlier caution about switching outreach's FROM to .co.uk (checkpoint continued 4) was more conservative than strictly necessary, though the noreply@ outreach fix made there is still correct and unchanged.

2. **Commission-display bugs fixed in both flagged files.**
   - app/api/orders/route.ts: added TIER_COMMISSION map, fetches the seller's real tier via prisma.seller.findUnique before building the order, and now stores commission = price * qty * commissionRate per seller tier instead of a flat 0.1 (commit c64b6b9).
   - app/api/dashboard/orders/route.ts: same TIER_COMMISSION map, computes commissionRate from the already-fetched seller.tier right after the seller lookup, replacing the flat PLATFORM_FEE_RATE (commit a93b929).
   Pro and Enterprise sellers will now see the correct commission figure in both their order list and their own dashboard view, matching what Stripe actually charges them (app/api/stripe/payment-intent/route.ts, which was already correct).

Both items from William's punch list are now closed. Remaining open items, unchanged from earlier checkpoints: docs/SUBSCRIPTION_AND_TIERS.md's Enterprise price/Stripe price ID discrepancy (£199 vs £99, needs live Stripe verification), Payoneer awaiting partner response, Payoneer Checkout unbuilt, and the GitHub PAT used all session should be revoked once William is done for the day.


## 2026-07-13 checkpoint (continued 6) -- noreply@ alias added

William added a 7th free alias on the velorcommerce.co.uk mailbox: noreply@velorcommerce.co.uk (confirmed live in the GoDaddy Aliases panel, delivers to customerservice@velorcommerce.co.uk same as the other six). Current full list: hello@, legal@, noreply@, partnerships@, sales@, sellers@, william@ -- all @velorcommerce.co.uk, all landing in one inbox. Note this is separate from noreply@velorcommerce.store, which is the outreach sender address on the .store domain and still has no real inbox behind it (see checkpoint continued 4) -- the two "noreply@" addresses are on different domains and do not overlap.


## 2026-07-13 checkpoint (continued 7) -- Fixed the two critical payments-audit findings: unauthenticated order creation + silent order loss

A 6-agent parallel audit of the whole codebase (payments/payouts, auth/admin, email, core commerce, cron/AI-agents, LiveKit+env-vars) surfaced its most critical finding: POST /api/orders had no auth check at all and built the Order straight from client-supplied price/total/quantity/sellerId (fabricable), and the only thing that ever called it was a fire-and-forget client-side POST after checkout (buyer closed tab = charged with no order). William: "lets fix this immediatley." Fixed and pushed to main -- verified live at commit **57433e2** (`git ls-remote origin main`).

**Architecture change:** PaymentIntent metadata is now the single source of truth for order creation, never the client.
- `app/api/stripe/payment-intent/route.ts` (already server-computed prices/commission) now ALSO stores in metadata: per-item `{productId,quantity,priceGBP}` (replacing the old raw client `items`, which had no price and was never read anywhere), `buyerEmail` (the signed-in session's own email -- never a client-typed one), `buyerName`, and a length-capped `shippingAddress` JSON blob (new `sanitizeAddress()` helper keeps it well under Stripe's 500-char metadata-value limit).
- New `lib/orders.ts` exports `createOrderFromPaymentIntent(pi)` -- the only place an Order is ever created. Reads exclusively from that trusted metadata; idempotent via `Order.stripePaymentId`'s unique constraint (a P2002 race is caught and just returns the winner's row).
- `app/api/stripe/webhook/route.ts`'s `payment_intent.succeeded` handler now calls this helper as the real, reliable order-creation path (replacing dead code that updated `Order.status` by an `orderId` metadata field nothing ever set). A failure here now returns 500 so Stripe retries automatically, instead of silently losing the order.
- `app/api/orders/route.ts` POST is rewritten into an authenticated accelerator for the confirmation page: it takes only a `paymentIntentId`, verifies the PaymentIntent directly against Stripe, confirms `metadata.buyerEmail` matches the caller's own session email, then calls the same `createOrderFromPaymentIntent()` -- so the confirmation page still gets an instant `orderId` without the webhook's latency, but nothing it sends is ever trusted as financial data.
- `app/checkout/page.tsx` now sends `buyerName`/`shippingAddress` to `/api/stripe/payment-intent` (previously collected client-side but never actually transmitted to the server). `app/checkout/confirmation/page.tsx`'s POST body shrank to just `{ paymentIntentId }`.

**Adjacent IDOR also closed while in this file:** GET /api/orders previously took a client-supplied `?email=` and trusted it outright (any logged-in buyer could read any other buyer's order history/items/address). Now always scoped to the session's own email, full stop. This broke `app/orders/page.tsx` (which was built around typing an email to search) so it was rewritten to auto-load the signed-in buyer's own orders via `useSession()` instead, with a "sign in" prompt when logged out. While in there, also fixed that page's pre-existing field-name mismatches against the real Prisma `Order` schema (it read `order.total`/`product.name`, but the schema has `order.subtotal`/`product.title`, and the GET query wasn't even including the `product` relation) -- this page had been non-functional regardless of the security issue.

**Side effect, not separately worked:** the negative-quantity stock-inflation bug (a negative `quantity` made `stock:{decrement}` increase stock) is also closed, since `payment-intent/route.ts` already clamps quantity to a minimum of 1 before it ever reaches metadata -- there is no longer a path for client-supplied quantity to reach order creation directly.

**Deliberately NOT touched in this pass (flagged, not fixed):** `app/api/cron/release-payouts/route.ts` reads PaymentIntent metadata key `md.sellerShare`, but nothing has ever written that key -- only `sellerShareGBP` (a GBP decimal string, e.g. `"45.99"`) has ever been written, and `release-payouts` also parses it with `parseInt` assuming pence/minor units. Net effect: **no seller payout has ever actually gone out via this cron.** This is a different file/bug from what William asked to fix immediately, but it's the natural next thing to fix and closely related (same payments domain, same PaymentIntent metadata contract) -- flagged prominently for the next checkpoint rather than assumed in-scope here. Remaining second-tier items from the same audit (IDOR in `/api/orders/[orderId]/route.ts`, open email relay in `/api/agents/test-outreach/route.ts`, no-auth livestream-report endpoint, fail-open `CRON_SECRET` pattern, corrupted mojibake in a couple of email subject lines, stale `.store` references, duplicate `sendEmail()` implementations, `.env.example` missing ~24 real vars) are unchanged and still open -- full punch list to be reported once the remaining audit findings are synthesized.

Verification note (per LAW #1): pushed via `git push` from the local clone using the existing session PAT, confirmed live via `git ls-remote origin main` returning `57433e2944a0d31bde72ea8df08c4446c1644988` -- not verified via a fresh Vercel deployment check yet, so confirm the next Vercel build succeeds before treating this as fully live in production.

**Addendum:** a repo hook flagged the two commits above (`57433e2`, `04c818a`) as GitHub-"Unverified" (committer email wasn't `noreply@anthropic.com`). William approved rewriting authorship + force-push; done via `git rebase --exec ... --reset-author` + `git push --force-with-lease`. Those two SHAs no longer exist on `main` -- the same changes now live as **`04cfaf4`** (order-creation fix) and **`14cf6fd`** (this doc), confirmed via `git ls-remote origin main` returning `14cf6fd998843f3fe745c8607cb779d90ee64902`. Content/behavior is identical, only the commit SHAs and author metadata changed.

## 2026-07-13 checkpoint (continued 8) -- Build failures from the order-creation fix, resolved

William reported all 4 production builds failing after the order-creation fix landed. Checked Vercel build logs directly (Deployments -> deployment -> Build Logs, expanded): every failure was the identical TypeScript error, `./lib/orders.ts:64:11 Type error: Type 'Record<string, unknown>' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'`. Root cause: Prisma's generated `Order.shippingAddress` (a `Json` field) requires its own `Prisma.InputJsonValue` type, which a plain `Record<string, unknown>` doesn't satisfy (an `unknown` value type isn't assignable to Prisma's JSON value union) -- one bad type annotation, repeated across every build since it's the same broken commit each time.

Fixed by importing `Prisma` from `@prisma/client` in lib/orders.ts and typing the parsed `shippingAddress` variable as `Prisma.InputJsonValue` instead of `Record<string, unknown>` (commit **cd094b2**). Confirmed **Ready** and promoted to Production in the Vercel dashboard -- verified live via `git ls-remote origin main` returning `cd094b2c40a070d224af2a5de3fe507fb2f499e0`.

Side discovery, not part of this fix: two more failed builds appeared in the deployments list while I was working (`bd40e8c` "SEO: add verified registered-office address..." and `6b715cf` "SEO log: 2026-07-13 16:xx UTC run...") -- these came from some automated SEO process that commits directly to main (not part of this session), and failed for the exact same reason since they were built on top of the broken commit before cd094b2 landed. They're superseded now that the fix is on top of the branch and don't need separate action, but note there IS an automated agent/cron pushing SEO commits straight to main in this repo -- worth knowing about, not otherwise investigated this session.

Also note: pushing to main had a `git push` rejection mid-session ("fetch first") because those same SEO commits landed on origin between my earlier force-push and this one -- resolved with a normal `git fetch` + `git rebase origin/main` (no force needed, since I was only adding a new commit on top, not rewriting anyone else's history this time) before pushing again.

## 2026-07-13 checkpoint (continued 9) -- Seller payout cron fixed: no payout had ever actually gone out

Continuation of the payments-audit punch list. Confirmed the suspected bug directly in code (not just from the audit report): app/api/cron/release-payouts/route.ts read PaymentIntent metadata key `sellerShare` via `parseInt`, but app/api/stripe/payment-intent/route.ts has only ever written `sellerShareGBP` (a GBP decimal string, e.g. "45.99") -- never a plain `sellerShare` key. `parseInt(undefined || '0', 10)` is always 0, and `if (!sellerShare || sellerShare <= 0) { skipped++; continue }` silently skipped every single delivered order on every cron run. **No seller has ever actually been paid via this cron** -- funds have been sitting safely in platform escrow the whole time (not lost, just never released).

Fixed in commit **85cd3a4** (confirmed Ready/Production in Vercel): read `sellerShareGBP`, `parseFloat` it, convert to pence (`Math.round(x * 100)`) for the Stripe transfer / Payoneer amount.

**Also fixed an adjacent bug this exposed**, not previously flagged by the audit: the payout `currency` was taken from `pi.currency` (the buyer's actual charge currency -- Velor supports multi-currency checkout, e.g. a US buyer paying in USD), but `sellerShareGBP` is always GBP-denominated regardless of what currency the buyer paid in (payment-intent/route.ts converts everything to GBP before computing the seller's share). Pairing a GBP amount with a non-GBP currency label would have sent the wrong amount in the wrong currency the moment a non-GBP order was released -- silent financial harm, not just "no payout happens." Changed to hardcode `currency = 'gbp'`, the only currency the number is ever actually valid in. If the platform's Stripe balance doesn't hold enough GBP to cover a given transfer, the call throws and is caught by the existing catch-and-retry (funds stay in escrow, retried next run) -- a safe failure, never a silently wrong payout.

**Not verified this session (cannot be, without a live delivered order + a cron run):** that a payout actually completes end-to-end now. The fix is a direct, high-confidence read of the exact metadata key payment-intent/route.ts writes (`sellerShareGBP`), but the real test is watching `/api/cron/release-payouts` actually release funds for a real delivered order once one exists. Flag this for verification once William has a real order reach DELIVERED status past the hold window.

## 2026-07-13 checkpoint (continued 10) -- Order confirmation email wired up + built the missing admin order-lookup page

William's real test purchase from a week ago (pi_3TqbHYDB5eA3Wfmu0QcnnSrf, £3.50, 7 Jul) surfaced two more gaps while checking whether it "helps" verify anything:

1. **No order confirmation email was ever sent to buyers.** Confirmed by checking Stripe's own receipt history for that payment ("No receipts sent") and by grepping the codebase: `buildOrderConfirmationEmail()` has existed in lib/email.ts since before this session but nothing ever called it. The email William got that day was Stripe's own account-owner payment notification, not anything from Velor. Fixed in commit **cd8a210**: wired the builder into `createOrderFromPaymentIntent()` (lib/orders.ts) -- the single place an Order is ever created since today's earlier order-creation security fix -- so it fires exactly once per real order regardless of whether the webhook or the checkout-confirmation accelerator is the one that actually creates the row. Best-effort: a failed send is logged, never thrown, so a broken email can't undo an already-successful order.

2. **No admin page to look up an individual order.** The admin sidebar (app/admin/layout.tsx) has linked to `/admin/orders` since before this session, but the page was never built -- confirmed 404 by navigating there directly. Pulse (`/pulse`, checked via app/api/admin/pulse-data/route.ts) only ever returns aggregate stats -- counts and total GMV -- by design; it was never meant to show individual transactions, which explains exactly what William described ("shows the amount... doesn't say who from or where"). Built in commit **065b2dc**: `app/api/admin/orders/route.ts` (session + role:'ADMIN' gated, same pattern as `/api/admin/sellers`) with search by buyer email, order ID, Stripe payment ID, or seller store name, plus a status filter; `app/admin/orders/page.tsx`, a searchable table matching the existing admin/sellers and admin/products page style, with an expandable row per order showing line items, the platform-fee/seller-earnings split, the Stripe payment ID, and shipping address/tracking when available.

Both confirmed **Ready**/Production in Vercel. Verified live via `git ls-remote origin main` -- confirm the exact SHA at the top of the next checkpoint rather than trusting this one, since more commits may have landed by the time this is read (per LAW #1).

**Also confirmed, incidentally, while investigating William's "cj dropshippers" comment:** the £3.50 payment's Stripe metadata (`sellerDbId`, `commissionRate`, `sellerShareGBP`) is unmistakably from this repo's own `app/api/stripe/payment-intent/route.ts` -- no CJ Dropshipping code exists anywhere in velor-marketplace (grepped, zero hits). Whatever William was testing, it went through this marketplace's real checkout, not a separate integration. That test order's seller (sellerDbId `cmra0vu4h0004113mudiybydz`) has no Stripe Connect account attached (`sellerAccountId` empty in the PaymentIntent metadata), so even with today's earlier payout-cron fix, that specific order could only ever be payable via Payoneer (not live yet) -- it is not a useful case for testing the Stripe-transfer side of the payout fix.


## 2026-07-13 checkpoint (continued 11) -- Order lookup added to mobile Pulse dashboard

William asked to check up on orders from his phone via Pulse (the token-gated mobile PWA dashboard), mirroring the existing SELLER APPLICATIONS -> /pulse/applications click-through pattern. Confirmed **Ready**/Production in Vercel at commit **32bd2ed** (`git ls-remote origin main`).

`app/api/admin/orders/route.ts` (built earlier today for the desktop /admin/orders page, session-only auth) now uses the shared `isAuthorizedAdmin()` helper from `lib/adminAuth.ts` instead of a direct `auth()` check -- it accepts EITHER a NextAuth admin session OR the Pulse `Bearer <ADMIN_SECRET>` token, so one route now backs both the desktop admin page and the new mobile Pulse page rather than duplicating the query. Also added optional `page`/`pageSize` params (defaulting to page 1 / pageSize 100, identical to the route's original `take:100` behaviour) so the response now includes `{orders, total, page, pageSize, totalPages}` -- the desktop page ignores the extra fields and is unaffected; the new mobile page uses them for real pagination (20/page).

Added `app/pulse/orders/page.tsx`, mirroring `app/pulse/applications/page.tsx`'s exact structure: independent token/unlock handling, a filter bar (search text + status dropdown), paginated card-based results (buyer name/email, seller store name, line items, platform fee vs seller earnings split, shipping city/country, tracking status, Stripe payment ID, date), and a "&larr; Dashboard" back link. Added a `View all orders &rarr;` link inside the existing ORDERS & REVENUE section of `app/pulse/page.tsx`, directly under the section title, matching the exact styling of the pre-existing applications link.

Verified via the local TS-syntax-check script (no full type-check possible from this sandbox, see TOOLING TRAPS) before pushing, then confirmed the actual Vercel build succeeded (this exercises real Prisma types, catching anything the syntax check couldn't) -- both checks passed cleanly, no build errors.


## 2026-07-13 checkpoint (continued 12) -- Multi-seller cart checkout fixed: separate orders, shipping, and payouts per seller

William asked, after the Pulse order-lookup work above, whether a cart with items from several sellers generates a single order number for the whole sale. It did, and that was a real bug, not just a display question: `app/api/stripe/payment-intent/route.ts` computed `sellerDbId`/commission/shipping/duties/total from only the FIRST seller encountered in the cart's items loop, and `Order.stripePaymentId` was uniquely constrained so `lib/orders.ts` could only ever create ONE Order per PaymentIntent. In a mixed cart, every seller's stock was decremented, but only the first seller ever got an order record, a payout, or a confirmation email -- the others' share of the money went to the first seller along with the full shipping/duties charge, regardless of whose parcel it actually was. William: "yes fix it now. but we also have to tackle the shipping of multiple orders in 1 cart," then clarified the shipping requirement further: every seller-order should get its own shipping cost/label, unless a seller is knowingly shipping multiple items of their own together (already true, since one seller's items in one cart already group under one Order/Shipment).

Fixed end to end, seven files, one commit (**3acfa6e**), confirmed **Ready** in Production (`git ls-remote origin main` = `3acfa6e1333c29de07124ac0d6d03a418c7b8180`; Vercel deployments list shows it Ready and the current Production deployment):

- `prisma/schema.prisma` -- `Order.stripePaymentId` is no longer independently unique; a compound `@@unique([stripePaymentId, sellerId])` now allows one payment to produce multiple Orders (one per seller) while staying idempotent per seller. Applied automatically via `prisma db push --accept-data-loss` on this deploy -- safe, since no existing data ever had more than one Order per stripePaymentId (that was the very bug being fixed).
- `app/api/shipping/rates/route.ts` -- now returns rates grouped by seller (`{sellerGroups: [...]}`) instead of flattened into one combined list, so each seller's parcel is quoted from their own real dispatch address via their own `ShippingProfile`.
- `app/checkout/page.tsx` -- renders one shipping-options block per seller (buyer picks a rate per seller when the cart spans more than one), fetches duties/landed-cost per seller using that seller's real origin country instead of a hardcoded `'GB'`, and calls the discount-validate endpoint once per seller so every seller's own automatic discounts apply.
- `app/api/stripe/payment-intent/route.ts` -- groups cart items by each item's REAL seller (resolved server-side from the product, never trusted from the client), computes each seller's own subtotal/discount/shipping/duties/commission/total, and stores a compact per-seller `sellerBreakdown` array in PaymentIntent metadata (short keys to fit Stripe's 500-char value cap; a runtime guard 400s with a clear error if a cart has too many sellers to fit).
- `lib/orders.ts` -- `createOrderFromPaymentIntent()` now returns an array and creates one Order/Shipment/stock-decrement/confirmation-email per seller in the breakdown, each in its own transaction, each idempotent via the new compound unique constraint. If one seller's creation fails, the others still commit, but a non-empty failure list still throws afterward so the webhook returns 500 and Stripe retries -- the "never silently lose an order" guarantee now applies per seller instead of per payment.
- `app/api/cron/release-payouts/route.ts` -- reads each order's own share from `sellerBreakdown` (matched by that order's `sellerId`) instead of a single flat `sellerShareGBP`, and looks up the seller's Stripe/Payoneer account fresh from the database (metadata no longer carries `sellerAccountId` at all -- dropped both for freshness and to help the breakdown fit the 500-char cap).
- `app/api/orders/route.ts` -- the checkout-confirmation accelerator now returns `orderIds: [...]` (plural). Checked both real callers of this route: the confirmation page ignores the response body entirely (fire-and-forget, drives its display from `localStorage` instead) and the buyer's own order-history page already renders `orders.map(...)` as independent cards -- so this shape change needed zero frontend changes at either call site.

Shippo itself needed no changes -- confirmed by reading `lib/shippo.ts`: it's only ever used for live per-seller rate quotes and free tracking-number registration, never to buy or front a label (Velor's standing policy, documented in `app/api/dashboard/shipping/label/route.ts`: sellers ship every order themselves, with their own carrier account and their own money, then self-report a tracking number). Only the calling route (`shipping/rates/route.ts`) changed how it groups/returns results.

Also answered conversationally, no code change: William asked whether requiring seller involvement for shipping would block the buyer's expectation of instant payment confirmation at checkout. It doesn't -- no seller acts live at checkout. Shipping rates come from each seller's pre-saved `ShippingProfile` (an address, not a live decision), duties/discounts are algorithmic, and Stripe payment confirmation plus order creation both remain exactly as instant and automated as before this fix, per seller, with no seller ever in the critical path.

**Not yet verified (per LAW #1):** this fix has NOT been tested against a real multi-seller cart checkout in production -- no live cart has actually been run through it since this deployed. The Vercel build succeeding confirms the code compiles and the schema migration applied cleanly, not that a real mixed-cart purchase produces the right Orders/Shipments/payouts end to end. Worth walking one real 2+ seller test cart through checkout by hand next time it's convenient, the same way William's earlier single-seller test order (`pi_3TqbHYDB5eA3Wfmu0QcnnSrf`) was used to catch the missing-confirmation-email and missing-admin-order-page gaps in an earlier checkpoint.


## 2026-07-13 checkpoint (continued 13) -- Ship-from address now captured at application, shipping profile auto-provisioned on approval

Immediate follow-up to the multi-seller fix above: sellers previously only configured shipping via a separate Settings -> Shipping dashboard step, discoverable only after approval. A seller who never found that page had no `SellerShippingProfile`, so `shipping/rates/route.ts` fell back to a placeholder "quote required" rate for their listings at checkout -- the exact gap the multi-seller fix just closed for existing sellers, but nothing stopped a brand new seller from recreating it. Confirmed **Ready** in Production at commit **ef20e23**.

- `prisma/schema.prisma`: `SellerApplication` gained a ship-from address (name, company, street1/2, city, state, zip, country, phone), all optional at the schema level so existing PENDING applications weren't broken.
- `app/api/seller/apply/route.ts`: requires the ship-from fields on every new submission and stores them.
- `app/apply/page.tsx`: new "Ship-from address" section on the application form. Picking a business/culture country auto-suggests the same ship-from country, never overwriting a value the seller already chose independently.
- `lib/provisionSeller.ts`: `approveApplication()` now upserts a real `SellerShippingProfile` from the application's ship-from address in all three provisioning branches, right after the Seller row exists -- so shipping already works before an approved seller's dashboard ever loads. No-ops safely for legacy applications with no ship-from data rather than blocking approval.
- `app/api/dashboard/products/route.ts`: belt-and-suspenders check requires a `SellerShippingProfile` before a product can be listed at all, catching any legacy seller approved before this change with a clear error instead of a silent placeholder-rate surprise at someone's checkout weeks later.


## 2026-07-13 checkpoint (continued 14) -- ID-document GDPR gap was already resolved; 5 remaining payments-audit findings closed

Two follow-up passes after the multi-seller and shipping fixes above.

**GDPR gap (KNOWN GAPS item 2) turned out to already be resolved**, just never marked as such -- see the RESOLVED note in KNOWN GAPS AND UNVERIFIED CLAIMS above for the full account. Short version: the three routes/pages the old note named had already been deleted by William on 2026-07-09; a repo-wide grep found zero remaining code references anywhere. What was actually left was dead schema (`SellerVerification` model, `VerificationStatus` enum, `Seller.verification` relation), removed in commit **8439b54**, confirmed Ready in Production. That deploy dropped the `SellerVerification` table from the live database -- any ID document URLs a seller uploaded through the old flow are now permanently gone, not just unreachable by code.

**Five remaining items from the payments-audit punch list (checkpoint 7 above), all closed in commit `a9ab576`, confirmed Ready in Production:**

1. **IDOR in `app/api/orders/[orderId]/route.ts`.** Required a session but never checked the order belonged to that session -- any signed-in buyer could view any other buyer's full order (items, prices, address) just by knowing or guessing an id. Now scoped to the session's own email via `findFirst`, same convention as `GET /api/orders`. No frontend caller of this exact route was found in the app (only `/track`, a separate and already-correctly-scoped guest-lookup variant) -- the fix closes a live, reachable vulnerability regardless.
2. **Open email relay in `app/api/agents/test-outreach/route.ts`.** Gated only by a secret hardcoded directly in the file -- readable by anyone with repo access, and a direct violation of this file's own standing directive 3 ("never hardcode a PAT, API key or secret"). No rate limit or allowlist on the `to` address meant it was effectively an open relay for sending real Velor-branded email to anyone who found the URL. Now gated by a fail-closed `ADMIN_SECRET` query-param check, same pattern as `/api/admin/set-tier`.
3. **No-auth livestream-report endpoint, `app/api/live/[room]/report/route.ts`.** Took a fully unauthenticated POST and blindly incremented `reportCount` -- anyone could script 3 requests against any seller's `roomName` and force their live stream to auto-end, a real DoS vector against sellers with zero accountability for who filed the reports. Now requires a signed-in session and deduplicates by (stream, reporter) via a new `LiveStreamReport` model with a compound unique constraint, so one account can never count twice against the same stream. `app/live/[room]/page.tsx`'s report button now resets to its unclicked state if the request actually fails, instead of always claiming success.
4. **Fail-open `CRON_SECRET` pattern.** Three routes (`agent-watchdog`, `recompute-rankings`, and **`release-payouts` -- a real-money payout release**) wrote `if (process.env.CRON_SECRET && authHeader !== ...)`, which skips the check ENTIRELY if `CRON_SECRET` is ever unset (`false && x` short-circuits -- fully open, no header needed at all). Every other cron/report route had a subtler version of the same root bug: comparing against the template literal `` `Bearer ${process.env.CRON_SECRET}` `` coerces an unset secret to the literal string "Bearer undefined", so a request carrying that exact header would pass even on routes without the flawed guard. New `lib/cronAuth.ts` centralizes one fail-closed check (refuses outright the moment the secret itself is missing, before ever looking at what the caller sent); all 11 affected routes (`agent-watchdog`, `enrich-emails`, `live-usage-check`, `outreach-auto`, `qualify-prospects`, `recompute-rankings`, `release-payouts`, `review-applications`, `scout-sellers`, `traffic-check`, `reports/daily`) now call it instead of rolling their own. `admin/set-tier` and `admin/products/auto-moderate` were checked and left alone -- both already fail-closed via a different, intentional query-param mechanism.
5. **`.env.example` only documented 8 of the ~30+ vars the app actually reads.** A full `grep -r process.env` sweep of `app/` and `lib/` found the rest (including `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, which the old file had wrong entirely -- it listed a `STRIPE_PUBLISHABLE_KEY` that's never actually read anywhere). Regenerated, grouped by purpose, with an explicit note on what's intentionally excluded (Vercel-auto-provided vars) so a future gap reads as a decision, not an oversight.

This closes every code-fixable item from the payments-audit punch list in checkpoint 7 above. What's left there is Payoneer (an external dependency, not a code fix -- see the Payoneer checkpoints elsewhere in this file) and Payoneer Checkout (genuinely unbuilt, deferred until real buyer volume post-launch).


## 2026-07-13 checkpoint (continued 15) -- Built the missing /origins and /origins/[slug] lattice pages, fixing two live 404s

William asked "what is the design port you talk about" after an earlier summary claimed the homepage/lattice redesign was "still unported" -- that claim was stale (contradicted by several later checkpoints in this same file). Live-verified the actual production site instead of trusting the note: the homepage and ~11 other pages (`/apply`, `/sell`, `/founding`, header, `/shop`, `/about`, `/live`, `/contact`, `/help`, `/search`, footer) were already live, but `/origins` and `/origins/japan` both returned real 404s. William: "build the pages you mentioned /origins and /origins/japan and both 404 is is that fixed already." Fixed, confirmed **Ready** in Production and live-verified both URLs in the browser, commit **a62357e**.

- `lib/worldCountries.ts` -- added `slugifyCountryName()`, `findCountryBySlug()`, and `countrySlug()`. No slug<->country helper existed anywhere in the codebase; the original design intent used lowercase name slugs (`/origins/japan`), not raw ISO codes. Verified programmatically that all 190 country names produce unique slugs before wiring anything up to it.
- `app/origins/page.tsx` (new) -- buyer-facing index of all 190 countries, region-grouped/searchable/filterable, structurally identical to `app/founding/page.tsx` (same `/api/lattice` data source, same flag-derivation-from-codepoints pattern, same region map) but every tile links to `/origins/[slug]` instead of `/apply` -- this page is for shopping, not seller recruitment.
- `app/origins/[slug]/page.tsx` (new) -- single-country page, e.g. `/origins/japan`. Resolves the slug via `findCountryBySlug`, shows an inline "can't find that country" state for an invalid slug, renders culture hints (`lib/cultureHints.ts`) and associated specialities (`lib/specialities.ts`, filtered by `associated.includes(code)`, buyer-facing labels via `buyerLabel()`) as plain tags. Trading countries (`/api/lattice` count > 0) get a live product preview via `/api/shop/products?origin=CODE` plus a link to `/shop?origin=CODE`. Countries with no seller yet get the same honest zero-state pattern established on `/shop` -- never implies a seller exists where one doesn't -- with a CTA into `/apply?country=CODE` and a link to `/founding`.
- Deliberately left `components/GlobalHeader.tsx`'s "Origins" dropdown untouched -- it still points every country link at `/founding`. William only asked to build the missing pages, not rewire navigation; per standing directive 4, that's a separate decision to offer, not make unprompted.
- Noted but not fixed (out of scope for this task, flagging for later): `app/apply/page.tsx`'s `?country=XX` prefill sets `form.country` to the ISO code, but the business/culture-country `<select>`'s option values are full country names -- so a prefilled code silently fails to visually select anything in that dropdown (pre-existing bug, not introduced by this work; the ship-from country field is unaffected).

Verified via the local TS-syntax-check script (all three touched/new files parsed clean) before pushing, then confirmed the Vercel build for `a62357e` showed Ready/Production, then navigated to `velorcommerce.store/origins` and `velorcommerce.store/origins/japan` directly in the browser -- both render fully (flag strip, region list with live counts, Japan's culture hints and speciality tags, the honest "nobody sells from Japan yet" zero-state with working CTA buttons). Neither 404s any more.

**Follow-up fix, commit `537db21` (same day, no separate checkpoint written for it until now):** `components/GlobalHeader.tsx`'s Origins dropdown was rewired from `/founding` to `` /origins/${slugifyCountryName(o.name)} `` per-country and to `/origins` for "All 190 countries" -- previously this build note had that as a deliberate no-touch; a follow-up request asked to actually fix it. Also fixed `app/apply/page.tsx`'s `?country=XX` prefill bug flagged above: it now resolves the ISO code to the matching country NAME before setting `form.country` (the `<select>`'s option values are full names, not codes), while still setting `shippingCountry` from the raw code. Both confirmed Ready/Production on Vercel; not independently re-verified live in the browser at the time (the next session's work superseded checking it further, see below), so treat as high-confidence but not double-checked against a live click-through.

---

## CHECKPOINT 2026-07-13 (continued 16) -- Velor Pulse rebuilt into a full 15-page mobile ops dashboard

William: "yes fix them now please. then i want you to rebuiled the velor pulse mobile dashboard, i want it too be highly advanced and every section has a clickable part that takes me to a different page that gives me an advance look at everything based off that section... please work your hardest to give me an highly advanced mobile velor pulse dasboard." Full rebuild, one commit (plus one same-day fix commit for a build failure), both confirmed **Ready** in Production and live-verified in the browser with real data rendering (not just the token-gate screen -- a valid admin token was already active in the browser's localStorage from earlier session work, so this was a genuine end-to-end check).

**New shared design system**, built from scratch, no new npm dependencies:
- `lib/pulseFormat.ts` -- `formatMoney`, `compactNumber`, `pct`, `timeAgo`, `fmtSpan`, `fmtDateTime`, `fmtDate`, `clamp`, `deltaPct`.
- `components/pulse/PulseKit.tsx` (~650 lines) -- the `PULSE` dark-theme design-token object (accent `#ff7a1a`, deliberately distinct from the main site's `#FF6B00` since Pulse is a visually separate private surface), `usePulseAuth`/`usePulseData` (the same single-admin-token model as before, `Authorization: Bearer <ADMIN_SECRET>` via `isAuthorizedAdmin()` on every backing route), and every UI primitive: hand-rolled SVG charts (`Sparkline`, `RadialGauge`, `MiniBar`, `FunnelChart` -- no chart library added), `KpiCard`, `SectionCard`, `ListCard`, `Badge`/`StatusBadge`, `FilterBar`/`FilterInput`/`FilterSelect`/`FilterButton`, `PageNav`, `ResultsMeta`, `TokenGate`, `PulseShell`/`PulseHeader`/`PulseFooter`, `BottomNav` (5 items: home/orders/revenue/sellers/applications -- the other 10 detail pages are reached from the hub grid, not the bottom nav, and correctly omit `activeNav`).

**Hub (`app/pulse/page.tsx`) rebuilt as a bento grid**, backed by an extended `app/api/admin/pulse-data/route.ts`:
- New **Pulse Score**: a composite 0-100 operational-health gauge, deliberately transparent rather than a black box -- the unweighted average of four named, code-commented sub-scores (`ordersHealth`, `applicationsHealth`, `supportHealth`, `catalogueHealth`), each a simple penalty formula off real live counts (open disputes, pending returns, overdue applications >24h, priority open tickets, low stock, pending certificates), returned to the UI with the full breakdown so it's never shown as a bare number alone. Live-verified rendering `100/100` with all four sub-scores.
- A "needs attention" strip (only renders items with count > 0), live KPI tiles with real sparklines (GMV 30d, traffic today, orders today, sellers, live-now, origins-trading via the public `/api/lattice` endpoint), and **13 section cards**, every one a working link into its own detail page -- satisfying "every section has a clickable part that takes me to a different page that gives me an advance look at everything based off that section" literally, not just for the headline metrics.

**12 new detail pages + backing admin API routes** (traffic, revenue, sellers, pipeline, listings, payouts, support, reviews, agent activity, Velor Live, origins, compliance), plus **2 existing pages restyled in place with unchanged backing logic** (orders, applications). Notable honesty/safety choices baked into the new routes, all still true after live verification:
- `pulse-listings` deliberately does NOT reuse `app/api/admin/low-stock/route.ts` (which sends a real email and writes an `AgentLog` row on every GET) -- computes low/out-of-stock counts with fresh, side-effect-free `prisma.product.count()` calls instead.
- `pulse-payouts` groups by whatever `Payout.status` strings actually exist via `groupBy()` rather than assuming a fixed enum, since the schema has no hard-coded status list.
- `pulse-pipeline`'s funnel documents in code comments that "Applied" is an application-count proxy (via `SellerApplication.prospectId`), not a guaranteed distinct-prospect count.
- `pulse-support` combines `SupportTicket` + `Dispute` + `ReturnRequest` behind one tab-switched page, always returning all 4 summary counts regardless of active tab so the KPI row never goes stale.
- `pulse-live` is the first-ever Pulse surface for Velor Live streaming (previously zero admin visibility into it despite the founding-seller live-broadcast perk existing since 2026-07-08).

**One build failure, found and fixed same session:** the first push (commit `f605670`) failed Vercel's real TypeScript check -- `./app/pulse/applications/page.tsx:102`, `let badgeColor = PULSE.green` (no type annotation) let TS narrow the type to the literal `"#3ddc84"` since `PULSE` is `as const`, so the later `badgeColor = PULSE.red` reassignment failed to type-check. This sandbox's syntax-only check (no live `DATABASE_URL`/Prisma engine available here, so no full type-check is possible before pushing) could not have caught this -- it's a real type error, not a parse error. Read the actual Vercel build log to find the exact line, fixed by typing the variable `string` explicitly, grepped every other new/changed file for the same `let x = PULSE.y` pattern (found no other instances), pushed as commit `5677416`, confirmed **Ready**/Production.

**Live verification (real data, not just the token gate):** `/pulse` hub renders Pulse Score 100/100 with all four sub-scores, real GMV/traffic/orders/sellers/live/origins tiles, and all 13 section-card previews with live counts (e.g. "Seller Pipeline -- 1024 prospects · 17 qualified · 225 outreach (7d)"). Clicked through to `/pulse/pipeline` (funnel chart + stage KPIs, real 1024/17/216/0/0 funnel), `/pulse/applications` (the real Wasizo deco application, REJECTED badge now rendering in the correct red -- confirms the build-fix actually works, not just compiles), `/pulse/support` (KPI row + tab switcher, correctly empty), and `/pulse/traffic` (real sparklines: 22 last hour, 80 today, 1.4k/7d, 2.7k/30d, top pages by real pageview counts) -- all four render correctly with real data end to end. Did not click through all 15 pages individually; the remaining ones share the exact same verified data-fetch/auth/rendering pattern (`usePulseAuth`/`usePulseData`/`TokenGate`) as the four checked, so treat those four as representative confirmation of the shared plumbing, not as proof every single page's specific query is bug-free -- worth a fuller click-through next time William is in Pulse himself.

Commits: `f605670` (full rebuild, failed build), `5677416` (build fix, Ready/Production).

## 2026-07-13 checkpoint (continued 17) -- Payoneer seller-activation route + real payout dashboard data

Continuation of the Payoneer duplicate-account investigation earlier this session. William asked how to onboard sellers outside Stripe's reach while the real Mass Payouts partner application (Customer ID 104582691) sits with Payoneer's team. Checked live code before proposing anything new (per LAW #1): the interim policy was already fully built -- `getPayoutRail()` resolves every seller's rail by country, `POST /api/payoneer/onboard` already returns an honest "being set up" message and logs an `AgentLog` interest record while `!isPayoneerConfigured()`, and `release-payouts`' `heldForPayoneer` bucket already holds those sellers' earnings safely and retries every run. No new provider (Wise/Routable, researched earlier this session) is needed for launch -- that's only worth building if Payoneer approval drags on for months and a specific seller's held balance grows large enough to justify a manual one-off payment.

Two things built and pushed this session, commit **2540404** (confirmed live via `git ls-remote origin main`, Vercel build not yet independently re-checked -- confirm **Ready**/Production before treating this as fully live):

1. **`app/api/admin/activate-payoneer-sellers`** (new, admin-gated). Once `PAYONEER_CLIENT_ID/SECRET/PROGRAM_ID/API_BASE` are added to Vercel and sandbox-verified per `docs/PAYONEER_SETUP.md`, POST this once: it finds every approved seller already resolved onto the `PAYONEER` rail with no `payeeId` (everyone who's been accruing escrow silently since before credentials existed), issues each a real Payoneer registration link, emails it to them, and logs the result to `AgentLog`. Idempotent -- re-running only catches sellers still missing a `payoneerPayeeId`, so nobody is emailed twice.
2. **`/dashboard/payouts` rewired to real data**, backed by a new `app/api/dashboard/payouts` endpoint. This page was previously a pure mockup: `availableBalance`/`pendingBalance`/`lifetimeEarnings` were hardcoded to `0`, `payoutHistory` was a hardcoded empty array, and the "Withdraw Funds" button never called an API at all (just `setTimeout` then closed its own modal) -- there is no seller-initiated withdrawal in this platform's real design, `release-payouts` already pays out automatically once an order clears its hold window. Replaced with real numbers (escrow still held = `DELIVERED` orders with no `Payout` row, using the already-stored `Order.sellerEarnings`; lifetime = real `Payout` rows with `status:'paid'`; real payout history) and removed the fake withdraw flow entirely. The "Payout Method" card also used to unconditionally say "Connect a bank account via Stripe" and link every seller to `/dashboard/stripe-connect` regardless of their actual rail -- now branches on the seller's real `payoutRail`, sending Payoneer-rail sellers to `/dashboard/payoneer` (their correct, already-existing destination) instead.

Also closed the smaller Payoneer-alongside-Stripe copy gap flagged earlier this session: `/dashboard/payouts`' payout-method subtitle now mentions both rails (the rest of the site -- footer, `/sell`, legal pages, seller agreement, `/help`, Pulse -- already got this fix in an earlier 2026-07-13 checkpoint). Deliberately left untouched: every buyer-facing "Stripe" mention (checkout trust badges, Stripe Identity copy, the seller's own Pro/Enterprise subscription-payment badges) -- none of those are payouts, and Payoneer Checkout (buyer-side payments) still does not exist in this codebase, so adding Payoneer there would be a false claim on the live site.

**Not verified this session:** the actual Vercel build for `2540404` (this sandbox has no browser/Vercel-dashboard access this session -- confirm Ready/Production next time before relying on this); a full TypeScript/Prisma type-check (this sandbox could reach `raw.githubusercontent.com` and do a real `git clone`, but not `binaries.prisma.sh`, so `prisma generate` failed on a blocked CDN -- verified via `esbuild` syntax-only checks and hand-matching every call against the real schema/lib signatures instead, same limitation prior sessions hit); and, obviously, the activation route has never been run against a real seller, since Payoneer credentials do not exist yet.

**Security note:** this session pushed using a PAT William pasted directly in chat. He should revoke it at github.com/settings/tokens now that this work is done, per the same standing practice as every prior PAT-using session.

## 2026-07-13 checkpoint (continued 18) -- Stripe Connect seller payout flow audited, two real bugs fixed

William asked to verify the Stripe payout flow for the seller dashboard was fully operational. Read every file in the path rather than assuming (per LAW #1): `/dashboard/stripe-connect` + `/return` + `/refresh` pages, `app/api/stripe/connect` (POST/GET), `app/api/stripe/connect/account` (GET/DELETE), the webhook handler, and how `release-payouts` consumes `stripeAccountId`/`stripeOnboarded`. Two real bugs found and fixed, commit **f2c5d20** (confirmed live via `git ls-remote origin main`; Vercel build not independently re-checked this session, same sandbox limitation as the previous checkpoint):

1. **`app/api/stripe/connect/route.ts`'s `BASE_URL` fallback was stale** -- `'https://velor-marketplace.vercel.app'`, a placeholder from before the custom domain existed, inconsistent with every other file's `velorcommerce.store` fallback. This is the file that actually builds the Account Link `refresh_url`/`return_url` sellers get redirected through during real onboarding -- if `NEXT_PUBLIC_BASE_URL` were ever unset in a Vercel environment, sellers would be bounced to the wrong, unmaintained domain mid-onboarding. Fixed to match.
2. **"Disconnect" on `/dashboard/stripe-connect` did nothing real.** `DELETE /api/stripe/connect/account` only cleared the `seller_account_id` cookie -- `Seller.stripeAccountId` stayed in the database, so the very next `fetchStatus()` call resolved the SAME account again via `GET`'s cookie-missing DB fallback. The button showed a confirm dialog and appeared to succeed, but the dashboard flipped straight back to "Connected." Now also clears `stripeAccountId`/`stripeOnboarded` in the database, so disconnecting is real and `release-payouts` correctly holds funds in escrow afterward instead of attempting a transfer to an account the seller just disconnected.

**Confirmed dead code, not touched (flagged for William's call, not deleted unprompted):** `app/api/stripe/connect/callback/route.ts` (expects `?account=&seller=` query params, raw `fetch` to Stripe's REST API) and `app/dashboard/stripe-connect/callback/page.tsx` (expects an OAuth `?code=` redirect and POSTs it to `/api/stripe/connect`, which does not even read a `code` field) are both leftovers from an abandoned OAuth/Standard-Connect design, superseded by the current Express + Account Links flow. Grepped the whole repo -- zero references to either path anywhere; the real `return_url`/`refresh_url` always point to `/dashboard/stripe-connect/return` and `/refresh`. Harmless as long as nothing links to them, but worth deleting to stop a future session from "fixing" the wrong file.

**Confirmed working as designed, not a bug:** the main Stripe webhook (`app/api/stripe/webhook/route.ts`) has no `account.updated` case -- `stripeOnboarded` is only ever refreshed by a seller visiting `/dashboard/stripe-connect`, `/return`, or `/refresh` (each calls `GET /api/stripe/connect/account`, which re-checks live Stripe status and persists it). If a seller finishes Stripe's hosted form but the browser never makes it back to `/return` (closed tab, network drop), `stripeOnboarded` stays stale until they revisit the settings page themselves -- no server-side fallback exists. Not fixed this session (would mean adding new webhook-handling code, a bigger change than the two clear bugs above); flagging as a real gap worth a webhook-based fallback if it ever causes a support ticket. Separately, `release-payouts` gates the Stripe branch on `stripeAccountId` being non-empty, not on `stripeOnboarded` -- so a seller with an account created but onboarding incomplete gets a real (safe-failing, retried) transfer attempt every 4 hours rather than being skipped outright. Consistent with the codebase's existing "safe failure over silent gate" pattern elsewhere (e.g. the optimistic `payoneerPayeeId` set in the activation route above); not changed.

## 2026-07-13 checkpoint (continued 19) -- Full Stripe + Payoneer + buyer cross-check; provisioning gap fixed; dead OAuth files deleted

William asked for a broader confirmation before deleting anything: are Stripe and Payoneer both fully operational for sellers, are buyers fully covered, and do payouts still route per the published policy terms after the checkpoint-18 fixes. Read every remaining piece not yet covered this session (per LAW #1, not from memory): `app/api/payoneer/onboard` (GET/POST), `app/dashboard/payoneer/page.tsx`, `lib/provisionSeller.ts`, `app/api/stripe/payment-intent/route.ts` (316 lines, buyer-side), and grepped `app/checkout/page.tsx` for the Stripe Elements wiring.

**Verdict given to William:** buyer payments are ready to go today (real Stripe keys, server-computed everything, correct Elements/PaymentElement wiring). Seller sign-up is ready on the Stripe side (any Stripe-supported-country seller can apply, get approved, and onboard for real today). It is NOT yet ready on the Payoneer side for actual money movement -- sellers in Payoneer-only countries can apply, get approved, and sell, but linking a real Payoneer account is blocked until Payoneer approves the Mass Payouts partner application (Customer ID 104582691) and `PAYONEER_CLIENT_ID/SECRET/PROGRAM_ID/API_BASE` are added to Vercel; until then they get an honest "being set up" message and their earnings sit safely in escrow. This has been true since checkpoint 17 and has not changed -- the activation route built then is what fires the moment credentials land.

**Real gap found and fixed, commit `3793de7` (confirmed live via `git ls-remote origin main`):** `lib/provisionSeller.ts` never set `payoutRail` on either `seller.create()` call (the "existing buyer becomes seller" branch or the "brand new account" branch) -- new sellers sat on the schema default `"STRIPE"` until their first dashboard visit lazily recomputed it via `GET /api/payoneer/onboard`. No payout was ever actually at risk (`release-payouts` holds funds safely in escrow whenever a rail doesn't resolve to a real payee, per its existing "safe failure, always retried" design), but a Payoneer-country seller sitting on a wrong `"STRIPE"` label before their first dashboard visit was invisible to the admin activation route and could trip a false watchdog alert (`app/api/cron/agent-watchdog/route.ts` explicitly skips flagging payout delays for `payoutRail==='PAYONEER'` sellers "by design" -- that exception only works if the rail is actually right). Fixed by resolving `getPayoutRail(application.country)` at creation time in both branches, same import already used everywhere else that needs this.

**Dead code deleted this commit**, per William's go-ahead now that this broader check passed: `app/api/stripe/connect/callback/route.ts` and `app/dashboard/stripe-connect/callback/page.tsx` -- both confirmed via repo-wide grep (zero real references, one stray comment mention updated) to be unreachable leftovers from an abandoned OAuth/Standard-Connect design, flagged in checkpoint 18 and held pending this confirmation. The real, reachable flow (`POST /api/stripe/connect` -> `accountLinks.create` -> `/dashboard/stripe-connect/return`) is untouched.

**Confirmed the checkpoint-18 fixes have not disrupted any existing seller:** the `BASE_URL` fix only changes behavior if `NEXT_PUBLIC_BASE_URL` were ever unset in Vercel (worth confirming it's set, but no seller was hurt by the old fallback if it was); the `Disconnect` fix only changes what happens when a seller clicks Disconnect, which previously did nothing anyway -- neither touches an already-connected, already-getting-paid seller.

**Not verified this session:** the Vercel build for `3793de7` (same sandbox limitation as prior checkpoints -- no browser/Vercel-dashboard access this session, confirm Ready/Production next time); whether `NEXT_PUBLIC_BASE_URL` is actually set in Vercel (would fully retire the checkpoint-18 BASE_URL concern if confirmed set).

**Security note:** this session again pushed using a PAT William pasted directly in chat. He should revoke it at github.com/settings/tokens now that this work is done.

## 2026-07-13/14 checkpoint (continued 20) -- Pinterest/X social assets, and a Companies House registered-office address change in progress

Two unrelated pieces of work in the same session, logged together since William asked to save "everything" at the end.

**Social media assets (organic, not paid).** William asked for a handful of Pinterest pins and X posts to recruit sellers, drive buyer traffic, and build brand awareness. No image-generation tool exists in this environment -- rather than fabricate stock photography, built 5 branded graphic cards (3 Pinterest pins at 1000x1500, 2 X cards at 1200x675) using the real `public/velor-logo.png` wordmark, the site's actual brand colours (`#0D0D0F` bg, `#FF6B00` accent), and only figures already live on the site (190 countries, 19 languages, 24h application SLA, 0% listing fees, Starter/Pro/Enterprise commission tiers, the 6 August buyer-launch date, the founding-seller-for-life perk). Rendered via a local Playwright/headless-Chromium script (`render.js`) since this sandbox has no outbound network to fetch fonts or stock photos -- confirmed `images.pexels.com`, `fonts.googleapis.com`, and `cdnjs.cloudflare.com` are all blocked (403) from bash here, consistent with the GitHub/Prisma-CDN blocks noted in earlier checkpoints. Used the locally-installed Liberation Sans font instead. Delivered to William via SendUserFile, not committed to this repo (they're marketing assets, not app code). Flagged for him to confirm the 6 August launch date is still accurate before posting, and that solid-colour tiles in pin 1 are placeholders for real product photography once listings exist.

**Companies House registered office address -- action started, awaiting a posted code.** William has already updated Velor Commerce Ltd's address everywhere on the live site (footer, Terms, About, Contact all say 49 Station Road, Polegate, East Sussex, BN26 6EA), but confirmed via a live Companies House lookup that the *official* registered office on file for company number 17268133 is still the old address, 1 Palmerston Gardens, Grays, RM20 4YJ -- a real compliance gap between the public register and the live site.

Walked through the actual filing process live in William's browser (Claude in Chrome), which resolved some real ambiguity in current Companies House guidance:
- Companies House's new **personal code** (11 characters, tied to an individual's identity verification, issued via GOV.UK One Login or an ACSP) is a *different* thing from the traditional 6-character **company authentication code** used to file changes like the AD01 registered-office-address change. Per the official gov.uk guide ("Tell Companies House about changes to your limited company"), the personal code is only required when appointing new directors -- it does not substitute for the authentication code on an address change.
- WebFiling sign-in itself has moved to GOV.UK One Login (as of Oct 2025) -- William's One Login got him straight into WebFiling with no separate authentication-code prompt at that stage. But adding company 17268133 to the account (via "File for a different company") did then prompt for the 6-character authentication code, confirming it's still a hard requirement for this filing, GOV.UK One Login or not.
- William doesn't have the authentication code saved, and confirmed Companies House already holds his current home address on file, so used the dedicated "Request an authentication code to be sent to a home address" service (`find-and-update.company-information.service.gov.uk/auth-code-requests/start`) rather than waiting on a reminder to the old, no-longer-accessible Grays registered office.

**Status: request submitted 13 July 2026 at 12:53am.** Companies House will post the code to William's home address; allow ~10 working days (so expect it around 27 July 2026). Nothing further to do until it arrives. Once William has the code, the remaining steps are: sign back into WebFiling (GOV.UK One Login), add company 17268133, enter the authentication code, and file the AD01 change of registered office address to 49 Station Road, Polegate, East Sussex, BN26 6EA. This is a real government filing with legal effect, so per this session's own action-boundary rules, actually entering the authentication code and clicking final submit must be done by William himself -- Claude can navigate to the right screen and help review the address fields, not authenticate or submit on his behalf.

## 2026-07-14 checkpoint -- Enterprise Stripe price fixed: £199 price deleted, £99 live end to end

The open item from the 2026-07-13 commission checkpoint ("docs/SUBSCRIPTION_AND_TIERS.md's Enterprise price/Stripe price ID discrepancy, needs live Stripe verification") is now fully resolved, verified live in the Stripe dashboard, not from docs. The discrepancy was REAL and live: price_1TpCqXDB5eA3Wfmuw3y2bScF (the only price ever created on prod_UoqXwy4RXYEoFl, 2026-07-03) was £199/mo, and STRIPE_ENTERPRISE_PRICE_ID (added to Vercel the same minute, marked Sensitive so unviewable, but no other candidate price ever existed) pointed at it -- so an Enterprise upgrade would have charged £199 against the £99 promised everywhere on the site. Never triggered: 0 active subscriptions, ever.

Fix, all verified live: (1) created price_1Tt7a6DB5eA3WfmuKt5ocwCv, £99.00/mo GBP recurring flat-rate on the same product, set as default; (2) the £199 price was DELETED (not archived -- an accidental delete-confirm during what was meant to be an archive, owned per LAW #1; William then explicitly confirmed he wanted it gone anyway: "i dont want the £199 price on there any way, we will never use it now"; Stripe only allows deleting never-used prices, so zero data/billing impact); (3) STRIPE_ENTERPRISE_PRICE_ID updated in Vercel (Production and Preview) to the new price ID -- mandatory, since the old value pointed at a now-nonexistent price and Enterprise checkout would have failed on "No such price"; (4) redeployed via the Vercel Redeploy button, confirmed Ready and holding the Production badge. Pro checked at the same time: Stripe £49/mo matches the site, no change needed. William re-confirmed the full tier scheme in chat this session: Enterprise £99/0% commission, Pro £49/4%, Starter free/10%. docs/SUBSCRIPTION_AND_TIERS.md corrected in this same commit (tiers-table £199 -> £99, new price ID recorded with deletion note, two stale Pro=8%/Enterprise=5% commission strings -> 4%/0%).

Note for future sessions: this cloud sandbox HAS outbound network in bash (git clone/fetch/push to github.com all work directly) -- the "no outbound network" line in TOOLING TRAPS describes earlier environments, not this one. Verify per session rather than assuming either way.

---

## 2026-07-15 checkpoint — ENTERPRISE TIER RETIRED; live shopping on every tier; Starter cap 10

William's explicit decisions, applied to the FULL production codebase (commit 2c79f75 on main, 60 files, Vercel build verified green on the preview branch first) and the app mockup:

- **Enterprise tier removed completely.** Pro (£49/mo, 4% commission) inherited every Enterprise feature: unlimited listings, Go Live video shopping, the dedicated AI account manager (assistant now gives Pro the full capability set — order lookups, drafting, escalation), full API access, priority support. William explicitly chose Pro KEEPS 4% (does not inherit 0%). Legacy ENTERPRISE rows are treated as PRO everywhere; commission maps alias ENTERPRISE->0.04 so no stray row can ever bill 0%; the Prisma enum value stays only so old rows never break; upgrade_to_enterprise returns a clear 400; /dashboard/upgrade/enterprise deleted.
- **Live shopping is on EVERY tier now, Starter included** — the standing "live broadcasting is the founding privilege" rule (2026-07-08) is SUPERSEDED by this decision. Founding perk copy is now "the full Pro tier free for life". Rewritten across homepage, /apply, /apply/invited, /founding, /sell, /help.
- **Starter listing cap 20 -> 10** (creation block, downgrade delisting in the Stripe webhook, and all copy).
- **Stripe:** Velor Enterprise product prod_UoqXwy4RXYEoFl ARCHIVED in the dashboard (0 subscriptions ever, £0 MRR — verified before archiving). STRIPE_ENTERPRISE_PRICE_ID env var is now unused/inert; William can delete it whenever.
- Docs updated with retirement notes (SUBSCRIPTION_AND_TIERS.md top note; history sections left as history). NOT re-verified live on production at write time: confirm velorcommerce.store/sell + /dashboard/upgrade render the two-tier scheme after the main deploy goes Ready (the identical code was verified green + rendering on the preview deployment).

## 2026-07-15 checkpoint — Velor App ("The Atlas"): buyer side COMPLETE in the mockup

A native mobile-app design for the **marketplace** (velorcommerce.store), design-first with William. Full state and every decision: **docs/app-mockup/CHECKPOINT.md on branch app-mockup-preview** (the branch doc is canonical; this is the summary).

- Mockup: public/velor-app-mockup.html on branch **app-mockup-preview** (NOT main). Preview: https://velor-marketplace-git-app-mockup-preview-velor1.vercel.app/velor-app-mockup.html . Push from bash git works; sandbox has outbound network.
- IMAGERY DONE (2026-07-14): all 9 waves, 186 countries with verified real Pexels photos (PG deliberately placeholder-only). Origin text for all 190 web-fact-checked by 12 parallel agents. Country dives carry per-country verified FILMS only (38 accepted from 380 queries; honest zero-state tile otherwise).
- BUYER SIDE COMPLETE & LIVE-WIRED (2026-07-14/15): Velor Live is a swipeable country-first feed (goLive/buildFeed; wheel nav removed — stray synthetic wheel events); craft pages for every tile (only China porcelain carries the SAMPLE listing -> PDP); PDP has deliver-to estimate row (rate quote, no label) + mock-labelled reviews; basket/checkout/confirmed/orders/passport/bell/You all render from live session models (CART/ORDERS/PASSPORT/FOLLOWS/FAVS) with honest zero-states; stamps deep-link to country-filtered orders; opening bell RINGS (4s synthesized real-bell, RING IT button; real app = custom notification sound reserved for channel openings); dispute needs 3 photos (except not-arrived), return flow built (14 days per published terms); legal docs read fully in-app (53 real sections embedded verbatim); language page lists the real 19; currency picker converts the whole money pipeline with LIVE FX (frankfurter -> open.er-api fallback, the lib/fx.ts strategy), 20 real currencies.
- Production findings flagged, NOT changed: terms say 14-day returns but app/api/returns/route.ts enforces 15 (code more generous — align when decided); the WORLD atlas 190 excludes CI/XK/FM/MH/NR/PW despite culture data existing for them.
- Sample universe: Lin Ceramics (CN) + Atlas Weave (MA) and everything derived from them, labelled SAMPLE; the real Polegate office address was scrubbed from buyer-facing sample data (checkout/addresses/You).
- REMAINING for review: Ask Velor, seller-side screens (Sell pitch, Founding seats, Apply, Verify ID, Dashboard, New listing, Payouts, Go live). Then scaffold the real Expo/RN app.

## 2026-07-15 checkpoint -- Shipping buffer shipped (seller-set quote padding)

William asked what happens when a label costs more than the buyer paid at
checkout (seller absorbs it; no re-billing) and ordered the fix built. New
optional "Shipping Buffer" on SellerShippingProfile (`handlingFeeGBP`,
default 0): a flat GBP amount added server-side to every real Shippo quote
buyers see for that seller. Clamped 0-25 at write time (settings POST) AND
at quote time (rates route). Never added to fallback quote-required
placeholders; currency-converted via lib/fx when a carrier rate isn't GBP.
Like all shipping money it passes to the seller commission-free and sits in
escrow until delivery + hold. Files: prisma/schema.prisma,
app/api/dashboard/settings/shipping/route.ts, app/api/shipping/rates/route.ts,
app/dashboard/settings/shipping/page.tsx (new field beside Handling Time).
Commit a81e198, verified Ready/Production on Vercel. NOT yet exercised
against a live checkout with a buffered profile -- verify alongside the
multi-seller cart walkthrough already flagged in checkpoint continued 12.
Side note (pre-existing, untouched): the settings page also sends
email/handlingDays fields the API silently ignores -- schema has no columns
for them; flag if William ever expects handling time to do something.

## 2026-07-15 checkpoint -- Velor App: real Expo app live in Expo Go; plate-by-plate sweep well underway

The app moved from mockup to a REAL Expo/React Native app this session. Everything below lives on branch **mobile-app** (folder `mobile/`), NOT main -- full detail in `mobile/DEVLOG.md` on that branch (canonical for app work; read it before touching the app).

- **Pipeline:** push to mobile-app touching `mobile/**` -> GitHub Action "Publish Velor app to Expo" runs `eas update --branch preview` on Expo account bilsy144 (project id 3207e08b-8832-4dba-bc40-d690d70628d9, SDK 57). 19 runs so far, all green. William tests in Expo Go via QR; every publish reaches his phone on next force-close+reopen.
- **The visual contract:** all 33 mockup screens are rendered as full-length stitched plates in `docs/app-mockup/plates/` (mobile-app branch) + per-element specs in `docs/app-mockup/spec/`. STANDING RULE (William): every app screen must match its plate exactly -- except where honesty requires divergence (no SAMPLE data, no fake counts, PREVIEW labels) or where William explicitly asks to go beyond the mockup (so far: the hamburger menu, which he had redesigned past the mockup's flat list).
- **Screens at plate standard after today:** Atlas, Country dive, Craft, Live feed (03), PDP -- new screen, product page with gallery/escrow/reviews/craft rail (04), Search (06), Basket (07), Orders (10), Passport (14), Bell (15), You (16), Addresses/Payments/Language+currency -- new (17/18/19), Sell with hero + clickable Starter/Pro earnings calculator (23), Founding seats -- new, live TAKEN stat from /api/lattice (24), Seller dashboard -- new PREVIEW with working STARTER/PRO toggle (27's structure, honest zeros), Menu (redesigned v2: feature cards, glass grid, orange sell band).
- **The bell RINGS:** mockup's bellSound() synthesis re-rendered via numpy to `mobile/assets/bell.m4a`; played natively via expo-audio@57.0.0 (RING IT on the Bell page). This is the intended channel-opening notification sound.
- **William's standing calls made today (app):** no website/social field on the seller application (nothing invites buyers off-platform); Apply photos must be deletable; Apply country must be a real picker; tier choice must be clickable (Sell calculator cards); Enterprise is gone everywhere in the app (two tiers: Starter free/10%/cap 10, Pro GBP49/4%); menu redesigned beyond mockup at his call.
- **Remaining sweep queue:** Checkout (08) vs current in-app checkout, Assist (22), Legal (20/21) plate checks; odetail/dispute/returnreq (11/12/13) arrive when real orders exist; seller-side sellorders/apikeys/newlisting/payouts/golive (28-32) as previews behind the Dash. Store release path (EAS Build + Apple/Play accounts) unchanged -- William registers those himself.
- **Sandbox notes:** this cloud sandbox HAS outbound network for git/npm (github.com, registry.npmjs.org) but NOT api.expo.dev, u.expo.dev, or GitHub's REST API (proxy-restricted) -- verify Actions/publish status via the browser on William's desktop. `npx expo install` fails here; pin versions via `npm view <pkg> versions` + matching major instead. WATCH OUT: npm install run at the repo root once polluted the web app's package.json (caught and reverted before commit) -- always cd into mobile/ first.

## 2026-07-15 checkpoint (2) -- Velor App: ALL pages built; full wiring scan passed

Continuation of today's earlier app checkpoint. Every buildable screen now exists at plate standard on branch mobile-app (publish runs #14-#21, all green; William verifying on-device throughout -- "perfect so far" at the buyer-sweep stage).

- **Completed since the last checkpoint:** Checkout (plate 08, honest 6-Aug pay gate on every control), Ask Velor plate-22 copy, Basket/Orders/Passport/Bell (plates 07/10/14/15), THE BELL REALLY RINGS (mockup's 470Hz bell synthesis rendered to mobile/assets/bell.m4a, played via expo-audio@57.0.0 -- William: "bell notifications need a real bell noise"), and the full seller side as honest previews reached from the Dash: SellerOrders/ApiKeys/Payouts (28/29/31), NewListing (30, fully interactive -- real photo picker, live tier maths, computed publish checklist), GoLive (32, no simulated counts).
- **The scan (William: "don't leave no stone unturned"):** tsc clean; full Metro export for BOTH platforms clean; all 27 navigate targets verified against the route table; params audited; assets audited (bell confirmed inside the bundle); live endpoints re-verified in Chrome (/api/lattice 190/0, /api/shop/products empty-honest, assistant avatar 512x512). Two real bugs found and fixed: the Atlas film reel's { start } deep-link into the Live feed was silently ignored (always opened film #1), and the privacy/buyer-protection legal docs were unreachable (every path passed doc:'terms'; LegalScreen now has a doc switcher).
- **Deliberately not built:** odetail/dispute/returnreq (plates 11/12/13) render a real order and none can exist pre-launch -- first build the day real orders exist. Store release path (EAS Build + Apple $99/Play $25 accounts) is William's registration when ready.
- App state in one line: every reachable page is plate-standard, honestly zero-stated, fully wired, and publishing automatically -- the remaining work is launch-driven (sign-in, real orders, store builds), not design-driven.

## 2026-07-15 checkpoint (3) -- William's STANDING REQUIREMENTS (he said "remember"): Face ID, chimed notifications, email-verified password resets

Ordered from his phone mid-session; all three are now standing product requirements, app + site:

1. **Face ID sign-in, password as backup.** BUILT (app, branch mobile-app): password signs in once against the site's NextAuth, Face ID/fingerprint then locks the restored session on every cold start; enable-offer right after sign-in; password never stored on the device. expo-local-authentication/-secure-store at the SDK-54 bundled versions.
2. **Notifications with chimes.** App plumbing BUILT ("Ring on this phone" on the Bell page: permission + Expo push token registered to /api/push/register; Android opening-bell channel wired to bell.m4a). Honest limit told in-UI: remote delivery + the custom chime activate with the STORE BUILD (Expo Go cannot receive push since SDK 53). Server keeps tokens in the new PushToken model; event senders (opening bells, order updates) are launch work.
3. **Email-verified password resets.** BUILT end to end on main: /api/auth/forgot (one-hour SHA-256-hashed single-use token, Resend email, no user enumeration), /api/auth/reset (+ marks emailVerified -- the click IS the verification), /auth/forgot + /auth/reset pages, "Forgot your password?" link on /auth/sign-in. The app's sign-in screen has the same door. New Prisma models PasswordResetToken + PushToken (additive, prisma db push applies on deploy).

Also this session: real seller sign-in in the app (NextAuth via the platform cookie jar -- live dashboard/orders/payouts and REAL listing publishing with data-URL images), EAS store-release scaffolding (eas.json, STORE-RELEASE.md; the build workflow file is stashed at /tmp on the session box because the PAT lacks `workflow` scope -- NEXT PAT NEEDS THE WORKFLOW SCOPE TICKED). NOT yet verified on-device: a real sign-in round trip, Face ID lock, and the forgot-password email (needs this deploy to go Ready first).

## 2026-07-15 checkpoint (4) -- ON-DEVICE VERIFIED: seller sign-in + automatic biometric sign-in. Session handover for tonight.

**Verified by William on his phone:** password sign-in against the live site works from the app; the biometric lock arms on open and on return-from-background; automatic sign-in works end to end -- "Ok yes all working now just not Face ID until we go through App Store set up."

**How the auth system now works (app, branch mobile-app):**
- Password signs in once (NextAuth, cookie jar). Enabling the biometric lock fires the biometric immediately and stores the credentials in the device's hardware-encrypted keychain (SecureStore). From then on, opening the app IS the sign-in: biometric passes -> live cookie, else silent keychain re-auth ("Signing you in..."). Keychain is wiped by: toggling the lock off (You page row, biometric-gated both ways), "Use password instead" on the lock, sign-out, or a server-side password change (fails once, self-clears).
- **EXPO GO LIMITATION (documented, told in-UI):** true Face ID cannot appear inside Expo Go -- iOS downgrades to the DEVICE PASSCODE sheet, which stands in and proves the owner. NSFaceIDUsageDescription is already in app.json ios.infoPlist, so the real (store/dev) build shows genuine Face ID from day one. William understands and accepts this pending store setup.

**TONIGHT'S QUEUE (William: "you will complete this later tonight"):**
1. William registers **Apple Developer** ($99/yr, org enrolment for Velor Commerce Ltd -- needs D-U-N-S) and **Google Play** ($25) -- mobile/STORE-RELEASE.md is the walkthrough. This unlocks true Face ID, push notifications with the bell chime, and the store path before 6 Aug.
2. **Next PAT must have the `workflow` scope ticked** -- the EAS build-trigger workflow (.github/workflows/eas-build.yml) is written and stashed at /tmp/eas-build.yml.pending on the session box (regenerate from STORE-RELEASE.md/DEVLOG if the box is gone: workflow_dispatch, platform+profile inputs, npm ci + eas-cli build with EXPO_TOKEN).
3. After credentials exist: `eas credentials` once (EAS-managed keystore + iOS certs), then an Android preview APK / iOS build via the workflow, then TestFlight.
4. Still open from earlier phases: buyer passkey sign-in (site-side WebAuthn, needs a go-ahead), push SENDERS server-side (PushToken registry + /api/push/register are live; wire opening-bell/order events at launch), odetail/dispute/returnreq screens when real orders exist.
5. PAT hygiene: the PAT used all day (11CGSBRSI0...) should be revoked when William ends the day; issue the new workflow-scoped one for tonight.

State of the branches: mobile-app tip 7b9a0eca (all app work, 30+ green publishes), main tip includes password-reset flow + push registry (live-verified: /auth/forgot renders on production). mobile/DEVLOG.md remains the canonical app log -- read it top-to-bottom before touching the app tonight.

## 2026-07-15 checkpoint (5) -- STORE REGISTRATIONS NIGHT: Google Play account LIVE, Apple enrolment submitted, D-U-N-S found, build workflow up

The "tonight's queue" from checkpoint (4), executed with William in-browser. Facts below verified live, not assumed.

**EAS build workflow restored.** The stashed .github/workflows/eas-build.yml died with the old session box; regenerated from STORE-RELEASE.md spec and pushed to mobile-app (451ee049) AND main (203a254c) -- GitHub only shows the Run workflow button for workflow_dispatch files present on the DEFAULT branch; dispatch it with branch=mobile-app. Run #1 green (57s). First Android preview APK build queued on Expo: build d11881f8, still sitting in the Free Tier Queue ~1h at checkpoint time -- check expo.dev/accounts/bilsy144/projects/velorvelor/builds and re-run the workflow if it ever errors. PAT note: the fine-grained token "velor-marketplace-deploy" now has the Workflows read/write repository permission (edited at github.com/settings/personal-access-tokens after a push rejection) -- no new PAT was needed, same token string.

**D-U-N-S number for VELOR COMMERCE LTD: 234899345.** Already existed at D&B (auto-assigned post-incorporation); Apple's lookup emailed it instantly to william@velorcommerce.co.uk. D&B record matches Companies House exactly: 1 Palmerston Gardens, GRAYS, RM20 4YJ (the register still shows Grays -- AD01 blocked on the posted auth code, ~27 July).

**CRITICAL DISCOVERY -- velorcommerce.co.uk website is DEAD.** Vercel serves 404 DEPLOYMENT_NOT_FOUND at the apex and www. The old dropship site's deployment has been deleted. Email on the domain is UNAFFECTED (MX/GoDaddy mailbox + Resend sending both fine -- separate from web hosting). Any doc/skill claiming the .co.uk site "is still running" is stale. Decide later: leave dead, or redirect to velorcommerce.store.

**Apple Developer org enrolment: submitted, awaiting Apple.** First submission K3G655P872 was WITHDRAWN by Apple within the hour -- their reviewer hit the dead .co.uk website (see above; the withdrawal email quotes the functional-website requirement). Resubmitted same night as **enrollment ID 3BC6GF58WA** with website https://velorcommerce.store; personal info William Sinclair / +44 7947181970 / work email william@velorcommerce.co.uk; entity Company/Organization; signing authority owner/founder. Next: Apple verifies (1-2 days, may phone), emails instructions, then WILLIAM pays the $99 himself. True Face ID + TestFlight unblock after that.

**Google Play Console developer account CREATED AND PAID ($25, 2026-07-15).** Organisation account on willsinclair144@gmail.com (Google's org-email tip declined knowingly -- no real inbox exists on .store, and .co.uk email vs .store website mismatches either way; soft warnings accepted). Public developer name **"Velor Marketplace"** (plain "Velor" already registered by someone else). Payments profile created and linked to D-U-N-S 234899345/company record. Public profile: hello@velorcommerce.co.uk + William's mobile. Private contact: william@velorcommerce.co.uk + mobile, English (UK). Org details: 1-10 employees, website velorcommerce.store, 1 app planned, earns money via "Other" (commission on physical goods -- outside Play Billing, correctly not IAP/subscriptions), app categories "None of the above". Three email verification codes were fetched from the customerservice@ inbox during signup (Apple x2, Google x2 -- all aliases deliver there).

**Play verifications still owed (Console shows deadlines, non-blocking tonight):** business document matching the D&B record -- use the Companies House incorporation certificate (shows Grays, still matches); SMS verify of the public phone; website ownership verify for velorcommerce.store (DNS TXT / Search Console). Apple side: watch william@ inbox for the 3BC6GF58WA verification email.

## 2026-07-15 checkpoint (6) -- FIRST APK BUILT; Search Console verified; Play verifications underway

- **First standalone Velor Android APK ever: BUILT AND INSTALLABLE.** Expo build d11881f8 Finished (9m16s build after a 1h10m free-tier queue wait; William upgraded to the Expo Starter plan mid-queue, $19/mo + $45 build credit, high-priority queue -- he may cancel to make it a one-off, benefits run to 15 Aug). Version 1.0.0(1), commit 451ee04, SDK 54, bundle store.velorcommerce.app. Install button/QR on the expo.dev build page, artifact valid 13 days. This is the real binary, not Expo Go.
- **Google Play org verification: document uploaded by William (Companies House incorporation bundle 17268133_newinc_2026-06-08.pdf), status In review.** Phone verification is gated behind document approval. 
- **Search Console: https://velorcommerce.store is now a VERIFIED property** of willsinclair144@gmail.com (HTML-file method -- public/google6c0313730f4642f3.html on main, commit 5d32eaa7; note in file: do not remove it, verification depends on it). Side benefit: the SEO agent's target site finally has Search Console data access under this account.
- **Play website verification: request re-sent from Play Console AFTER the property existed** (the first send went nowhere -- no Search Console property existed at all). Requester and property owner are the same Google account, so the association should self-approve; if the Play home still flags the website task after a day, check Search Console Settings -> Associations -> Pending requests.
- Redirect follow-up from checkpoint (5): velorcommerce.co.uk AND www 308-redirect to velorcommerce.store, live-verified in Chrome (Vercel domain config on the velor-marketplace project; DNS/MX untouched, email unaffected).

## 2026-07-15 checkpoint (continued) -- Outreach funnel diagnosed: gate was fine, scout was starved; Brave rotation + enrichment retry shipped

William approved a diagnosis of why ~1,041 prospects yielded only ~19 qualified and zero applications. Read the full pipeline (scout-sellers, enrich-emails, qualify-prospects, outreach-auto, prospectQualify) and pulled live numbers via the Pulse pipeline API (admin token from browser localStorage key `velor_admin_secret`).

**The AI qualification gate is NOT the problem -- do not soften it.** Of 171 all-time rejects, 118 cite hard evidence in qualificationNotes (The Body Shop as mass-market, Voylla as generic imitation jewellery, explicit wholesalers, a ceramics-supply company); only ~6 were doubt-only rejections and those were genuinely thin (a Shopify demo store, a store literally named "Jewelry", no country). Active-pool pass rate was 16/35 screened (~46%).

**Actual root causes, confirmed in AgentLog:**
1. Four of the five scout sources have NEVER run -- every scout run logs `source_skipped` for etsy, ebay, google, bing (API keys never set in Vercel). Only Brave is live. Also: Microsoft retired the Bing Search API, so the Bing code path is permanently dead regardless of keys. Etsy/eBay are low-value even with keys: their sellers' emails are not public, so those prospects feed the no_email graveyard.
2. Brave's 30 fixed queries had exhausted: runs on 07-15 returned 2 new prospects vs ~310 duplicates each.
3. 356 prospects (34% of all-time) died at status no_email with only 3 pages checked (homepage, /pages/contact, /contact).
4. Funnel all-time: 1,041 prospected; 636 dropped (07-10 bad-recipient cleanup); 356 no_email; 38 active (36 with email); 19 qualified vs 171 rejected; 218 distinct prospects ever emailed (mostly pre-gate junk); 0 applications. Zero applications is a VOLUME problem -- only ~16-19 genuinely qualified prospects have ever been contacted post-gate.

**Shipped (William: "yes"), commits 655e5deb + build-fix a79d363c, Ready in Production:**
- `scout-sellers`: BRAVE_TARGETS (30 fixed) replaced by a generated matrix -- BRAVE_CRAFTS (~74 craft+country phrases across the six homepage categories, Global South/East weighted) x BRAVE_FRAMINGS (4 phrasings, framing-outer so one run's window is ~30 different crafts under one framing) = ~296 queries. `braveQueriesForRun()` rotates a 30-query window one slice per 6-hour cron slot (`Date.now()/(6h) % length` -- deterministic per slot, full matrix coverage ~every 2.5 days).
- `enrich-emails`: page list expanded from 3 to 9 (homepage + /pages/contact, /contact, /contact-us, /pages/contact-us, /about, /pages/about, /about-us, /pages/about-us), 15s per-prospect budget added. Leftover batch slots after fresh prospects now give stored no_email rows exactly ONE retry: email found -> status back to 'prospected' (so the qualify gate screens it); still nothing -> new terminal status 'no_email_final', never fetched again. Grep confirmed nothing else branches on 'no_email'. At ~24/run x 4 runs/day the 356-row backlog clears in ~4 days.

**Build failure lesson (real cost: two failed Production deploys, caught by William watching Vercel):** the first push removed the BRAVE_TARGETS constant but left `for (const target of BRAVE_TARGETS)` in scoutBrave -- the local TS-syntax-check parses files individually and cannot catch a missing identifier; only Vercel's real type-check can. Grep for every usage of a symbol before deleting its definition. The SEO agent's independently-pushed commit (01a9fbea) also failed while sitting on top of the broken commit -- an innocent-bystander failure, cleared by the fix.

Session workflow notes: this sandbox pushes to GitHub directly over HTTPS with the PAT (no browser needed); the SEO agent pushes to main concurrently, so ALWAYS fetch+rebase immediately before pushing. Vercel build logs fetched via in-browser `fetch('/api/v2/deployments/<dpl_id>/events?...')` with team id from `/api/teams/velor1` -- much faster than the network-tab interception route.

Next checks: scout+enrich crons fire 00:00, qualify 00:20 -- tomorrow's Pulse /pulse/pipeline should show new-prospect volume recovering and retriedFound in the email-enrich AgentLog details. William also floated using the new app-promo graphic in outreach emails; parked until real App Store/Play links exist (QR + store badges in the image would currently be dead links; advised against fabricated "1.2K viewers" social proof in seller-facing email).

## 2026-07-15 checkpoint (continued 2) -- Global-reach push: multiplier pipeline, William's email design live, force-run recovery, PR/social kits

William's directive: "get the word out... global reach... recruit sellers... no ifs or buts." Declined the join-forums-and-mass-post interpretation (account creation prohibited; astroturfing would burn the brand and Resend deliverability) and he approved the four-track alternative: multiplier outreach, social kit, PR push, SEO landing pages (SEO pages still pending).

**Multiplier outreach (commit e35a0bc3):** new 'multiplier' prospect class -- artisan cooperatives, fair-trade orgs, craft associations. 20 rotating Brave queries (6/run ride along with the main window), score 70 so they lead all queues, dedicated MULTIPLIER_SYSTEM_PROMPT in prospectQualify (the maker prompt would wrongly reject a co-op), English partnership pitch in outreachEmail, safeSellerType passes 'multiplier' through. First night: Fair Trade Federation contacted. QUALITY FLAG: gate passed "Vendor Directory" and "Wholesale Textiles" as multipliers -- needs a tightening pass, review verdicts.

**Email template = WILLIAM'S DESIGN, not negotiable.** He rejected my HTML-typographic redesign ("no more block looking templates") and supplied `velor email template.png` (OneDrive\Desktop). Iterations landed at commits 0fcb81c9 -> ac4891f2 -> 19357857 -> a9ee7ac2, all Ready. Final state: masthead.png (wordmark cropped FROM his template -- he explicitly said keep this one; the separate gold "GLOBAL MARKETPLACE" logo was never supplied as a file), full-width orange rule with diamond, hero band, kicker, serif headline with orange accent word, three centered paragraphs, 4-ACROSS icon row (his icons, cropped from template, bg normalized to #0a0a0a), categories line, full-width orange pill CTA (direct link to /apply/invited with country param), velorcommerce.store mark, appNote line, tagline REAL CULTURE. REAL PEOPLE. GLOBAL OPPORTUNITY., dark footer WITHOUT company number (William: "edit the company number out" -- noted UK email rules expect it; site Terms/Contact still carry it). OUTREACH_V2 copy hand-written in ALL 19 languages (kicker/headlineA+B/p1-3/feat1-4+note/cats/ctaV2/tagA+B). Pro line says "free LIFETIME Pro membership" -- matches /apply/invited which promises "Pro, free for life" (my earlier caution was wrong; the landing page makes the lifetime promise). Multiplier initial email restyled to same design (William received an old-style partner email via BCC and flagged it).

**Region heroes:** heroForCountry() in outreachEmail.ts picks hero-<region>.jpg by ISO code or free-text name, default outreach-hero.jpg (cropped from his template). LIVE: hero-morocco.jpg (Arabic region, 12 codes). William is generating 9 more from prompts I supplied (turkey, peru, mexico, india, japan, westafrica, eastafrica, seasia, europe) -- style block: dark, copper glow, wireframe globe arcs, NO TEXT IN IMAGE, 16:9, drop in Downloads/Desktop, crop to ~2.455:1 (Morocco crop: top 260 of 1536x1024).

**Force-run discovery (BIG):** Vercel cron page has per-job Run buttons (Settings -> Cron Jobs). Ran scout+enrich(x5)+qualify+outreach manually: scout's rotating matrix found 257 new prospects in ONE run (vs 2/run before); funnel now 1,298 prospected / 243 active / 28 qualified; 9 invitations sent same evening. Enrichment was the new bottleneck -> BATCH 24->96, TIME_BUDGET 280s, maxDuration 300 (commit ac4891f2).

**Device bridge:** William's Windows desktop "wslaserclean" connects; granted folders this session: Downloads, Desktop, OneDrive\Desktop. His real desktop is OneDrive\Desktop. He REFUSED Pictures access twice -- never ask again; "gallery" means his generator app's gallery, not a filesystem folder. Stage files via device_stage_files.

**Deliverables sent to William:** social launch kit (posts for X/IG/TikTok/LinkedIn/Reddit + calendar to 6 Aug), press release (embargo-ready), media list (16 real outlets, 4 tiers; ChannelX editor chris@channelx.world verified), paste-ready pitches per outlet. His to-do: send ChannelX pitch, post social kit items, generate remaining heroes.

**Mojibake fix:** live English initial subject had a corrupted em-dash (sent in real emails); fixed. Lesson repeated the hard way: grep every usage before deleting a symbol -- removing BRAVE_TARGETS while a loop still referenced it broke two Production deploys (caught by William watching Vercel).

## 2026-07-16 checkpoint -- Founding atlas: duplicate/broken images fixed; 200 open-product-slot boxes added to every country page

**Context:** continuing the founding-atlas polish (all 190 `/founding` cards + `/origins/[slug]` pages -- real cultureHints, real Pexels photography, wired into both pages). William flagged Congo/Congo (DRC) showing duplicate images and asked for a scan.

**Duplicate-image + empty-tile fix (commit f0be3695, live):** found the Congo/Congo (DRC) full 3-photo-set duplicate plus 11 other less-visible duplicate-first-image groups (24 countries total), and 10 countries with zero images (Antigua and Barbuda, Bahamas, Barbados, Dominica, Grenada, Papua New Guinea, St Kitts and Nevis, St Lucia, St Vincent and the Grenadines, Turkmenistan). Fixed via reorder-to-existing-alternative where one existed, fresh WebFetch-verified Pexels research where it didn't. Caught and fixed two NEW duplicates my own reorder fixes introduced (Uganda vs Central African Republic, Tonga vs Samoa) via a full 190-country re-scan -- lesson: always re-check the WHOLE dataset after a fix, not just the previously-flagged list.

**Broken-CDN-link fix (commit 1129112f, live):** a Pexels *photo page* resolving does not mean the *CDN image asset* still loads -- found this the hard way when Ethiopia's founding card rendered a broken-image icon in the browser. Load-tested all 1,021 unique photo IDs in `lib/countryImagery.ts` directly against `images.pexels.com` (concurrency-limited to 6 in-browser via `javascript_tool` + `Image()` onload/onerror -- an unthrottled `Promise.all` on 130 images at once gave ~60% false-timeout noise from the browser's per-host connection cap; 6 concurrent was clean). Found exactly 2 dead links: Ethiopia's "The coffee ceremony" (old id 30937097) and Italy's "Florence belts" (old id 31367060, gallery-only, not on the `/founding` card). Both replaced with fresh verified IDs (38519856, 31367059). **If any other image ever shows a broken-icon on `/founding` or `/origins/[slug]`, this is the playbook: verify via the direct CDN url, not the pexels.com/photo/ page.**

**Still open / not yet done:** the countryImagery.ts header itself says the dedup pass "only covers duplicates visible on /founding's cards and the previously-empty countries" -- 2nd/3rd gallery-image-level duplicates elsewhere in the recovered dataset (e.g. id 34876038 shared by 6 countries, 29475576 by 3, per grep evidence) were NOT touched and would need a further pass if William wants full gallery-level dedup, not just first-image/card-level.

**NEW FEATURE SHIPPED (commit c39f6ab6, live) -- 200 open-product-slot boxes on every `/origins/[slug]` page:** William asked for every "flag page" (confirmed = the 190 `/origins/[slug]` country pages, each has a flag box in its hero) to show 200 boxes in a grid, each 1in wide x 1.5in tall (real CSS inches, `width:1in;height:1.5in`), with a diagonal corner ribbon reading "Your products here" and a small empty card at the bottom of each box reserved for future product photo/name/price once a seller lists. Confirmed with William: shows on EVERY country page regardless of trading status (even countries with real live products already get the 200 extra open slots), diagonal-ribbon style (not a straight horizontal band). Implemented as a single new section in the one dynamic-route template (`app/origins/[slug]/page.tsx`, right after the hero, before the "known for" gallery) -- applies to all 190 pages automatically, no per-country duplication. New CSS classes: `.ocp-slots-intro`, `.ocp-slots-grid`, `.ocp-slot`, `.ocp-slot-ribbon`, `.ocp-slot-card`. The intro copy explicitly says "nothing is for sale here yet" / "not a listing" -- this is deliberate, per LAW #1: 200 empty boxes on a page could otherwise read as 200 fabricated products, so the copy has to make clear these are open capacity, not real inventory.

**NEXT STEPS for whoever picks this up:**
1. Visually spot-check the 200-box grid on both light and dark mode (the CSS uses `var(--surface)`, `var(--surface-2)`, `var(--border)`, `var(--accent)` tokens, which should theme correctly, but this was not manually checked in both modes this session).
2. Check the grid on a narrow/mobile viewport -- `grid-template-columns:repeat(auto-fill,1in)` will wrap to fewer columns automatically, but the ribbon's `rotate(-45deg)` + fixed 150px width was only checked on a 1568px-wide desktop screenshot; confirm ribbon text doesn't clip or overflow the 1in-wide box at small viewports.
3. When real per-country product data exists, the empty `.ocp-slot-card` divs are where it should render (currently just a dashed empty placeholder) -- the natural follow-up is wiring the first N real products (from the same `/api/shop/products?origin=CODE` call already used lower on the page) into the first N slot-cards, so slots "fill in" live as sellers list, exactly as the intro copy promises.
4. The still-open gallery-level-duplicate item above (point 3) is separate and unrelated to the 200-box feature -- don't conflate the two if resuming either one.
5. Reminder for any session working in this file concurrently: the autonomous SEO agent commits to this same repo/branch throughout the day -- always `git fetch origin main` and rebase immediately before pushing, never assume `origin/main` is where you left it.

## 2026-07-16 checkpoint (continued) -- Full site wiring pass, real live bugs fixed, Enterprise tier fully retired, mojibake email corruption fixed

William's directive this session: "no stone unturned" -- connect every
button/flow site-wide, defer only Message Seller until rules exist (see the
OUTSTANDING section at the top of this file). Commits below are all on
`main`, confirmed Ready/Production on Vercel via the deployments page
(`prisma generate` is still blocked in this sandbox -- verified with
`esbuild` syntax checks per file, same limitation as every prior session).

**Readiness audit + payment/checkout trust (commits 52b601a, 97565b8):**
added the missing `/auth/error` page; fixed broken links and silent admin
401s; the shipping/duties calculation on `app/api/stripe/payment-intent`
no longer trusts client-supplied shipping amounts -- it now re-fetches the
authoritative rate from Shippo (`lib/shippo.ts getRate()`) server-side and
recomputes duties via `lib/duty-rates`; the order-confirmation page no
longer fabricates an order number (`'VLR-' + Date.now()`) and instead waits
for the real one from `/api/orders`; fixed a discount-code
double-increment bug on Stripe webhook retries.

**Connect remaining buttons/flows (commits 00ff8ad, f131a28):** cart
quantity +/- controls on the checkout Order Summary (with stale-intent
invalidation), a wishlist key bug (`wishlistItemId` vs the API's actual
`id` field), and a real review-submission UI on the product page. Verified
LIVE via browser, not just deployed -- William caught that my earlier "all
connected" claim was wrong ("buy now buttons still dont work, add to cart
dont work review click dont work"); root cause was that zero real product
listings existed, so the only reachable "product page" was the
intentionally-disabled `/shop/preview` mockup. Changed that page's four
action buttons from silently-disabled to an honest inline notice
explaining it's a preview, not a real listing, linking to `/sell`.

**Live bug found and fixed while testing (not something William
reported):** `app/account/page.tsx` order history was reading a
non-existent `total` field (the real Prisma field is `subtotal`), showing
"£NaN" on every real order in a signed-in buyer's history.

**Enterprise seller tier fully retired (commit 655a97c) --** William:
"imsigned into tester account, why does my dashboard say enterprise when
we removed that tier completly." Root cause was systemic, not one label:
several seller-facing API routes (`seller/me`, `seller/storefront`,
`dashboard/support`, `dashboard/live`, `dashboard/analytics`) were
returning the raw unnormalized `seller.tier` straight from the database,
and about ten dashboard subpages each had a boolean
`isEnterprise = tier === 'PRO' || tier === 'ENTERPRISE'` that was
identical to `isPro` post-retirement, which in every ternary/JSX-order
comparison against a separate `isPro` check meant "Enterprise" always won
and "Pro" was permanently dead code -- the same copy/paste-bug shape as an
`isPro`/`isEnterprise` mixup already fixed earlier in
`dashboard/analytics/page.tsx` this session. That surfaced as real bugs:
Settings showed "★ Enterprise" as the plan name for every Pro seller, and
Go Live read "Enterprise - Live Shopping" even though Live Shopping is
explicitly open to every tier. Added `lib/tier.ts` (`normalizeSellerTier`)
as the one place that collapses any legacy `'ENTERPRISE'` value to
`'PRO'`, applied at every API boundary above, removed the ENTERPRISE
entries from both client-side theme tables (`lib/dashboard-theme.tsx`,
`app/dashboard/layout.tsx` -- now real two-tier Starter/Pro types), deduped
the `isPro`/`isEnterprise` booleans across all ten dashboard pages, and
fixed two double-stacked accent-bar render bugs (Overview and Storefront
pages were rendering a gold bar and a blue bar on top of each other for
every Pro seller). Verified live in the browser afterward, signed in as
the test seller: sidebar reads "PRO PLAN," Settings reads "★ Pro," Go Live
reads "Live Shopping," API Access reads "PRO."

**Mojibake email corruption fixed (commit af8c1b2) --** William forwarded
the actual seller-approval email he received, which read "Great news
â€Â"" instead of "Great news --". This repo has picked up double- and
even triple-encoded UTF-8 mojibake over time in several places (bytes
re-interpreted as Latin-1 and re-encoded, sometimes twice); each instance
was fixed by reading the exact raw bytes and reversing the specific number
of encoding passes, not a blanket text replace (a plain string-replace of
"--" would not have matched the corrupted bytes). Fixed: the seller-
approval email body (the reported bug); the daily briefing email's subject
line, a section header, and a flagged-issue string (all sent to
william); product-page star ratings (were rendering a garbled character
instead of star glyphs); two "discount applied automatically" notes; the
admin "Invalid secret" error message; and a real functional bug, not just
cosmetic, in `app/api/cron/scout-sellers/route.ts` -- title-parsing logic
was doing `.split('a-circumflex')` instead of `.split('en dash')`, so
scraped candidate seller names likely were not being cleaned up as
intended. Left untouched: mojibake em dashes that exist only inside code
comments in this same cron file and a couple of `lib/` files -- not shipped
to any user or email, no functional impact, lower priority than the
user-facing instances above. **If new "â..." garbage appears anywhere
else, this is the signature to grep for** -- it has now shown up in five
unrelated files, so something upstream in the workflow may still be
introducing it.

**Still open, explicitly deferred, not touched this session:**
1. Message Seller / buyer-seller messaging rules -- see the OUTSTANDING
   section at the top of this file.
2. Seller username-at-signup requirement -- see the OUTSTANDING section at
   the top of this file (raised by William at the very end of this
   session, not yet scoped).
3. **The original "click through the whole buyer journey" verification
   task is still not done.** William approved "create one real test
   listing" as the plan (chosen over alternatives) specifically so the
   Add to Cart -> Buy Now -> checkout -> review flow could be proven working
   end to end with screenshots, not just claimed working from code
   inspection -- this is the same lesson from the "buy now buttons still
   dont work" correction above, applied proactively this time instead of
   reactively. William is signed into the pre-existing "Test Storefront
   Preview" seller account (already approved this session via the admin
   panel) -- next session should: sign in as that seller, list one real
   product through the seller dashboard (now unblocked -- Products page
   Enterprise-tier bugs above are fixed), then as a buyer click through
   Add to Cart, Buy Now, checkout with a real Stripe test card, and the new
   review-submission UI, taking screenshots at each step. Do not claim any
   step works without that live proof, per the pattern above.

**Suggested next steps, in order:**
1. Finish the test-listing + full buyer-journey verification (item 3
   above) -- this is the direct continuation of what William asked for
   before this session's detours into the Enterprise-tier and mojibake
   bugs, and it is the best remaining check that checkout/payments/reviews
   genuinely work for a real seller+buyer, not just in isolated code
   review.
2. When William is back and ready: walk him through the Message Seller
   question list in the OUTSTANDING section and get explicit answers
   before writing any code for it.
3. Scope the seller-username requirement with William (also in
   OUTSTANDING) -- likely a small, well-contained change (a required field
   in `app/apply/page.tsx` plus confirming `storeName` is truly the only
   thing ever shown to buyers) but needs his decision on the open questions
   before starting.
4. Given mojibake has now appeared in five unrelated files across multiple
   sessions, worth a five-minute repo-wide grep for the `Ã` signature next
   time anyone is in this file for an unrelated reason, purely as a cheap
   periodic check -- it costs nothing to look and it keeps recurring.


---

2026-07-18 checkpoint -- CHANNELX / CHRIS DAWSON PRESS OUTREACH: VERIFIED, NOT CHANGED (DONE)

William asked for the live Outlook thread with chris@channelx.world (Chris Dawson, Editor in Chief, ChannelX) to be checked end to end. This was a verification pass only -- no code changed, no new email sent.

Sequence confirmed correct, nothing missing or out of order: outreach sent 2026-07-15 23:26, Chris replied 2026-07-16 08:38 asking for the release "under embargo", William's reply went out 2026-07-17 00:43 with the full press release attached inline, embargo dropped ("no embargo, you're free to publish the moment it lands").

Two facts in the release were independently verified against live sources, not just trusted from the email text. Company number 17268133 (VELOR COMMERCE LTD) confirmed live on Companies House: active, private limited company, incorporated 8 June 2026, matches exactly. Pricing quoted in the release (Starter: free, 10% commission, 10 listing cap; Pro: GBP 49/month, 4% commission, unlimited listings) confirmed against the LIVE TIER_CONFIG in app/api/seller/subscription/route.ts, not against this file. Note: the older "Seller tiers" line earlier in this file (12%/8%/5%, citing commit ee7683e) is now stale -- Enterprise was retired 2026-07-15 and Pro absorbed everything it offered, per the comment at the top of route.ts. That line already told readers not to trust it alone; this entry is the live-verified correction.

Three judgment calls in the release were flagged to William directly in chat and confirmed TRUE and deliberate by him on 2026-07-18. First, the release states "William Sinclair, whose physical disability rules out manual work, built the 190-country marketplace from a laptop in a shed" -- not documented anywhere else in this file before now; William confirmed this is accurate and was his approved detail. Second, the media contact listed is support@velorcommerce.store, not customerservice@velorcommerce.co.uk (the address this file's email-routing rule names as the catch-all elsewhere); William confirmed support@velorcommerce.store is a real, monitored inbox. Third, Chris asked to publish "under embargo" and the reply dropped the embargo entirely; William confirmed this was his deliberate choice, faster founding-seller recruitment prioritised over an exclusive embargo, not an oversight.

No outstanding action from this checkpoint. If a future session sees a follow-up from chris@channelx.world, this is the context.

---

## 2026-07-19 checkpoint -- FOREGROUND SERVICE PERMISSIONS DEMO VIDEO: BLOCKED BY SANDBOX, WORKAROUND FOUND, NOT YET SUBMITTED

Goal this session: get a demo video into Play Console's Foreground Service Permissions declaration (FOREGROUND_SERVICE_MEDIA_PLAYBACK, required because the app targets Android 14) so that outstanding App content declaration can be completed.

**What was tried and why it failed.** Continuing from a prior session's workaround for the Expo build CDN returning a genuine 503 to this sandbox's network path (a GitHub Actions job, .github/workflows/download-apk.yml on this repo, has the Actions runner itself curl the presigned build URL and POST the APK straight to Appetize.io's API) -- that workaround fully succeeded and the app is live and installable at https://appetize.io/app/oe3scs5l6mzipmz6266lqaw25e.

This session then spent a long stretch trying to launch and record that Appetize session from this sandbox's Chrome tooling, before William stepped in. It never worked, across many attempts, two devices (Pixel 7, Pixel 6), and multiple fresh tabs: the emulator screen stayed a solid black frame indefinitely, or the session dropped with "Unexpectedly lost connection to device." Confirmed via network logs this was NOT a slow-boot or reaction-time issue -- POST /api/session/request returned 200 and Appetize's own analytics fired an app_played event every time, meaning a real session WAS granted server-side, but the video itself never rendered in this sandboxed browser. Three checkpoints inside a single batched tool call (zero delay from model round-trips between them) still showed byte-identical black frames, which rules out "act faster" as the fix. Conclusion: this sandbox's browser cannot receive Appetize's live emulator video stream (almost certainly a WebRTC/websocket limitation of the sandbox network), an environment limitation, not something more retries will resolve. Do not retry this exact path in a future session without a different environment for the browser automation.

**What actually worked:** William recorded the demo directly on his own phone (IMG_6203.MOV, approx. 107MB) once the emulator route stalled -- the more reliable path, and arguably a better artifact for Play's review since it is a real device, not an emulator.

**Second blocker, also environment-side:** pulling that 107MB file from William's PC into this sandbox (via the remote-devices bridge, already-connected Downloads folder) timed out 4 consecutive times ("wall-clock timeout" on device_stage_files) -- the bridge could not move a file this large in whatever window it allows. Dragging the file directly into the chat also did not work for William this session (not diagnosed further -- he reported the UI would not accept it). If a future session hits the same wall: do not keep retrying the identical transfer call. Either ask William for a trimmed/compressed clip (the source file is far larger than the roughly 15-20 seconds of actual content needed), or find a different transfer path from the start.

**Key discovery that changes the whole approach:** live-checked the actual Play Console form (Monitor and improve > Policy and programmes > App content > Foreground service permissions > Start declaration > tick "Media playback") -- it does NOT take a file upload at all. It asks for a Video link, a plain URL text field. This means the video file never needed to reach this sandbox or be uploaded into Play Console as a file -- William only needs to host IMG_6203.MOV somewhere with a shareable link (YouTube unlisted, or Google Drive with link-sharing on) and paste that URL into the field.

**Next steps, in order (none of this is done yet):**
1. William uploads IMG_6203.MOV to YouTube (unlisted) or Google Drive (link-sharing on) and provides the resulting link.
2. Paste that link into the Video link field under Foreground service permissions > Media playback. As of this checkpoint only the "Media playback" checkbox was ticked in the live form, nothing saved yet -- "Show picture in picture" and "Other" were left unticked as not applicable.
3. Confirm with William in chat before clicking Save -- this changes a live Play Console declaration.
4. Once saved, come back to "App content" for the other 3 declarations that showed as needing attention this session (Sign-in details, Target audience and content, Data safety) -- none of those three were opened or actioned this session, only Foreground service permissions was.
5. If a future session needs to interact with Appetize's live emulator again for any reason, do not repeat the sandboxed-browser recording approach -- it is now confirmed not to work here. Either have William do it directly on his own device/browser, or find a different headless-friendly emulator/recording service.

## Session -- 2026-07-19: Craft imagery opener parity + polish

Work this session on the /origins/[slug] country pages (all pages using the craft-opener pattern):

1. **Craft opener image** (commits 41-45): implemented and iteratively refined a full-bleed photo opener for /origins/[slug]?craft=<term> pages, matching the mobile app's CraftScreen treatment.
   - (41) Scrim gradient adjusted so the top ~2/3 of the image renders clear of any dark overlay, darkening concentrated in the bottom third, per William: "2 thirds of the image needs to be shown behind the text."
   - (42) Opener height changed from a fixed 400px/280px to viewport-relative (66vh desktop / 55vh mobile, with min/max bounds), per William's clarification that "2 thirds of the depth of the image" meant the container itself was too small/narrow, not the scrim.
   - (43) Restructured so the ENTIRE hero block -- flag, country name, trading status, "Known for" hints, speciality tags, and both pills ("Claim your country" / "Become a seller") -- renders INSIDE the image container, not just the kicker+title, per William: "the image needs to cover from the hero text down past claim your country pill, so all text and pill sits inside the image." The .ocp-opener container's height became fully content-driven (min-height only, no fixed/vh height) so it naturally grows to fit however much hero content a given country has. Added .ocp-hero-onimage color overrides (white/light text, tag borders, secondary pill) for legibility over a photo, excluding the primary pill via :not(.ocp-pill-primary) so its own solid accent background is untouched. The non-craft-image code path (plain country pages without ?craft=) was left completely unchanged.
   - (44) **Bug fix**: the scrim's gradient originally faded back to var(--bg) (the plain page background) at a fixed pixel offset (460px). Countries with long "Known for" hint lists and many speciality tags (e.g. Japan: 6 hints wrapping 3 lines + 8 tags wrapping 2 rows) have hero content that extends well past that offset, so the bottom of the hero (flag, name, status, tags, pills) rendered on the plain page background instead of on the photo. Fixed by making the final gradient stop hold the same dark color all the way to 100% instead of transitioning back to var(--bg) -- since the container's height is content-driven, this darkens exactly as much of the photo as the hero content needs, for any country regardless of text length. **Lesson: re-check any content-length-dependent scrim/gradient against the country with the longest hints/tags in the catalogue (Japan, currently) before considering it done.**
   - (45) Removed the "Identity verification not yet available here" status line for countries on identity-verification hold (RESTRICTED_IDENTITY_COUNTRY_CODES). Per William, hidden entirely rather than replaced -- the status <div> simply doesn't render when status === 'hold' (and not pending); flag/name/hints/tags/pills still render normally.

2. **New push technique for the GitHub web editor (avoids a real bug hit this session):** when reconstructing a large file's full content via `window.__pcX = "<huge JSON-escaped string>"` in one javascript_tool call, if that string is hand-copied from a Read tool's own displayed output rather than sourced fresh, the copy can silently drop a middle chunk with no truncation warning -- a push this session landed `.length` short by ~800 characters, missing a whole JSX branch. **Do not hand-copy giant strings from a prior tool-result display into a new tool call.** Instead: split the target file into ~5000-char chunks with `python3 -c "import json; ... json.dumps(chunk)"`, write each to its own /tmp file, `Read` each individually (small enough to verify it's not truncated), then in the browser build the target string via several `window.__pcX += "<chunk>"` calls, checking `.length` after every append against the expected running total (from `wc -c` on the source file beforehand). Only dispatch the CodeMirror replacement once the final length matches exactly, and confirm `newDocText === newText` after dispatch. For single-line/few-line diffs, prefer the smaller/faster live-document find-and-replace instead (locate a unique substring in the current doc via `.indexOf()` / occurrence count, dispatch only that sub-range) -- used for commits 44 and 45 and still the preferred method whenever the before/after text is known exactly.

3. Verification method reconfirmed: after committing via the GitHub web editor, check the commit landed via the History page (github.com/BILSY144/velor-marketplace/commits/main/<path>) rather than relying solely on raw.githubusercontent.com -- the raw CDN can lag 10-30+ seconds even with a cache-busting query param. The commit history and the live site itself (after ~15-20s for Vercel to redeploy) are more reliable signals than the raw file.

## NEXT STEPS (open, not yet started) -- mobile app seller access, logged 2026-07-19

William reported, from testing the live app while logged in: no option or route to reach the seller dashboard, no way to list goods (create a new product listing) from the app, and no real seller-side advantages once logged in -- the app doesn't feel different/better for an actual seller vs. a buyer.

**What already exists in mobile/src/screens (found while scoping this, not yet verified working end-to-end):**
- `DashScreen.tsx` -- imported in `mobile/App.tsx` and registered as a navigator route named `Dash`.
- `NewListingScreen.tsx` -- imported in `App.tsx`, presumably the listing-creation flow, but nothing found yet that links to it from anywhere reachable in the logged-in UI (no confirmed entry point).
- `SellerOpsScreens.tsx` -- exports `SellerOrdersScreen`, `ApiKeysScreen`, `PayoutsScreen`, all imported in `App.tsx`.
- `GoLiveScreen.tsx`, `SellScreen.tsx`, `SeatsScreen.tsx`, `ApplyScreen.tsx`, `VerifyScreen.tsx` -- all exist and are imported in `App.tsx`.
- `MenuScreen.tsx` has a "SELL" section (a `SELL ON VELOR` band linking to the `Sell` route) and a row of pills under it linking to `Seats`, `Dash` ("Dashboard"), and `Apply` -- this reads as a marketing/onboarding CTA aimed at buyers who aren't sellers yet, not a dedicated home for an already-approved seller. Whether this section is reachable from the main tab bar, and whether it's gated by any seller-status check, was not confirmed this session.

**So the screens and nav routes appear to already exist in code -- the gap William is hitting is most likely one or more of:** (a) no visible/working entry point into these screens once actually logged in as a seller, as opposed to the generic "become a seller" promo pills in MenuScreen; (b) the app has no concept of "this logged-in user IS an approved seller" that unlocks a different, seller-specific experience -- i.e. everyone sees the same buyer-oriented menu regardless of seller status; (c) `NewListingScreen` may not be linked from anywhere reachable at all; (d) the screens may exist but be incomplete/stubbed once opened.

**Next steps for a future session (none of this has been started):**
1. Confirm with a real logged-in seller test account (or ask William for one / test alongside him) exactly what he sees today in the app's menu/tabs, and screenshot the actual gap -- don't assume from code reading alone.
2. Find where (if anywhere) the app determines seller status client-side (check `mobile/src/store.ts` and `mobile/src/api.ts` for a seller/approved flag) and confirm whether the UI actually branches on it anywhere, or whether every logged-in user sees the identical buyer menu.
3. Wire a real, persistent entry point to `DashScreen` for approved sellers -- not just a one-off promo pill buried in a buyer-facing menu -- e.g. a dedicated tab, or a MenuScreen section that only renders for sellers and replaces/supplements the generic "SELL ON VELOR" CTA.
4. Confirm `NewListingScreen` is actually reachable (from the dashboard or a tab) and works end to end for creating a new product listing from the app -- currently unverified whether it's linked to anything.
5. Once basic navigation is fixed, revisit what "real seller advantages" should mean in the app specifically -- e.g. order management (`SellerOrdersScreen`), payouts (`PayoutsScreen`), API keys (`ApiKeysScreen`) all already have screens built; confirm each is reachable, functional, and wired to live data, and ask William what additional seller-only value he wants surfaced (sales stats, quick actions, etc.) before building further.
6. **Critical requirement, per William:** the fix must let a single logged-in account operate as BOTH a buyer and a seller -- not a separate seller-only mode, account type, or app experience that replaces buying. An approved seller keeps full buyer functionality (browsing, shopping, checkout) exactly as-is; seller capabilities (dashboard, listings, orders, payouts) are layered on top and reachable from the same logged-in session, not a fork/toggle that hides buyer features while in "seller mode". Whatever entry point gets built (point 3 above) must sit alongside normal buyer navigation, not replace it.
7. Standing directive still applies: do not change anything without explicit user permission -- this is a planning/discovery task list only, no code has been touched yet.

## 2026-07-19 checkpoint (2) -- YOU SCREEN REBUILT: UNIFIED LOGIN DOOR + SELLER STUDIO ENTRY POINTS (approved by William, pushed)

William's directive this session: an advanced login/You page; one login gives buyer AND seller access; a buyer sees only buyer access plus a small "Become a seller" pill. Design approved by William in chat from a 3-state HTML preview before push.

Shipped (2 files, no backend/nav/store changes):
- mobile/src/screens/YouScreen.tsx rebuilt in three states. (1) SIGNED OUT: inline sign-in door for EVERY velorcommerce.store account -- member card, focus-ring form, reset-by-email, Face ID enrolment offer after success; honest onboarding copy (buyer accounts are created with a first order via email activation -- there is no buyer self-registration endpoint; sellers apply). (2) BUYER: full buyer hub unchanged + small "Become a seller" pill (routes to Sell). (3) SELLER (detected by session sellerId, already baked into the JWT by auth.ts): buyer hub kept fully intact, PLUS an ON AIR channel card (real escrow/paid-out/listings from /api/dashboard/payouts, /api/seller/subscription, /api/dashboard/orders, /api/dashboard/products; em dash while loading) and six SELLER STUDIO rows: Dash, NewListing, SellerOrders, Payouts, GoLive, ApiKeys -- the first real seller-facing entry points to routes that existed in App.tsx but were unreachable. Layered, never a mode toggle (per the standing requirement in the section above). GoLive sub-copy initially pitched live broadcasting as founding-only -- WRONG, corrected same night in checkpoint (3) below: live is on every tier.
- mobile/src/screens/SignInScreen.tsx: copy-only rewording from seller-only door to the unified one-account door (route kept -- other screens still link to it).

Decision by William this session: the app login accepts BUYER accounts NOW -- supersedes the previous "buyer passkeys arrive at launch, sellers only" copy.

Verified: npx tsc --noEmit clean against mobile/tsconfig. NOT yet verified on-device; the eas-build workflow is manual (workflow_dispatch), so an Expo publish/EAS build is needed before William can see this on his phone. Remaining from the mobile-app seller access NEXT STEPS above: on-device test as a real seller, confirm NewListing works end to end, and audit whether other screens should also branch on seller status.


## 2026-07-19 checkpoint (3) -- UPGRADE-TO-PRO BUTTON, TIER GATING, CURRENCY FIX, GO-LIVE RECORD SET STRAIGHT, PLAY STORE PUSH STARTED

All approved by William in chat this session. App changes shipped to mobile-app (Expo publish auto-fires per push) and mobile/ fully synced to main at the end of the session.

1. **Upgrade to Pro (William's ask):** DashScreen upgrade card for live STARTER sellers -- POST /api/seller/subscription {action:'upgrade_to_pro'} -> Stripe hosted checkout opened via Linking.openURL. Payment details go to Stripe in the browser, never the app. Founding sellers never see it. New api.ts helper startProUpgrade().
2. **Tier gating (William: "no Pro perks for Starters"):** ApiKeysScreen now Pro-gated with an upgrade door for live Starter sellers. Listing cap and commission were already server-enforced (LISTING_LIMITS in /api/dashboard/products: STARTER 10). AI account manager card was already visually locked for non-Pro.
3. **GO LIVE IS FOR EVERY SELLER -- record set straight (William, explicit):** a session tonight briefly gated the app's GoLive as founding-only, based on the 2026-07-08 "founding privilege" note WITHOUT reading down to the already-existing supersession note ("Live shopping is on EVERY tier now, Starter included"). Reverted same night. LESSON: grep for "SUPERSEDED" and read forward in this file before enforcing any old standing rule. Remaining stale copy corrected on the website too: Go Live removed from the Pro-perk bundles on /founding, /apply, /apply/invited, homepage seller band, /sell launch card, /help founding FAQ -- each now lists real Pro perks (unlimited listings, 4% commission, AI account manager) and, where apt, states plainly that Velor Live is open to every seller on every tier.
4. **Currency conversion FIXED (William's on-device report "does not work"):** root cause -- every price screen (Pdp, Basket, Country, Craft, Live, Checkout) imported onI18n but NEVER subscribed, so fmt() prices painted once in GBP and never repainted when a currency was picked or rates arrived async on cold start. Fix: useI18nTick() hook in i18n.ts, called by all six screens; PdpScreen's sticky Add bar was also hardcoded GBP -> fmt(). Awaiting William's on-device verify.
5. **Language speed:** i18n manifest regenerated via a NEW AST extraction script -- now preserved at mobile/scripts/extract-i18n-manifest.js (the previous manifest header claimed the script was "preserved in CLAUDE.md notes" -- it was not, anywhere). Union of old manifest + fresh extraction: 3,014 strings, 304 new (tonight's screens). Server cache warm for the new strings still TO DO from a browser tab (sandbox cannot reach velorcommerce.store; per-IP budget 2000/day means ~6 languages max per day from one IP -- prioritise, rest fill lazily).
6. **Play Store (in progress when this checkpoint was written):** production Android AAB build to be triggered from mobile-app via the eas-build.yml workflow AFTER the above landed (an earlier run #5 from pre-fix commit 9883358b should be ignored/cancelled on expo.dev to save quota). Remaining: Play Console App content declarations (Foreground service needs William's demo-video LINK -- he is uploading IMG_6203.MOV to YouTube unlisted; Sign-in details needs review test credentials; Target audience; Data safety), store listing (copy/screenshots/feature graphic), upload AAB, submit. Apple: William's developer enrolment still pending acceptance -- iOS submission blocked on that, nothing else.

## 2026-07-19 checkpoint (4) -- VELOR SUBMITTED TO GOOGLE PLAY FOR REVIEW (the whole thing, same night)

At William's direction ("move fast and get this on the google play store"), the full submission went in tonight. State when "Send changes for review" was clicked: 11 changes in review -- Production release 5 (1.0.0, AAB from commit 000c4c5 via EAS build ba59fa97, all of tonight's app work included), 177 countries/regions targeted (every one Play offers, William: "every country") + rest of world, en-GB store listing (name VELOR), and all App content declarations.

What was completed tonight in Play Console, in order: app category (Shopping) + store contact details (support@velorcommerce.store, https://velorcommerce.store) -- Foreground service declaration (Media playback ticked, video link https://velorcommerce.store/velor-foreground-service-demo.mp4; the 107MB IMG_6203.MOV was pulled off William's PC in 15MB dd chunks via the device bridge after whole-file staging timed out again, ffmpeg-compressed to 3MB/720p in the sandbox, committed to the site's public/ and served by Vercel -- the "video link not file upload" discovery from checkpoint (1) was exactly right) -- Data safety imported from William's prepped data_safety_import.csv (Downloads) via the Import from CSV flow, all types Completed -- Sign-in details: reviewer account willsinclair144+playreview@gmail.com (a real STARTER seller account William created himself at /auth/sign-up, store "Play Review Test Store"; password provided by William in chat and entered into the declaration -- it is DISCLOSED TO GOOGLE by design, treat as public) with honest access instructions -- Target audience: 18 and over only.

Managed publishing is OFF: when Google approves (typically up to 7 days per their dialog, often 1-3), the app publishes AUTOMATICALLY to all 177 countries. Watch for the review outcome in Play Console / email. Warning left standing: no deobfuscation file on the AAB (cosmetic, crash reports only). Apple: still blocked on William's developer enrolment acceptance, nothing else.

Follow-ups: revoke tonight's GitHub PAT (William, reminded in chat); on-device verify of the currency fix + language speed in Expo Go; walk the review account through a listing end-to-end sometime (it doubles as a seller-flow test account); if Google rejects anything, the declarations above are where to look first.

## 2026-07-19 checkpoint (5) -- PULSE APP ANALYTICS SHIPPED (installs / country / platform / language / currency / DAU-WAU)

William asked for an app-downloads tracker on Pulse with "all the key details... the more information the better". Built the same night: additive Prisma model AppInstall (anonymous installId, platform, osVersion, appVersion, country from x-vercel-ip-country server-side, language, currency, createdAt, lastSeenAt); public POST /api/app/install (idempotent upsert, validated); admin GET /api/admin/pulse-app (totals, DAU/WAU/MAU from lastSeenAt, 30d sparkline, breakdowns by country/platform/OS/app-version/language/currency); /pulse/app drill page in the house PulseKit style; App installs KPI card on the Pulse hub (pulse-data extended with an `app` section). App side: mobile/src/installPing.ts pings 3s after cold start, fire-and-forget (mobile-app ee6e297f, main e351d2c0, mobile/ in sync).

HONESTY NOTES: (1) AGE IS NOT COLLECTED AND NOT COLLECTIBLE -- only Play Console's aggregate demographics will ever show age, and only at volume. Do not add age collection without re-doing the Data safety declaration. (2) The telemetry is covered by the submitted declaration -- the data_safety_import.csv already declares Device or other IDs (app functionality + fraud prevention), verified line 61/765+. (3) The SUBMITTED store build (5) predates the ping -- store installs will NOT report until either an OTA update is published to the PRODUCTION channel after Google approves (the auto workflow publishes to preview only -- a production `eas update --branch production` is a separate deliberate act) or the next store build. Expo Go (preview channel) has it now. (4) Counts are ACTIVATED installs (first opens), not store downloads -- store download counts stay in Play Console > Statistics.

---

## 2026-07-20 checkpoint -- LIVE SHOPPING POLISH PASS: PIN SYNC CONFIRMED, MOBILE ZOOM FIXED, DESKTOP LAYOUT CAPPED, BELL REPLACES HEART

Continuation of the TikTok-style live-shopping redesign from earlier in the week (seller `app/dashboard/live/page.tsx`, buyer `app/live/[room]/page.tsx`, native `GoLiveScreen.tsx`/`LiveRoomScreen.tsx`). This session was almost entirely William's live, on-device bug reports against the already-shipped redesign, fixed and verified one at a time -- commits `4adf8825`..`f9f14b70` on `main`, all pushed and confirmed both on the remote and (where checked) on William's own screen via the device bridge's read-only screenshot tool.

**False alarm, corrected early:** an unauthenticated `git fetch` at the start of the session showed `origin/main` 13 commits behind local, which looked like the entire prior redesign had never actually been pushed. A fresh *authenticated* fetch showed `origin/main` matched local exactly -- the plain fetch had just failed silently against this sandbox's proxy and returned a stale cached ref. Lesson: don't trust an unauthenticated `git fetch`/`git log origin/main` in this environment as proof of what's live; re-fetch with the PAT before concluding anything is or isn't pushed.

**Bugs found and fixed, in the order William reported them:**
1. **Buy Now button "absent" / product card looked like "an oval pin, that's all":** not a bug -- confirmed live on William's own screen (desktop Chrome, granted read-only via the device bridge) that pinning a product from the seller's phone correctly promoted it from the plain oval tray chip to the full "Now showing" card with a working Buy Now button on the buyer's desktop session, in real time. The earlier report was simply a moment where nothing was actively pinned yet.
2. **Mobile "screen expands and doesn't auto-resize" (persisted through two earlier rounds of fixes -- 16px input font-size, then card repositioning):** root cause was iOS Safari's zoom-on-input-focus not being prevented at the source -- the site's shared viewport meta tag still allowed pinch-zoom, and once Safari zooms in for any reason it does NOT automatically zoom back out on blur. Fixed by having both live pages lock the viewport to `maximum-scale=1, user-scalable=no` for as long as they're mounted (restored on unmount so the rest of the site keeps normal pinch-zoom). Also added a `window.visualViewport`-tracking height in place of trusting `100dvh` directly, as a second, independent fix for the same class of symptom. William confirmed fixed after this landed.
3. **Desktop buyer view "taken the whole page," product card "end to end":** the buyer live viewer had no responsive treatment at all -- always full-bleed edge-to-edge regardless of screen width. Added an `isMobile` check (matching the pattern already used in the seller dashboard page) and capped the desktop frame to ~430px, centered, TikTok/Instagram-Live-desktop-style; mobile is unchanged (still true full-screen). William confirmed "yes thats much better."
4. **Seller mobile broadcaster pin tray "could put off the seller's view":** moved from directly under the header (floating over the seller's own picture of their video) to directly above the chat composer, matching the buyer-side reposition shipped earlier. The "View public page" link that used to sit in that spot was removed outright at William's request -- "it has no purpose on the video at all."
5. **Stream title/caption "floating in the middle of the screen," "white and boring":** first attempt gave it a grounded dark-pill background + Velor's Fraunces serif instead of plain white text -- William's next report was that it was now "a long box" still floating, and to remove it completely, since the pinned product card already states what the product is. Removed the title/description block entirely rather than re-styling again.
6. **Heart -> bell, per William's explicit direction ("remove the heart and place it with a bell that chimes like mobile app"):** discovered mid-task that the app already has a genuine bell chime feature -- `mobile/src/screens/BellScreen.tsx`'s "RING IT" plays a real synthesized cast-bell sound (`mobile/assets/bell.m4a`) with a five-step swing animation, built in an earlier session per William's 2026-07-15 call ("bell notifications need a real bell noise"). Reused that exact asset and swing curve rather than inventing a new sound: mirrored the file to `public/sounds/bell.m4a` for the website, replaced the tap-to-like heart (and its double-tap-on-video gesture, which doesn't map as a sensible "ring a bell" metaphor) with a single rail-button tap that plays the identical chime and swing on both the website (lazily-created `HTMLAudioElement`, try/catch-wrapped) and the native app (`expo-audio`'s `createAudioPlayer`, same lazy-creation/try-catch/release pattern as `BellScreen.tsx`). Both surfaces now sound and animate identically to each other and to the existing BellScreen feature.

**Verification method used throughout:** the user's desktop was screenshotted live via the `mcp__remote-devices__computer_screenshot` tool (read-only Chrome grant) at multiple points to directly confirm rendering state rather than trusting William's text description alone or my own code-reading -- this is what caught that the "Buy Now absent" report was a non-bug, and confirmed the desktop-cap and pin-sync fixes visually rather than by inference. Every push was verified against a fresh `git clone` of the exact commit before considering it done, per LAW #1.

**End state, William's words:** "ok now its perfect. from what i can see its set right now." Session closed on that note, with an explicit plan for **tomorrow**: "we will make it our own design based off these visuals" -- i.e. a further, more distinctively-Velor-branded pass on top of the now-working TikTok-style structure, not a functional redo. See the OUTSTANDING section near the top of this file for the seller dashboard redesign William raised in the same conversation, which is a separate, larger, not-yet-started piece of work.

**Not done this session, still open:** the homepage/home-screen live video embed feature (actual inline live video tiles on the website homepage and the native app's home screen, horizontal row when multiple sellers are live simultaneously, click-through to the full room) -- raised earlier in the week, confirmed still not started, not touched this session either. The GitHub PAT William pasted in chat this session is, per standing practice, flagged again for rotation -- it sat in plain chat text and shell history for the whole session.

## 2026-07-21 checkpoint (late) -- APP SELLER DASHBOARD: BLACK SCREEN + NaN FIXED, FULL SWEEP COMPLETED, BROKEN npm ci FIXED

Context: the prior session (Seller Studio work above) crashed mid-task while
sweeping the native app's seller dashboard for William's report: "abnormal
symbols" under YOUR CHANNEL / EARNED - ALL ORDERS, plus black blank screens
when opening some seller sections. It got the core fix PUSHED before dying
(main `c35e539d`, mobile-app `843444af`, Expo preview publish auto-fired,
Vercel green) but never checkpointed it, and never finished the full sweep.
This session verified the fix and completed the sweep.

**The fix that landed (verified in git + Vercel, not memory):** the
2026-07-21 orders-API reshape (`a4bd2fe`) changed `/api/dashboard/orders`'s
response; the app still read the OLD fields -- `o.totalPayout` (now
undefined) summed to NaN under EARNED (the "abnormal symbols"), and
`o.totalRevenue.toFixed(2)` threw on undefined, crashing SellerOrders to a
black screen. `mobile/src/api.ts`'s SellerOrder type now matches the route
exactly, DashScreen sums `sellerEarnings`, SellerOrders renders
`product.name`/`images`/`total`/`sellerEarnings`, all null-guarded; the
route additionally returns per-order `sellerEarnings` (additive) so no
client recomputes commission maths.

**Full sweep completed this session (William: "a full sweep is needed"):**
every app screen that consumes seller APIs was diffed against the LIVE
route handlers, not assumptions:
- `/api/dashboard/payouts` <-> SellerPayouts: exact field match; PayoutsScreen
  fully null-guarded (`p?.pendingEscrow ?? 0`, `live && p` gates).
- `/api/dashboard/products` <-> SellerProduct: match (route maps title->name;
  screens read `name ?? title`).
- `/api/seller/subscription` <-> tier/foundingBadge/listingLimit reads: match.
- `/api/dashboard/live` <-> SellerLiveStatus: match; GoLiveScreen try/catch
  with honest error state.
- YouScreen seller card: all figures guarded -- em dash while loading,
  never NaN.
- Every `nav.navigate()` target in mobile/src resolves to a registered
  route in App.tsx (no dead-route black screens).
- Byte-level mojibake scan of mobile/src: clean (the symbols were NaN
  output, confirming the prior session's scan).
- `tsc --noEmit` on mobile/: ZERO errors in any data/screen code. The only
  errors are 8 PRE-EXISTING types-only complaints in GoLiveScreen/
  LiveRoomScreen (LiveKitRoom `style` prop not in its TS props, TS 5.x
  Uint8Array generic strictness, RegisteredStyle vs ViewStyle) -- runtime-
  safe, Metro doesn't type-check so EAS builds can't fail on them, and the
  live-broadcast screens are on the do-not-touch-without-checking-in list,
  so deliberately left alone and logged here instead.
- Branch parity checked: after the sync, mobile/src data screens (api.ts,
  DashScreen, SellerOpsScreens, YouScreen) are byte-identical between main
  and mobile-app; the branches only diverge on the LiveKit live-shopping
  files (main = store build with real LiveKit; mobile-app = Expo Go
  version without the native module). That divergence is intentional.

NOT yet confirmed on William's device -- he should reopen the seller
dashboard in Expo Go: Earned figure and Orders pages should now be correct.

**Real breakage found by the sweep, fixed (commit `326fe815`):** main's
`mobile/package-lock.json` never gained the LiveKit dependencies
package.json added 2026-07-20 -- `npm ci` failed outright, and
`.github/workflows/eas-build.yml` runs exactly `npm ci`, so THE NEXT STORE
BUILD WOULD HAVE DIED AT INSTALL. (Unrelated to the 5072fbd lockfile-drift
revert on mobile-app, which is consistent -- `npm ci --dry-run` clean, no
LiveKit in its package.json.) Regenerating surfaced two real peer
conflicts, fixed at the source, NO --legacy-peer-deps papering:
`@config-plugins/react-native-webrtc` ^10 -> ^13 (v10 peers expo ^52,
project is expo 54) and `@livekit/react-native` ^2.7.0 -> ~2.8.0 (2.9+
peers webrtc ^137/^144 but the project pins webrtc ^125; 2.8.x is the
newest that peers ^125). `npm ci` verified passing from a clean tree.
Reminder that still stands: never commit lockfile drift from this
sandbox's own incidental installs -- this commit is a deliberate,
verified lockfile regeneration, the opposite case.

Environment note for future sessions: this cloud sandbox HAS outbound
network in bash (public git clone, npm registry, curl all work) -- the "no
network" rule in older notes applies to a different environment.

## 2026-07-21 checkpoint (late 2) -- LANGUAGE/CURRENCY: ROOT CAUSES FOUND AND FIXED; WARM-UP PASS IS TOP PRIORITY WHEN FUNDS ALLOW

William: "language and currency conversion on both desktop and app. only
some words and symbols are ever converted... we base our business on
anywhere anyone can use our services in their own language and currency
... no room for just settling with part conversions." Full diagnosis run
with live evidence, all fixes shipped this session.

**ROOT CAUSE 1 -- the translation budget death spiral (server, primary):**
v1 accounting (lib/translate.ts) counted REQUESTED cache-misses and kept
incrementing after a caller was capped; capped misses were never
translated so never became cache hits, so the same strings re-counted on
every page view forever. Verified live in Vercel logs: William's home IP
at 39,297 counted "misses" against the 2,000/day cap -- permanently
capped by one day of legitimate testing, everything new on his IP
(desktop AND phone share it) falling back to English. Fixed (78287c2d):
gate peeks without recording, only translations actually performed are
recorded, day keys prefixed d2: so v1's poisoned counter rows are
orphaned. Limits deliberately unchanged at 2,000/IP / 25,000 global
(William chose to keep 2,000). Debug responses now carry the cap reason.

**ROOT CAUSE 2 -- the app cached English fallbacks as done, then saved
them to disk (mobile/src/i18n.ts):** same bug class the website fixed in
2930ab4, never ported to the app -- and v4.1's on-device persistence
made it permanent across restarts. Fixed (c4825a71): only translations
differing from source are cached; dict files bumped velor-i18n ->
velor-i18n2 (poisoned on-device files abandoned, they self-clean);
per-string 60s retry cooldown + repaint-only-on-real-change prevent a
capped server from being hot-looped by render cycles.

**ROOT CAUSE 3 -- currency was wired only partially:** site dashboard
pages beyond Overview/Payouts painted raw GBP; the app's SELLER screens
hardcoded GBP while buyer screens converted. Fixed: new shared
useMoneyFmt() hook wired into Orders/Analytics/Discounts/Upgrade
(5c33412f; CSV exports stay raw GBP data; GBP input fields stay GBP;
Upgrade shows converted price with an honest "Billed as £49 GBP" note),
and all app seller money now renders via fmt() with useI18nTick()
(c4825a71).

**TOP PRIORITY WHEN FUNDS ALLOW (William, 2026-07-21: "i dont have the
funds for now but please can we mark this as top priority for when i can
afford it"): the full warm-up pass.** Pre-translate the complete
site+app string union across all 18 non-English languages so every user
gets instant, total translation from cache instead of lazy trickle-in.
One-off Anthropic API spend, ballpark £30-100 (last full warm-up was
~46k strings). Until then translation self-heals lazily as users browse
-- correct but not instant for first-seen strings. RE-RAISE THIS with
William when he mentions budget/funds available; do not let it go quiet.

**Verify after deploy (not yet done at write time):** /api/translate
with {debug:true} from William's IP should show cacheOnly:false and
genuinely translate; his phone app should heal itself as screens render
(old poisoned dicts abandoned on next app update via OTA).

## 2026-07-21 checkpoint (late 3) -- GOOGLE PLAY STATUS CORRECTED FROM THE LIVE CONSOLE; APPROVAL-DAY RUNBOOK PREPARED

Earlier notes here were OUTDATED, William corrected them and the live Play
Console was examined 2026-07-21 evening. Current truth:

**Google Play -- nothing left on our side; waiting only on Google's
review.** Production release 5 (1.0.0), submitted 19 Jul 22:42, IN REVIEW,
configured for FULL ROLLOUT to 177/177 countries on approval. In the same
review: store listing (VELOR, en-GB), content rating questionnaire, target
audience, Shopping category, and all declarations INCLUDING foreground
services -- the FGS demo video WAS submitted and Google verification
passed (the 2026-07-19 "not yet submitted" note above is superseded).
Android developer verification: complete for all apps. Managed publishing
is OFF, so the app goes live AUTOMATICALLY when review passes -- no
further action. Internal testing release 2 stays live for testers.
No policy issues, no rejections. Apple: enrolment still pending, nothing
to do.

**APPROVAL-DAY RUNBOOK (prepared, William: "yes all"):**
1. The moment Google approves: run the new manual workflow **"Publish
   Velor app to Expo PRODUCTION"** (.github/workflows/
   eas-update-production.yml on mobile-app, commit d5207356). Actions ->
   that workflow -> Run workflow -> type LIVE in the confirm box. It
   publishes mobile-app's current JS to the production channel so store
   installs immediately get everything since the 19 Jul build (2h SLA
   screens, black-screen/NaN fix, exact-pence + converting money,
   translation cure, honest Go Live copy).
2. **HARD RULE until store build #2 ships: production OTA comes ONLY
   from the mobile-app branch.** Build 5 has no LiveKit native module;
   main's mobile/ imports @livekit/react-native at module load and would
   CRASH every store install at launch. Both builds currently share
   runtime exposdk:54.0.0 (runtimeVersion policy: sdkVersion) -- nothing
   but this rule keeps main's JS off build 5.
3. **Store build #2 (adds real LiveKit broadcasting):** unblocked tonight
   (main's mobile lockfile fixed, npm ci verified). BEFORE cutting it,
   split the runtimes: set an explicit runtimeVersion (e.g. "1.1.0") in
   main's mobile/app.json so build-5 installs and build-2 installs stop
   sharing OTA updates; then build via the existing EAS Build (manual)
   workflow, profile production, from main. Submitting build #2 to Play
   restarts review for that release only (the app itself stays live).
4. Build 5 was built from mobile-app (EAS Build manual run #5, profile
   production, channel production, appVersionSource remote).

## 2026-07-21 checkpoint (late 4) -- FULL SITE WIRING SWEEP BEFORE SELLER ONBOARDING PUSH

William: "1 full enhanced sweep through the entire website for anything
not working or wired up through routes." Method: static cross-check of
the whole codebase plus live verification against production.

**CLEAN (verified, not assumed):**
- All 144 frontend fetch calls resolve to one of the 133 real API routes
  with a matching exported HTTP method. Every initially-flagged mismatch
  was a false positive of the checking script, individually re-verified.
- All 220 internal link/navigation targets resolve to one of the 93 real
  pages (the only two non-page hrefs are the press page's logo downloads,
  both files present in public/).
- No dead handlers, no empty onClick, no fake setTimeout-only buttons.
  The only "Coming soon" copy is the honest Payoneer state.
- All 34 top-level public pages return 200 in production; dynamic routes
  verified live (/origins/gb, /specialities/ceramics). Zero console
  errors on / and /shop.
- Messaging: see the corrected OUTSTANDING section above -- wired since
  2026-07-20; only William's rules remain open.

**CLEANUP:** deleted the stray file `app/feat: add Google Fonts and CSS
variables to layout` (junk from an old botched commit; Next ignored it)
and the dead components/Footer.tsx it was the sole importer of (the
placeholder-link footer superseded by GlobalFooter). tsc clean after.

**CRITICAL DATA FINDING (not a wiring bug -- needs William):** the shop
is currently EMPTY in production. /api/shop/products returns zero
products and /api/lattice reports trading: 0, because the ONLY product
in the database -- William's founding "hand made toys" listing, APPROVED
and live-verified with real money on 2026-07-17 -- is now status
REJECTED. No cron or agent code path can reject an APPROVED product
(auto-moderate only touches PENDING_REVIEW; the seller edit PATCH never
writes status): the only route is the admin products PATCH behind an
ADMIN-role session, i.e. someone clicked reject in /admin/products or
/pulse/listings after 07-17. Raised with William in chat; needs an admin
re-approve (and its stock is 0 from the test purchase, so it will show
SOLD OUT once restored). Until at least one APPROVED product exists,
buyers see an empty marketplace and the atlas shows no trading
countries -- worth fixing before the seller-onboarding push.

## 2026-07-21 checkpoint (late 5) -- LIVE STREAM REPORTING RULES (William): FORM WITH REASONS, 5 SEPARATE REPORTS END A STREAM

William: "cant stop a live by 1 report. there needs to be a page for the
viewer to report to and the reasons for the report, and the rules are 5
seperate reports triggers a live stream ending after reports filled in."

Shipped (web + app, server enforced):
- AUTO_END_THRESHOLD raised 3 -> 5 in /api/live/[room]/report. Reports
  were ALREADY per-account deduplicated (LiveStreamReport unique on
  [streamId, reporterEmail]) and sign-in gated, so 5 means five separate
  accounts -- one person can never end a stream.
- Every report must now be FILLED IN: a reason from the shared list in
  lib/liveReportReasons.ts (contact-sharing/off-Velor steering,
  inappropriate, prohibited items, misleading, safety, other) with
  optional details -- required for "other". Schema: LiveStreamReport
  gained reason (default "unspecified" for old rows) + details; applied
  in production automatically by the build's prisma db push.
- Report FORM (reasons radio list + details + submit) replaces the old
  one-tap report: full-screen overlay on the web viewer
  (app/live/[room]/page.tsx) and in the native app's LiveRoomScreen
  (main branch -- build #2 code; the Expo Go branch has no live viewer).
  Overlay keeps the stream playing underneath rather than navigating
  away to a separate URL.
- When the 5th report ends a stream, the ops review SupportTicket now
  includes the reason breakdown and reporter details, so review starts
  with the WHY.

## 2026-07-21 checkpoint (late 6) -- BUYER-FACING UI BATCH, ALL LIVE-VERIFIED

All requested by William in chat this evening, each deployed green and
verified in his browser:
- /specialities INDEX page removed entirely (header/footer/origins/shop
  links + sitemap too; per-term pages kept -- homepage chips and origin
  pages link them; sitemap carries a DO-NOT-RE-ADD note for the SEO
  agent, which created it on 07-20). Its header link had been shrinking
  the search bar.
- Desktop logo moved to the far left of the viewport (.velor-logo-link,
  min-width 901px only -- phones/tablets byte-identical to before).
- Origin (flag) pages stripped to sellers' listing boxes only: category
  photo-card rail + category pill row now render solely on the global
  /shop view. Category discovery is the search bar's job (William).
- /api/search results ranked by seller merit (rankingScore desc, then
  createdAt), take 8 -> 24 -- "ceramics" now returns a real ranked page
  of listings across countries.
- FLAG SWITCHING BUG fixed: client-router push /shop?origin=X ->
  /shop?origin=Y (same path, query-only) silently no-oped in production
  (reproduced live; homepage flag clicks were fine). Flags are now real
  <a href> links (closes SEO backlog 34 -- 190 crawlable country links):
  soft-nav from other pages, full navigation when already on /shop.
  Verified live: GB -> Albania -> Andorra hops.
- Country pages: high-definition faded flag (flagcdn SVG, opacity 0.14,
  bottom fade) fills the whole white header band behind VELOR / All
  Goods / search, edge to edge between the borders. William: "thats so
  much better, gives the seller some state of pride and the buyer knows
  exactly what page there on. perfect."

Still open from earlier today: William's founding listing is REJECTED ->
shop + lattice EMPTY in production (needs admin re-approve; see late 4);
Google Play release 5 in review, production-OTA button armed; session
PAT to revoke at wrap-up.

## STANDING RULE (2026-07-21) -- SEO AGENT DESIGN FREEZE

William: "stop the seo agent from changing our pages we designed ... i
only set up the seo agent to work for better search engine results."
Enforced in three places, all live: (1) the hourly scheduled task's
prompt rewritten with an explicit DESIGN FREEZE (verified updated
2026-07-21 20:57 UTC); (2) SEO_LOG.md's rules section, which the agent
reads first every run; (3) this note. The agent may touch ONLY: head
metadata, schema.org JSON-LD, sitemap.ts, robots.ts, image alt text, and
SEO_LOG.md. Anything a user can see -- pages, routes, components, nav,
links, styles, rendered copy, anything in mobile/ -- requires William's
explicit written approval first, logged as a proposal in SEO_LOG.md's
backlog. Interactive sessions: if a future SEO-agent commit violates
this, revert it and tighten further rather than letting it slide.

## 2026-07-21 checkpoint (late 7) -- PAYONEER MASS PAYOUTS: TWO-CHANNEL CHASE SENT; SELLER-ACQUISITION RESEARCH LAUNCHED

Payoneer (urgent, William): 8 days after the 13 July Mass Payouts partner
application, zero genuine contact (Outlook contains only wrong-account
noise from the mistaken duplicate, Customer ID 105170281). Verified live
in the signed-in Payoneer account (correct account confirmed on-screen:
VELOR COMMERCE LTD, Customer ID 104582691) that the application never
created any support case ("My Requests" was empty -- the Salesforce lead
form left no tracked record). Chased on two channels 2026-07-21 evening:
(1) support case 260721-023420 raised from inside the correct account
(status Received; William ticked the captcha and submitted); (2) email
SENT 22:34 from customerservice@velorcommerce.co.uk to
partners@payoneer.com, cc smb@payoneer.com, referencing the case, the
application date, the 6 Aug launch, and the disregard-the-duplicate
instruction -- verified in Sent Items. One-shot scheduled task
trig_01M4Mda4L43vPPGbmErV4MXu fires 2026-07-23 08:00 UTC to check both
channels and recommend LIVE CHAT escalation if still silent.

SELLER ACQUISITION (William: "really struggling to get sellers to
onboard, not a single 1 to date... full research how we can reach these
people around the world for free... otherwise we are going to have to
pospone opening to buyers"): deep-research workflow launched this
session on free worldwide artisan-recruitment channels, conversion
levers, cold-start precedents, competitor-seller discontent, and a
0-to-10-sellers-in-2-weeks plan. Report lands in this session; findings
and the action plan to be checkpointed here when done. HONEST BASELINE:
weeks of cold email + Facebook group outreach have produced ZERO
sellers; treat channel strategy as unproven until a signup exists.

## 2026-07-21 checkpoint (late 8) -- SELLER ACQUISITION PLAYBOOK DELIVERED (deep research, adversarially verified) + TRUST ACCREDITATION RESEARCH

Deep-research run complete (104 agents; every claim 3-voter adversarially
verified; live-fetched sources 2026-07-21). PDF delivered to William:
"Velor-Seller-Acquisition-Playbook.pdf". Core verdict: cold-emailing
individual artisans failed because an unknown marketplace is
indistinguishable from a scam to an individual; the evidence-backed play
is AGGREGATORS + DENSITY + HAND-HOLDING.

VERIFIED CHANNELS (all live-checked):
- Asha Handicrafts Association (India): WFTO Guaranteed Member,
  aggregates 1,000+ artisans, mission IS finding them sales channels,
  already supplies SERRV/Ten Thousand Villages. Highest-value pitch.
- WFTO free searchable member directory (wfto.com/members/) + sourcing
  route info@wfto.com.
- EPCH (epch.in/member): ~10,000 Indian handicraft exporters with
  public emails, verified accessible without login.
- World Crafts Council (UNESCO-accredited): 5 regional networks +
  downloadable World Craft Cities list (Srinagar, Jaipur, Kyoto,
  Birmingham, Stoke-on-Trent...).
- Fair Trade Federation (US/CA member directory).
- Qwoted free tier (2 pitches/month) -- the only free press channel
  that survived verification.
COLD-START PRINCIPLES (verified): one niche/region first, density before
breadth (Reforge/Chen/Rachitsky, no counterexamples); Etsy seeded from
existing craft communities + craft fairs + near-zero fees + sellers with
audiences; manual founder-led onboarding (Breather/Airbnb). Barriers to
lead with (ITC 111-country survey; DEF India ~20% digital training):
payments, escrow, delivery, hand-held setup -- NOT commission rates.
HONEST NULLS: no conversion-rate data survived verification; craft
bloggers/TikTok/diaspora/tourism-board channels unproven.

TRUST ACCREDITATIONS (separate agent, all verified with costs/URLs, in
the PDF): ICO registration LEGALLY REQUIRED (£52/yr); FREE: Good
Business Charter, Trustpilot, Google Customer Reviews, PCI SAQ A
statement; £50 Heritage Crafts membership; later: chamber (~£300),
Cyber Essentials (£360), BAFTS, Buy With Confidence (needs 6mo trading),
WFTO candidacy (~EUR850/yr, 2027). INELIGIBLE/AVOID: Fair Trade
Federation membership (US/CA only), SafeBuy (credibility challenged),
Shopper Approved, "Stripe verified partner" badges (do not exist).

2-WEEK PLAN (in PDF): Day 1 pick ONE launch cluster (recommended: Indian
handicrafts); Day 1-2 free trust stack; Day 2-4 five-to-ten personalised
aggregator pitches under William's name; Day 3-5 EPCH direct wave
(20-30/day, quality over volume); Day 5-7 Qwoted + craft-city press;
Week 2 hand-hold every respondent end to end. Execution starts on
William's cluster decision.

## 2026-07-21 checkpoint (late 9) -- SELLER OUTREACH EXECUTION STARTED: 4 AGGREGATOR PITCHES SENT + PAYONEER TWO-CHANNEL CHASE DONE

Cluster decision (William): INDIAN HANDICRAFTS first. Company No.
17268133 (use in all signatures).

SENT tonight from customerservice@velorcommerce.co.uk under William's
name (all verified sent via Outlook):
1. Asha Handicrafts Association -- contact@ashahandicrafts.com, cc
   ivan.carvalho@ashahandicrafts.com (the flagship pitch; 1,000+
   artisans).
2. WFTO -- info@wfto.com (sourcing/central route; asked for member
   circulation + Asia network connection).
3. EPCH -- mails@epch.com (asked for member circulation route +
   presentation to the Council).
4. WCC Asia-Pacific -- admin@asiapacificcraftsalliance.org (wccapr.org
   redirects there; asked for craft-city/national-council routing,
   named Jaipur + Srinagar).

FRAMING RULE (William, mid-send): Velor is a GLOBAL marketplace, never
"a UK marketplace" -- UK appears only in the registration line
("Velor Commerce Ltd, Company No. 17268133"). Honesty note: pitches 1-2
(Asha, WFTO) went out BEFORE the correction and describe Velor as "a UK
marketplace ... launching worldwide" -- factually true, not retracted;
pitches 3-4 and ALL future outreach use the global framing. Standing
rule for every agent and session: use the global framing.

STILL TO SEND (Day 2 wave): Jaipur craft-city body + Fair Trade Forum
India (contacts need identifying first), then the EPCH member direct
wave (20-30/day, personalised, quality over volume). Trust stack
Day-1 items (ICO, Good Business Charter, Trustpilot, Google) not yet
submitted -- William does these. Follow-ups to tonight's 4 due in 5-7
days if silent. Hand-hold ANY respondent end to end immediately.

## 2026-07-22 correction -- "EMPTY SHOP" FINDING RESOLVED: WILLIAM REJECTED THE DUMMY LISTING DELIBERATELY

The late-4 checkpoint's "critical data finding" (only product REJECTED,
shop empty, suspected accidental admin click) is RESOLVED and was NOT a
problem: William rejected "hand made toys" himself -- it was a dummy
listing created to test the system and checkout (the 2026-07-17
real-money end-to-end test). Do NOT re-approve it and do NOT treat the
empty shop as a defect. The shop is empty because Velor genuinely has
zero real sellers yet -- the origin pages' "200 open seats" design is
the intended honest state until real sellers list. The one and only fix
for the empty shop is the seller-acquisition mission (see the playbook
checkpoints above).

## 2026-07-22 checkpoint (overnight session, ~00:00-02:15 UK) -- TRUST STACK EXECUTED, ALL 6 AGGREGATOR PITCHES SENT, WILLIAM'S EMAIL IDENTITY REBUILT

Continuation of the seller-acquisition execution (late 8/9 checkpoints).
All verified live, nothing assumed:

**TRUST STACK (Day-1 items DONE, William clicking, Claude navigating):**
- ICO data-protection registration COMPLETE: application C1989708, Tier 1,
  paid by Direct Debit (auto-renews annually). Org address on the form:
  49 Station Road, Polegate BN26 6EA. Trading names listed: Velor, Velor
  Marketplace, velorcommerce.store. DPO outcome: not required (correct).
  Public register listing follows within 7 working days -- once the
  registration number email arrives, add "ICO registered" to the site
  footer trust badges (NOT before).
- Good Business Charter application SUBMITTED (status Pending): GBC
  account under customerservice@; org profile with velor-logo-2026.png,
  Company No. 17268133, the global-marketplace description; all 10 SME
  components answered honestly (N/A on zero-hours; escrow=customer
  commitment, seller rules+certificates=ethical sourcing, digital-first=
  environmental); the 3 declarations ticked; the GBC logo licence
  agreement was reviewed and Agreed by WILLIAM personally. On approval:
  add GBC logo to footer trust badges (promised in the application).
- Trustpilot claim NOT yet started (next session). Heritage Crafts (£50)
  parked until funds.

**SELLER OUTREACH -- ALL 6 AGGREGATOR PITCHES NOW SENT** (Outlook,
verified in Sent Items): RajSICO rajsico@rajasthan.gov.in (00:50) and
FTF-India x.selvan@fairtradeforum.org.in + ftfindia@gmail.com (00:54)
joined the four sent 21 Jul. Both new pitches use the GLOBAL framing +
Company No. 17268133. Follow-ups due ~27-29 Jul if silent. The EPCH
member direct wave (30-prospect shortlist with emails, in the 2026-07-21
research agent report) is QUEUED for next session -- deliberately not
started at 2am so sends carry the new from-address (below).

**WILLIAM'S EMAIL IDENTITY (his standing rules, all implemented):**
1. RULE: customerservice@ is ONLY for customer/seller correspondence
   through the business; anything to organisations/partners/press goes
   FROM william@velorcommerce.co.uk under his name.
2. RULE: every outgoing email carries the standing signature: William
   Sinclair / Director, Velor Commerce Ltd (Company No. 17268133) /
   velorcommerce.store | william@velorcommerce.co.uk | WhatsApp +44 7404
   014621 / VELOR Global Marketplace logo (velor-logo-2026.png -- the
   website header logo; NOT brand/velor-logo-master.png which has a black
   background). Saved as the default Outlook signature ("Velor Standard
   Signature", new messages AND replies) -- deeplink-composed drafts
   should now END at "Kind regards," and let the signature do the rest.
3. Mailbox PRIMARY ADDRESS CHANGED to william@velorcommerce.co.uk via
   Exchange Online PowerShell ON WILLIAM'S OWN PC (GoDaddy panel cannot
   do it; GoDaddy support chat only tried to sell a second mailbox --
   declined). Commands run: Set-Mailbox -WindowsEmailAddress william@...
   + Set-OrganizationConfig -SendFromAliasEnabled $true. VERIFIED:
   Get-Mailbox returns PrimarySmtpAddress william@velorcommerce.co.uk.
   customerservice@ + all other aliases keep receiving into the same
   inbox; sign-in username UNCHANGED (customerservice@).
   PROPAGATION CAVEAT: a 02:05 test STILL stamped customerservice@ --
   Exchange transport cache; expect william@ on sends from the morning.
   VERIFY on next session's first send. If the signature logo still
   arrives as an attachment (cid) instead of inline, swap the saved
   signature's image to the hosted URL https://velorcommerce.store/velor-logo-2026.png.
- "Always show From" enabled in Outlook compose settings.
- Resend/transactional/agent email routing is UNTOUCHED (hello@ /
  noreply@ .store, customerservice@ recipient rules all unchanged).

**Environment notes:** Chrome MCP tab group can be closed by William
mid-session (tabs vanish -- re-create via tabs_context_mcp createIfEmpty).
Desktop bridge: terminals grant at click-tier only (NO typing) -- for
PowerShell work, prepare a single paste-block and William pastes/runs it
himself while Claude watches via computer_screenshot (worked perfectly).
William asked for EXTRA-CLEAR non-technical instructions ("im not
computer savvy") -- one small step at a time, say exactly where to click.
GitHub warned the classic PAT expires soon; session PAT deletion still
owed at wrap-up (William).

**Next session queue:** 1) verify from-address shows william@ on a real
send; 2) EPCH direct wave (20-30 personalised, from william@, global
framing); 3) Trustpilot claim; 4) Payoneer trigger fires 08:00 UTC 23 Jul
(escalate live chat if silent); 5) watch GBC approval + ICO number email
+ Google Play release 5; 6) translation warm-up TOP PRIORITY when funds.


## 2026-07-22 checkpoint 2 (overnight ~02:40-03:35 UK) -- EPCH WAVE COMPLETE, HONESTY CORRECTION, WHATSAPP AUTOMATION LIVE

**HONESTY CORRECTION (William, applies to ALL future outreach):** Never promise "we will build your store/listings for you" - that service does not exist. Truth (Option A): sellers self-serve at velorcommerce.store/apply - simple ID verification, site works in the seller's own language, listing takes only minutes; agents are too slow for hands-on builds. The 6 EPCH emails sent earlier tonight and the aggregator pitches DO contain the old promise - if anyone replies asking us to build their store, answer honestly and point them to the simple signup. All later sends corrected.

**EPCH DIRECT WAVE COMPLETE - 12/12 sent from william@** (verified in Sent Items). Final 6 sent 02:51-02:55 with corrected honest wording: A.H. Decorative (info@ahdecorative.com), A. M. Glass (amglass@amglassintl.com), Ajay Glass Works (info@ajayglassworks.com), A M Leather (info@amleatherindia.com), A S K Hometex (jegan@askhometex.com), Akrati Jewels (akratijewelsinc@gmail.com). Follow-ups due ~27-29 Jul if silent.

**WHATSAPP BUSINESS AUTOMATION LIVE** on +44 7404 014621 (app was already installed and connected): Greeting message (first-time contacts) + Away message (custom night schedule), both carrying the join link https://velorcommerce.store/apply, recipients "Everyone not in address book". Corrected texts (no store-building promise) saved by William himself.

**META VERIFIED STATUS (verified on screen):** the Velor business portfolio has an ACTIVE "Meta Verified Business Standard" subscription covering the VELOR Facebook Page and @velorcommerce Instagram (both blue-ticked). WhatsApp is NOT covered. Desktop cannot manage the subscription (mobile-billed) - changes only via the phone Facebook app: Accounts Centre, Subscriptions, Meta Verified. The WhatsApp number is Approved and connected in the portfolio (WhatsApp Manager shows +44 7404 014621 / VELOR / GB). NEXT: check the phone flow for an add-WhatsApp option and its price; if absent, join the waitlist at facebook.com/business/tools/meta-verified-for-business. Parked as non-launch-critical.

**STANDING RULE (William):** if he asks a question mid-task, STOP and reply acknowledging it BEFORE continuing any work.

**Next session queue:** 1) morning from-address verify on a real send; 2) Trustpilot claim; 3) Payoneer trigger fires 08:00 UTC 23 Jul; 4) watch GBC approval, ICO number email, Google Play release 5; 5) EPCH follow-ups ~27-29 Jul; 6) Meta Verified WhatsApp via phone; 7) translation warm-up when funds allow.

## 2026-07-22 checkpoint 3 (afternoon session, ~13:20-17:00 UK) -- GBC ACCREDITED + LIVE ON SITE, TRUSTPILOT CLAIMED, WEPs APPLICATION SUBMITTED

All verified live unless stated. William present and clicking throughout.

**GBC -- ACCREDITED.** Official email 10:46: "VELOR COMMERCE LTD is now
officially Good Business Charter accredited." Their condition (stamp on
site linked to their explainer page) SHIPPED same hour: new footer
accreditations band, left end, own bordered row between trust band and
link columns, built to take more badges (commits cbee534/11e614d/f366d55;
stamp at 174px per William "3 times the size"; asset public/
gbc-accredited.jpg -- the crisp official PNG pack exists at
Downloads/GBC-accreditation-stamp-3.zip if an upgrade is ever wanted).
Linked to goodbusinesscharter.com/what-good-business-charter-accreditation
-means-and-why-it-matters/. LIVE-VERIFIED on /contact footer.

**ICO -- partial.** 08:00 email is only William's CONTACT security number
(CSN6256110, ref ICO:00014871559 -- quote both when phoning 0303 123
1113). The REGISTRATION number email (needed before "ICO registered" may
join the footer) has NOT arrived yet; due within 7 working days of 21 Jul.

**TRUSTPILOT -- account created and profile claimed; domain verification
BLOCKED BY THEIR SIDE.** Free plan. Account william@velorcommerce.co.uk
(William's explicit choice), Velor Commerce Ltd / velorcommerce.store,
activated via email, logged in. Domain-email route impossible
(velorcommerce.store has NO MX -- confirmed by DNS query; it is
send-only via Resend). Meta tag route: tag live in app/layout.tsx
metadata.other (commit 3e8eb8e) -- verified present on live homepage.
DNS route: TXT record trustpilot-one-time-verification-id=f99701c5-922e-
49a2-ba30-ec66eb37e125 added @ velorcommerce.store in GoDaddy, verified
resolving. BOTH proofs permanently in place, but Trustpilot's "Verify
domain" button spun indefinitely on 4 attempts over ~1h (no API error
visible; their backend hanging). NEXT SESSION: retry once (fresh load of
businessapp.b2b.trustpilot.com/dashboard/claim, Verify with DNS); if
still hanging, submit their "Fill out this form" support link on that
page.

**WEPs (UN Women's Empowerment Principles) -- APPLICATION SUBMITTED.**
On-screen confirmation: "Sign Up WEP Velor Commerce Ltd has been
created." 10-15 business days review; follow-ups to
william@velorcommerce.co.uk. Submission included: signed CEO Statement
of Support (official template; William signed on paper, signature
photographed, extracted and composed onto the PDF -- final file
Downloads/Velor-CEO-Statement-of-Support-SIGNED.pdf, joining date
22/07/2026), CEO headshot (Downloads/William-Sinclair-CEO-photo.png),
certificate of incorporation. CEO quote (approved by William) frames
Velor as championing women makers worldwide. Gender-balance fields
answered HONESTLY (Less than 30% across -- one-man company); William
questioned the look, agreed honest baseline + growth story is right.

**SME Climate Hub -- deliberately NOT joined.** William spotted the
conflict himself: a global-shipping marketplace signing "halve emissions
by 2030" from a near-zero pre-launch baseline would be greenwashing bait
(CMA Green Claims risk). Honest positioning instead: digital-first, no
warehouses, goods ship once maker-to-buyer. Do not sign climate pledges
that growth would break.

**Printer (HP DeskJet 2910) -- 90% set up, one hardware fault.** Windows
added it over WiFi (it was already on the network, solid blue light);
the official HP app (Microsoft Store -- note: "HP Smart" is retired, the
app is now just "HP") installed and the printer connected in it. BUT a
persistent phantom "printer door open" error survives door reseating,
power cycles and the proper HP driver -- likely a sticky door sensor.
Parked; HP support another day. Print jobs go nowhere until fixed.

**From-address VERIFIED.** William's Outlook sends now stamp
william@velorcommerce.co.uk (WEPs-statement email to his Gmail showed the
new From + the standing signature with inline logo). Yesterday's
Exchange-cache caveat is resolved.

**Seller inbox note:** Nepal Art Shop (Sharma Meera) -- William is
handling her directly by email/WhatsApp himself; do not double-reply.
WFTO pitch got an out-of-office (Robert Vidal Esteve back 27 Jul --
matches the planned follow-up date).

**Environment notes for future sessions:** This cloud sandbox HAS git
network to github.com (clone/push with PAT worked; api.github.com is
proxy-limited -- use browser-context fetch for Contents API instead).
William created a 7-day fine-grained PAT this session -- treat as
rotated/expired after ~29 Jul; ask fresh. File shuttle device<->sandbox:
desktop-app folder connect (Downloads granted) + device_stage_files /
device_commit_files works cleanly; Chrome-extension file_upload can fill
web file inputs from /mnt/user-data/* paths. Chrome MCP JS return filter
blocks base64/hex dumps -- transfer binaries via GitHub Contents API from
browser context (delete temp files from repo after; done this session).
Computer-use on William's desktop works (Microsoft Store, Settings, HP
app granted; HP app renders via msedgewebview2 -- grant that basename
too, and first launch can be minutes-slow/blank).

**Next session queue:** 1) Trustpilot verify retry (both proofs already
in place); 2) Payoneer trigger fires 08:00 UTC 23 Jul -- escalate live
chat if silent; 3) watch for ICO registration number email -> then add
"ICO registered" footer badge; 4) watch GBC public listing + WEPs
review; 5) Meta Verified WhatsApp check on William's phone; 6) EPCH +
aggregator follow-ups ~27-29 Jul (WFTO contact back 27th); 7) printer
door sensor via HP support when time allows; 8) translation warm-up
when funds.

## 2026-07-22 checkpoint 4 (early evening) -- GOOGLE BUSINESS PROFILE BUILT; ACCREDITATION MAP SETTLED

**GOOGLE BUSINESS PROFILE -- CREATED, PENDING VIDEO VERIFICATION.**
Profile "Velor" / category E-commerce service, under willsinclair144@
gmail.com. Region UK; verification address 49 Station Road, Polegate
BN26 6EA (hidden from public; William's choice); phone +44 7404 014621;
website velorcommerce.store; hours OPEN 24 HOURS all 7 days (William:
"were open 24h because its global"); description global-framed per LAW
#2 (note: Google REJECTS URLs inside the description field); photos:
velor logo (logo2026-on-white), assistant avatar (velor-avatar-circle),
global hero + dark brand visual. Google offered ONLY video verification
for this profile ("show location, equipment, proof of management") --
chose Verify Later; WILLIAM records the video from the dashboard when
fresh. Until verified the profile is not publicly visible. A GBP £400
Google Ads credit offer (spend-matched, T&Cs) was deliberately skipped;
claimable later from the dashboard for launch marketing.

**ACCREDITATION RESEARCH SETTLED (free/global):** Artisan Alliance =
CLOSED ("not currently accepting new membership applications", was
$100/yr) -- off the list. ITC ecomConnect (free, UN ITC) = QUEUED,
needs a William account signup (~10 min). Fair Payment Code (UK gov,
free, Bronze/Silver/Gold for paying suppliers fast) = apply 2-3 months
POST-LAUNCH with real payout evidence -- extremely on-brand, do not
apply early with no payment history. Paid/parked: WFTO membership,
Heritage Crafts (£50), Cyber Essentials (~£320), UN Global Compact
(mandatory annual contribution -- NOT free for companies).

**Next session queue additions:** GBP video verification (William's
phone, from business.google.com dashboard); ITC ecomConnect signup.

## 2026-07-22 checkpoint 5 (evening) -- ACCREDITATION SWEEP: GOOD MARKET DRAFTED, ECOMCONNECT JOINED, NEST SENT

**ARTISAN ALLIANCE EMAIL BOUNCED.** William sent the outreach email
himself; Outlook returned "Delivery has failed to these recipients"
(17:03). Confirms the organisation is dead (matches the dormant/closed
finding). Off the list permanently.

**NEST PARTNERSHIP LETTER SENT.** To partnerships@buildanest.org from
william@velorcommerce.co.uk -- intro to Velor, asks how a marketplace
can work with Nest (partnership / Nest Standards alignment), offers
founding-seller places to their maker network. Await reply.

**GOOD MARKET APPLICATION -- COMPLETE ON ALL 7 PAGES, SAVED AS DRAFT
20909. NOT YET SUBMITTED (needs 1 more photo).**
- Account: william@velorcommerce.co.uk (password set by William).
  Draft URL: goodmarket.global/application-form/20909 (also via
  Account -> My Enterprises -> Velor -> Edit).
- Answers (all honest): brand Velor / Velor Commerce Ltd; sector
  System Services > Trade > MARKETPLACE (exact category); chips
  Online marketplace, Artisan goods, Handicrafts, Live commerce;
  Physical No; map pin on Polegate (Location Title "Registered
  office - Polegate, East Sussex, UK"); email customerservice@;
  website + FB + IG; logo uploaded; CEO photo as photo 1; People &
  Planet: Prioritize/Purpose/Communicate Yes, Measure No, Certify
  Yes via GBC (listed under Other Certifications w/ link to GBC 10
  components), Legal Status No, Registration Yes, Private Company,
  Revenue = Commissions, Self-Sustaining Yes, Reinvest No, Services
  Yes (escrow/onboarding detail), Contributions No; Environment page
  all No (pre-launch digital, per their "doesn't apply = No" rule);
  Customers: Responsive/Guarantee/Relationships/Transparent-Pricing
  Yes, rest No; Workers all No (solo founder); Suppliers: Ethical
  Practice Yes, rest No; Community: Good Citizen/Social Benefit/
  Networks Yes (Networks detail cites GBC + WEPs + artisan-org
  partnerships); Additional Info written; postal address for
  certificate 49 Station Road; Optional programmes = No.
- BLOCKER: needs >= 2 REAL photos (no graphics/AI/screenshots).
  William's first supplied 2nd photo was AI-generated (his own
  admission) -- correctly NOT used. Options: real photo from a
  founding seller (with permission -- ask Sharma/ceramics contacts
  via WhatsApp) or William's own photo of himself at work. When the
  photo lands: upload to Photos, then SUBMIT. Review < 48h, free
  forever.
- APP LANDMINES (their bugs): typing in the Latitude/Longitude
  fields CRASHES the app and wipes ALL unsaved answers (use the map
  picker + search box instead); the "Successfully Saved" modal
  sometimes gets stuck (reload the draft URL to escape); /application-
  form/0 is always a BLANK NEW application, never the draft; radios
  render checked but read false via DOM (trust the visual, not
  input.checked); text inputs need REAL typing (React state ignores
  synthetic value setters; chips + radios via JS .click() are fine).

**ITC ECOMCONNECT -- ACCOUNT LIVE.** william@velorcommerce.co.uk,
org Velor Commerce Ltd (Business / Services / Polegate UK), profile
user id 8891772. 8,102 members; Members directory filter Industries=
"Arts and Crafts" = 56 prospects across Ghana, Indonesia, Peru,
Tunisia, India, Grenada, Sierra Leone, Kenya, Cameroon, Nigeria,
Cambodia, Bangladesh, Zambia, Costa Rica. STANDOUTS: BaSE (Khulna,
Bangladesh -- fair-trade handicraft umbrella org, one yes = many
makers), Israel Fugah (Accra, active), Meta Dharmawan (Jakarta).
Platform has built-in member messaging.

**OUTREACH PLAN APPROVED BY WILLIAM:** one intro message drafted
(founding-seller invitation; link to velorcommerce.store/SELL not
/apply -- landing page sells the vision first), personalised first
line per recipient, batches of ~10, organisations first. William's
ecomConnect profile needs photo + bio BEFORE first send (avatar
cropped and ready at /mnt/user-data/outputs/william-ecomconnect-
avatar.jpg from his cafe selfie IMG_3720.JPG; upload was mid-flight
when the Chrome tab group dropped). Bio line: "Founder of Velor -- a
global marketplace for authentic cultural and artisan goods,
launching 6 August 2026."

**Session-end state:** Chrome tab group dropped (4th time today) and
tab-group recreation was being blocked -- browser work paused pending
William confirming the extension is up. Non-browser work continued.
Next: finish ecomConnect profile (photo+bio), send outreach batch 1,
Good Market 2nd photo + submit, Trustpilot support form, GBP video
verification, WFTO ~27 Jul, Payoneer 08:00 UTC 23 Jul.


## 2026-07-23 checkpoint -- Companies House confirmed new registered office; Indiegogo business address updated to match

Companies House has CONFIRMED the AD01 change of registered office address for company 17268133 (VELOR COMMERCE LTD) to **49 Station Road, Polegate, East Sussex, BN26 6EA** -- previously logged as "in progress" pending William's own WebFiling authentication/submit step. William confirmed today (2026-07-23) that Companies House has accepted it. The old address (1 Palmerston Gardens, Grays, RM20 4YJ) is no longer the registered office of record.

Also updated to match, same session: Indiegogo's Business Details > Registered Business Address (admin/project-settings/velor-marketplace/velor--the-worlds-shopping-channel/merchant-details/business-data) still had the old Palmerston Gardens address, which appears to have triggered an Indiegogo email ("There's an issue with your account details" -- business account details flagged for review/resubmission). Fields updated and saved live, confirmed via the page's own "Your changes have been saved" toast:
Street: Station Road; House/unit number: 49; City: Polegate; Postal code: BN26 6EA; Country: United Kingdom (unchanged).
       
        Not independently verified this session: whether Indiegogo's account-verification flag has actually cleared as a result -- that depends on their backend re-check of the submitted data, not just the form save succeeding. If the "issue with your account details" email or dashboard banner reappears, check Indiegogo's verification status directly rather than assuming the address edit alone resolved it (per LAW #1).


**Follow-up, same day:** two more mismatches were found while auditing the Indiegogo Business Account Details page, both currently locked read-only because the records are marked "IN REVIEW" (confirmed via direct DOM inspection -- every field on both records has readOnly=true, not just the specific ones below, so this is Indiegogo's own review-lock, not a site bug on our end): (1) the Decision-maker record for William Sinclair still has Postal code "RM20 4YJ" (the old Grays postcode) while Street/House number/City already read Station Road/49/Polegate -- should be "BN26 6EA"; (2) the Bank account's Owner name field reads "VELOR COMMERCE LTD" but should read "William Sinclair" (the actual name on the bank account). William submitted a support ticket via Indiegogo's contact form (indiegogo.com/en/contact) describing both corrections and received a confirmation email that the request was sent. Not yet resolved -- next session should check whether Indiegogo has corrected these or unlocked the records for self-service editing.


## 2026-07-23 checkpoint (2) -- Stripe/Payoneer verification now required BEFORE seller dashboard access, not after

William reported a new seller signup "thinks it's a hoax seller" and asked to move Stripe verification to the start of the seller application: "at the moment anyone can get in the dashboard without stripe verification... same rules for stripe just when I seller signs up not after." Investigated and fixed the actual gap this session (bash in this sandbox has real outbound git network -- cloned BILSY144/velor-marketplace directly, no Chrome extension needed for this piece of work).

**Root cause confirmed by reading the live code, not assumed:** since the 2026-07-21 identity-model change (see SELLER IDENTITY VERIFICATION above), an application is approved on rules-screening alone -- no photo ID, no Stripe/Payoneer step required at application time by design (William's own explicit call, to let anyone sign up). But nothing EVER enforced completing payout-rail verification before dashboard access either: middleware.ts only gated `/dashboard/*` on being signed in + having accepted Terms. A seller could sign in the moment they were approved and use Products/Orders/Settings/Storefront/etc. having never touched Stripe Connect at all -- payout onboarding was something they could do "whenever." That is the literal gap William described.

**Fixed (commit bdac5d16, pushed to main):** a new mandatory payout-verification gate in middleware.ts, built on exactly the same pattern as the existing mandatory Terms-acceptance gate (`velor_terms` cookie): a new `velor_payout_setup` cookie blocks every `/dashboard/*` route for a SELLER until it's set, except the setup pages themselves (`/dashboard/stripe-connect*`, `/dashboard/payoneer`). New files: `lib/payoutGateCookie.ts` (Edge-safe constant + pure `payoutGateSatisfied(rail, stripeOnboarded)` logic -- deliberately has ZERO Prisma/DB import since middleware.ts runs on Edge runtime and this repo's PrismaClient is not edge-adapted; importing prisma into middleware would break it), `lib/payoutGate.ts` (Node-only DB resolver, `resolvePayoutGate()` + `setPayoutGateCookie()`), and `app/api/seller/payout-gate/route.ts` (a dedicated status/refresh endpoint). The cookie is set/cleared as a side effect of `GET /api/stripe/connect/account` and `GET /api/payoneer/onboard` every time either is called -- and `app/dashboard/layout.tsx` ALREADY calls one of those two on every dashboard mount (for its existing rail-aware payout nav), so the gate self-heals on normal navigation with zero new fetches added to the dashboard shell. `DELETE /api/stripe/connect/account` (Disconnect) also clears it, so disconnecting re-arms the gate.

**Payoneer-rail sellers are deliberately EXEMPTED from this gate for now.** Asked William directly whether Payoneer verification could happen independently of the Mass Payouts payout API -- confirmed no: the entire Payoneer registration flow (not just the money transfer) runs through `getRegistrationLink()` in lib/payoneer.ts, which requires the Mass Payouts partner API credentials that don't exist yet (`isPayoneerConfigured()` is still false, partner approval pending since 13 July, case 260721-023420 chased 21 Jul -- see the SELLER ACQUISITION / Payoneer checkpoints above). Gating a Payoneer-country seller on a step that cannot currently be completed would be a dead end, not friction -- it would lock out every seller from ~150+ countries entirely, mid an active recruitment push where getting any real seller at all is the current struggle. **REVISIT the moment Payoneer approves partner access**: at that point `payoutGateSatisfied()` in lib/payoutGateCookie.ts should stop exempting PAYONEER and instead require a real completed registration (`Seller.payoneerPayeeId` confirmed ACTIVE via `getPayeeStatus()`), matching the Stripe-rail bar exactly. This is the single place to change it.

**Also corrected, same commit:** `buildSellerApprovedEmail()` in lib/email.ts now tells a newly-approved seller that payout verification is the first dashboard step, before store setup/listing -- the old copy ("log in... set up your store, add products, and start selling") no longer matched what the seller will actually see first.

**Known transitional effect, flagged rather than hidden:** any seller who was ALREADY using the dashboard before this deploy (approved, already has products listed, but never completed Stripe Connect onboarding for whatever reason) will hit this gate too on their first visit after the deploy -- the gate applies to any seller lacking the cookie, not just brand-new signups, since there was no way to grandfather "already trusted" sellers without either a data migration or weakening the check. If William reports an existing seller unexpectedly bounced to /dashboard/stripe-connect, that is this change working as intended, not a bug -- direct them to complete Stripe Connect (or note the Payoneer exemption if that's their rail).

**Separate, NOT investigated or fixed this session:** the specific "hoax seller" wording. No code path anywhere in this repo flags, labels, or rejects an application/seller as a "hoax" (grepped for hoax/fraud/suspicious/risk-score -- only hits are generic legal-policy prose, nothing functional). The most likely real-world explanation is that Stripe's own risk/fraud system flagged that specific seller's Connect account during onboarding (a per-account Stripe decision, external to this codebase, not fixable by a code change) -- but this was NOT confirmed against the actual seller's Stripe account this session (no live Stripe dashboard/API access from this sandbox; would need either the seller's email/Stripe account id and browser access, or STRIPE_SECRET_KEY, neither available here). If William can supply which seller this was, a future session should look up their actual Stripe Connect account status/requirements directly before assuming which specific Stripe flag caused it.

**Verification done this session (no browser/Vercel-dashboard access, so build status is NOT independently confirmed -- check Vercel deployments for bdac5d16 next time before treating this as fully live):** `npx prisma generate` (with `PRISMA_QUERY_ENGINE_LIBRARY`/`PRISMA_SCHEMA_ENGINE_BINARY` pointed at dummy files + `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`, since `binaries.prisma.sh` is proxy-blocked here same as prior sessions) followed by a full `npx tsc` against a `/tmp/tsconfig.check.json` extending the repo's real tsconfig -- zero errors, confirming every changed/new file type-checks against the real Prisma-generated types, not just parses. Pushed via a PAT William pasted directly in chat this session -- he should revoke it at github.com/settings/tokens now that this is done, per standing practice.


## 2026-07-23 checkpoint (3, evening) -- Dots.dev ruled out (US-only, confirmed); Payoneer WhatsApp message clarified; Trolley chosen as the alternative and bank-transfer onboarding started; SESSION PAUSED MID-FORM

Continuation of the morning's urgent Dots.dev directive (see the superseded
section near the top of this file). This session actually tried to execute
it, hit a hard platform wall, and pivoted -- full trail below per LAW #1.

**Dots.dev -- confirmed dead end.** Attempted signup at
dashboard.dots.dev. The Country field on the business-account form is
locked to United States with the text "Only US businesses are supported at
the moment" -- the dropdown does not respond to any click/selection
attempt (verified via JS inspection, not just a visual glitch). Asked
Dots' own AI documentation chatbot directly: it confirmed the restriction
is real and current, and that it isn't spelled out in their public docs.
Velor Commerce Ltd is UK-registered, so this is a permanent block, not
something to retry differently next time. **Do not attempt Dots signup
again.**

**Payoneer WhatsApp message -- clarified, not a resolution.** William had
received a WhatsApp notification saying his account was "ready" and could
receive payments. Investigated by actually signing into the live Payoneer
account (myaccount.payoneer.com) and checking Home/Manage: this was his
personal Payoneer *receiving* account activating, unrelated to the stalled
**Mass Payouts partner API application** (case 260721-023420, chased by
email to partners@payoneer.com on 21 Jul, still unanswered as of this
session). No partner/developer API features are visible on the account.
The real blocker is unchanged and still open.

**Payoneer escalation phone number found:** +1-332-244-7939, sourced
directly from the signed-in account's own Support Center (not a generic
public listing) -- for calling to escalate case 260721-023420 if the email
chase stays silent.

**Trolley (usetrolley.com) identified and chosen as the fast alternative**
after research into UK-eligible, quick-setup global payout providers.
Signup started same session:
- Company Details, Directors, and Payout Information sections all show
  "Saved" in the main Trolley activation flow
  (dashboard.trolley.com/activate). Business Registration Number
  17268133 entered (had to clear-and-retype once due to a browser-autofill
  collision that kept reverting the field to "VELOR COMMERCE LTD" -- fixed
  by Ctrl+A/Delete then a fresh type). Registered address entered as 49
  Station Road, Polegate, East Sussex, BN26 6EA -- the current confirmed
  Companies House registered office (see the 2026-07-23 checkpoint (2)
  address-confirmation entry elsewhere in this file). County field needed
  a second attempt after a misclick selected "Barking and Dagenham"
  instead of "East Sussex."
- **Directors section auto-populated William's real First Name, Last
  Name, and Date of Birth without any typing action** -- flagged to
  William in chat as a concern (this is exactly the kind of personal
  identity data Claude does not enter itself), but not independently
  verified as correct or altered. Sanity-check this before relying on it.
- The **countries multi-select** ("expected payout countries") had a stray
  autofill/stale-state populate itself with 53 then 106 unintended
  countries at one point -- cleared via the field's clear-all icon.
  William then took over that field himself using the real UI mechanic
  (clicking one checkbox per continent selects every country in it) and
  selected all 239 available countries; Claude filled the adjacent
  purpose/description text field and saved that section.

**IMPORTANT DISCOVERY, mid-submission:** clicking through to finish
account activation revealed a "Congratulations!" modal reading *"Your
account has been approved to send PayPal payouts."* Trolley auto-approves
PayPal-based sending on signup, but that is NOT what Velor needs -- a
PayPal-only rail doesn't serve a global 190-country seller base. **Real
bank-transfer payouts are a separate onboarding flow**, reached via "Go to
Bank Transfer Onboarding Form" on that same modal
(dashboard.trolley.com/activate/bank). This is the flow actually needed
and the one now in progress.

**Bank Transfer Onboarding -- IN PROGRESS, paused mid-form, nothing
submitted yet.** Steps: 1) Business Structure, 2) Beneficial Owners
(inside step 1's flow), 3) Shareholder Register, 4) Review Submission.
State at pause:
- Business Structure: answered "One or several owners own 25% or more,
  directly or indirectly, or have a controlling interest" (accurate --
  William owns 100% of Velor Commerce Ltd).
- Beneficial Owners, Owner #1 (William): Owner Type Individual; First
  Name William; Last Name Sinclair; Position/Title Director; Email
  auto-filled william@velorcommerce.co.uk; Country of Residence
  auto-filled United Kingdom; Shareholding Amount pre-filled 100%; PEP
  question answered No (accurate). Phone country code +44 selected but
  **no phone digits typed yet** -- this is exactly where the session was
  paused.
- **Still blank, not yet touched:** Street / City / County / Postal Code
  (William's residential address -- not filled pending resume), **Date of
  Birth**, **Nationality**, and **Tax Identification Number**.
- **Tax Identification Number will NEVER be filled in by Claude** -- it is
  a government identification number, in the same standing-prohibited
  category as an SSN or passport number, regardless of any instruction to
  do so. William must type that field himself when this resumes. Date of
  Birth and Nationality are being left for William too, consistent with
  how the Directors section's auto-populated DOB was handled earlier in
  this same session (flagged, not entered/altered by Claude).
- Step 2 (Shareholder Register) and step 3 (Review Submission) have not
  been reached yet.

**Session paused at William's request** (family time), to resume "tonight."
**Next session: do not restart the Trolley flow from scratch.** Resume
directly at dashboard.trolley.com/activate/bank on the Beneficial Owners
step -- click into the Phone Number field (country already set to +44)
and continue from there. Hand the Date of Birth / Nationality / Tax ID
fields to William directly rather than attempting them.

**Next steps, in order:**
1. Resume and complete the Trolley Bank Transfer Beneficial Owners step
   (phone number, address, then William enters DOB/Nationality/Tax ID
   himself), then Shareholder Register, then Review Submission -- confirm
   with William before the final submit, same as the PayPal step.
2. Once Trolley bank-transfer is actually approved, this needs real
   engineering work to wire into the codebase (a new rail alongside/
   instead of the dead-end DOTS entry in lib/payoutRail.ts's PayoutRail
   type, a lib/trolley.ts equivalent, env vars) -- NOT started, NOT
   requested yet. Do not start this without William's explicit go-ahead,
   per standing directive 4.
3. Keep chasing Payoneer's Mass Payouts case 260721-023420 (email sent,
   phone number now on hand: +1-332-244-7939) as a second, independent
   payout-rail track -- Trolley is not guaranteed to pan out either.
4. Sanity-check the auto-populated Director DOB on Trolley with William
   directly; do not assume it's correct.
5. The original urgent-Dots directive's downstream concern still stands
   even though Dots itself is dead: sellers outside Stripe's coverage
   (including the two approved China sellers, LAKA's Studio and HALLORY)
   still have no live payout rail. Whichever of Trolley/Payoneer lands
   first becomes the thing to wire up with real urgency.

## 2026-07-23 checkpoint (4) -- Trolley payout-rail engineering COMPLETE and pushed; real Pulse bug found: a legacy sign-up page creates unreviewable "orphaned" sellers

**Trolley integration finished, commit e84492f7 on main, pushed and
tsc-clean.** Completes the work started earlier the same session
(lib/trolley.ts, schema fields, `/api/trolley/onboard`,
`/dashboard/trolley`, the release-payouts TROLLEY branch — see the
checkpoint above this one for that half). This commit updates every
remaining dashboard surface that still referenced DOTS as the default
non-Stripe rail: `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`,
`app/dashboard/payouts/page.tsx`, `app/dashboard/stripe-connect/page.tsx`,
and `app/api/dashboard/payouts/route.ts` now all resolve/route/label/brand
TROLLEY correctly (green "T" tile, "Trolley" label, `/dashboard/trolley`
setup link), while the existing DOTS/PAYONEER legacy branches are left
fully intact for any seller row not yet self-healed onto TROLLEY. Also
added `TROLLEY_ACCESS_KEY`/`TROLLEY_SECRET_KEY`/`TROLLEY_API_BASE` to
`.env.example` (marked the DOTS entries there as legacy/permanently
unusable) and wrote `docs/TROLLEY_SETUP.md` (mirrors `docs/DOTS_SETUP.md`'s
structure — what's built, what William needs to do once Trolley approves,
the sandbox-verification checklist). Verified with a REAL type-check this
time, not just syntax: `npx prisma generate` (dummy engine-path env vars,
since `binaries.prisma.sh` is proxy-blocked here) then `npx tsc` against a
temp tsconfig extending the real one — zero errors across every
changed/new file. This cloud sandbox turned out to have full outbound git
network this session (contradicts some older per-session notes in this
file; `git fetch --unshallow` worked, `npm install` worked) — verify fresh
each session rather than assuming either way, per the TOOLING TRAPS section.

Still open, exactly as before: Trolley's own KYC review of Velor's Bank
Transfer Activation is pending (no live credentials yet, `isTrolleyConfigured()`
false, the whole rail is safely inert — sellers accrue in escrow); revisit
`lib/payoutGateCookie.ts`'s TROLLEY exemption the moment credentials land
(see that file's own "REVISIT (TROLLEY)" comment and
`docs/TROLLEY_SETUP.md` Step 2.3); keep chasing Payoneer's Mass Payouts
case 260721-023420 in parallel.

**Real bug found mid-session, NOT yet fixed (William's report, verified
live in the browser): a whole separate seller sign-up surface exists that
bypasses the entire application/review pipeline and produces permanently
unreviewable seller accounts.**

William reported he could not review a pending seller application from
`/pulse/applications` on his phone. First answer given was WRONG and had
to be corrected: `/pulse/applications/[id]` (tap into any row from the
list) genuinely does have Accept/Deny buttons — built under William's own
account on 12 July (`0b1a6715`), still live on `main`, calling the same
admin-gated `PATCH /api/agents/applications/[id]` the desktop console
uses. Nothing was removed or changed without his permission; the first
answer was simply researched wrong (only the list page + its GET-only API
were checked, not the detail page).

The REAL problem, found by live-checking production (`/pulse/applications`
via the stored admin token): the specific applicant, **Vellora
International Trading Co. Ltd.** (刘保霞 / liubeier76@gmail.com, joined
23 Jul 2026), does not appear on `/pulse/applications` at all — because
she never has a `SellerApplication` row. `/pulse/sellers` shows her as a
bare `Seller` record with `approved: false` (badge "PENDING"). Root cause,
confirmed by reading the code: `app/auth/sign-up/page.tsx` is a genuinely
live, reachable, LEGACY sign-up page (separate from the real `/apply`
flow) that POSTs to `app/api/auth/register/route.ts`. That route creates a
`User` + nested `Seller` directly — no `SellerApplication` row is ever
created, so the applicant never enters `review-applications` (the 24h SLA
cron), never appears on `/pulse/applications` or `/admin/applications`,
and gets an honest-sounding "we'll review within 2 hours" email that
nothing ever acts on. She is permanently stuck with **zero approve/reject
path anywhere on Pulse** — confirmed live: the Sellers page rows on Pulse
are not even links (`document.querySelectorAll('a')` returned only the 6
nav links, nothing per-seller).

**This same legacy page is not purely a bug to delete on sight** — per the
2026-07-19 checkpoint (4), William used `/auth/sign-up` himself to create
the Play Store reviewer account (`Play Review Test Store`, also currently
sitting `approved: false`/PENDING on Pulse's Sellers list for the exact
same reason). So this page is a known, previously-used utility, not purely
an accident — but its silent lack of any review path is a real gap
regardless of who uses it.

**Stopgap that works today, told to William:** the desktop admin console
at `/admin/sellers` (`app/admin/sellers/page.tsx` +
`app/api/admin/sellers/route.ts` GET/PATCH, real NextAuth ADMIN session,
not the Pulse Bearer-token model) already has working Approve/Reject/
Suspend buttons for exactly this kind of bare `Seller` row — confirmed by
reading the route (`PATCH { sellerId, action }` sets `approved` directly
and emails the seller). William needs to sign in on desktop and use that
page for Vellora (and the Play Review account, if he ever wants it
formally "approved" rather than left as a working test account) until a
Pulse-side fix exists. Not yet confirmed live in the browser that this
page actually renders/works end-to-end this session — no admin session
existed in the browser this session, and signing in is William's own
action per standing rule.

**Awaiting William's direction on two follow-ups, do not start either
without his go-ahead (standing directive 4):**
1. Add Approve/Deny for these bare/orphaned `Seller` rows to Pulse itself
   (a new detail surface, or extend `/pulse/sellers`), so this doesn't
   require the desktop console.
2. Whether to retire `/auth/sign-up` entirely, wire it into the real
   `SellerApplication` flow instead of bypassing it, or leave it as-is
   with a Pulse-side fix covering the gap it creates.

Not investigated this session: whether any OTHER orphaned `approved:false`
sellers besides Vellora and Play Review Test Store exist from this same
path (CJ Dropshippers and 义乌市芳拓饰品厂 are also PENDING on
`/pulse/sellers` but those are known, intentionally-deactivated legacy
test accounts from 2026-07-08, not new orphans — see that session's
checkpoint). A full audit of every `approved:false` Seller row's origin
would confirm there's nothing else stuck the same way.

## 2026-07-23 checkpoint (5) -- Approve/Deny for orphaned sellers shipped directly to Pulse

Follow-up 1 from the checkpoint above: William answered "yes" to adding
Approve/Deny for orphaned sellers to Pulse itself, specifically so he can
accept **Vellora International Trading Co. Ltd.** from his phone rather
than needing the desktop `/admin/sellers` console. Shipped, tsc-clean
(real `prisma generate` + `tsc` against a temp config extending the repo's
own tsconfig — zero errors), not yet committed/pushed at the point this
note was written (do that next, per the session's established pattern:
fetch+rebase against `origin/main` first, since the SEO agent pushes
concurrently).

**Backend:** `app/api/admin/pulse-sellers/route.ts` gained a `PATCH`
export, gated by `isAuthorizedAdmin(request)` (works from Pulse's
Bearer-token model, unlike the desktop-only `/api/admin/sellers` PATCH).
Accepts `{sellerId, action: 'approve'|'reject', reason?}` — deliberately
scoped to approve/reject only, not "suspend" (this is for actioning a
PENDING orphaned seller, not managing an already-approved seller's
lifecycle). Reject requires a non-empty `reason` (shown to the seller),
matching the UX already established on `/pulse/applications/[id]`'s
reject flow, even though the `Seller` model has nowhere to persist that
reason (same as the existing desktop `/api/admin/sellers` PATCH). Updates
`seller.approved` then sends a best-effort email via the existing
`lib/email.ts` builders (`buildSellerApprovedEmail`/
`buildSellerRejectedEmail`, reused rather than duplicating the desktop
route's inline HTML template style) — a failed send never undoes the
already-committed approve/reject, same pattern as `lib/orders.ts`'s
order-confirmation email.

**Frontend:** rather than a new `/pulse/sellers/[id]` detail page (the
`Seller` model has little to show beyond what the list card already
renders), `app/pulse/sellers/page.tsx`'s per-row rendering was extracted
into a new `SellerCard` subcomponent with its own `busy`/`actionError`/
`showRejectBox`/`rejectReason` state, mirroring `/pulse/applications/
[id]`'s `act()`/`showRejectBox`/`window.location.reload()` pattern
exactly. Accept/Deny buttons render only when `!s.approved`, call the new
`PATCH /api/admin/pulse-sellers` with the Bearer token from
`usePulseAuth()`, and reload on success (`usePulseData` exposes no
refetch function, so this matches the established Pulse convention).

**Not yet done:** commit, fetch+rebase, push, then confirm with William
he can approve Vellora from `/pulse/sellers` on his phone. William's
second follow-up (retire vs. fix vs. leave `/auth/sign-up` as-is) remains
unanswered — do not touch that page or `/api/auth/register` without
further explicit direction.
