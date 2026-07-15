# Velor mobile — dev log

## 2026-07-15 — v1 running on William's phone (first ever)

Scaffold session end-to-end: Expo app built from the approved Atlas mockup,
published via GitHub Actions (EAS Update, branch "preview", project
bilsy144/velorvelor, id 3207e08b-8832-4dba-bc40-d690d70628d9), opened in
Expo Go on William's device. CONFIRMED WORKING by William in chat.

Publishing pipeline: any push to mobile-app touching mobile/** republishes
automatically (.github/workflows/eas-update.yml, secret EXPO_TOKEN set by
William in repo settings). This sandbox CANNOT reach api.expo.dev directly
— always publish through the workflow.

CRITICAL VERSION NOTE: the app is pinned to **SDK 54** (RN 0.81.5, React
19.1, TS 5.9) because the App Store/Play Store version of Expo Go only
supports SDK 54 (newer Expo Go builds stuck in Apple review — see Expo
changelog "expo-go-and-app-store-may-2026"). The first publish was SDK 57
and Expo Go rejected it as incompatible. Do NOT bump the SDK until either
Expo Go catches up or we move to development builds / EAS production
builds (which don't need Expo Go at all). Deps were aligned offline via
node_modules/expo/bundledNativeModules.json since expo install can't
reach the API from the sandbox.

Next build phases: passport + orders screens, real product detail page,
sign-in (passkeys at launch), in-app checkout for 6 Aug, seller side.
Store release path: EAS Build + Apple Developer ($99/yr) + Play ($25) —
William registers those himself.

## 2026-07-15 (later) — STANDING RULE from William: the app must match the mockup EXACTLY

"everything needs to be exactly the same as mock design exactly the same."
When building any app screen, open the mockup (app-mockup-preview branch,
public/velor-app-mockup.html) and copy its layout, copy, type sizes and
behaviour — do not improvise layouts. Changes this round:
- Atlas = full-bleed globe page (NO scrolling, NO country list w/ flags —
  that list was never on the mockup's atlas). Globe owns all gestures.
- Globe has both mockup views + toggle (bottom-right): 'real' procedural
  earth (renderReal ported verbatim: climate bands, ocean spec, day light)
  and 'ink' dark sphere + land dots. Channel lights + orbit rings in both.
- Hero exactly as mockup: centered "Shop <em>the world</em>" Fraunces,
  rotating word (HERO_WORDS) fading every 2.4s, italic accent word
  (Fraunces_500Medium_Italic registered).
- Hint "Drag anywhere · tap a light" centered at ~54% like .atlas-hint.
- Logo: splash ONLY (William) — not on Atlas.
- Safe-area padding everywhere (notch was hiding back buttons).

## 2026-07-15 (later still) — THE SCAN: mockup reference kit committed

William: "is there not a way for you to scan the mock design and layout and
directly apply every detail." Built it:
- docs/app-mockup/plates/ — all 33 mockup screens rendered at 2x with the
  REAL fonts (served locally from @expo-google-fonts TTFs) via Playwright
  in the sandbox. Pexels media is network-blocked here so photos/films show
  the mockup's own gradient fallbacks — layout, type, spacing and copy are
  pixel-true. THESE PLATES ARE THE VISUAL CONTRACT for every app screen.
- docs/app-mockup/spec/ — per-screen element tree: tag/class, exact copy,
  computed font family/size/weight/colour, onclick target. Use with plates.
- Regenerate: /tmp/plates.js + /tmp/spec.js pattern (serve mockup+fonts on
  localhost, loop SCREENS, clip .vp). Mockup source lives on the
  app-mockup-preview branch (git show app-mockup-preview:public/velor-app-mockup.html).
- First application: Atlas reel corrected from plate 01 — V LIVE pill header
  (V orange + LIVE white, dark pill w/ orange border) and 138pt film cards
  with Fraunces-italic orange titles + Inter 9.5 subs, 'Preview' chip 7px.
- Deliberate divergences from plates (William's explicit calls or honesty):
  no VELOR wordmark on Atlas (logo splash-only), no double-tap-zoom claim in
  hint, PREVIEW badging + no fake counts, payment gated to 6 Aug.

## 2026-07-15 — Plates upgraded to FULL-PAGE (stitched); country dive completed

The first plate set only captured above the fold — that's how the country
dive's lower sections got missed (William caught it). /tmp/plates2.js now
steps each screen's .sc scroller and stitches segments (PIL) into full-length
plates (e.g. country 1970px, search 3658px, seats 13795px, dash 2756px).
ALWAYS check the full plate + the spec tail before calling a screen done.
Country dive completed from the full plate: BE THE FIRST founding spotlight
card (mockup copy incl. "Claim the founding seat" + Follow button with
session-local follow state), passport tie row ("Earn the Japan stamp"),
TRAVEL ON rail (MX/IT/UZ/GH/ET/PT per spec, nav.push for stacked dives).

## 2026-07-15 — Sweep: Live feed matched to plate 03; product page (PDP) built from plate 04

Live feed rebuilt to spec/live.txt: back chip to Atlas, PREVIEW pill
top-right, the honest preview note + menu button, step chevrons with the
n/41 counter, country chip into the dive, Fraunces 23 title, product strip
and the ask-row + heart. Honesty divergences (standing rule): the mockup's
sample chat bubbles (amira/seller) are NOT rendered — live chat begins with
real broadcasts; the product strip renders only when a REAL listing exists
for the film's country (fetched live, shared query key with the dive).

PdpScreen is new — the app finally has a product page (cards previously
only added to basket). Plate 04 top-to-bottom: swipeable gallery + dots,
COUNTRY × CRAFT kicker, Fraunces 31 title, Fraunces 30 price, delivery row
(honest "quoted live at checkout" instead of the plate's invented estimate),
maker card, THE MAKING (real description), escrow block (spec copy
verbatim), speciality pills, BUYER REVIEWS (real rating only — the plate's
SAMPLE reviews replaced by its own honesty line), MORE FROM {COUNTRY} craft
rail, sticky qty-stepper + "Add · £" bar. FOUNDING badge deliberately not
shown until the API exposes a real founding flag.

Wiring: Pdp registered in the stack; Craft listing rows, Country dive
product cards and the Live strip all navigate to it. Cart add() takes a qty;
new useFavs store (session-local, like the mockup's FAVS). tsc --noEmit
clean with full node_modules (npm ci works from this sandbox).

## 2026-07-15 (later) — Uplift pass: Search + You rebuilt to plates; Sell tier
## picker; Apply fixes (all four William catches this session)

Search (plate 06): "Search the world." Fraunces 34, the "A place, a craft,
a thing…" input, every region as a horizontal rail of tall country photo
tiles (lead IMAGERY photo + flag + name), dashed-globe "190 channels,
still opening." footer, back chip to Atlas. Typing swaps rails for
results; IMAGERY craft hits now open the Craft page (photo row), culture
hints open the dive.

You (plate 16): YOU kicker, Fraunces h1, passkey line (honest pre-launch
copy — no fake signed-in name), Passport card with the big orange stamp
count, the seven ACCOUNT rows exactly as the plate, SELL ON VELOR card.
New Addr / Pay / LangCur screens (plates 17/18/19) so every row lands
somewhere real: addresses honest zero state (no SAMPLE address), payment
methods with the Stripe green card + wallet row, language list (the real
19, English LIVE + ARRIVING badges) and 20-currency grid (GBP live,
others honestly ARRIVING until the FX pipeline ships at launch).
Favourites & follows row shows real counts — follows moved from
CountryScreen's module-local Set into a shared useFollows store.

Sell (plate 23): "What you'd keep" calculator built — drag slider
(PanResponder, no new dep) + CLICKABLE tier cards (William: "no clickable
option to choose what tier you want"), real TIER_CONFIG maths (Starter
free/10%, Pro £49/4%), keep-figure per selected plan.

Apply: photo thumbnails now carry a delete × (William catch); YOUR
COUNTRY is a real searchable 190-country picker modal (William catch — it
never clicked before); the WEBSITE OR SOCIAL field is REMOVED entirely
(William: "we dont want buyers bypassing us") — standing rule: nothing on
the application invites buyers off-platform.

## 2026-07-15 (later still) — Sell page full plate treatment + the founding
## seats page (plate 24) built

Sell rebuilt to the complete plate 23: the sellhero photo cover (the
mockup's own Pexels 31330206) melting into black with SELL ON VELOR +
Fraunces 34 hero over it, shared Chrome (back chip to You + the three
icons), checkmark perks, the calculator, and BOTH plate CTAs — "See if
your seat is open" now lands on a real screen.

SeatsScreen is new (plate 24): THE FOUNDING MAP, "One seat per country.",
search across countries AND craft hints, the SEATS/TAKEN/24H DECISION stat
row (TAKEN live from /api/lattice — counts countries actually trading,
never faked), WHAT THE SEAT CARRIES, the CRAFT POWERHOUSES photo rail, and
every region's countries as seat rows (photo, flag, real craft hints, SEAT
OPEN chip — CHANNEL OPEN in green once a country really trades). Open
seats land on Apply with the country pre-picked; taken ones open the dive.

## 2026-07-15 (menu) — Hamburger menu rebuilt to the mockup's MENU_HTML

Exact structure from the mockup source (no plate exists for the menu — read
MENU_HTML + .menu CSS from the mockup HTML directly): near-black fade-in
overlay (transparentModal + fade; expo-blur not in deps so the blur is
approximated by opacity), 44px × top-right, content from 28px margins,
orange tracked Shop/You/Sell kickers, Fraunces 23 row titles + 10.5 dim
subs. Rows: All countries (→ Search rails), Atlas, Velor Live, Search,
Basket, Orders, Passport / Notifications, Ask Velor, Account / Sell on
Velor, Founding seats (→ the new Seats page), Apply. Honesty divergence:
the mockup's "Seller dashboard · Preview" row is omitted until the
seller-side sweep builds that screen — no dead links.

## 2026-07-15 (menu v2 + dashboard) — Menu properly redesigned; seller
## dashboard preview built (plate 27 structure)

William on menu v1: "still looks the same just different font. no redesign
or uplift" — his explicit call OVERRIDES the mirror-the-mockup rule for
this screen (the mockup's menu is itself a flat list). Menu v2 is layered:
MENU header + ×, two feature cards (Atlas dashed-globe mark; Velor Live
with a real preview-film still + V LIVE pill), a 2×2 glass grid
(Search/Basket/Orders/Passport, live basket badge), YOU pill row, the
orange SELL band ("Your country's shopping channel." + Founding seats /
Dashboard / Apply chips), language/currency + legal footer.

DashScreen is new — plate 27's full structure as an HONEST PREVIEW (the
plate itself is all sample data: Studio Kaede, fake revenue; the app
renders the same sections with real zero states and a PREVIEW banner, no
invented numbers). The STARTER/PRO toggle is live and shows what each plan
really gets: 10 listings vs unlimited, AI account manager + API Pro-only,
Go Live on every plan. Becomes the real dashboard when seller sign-in
ships. Reached from the menu's SELL band (Dashboard chip) — the mockup's
"Seller dashboard" entry now has a real destination.

## 2026-07-15 (buyer sweep) — Basket/Orders/Passport/Bell to plate standard;
## THE BELL ACTUALLY RINGS

Basket (plate 07): "N makers. One payment." dynamic Fraunces title, green
escrow banner, items grouped by REAL seller (flag, store name, "ships from
…", qty steppers, tap-through to PDP), summary card and sticky checkout
button. Honesty: the plate's sample shipping rates are replaced by "quoted
at checkout from this maker's real dispatch address" — checkout is where
real Shippo rates exist.

Orders (plate 10): TRACKING / "On the way." header, the plate's order card
drawn honestly — PAID→SHIPPED→DELIVERED rail unfilled, PROTECTED chip,
"your first parcel lands here" — plus the three protection explainers.

Passport (plate 14): VELOR · BUYER PASSPORT kicker, Fraunces 44 "0 / 190",
progress hairline, round dashed stamp circles (dimmed flags, tap → dive),
Next stamps card with Open the Atlas. No EN ROUTE chips until real orders.

Bell (plate 15) + REAL BELL SOUND (William: "bell notifications need a
real bell noise"): the mockup's bellSound() synthesis (F=470Hz, 10
inharmonic partials with detuned doublets, bandpassed strike noise, double
strike at 0s/0.9s) was re-rendered in Python/numpy to assets/bell.m4a
(~65KB AAC) — the SAME bell, as a real audio asset. expo-audio@57.0.0
added (pinned to SDK 57; expo install can't reach the API from here, npm
view + matching major used instead — NOTE: first npm install accidentally
ran at the REPO ROOT and polluted the web app's package.json; reverted via
git checkout + rm -rf node_modules package-lock.json at root before any
commit). RING IT seeks to 0, plays, and swings the bell icon. YOUR BELLS
now lists real follows (useFollows) with Visit/Unfollow; sample explainer
cards stay SAMPLE-labelled per the plate's own honesty labels.

## 2026-07-15 (checkout + assist) — Checkout to plate 08; Ask Velor aligned
## to plate 22

Checkout rebuilt to plate 08's full structure: Fraunces "Checkout",
DELIVER TO row, DELIVERY · N PARCELS card (per-seller rows, flag + "their
own carrier"), SUMMARY card, the white wallet-pay button, "or pay by card
· Stripe" divider, CARD placeholders, the green escrow banner verbatim,
sticky "Pay securely · £" bar. Honesty kept: no sample address, per-parcel
prices "quoted live", and EVERY pay control explains the 6-August gate —
Velor never fakes an order.

Ask Velor: plate 22 copy applied — the welcome bubble ("I can help you
find something specific…"), the three starter pills verbatim including the
Spanish one, and the header sub "The same guide as the website — any
language, honest answers". The real assistant API wiring is unchanged.

CLAUDE.md checkpoint pushed to MAIN (ea57e1b) summarizing the whole app
day for future sessions — the branch doc (this file) stays canonical.

## 2026-07-15 (final pass) — Seller-side pages complete + FULL WIRING SCAN

All five remaining seller pages built, reached from the Dash preview:
- SellerOrders (plate 28): filter pills (all real zeros), honest zero desk.
- ApiKeys (plate 29): PRO TOOLS, zero keys state, capability pills, the
  shown-once/hashed/600rpm footer verbatim.
- Payouts (plate 31): HELD IN ESCROW FOR YOU £0.00, the no-withdraw-button
  copy, payout method (Stripe + Payoneer-on-the-way), zero history.
- NewListing (plate 30): FULLY INTERACTIVE preview — real photo picker with
  tap-to-set-cover, title/price/stock/parcel inputs, live "you'd keep" line
  from real tier maths, description/story, regulated-materials gate, and a
  READY TO PUBLISH checklist computed from what's actually filled in.
  Publish explains the approved-account gate.
- GoLive (plate 32): camera-check stage on a real preview-film still,
  broadcast title, pinned listings, Go live gate. The plate's SIMULATED
  live/ended stages are not rendered (no fake counts).
Dash wiring: stat tiles, pipeline cards, escrow note, Go live card, + New
and Keys all navigate to their real pages now (say-gates removed).

### THE SCAN — every page, every wire (2026-07-15)

Method: tsc --noEmit; full Metro export for BOTH platforms (ios + android,
both clean — this catches every import/asset/parse error the phone would
hit); grep-audit of every nav.navigate target against the registered route
table; per-screen route.params audit; app.json asset audit; live endpoint
checks via Chrome.

VERIFIED CLEAN: 27 distinct navigate targets, every one registered; all
param readers have fallbacks; bare tab-name navigations (Atlas/Search/Live)
only ever fire from sibling tabs where they resolve; app.json's 6 asset
refs all exist; bell.m4a (64,592B) confirmed inside the exported bundle;
LEGAL keys terms/privacy/help all present; live endpoints confirmed via
browser: /api/lattice {"totalCountries":190,"trading":0,...},
/api/shop/products (real empty catalogue), velor-assistant.png (512×512).

BUGS THE SCAN FOUND AND FIXED (both real):
1. Atlas film reel navigated Live with { start: i } — LiveScreen never read
   it, so every film card opened the feed at film #1. Now deep-links to the
   tapped film (scrollToIndex, safe with getItemLayout).
2. Privacy + buyer-protection legal docs were UNREACHABLE — every entry
   passed doc:'terms' and LegalScreen had no switcher. Added the doc pill
   switcher inside LegalScreen; all three docs reachable from every entry.
Also removed dead say/note code left in DashScreen after the wiring pass.

Screens NOT built, by design (documented, not forgotten): odetail/dispute/
returnreq (plates 11/12/13) — they render a real order and none can exist
before buyer launch + sign-in; building them dead violates the no-dead-
links rule. They are the first build the day real orders exist. Store
release (EAS Build + Apple/Play) remains William's registration.

## 2026-07-15 (hotfix) — Bell page black screen: expo-audio version mismatch

William: "Favourites and follows goes to a dead black screen. And bell page
goes to black dead screen." Both routes land on BellScreen — one crash.
Root cause: expo-audio@57.0.0 was installed (matched to a wrong belief the
app runs SDK 57 — see AGENTS.md's own warning) but the app is pinned to
EXPO SDK 54 (store Expo Go), whose bundled expo-audio is ~1.1.1. The 57.x
JS calls natives the SDK 54 runtime doesn't have; useAudioPlayer threw at
render; the published (production-mode) bundle shows a crash as a black
screen. THE LESSON, permanently: check node_modules/expo/
bundledNativeModules.json for the EXACT version before adding ANY expo-*
package — never infer from npm's latest majors.

Fix: expo-audio pinned ~1.1.1 (same useAudioPlayer/createAudioPlayer/
seekTo API, verified in its .d.ts). BellScreen hardened: NO native audio
call at render — the player is created lazily on first RING inside
try/catch (plus playsInSilentMode so the iPhone mute switch doesn't eat
the preview), released on unmount. If audio ever breaks again the bell
swings silently and the page still renders. tsc + iOS export clean.

## 2026-07-15 — Certificate upload added to the listing form (William's call)

New Listing's regulated-materials gate now does what production does:
declaring "Yes" opens a CERTIFICATE REQUIRED card — CITES / phytosanitary /
export-paper photo upload (image picker, multiple, each with a delete ×),
with the honest copy that Velor verifies before the listing can go live
and that regulated items cannot list without one. The READY TO PUBLISH
checklist gains a "Certificate · N" pill that must be green when
regulated=Yes, mirroring the production admin gate (409 without a valid
certificate — see velor-cultural-marketplace / compliance chain).

## 2026-07-15 — The opening moment (plate 00) built

William: "Is the opening page done" — the native splash (the gold VELOR
GLOBAL MARKETPLACE logo on black) was already in place, but plate 00 is a
MOMENT, not an image: logo over a soft orange glow, "THE ATLAS · ON AIR"
with a pulsing live dot, TAP TO SKIP, fading into the Atlas. Built as a
SplashOverlay in App.tsx that renders the same splash.png the native
splash shows (seamless handoff — no visual jump), adds the ON AIR line +
pulse + skip, and fades out after 2.4s or on tap. Native driver anims
only; overlay unmounts after fade so it costs nothing afterward.

## 2026-07-15 — Splash glow removed (William's call)

"We need to take away the orange glow from opening page" — the soft orange
radial behind the logo is gone; the opening is now pure logo on black with
the ON AIR pulse and TAP TO SKIP. STANDING: do not reintroduce a glow or
backdrop on the splash without William asking.

## 2026-07-15 — Splash box seam fixed

The overlay's background was #050507 while splash.png's own black is
#08080b (sampled from the PNG; the native splash config already used it) —
the 3-point difference read as the logo "sitting on a black box." Overlay
and pre-font-load view now use #08080b exactly. RULE: any surface that
shows splash.png must be #08080b, nothing darker.

## 2026-07-15 — Splash box KILLED for good: transparent logo PNG

Matching blacks wasn't enough on-device ("still visible... two shades of
black"). Root fix: assets/splash.png is now TRANSPARENT — the (8,8,11)
background floor was subtracted and black-to-alpha applied (un-premultiplied
so the gold stays exact; verified by compositing over pure black). Every
launch surface (native splash bg, pre-font view, overlay) is now pure
#000000. There is physically only one black behind the logo now. RULE: the
splash PNG must stay transparent; never re-export it with a baked
background.

## 2026-07-15 — PUSH AHEAD phase: store-release scaffolding + REAL seller sign-in

William chose "all three in order" (store prep, seller sign-in, buyer prep).

STORE RELEASE (phase 1): eas.json build profiles (preview APK / production
store builds, channels preview/production so OTA updates keep flowing to
the right binaries), manual EAS Build GitHub workflow
(.github/workflows/eas-build.yml, workflow_dispatch, uses EXPO_TOKEN), and
mobile/STORE-RELEASE.md — William's registration checklist (Apple $99/yr
org enrolment, Play $25) + the exact steps after. Android preview APKs are
buildable TODAY with no store account.

SELLER SIGN-IN (phase 2) — REAL, no backend changes: RN's fetch rides the
platform cookie jar, so the app signs in against the site's own NextAuth
(csrf -> credentials callback -> /api/auth/session as the honest success
check; api.ts). New SignInScreen (kit-styled, show/hide password, honest
buyer note, apply link). useSession store, restored from the cookie jar on
cold start (App.tsx). SIGNED-IN MODE lights up: Dash (green LIVE banner,
real tier/founding badge from /api/seller/subscription, real escrow +
paid-out from /api/dashboard/payouts, real pipeline from
/api/dashboard/orders, real listings from /api/dashboard/products; tier
toggle preview-only; views·7d shows an em dash — no endpoint, no invented
number), SellerOrders (real order cards, status-bucket filter pills with
live counts), Payouts (real escrow/paid/history + rail status + hold
window), NewListing (REAL publish: images as data URLs — the site's own
Add Product format, base64 from the picker at q0.5 — best-effort parcel
parse to grams/cm; server enforces caps, ship-from and cert gates; honest
held-for-certificate message). You page: signed-in state with first name +
email + sign out, or the seller sign-in door. Claude never touches the
credentials — sellers type their own, straight to the site over HTTPS.

BUYER PREP (phase 3): the buildable part is done — the sign-in surface,
session plumbing and honest "passkeys at launch" copy all exist; what
remains is site-side WebAuthn (separate backend work, William's call when
to build it).

NOT verified on-device yet: a real sign-in round trip (needs a real seller
account credential typed by William on his phone). The cookie-jar
assumption (RN fetch + NextAuth __Secure cookies) is the one live risk —
if sign-in succeeds but the dashboard stays in preview, check whether the
session cookie is being persisted/sent (credentials:'include' is set
everywhere it matters).

## 2026-07-15 — STANDING REQUIREMENTS from William (he said REMEMBER):
## Face ID sign-in + password backup; chimed notifications; email-verified
## password resets

1. FACE ID (built, app side complete): expo-local-authentication@17.0.8 +
   expo-secure-store@15.0.8 (bundled SDK 54 versions — checked
   bundledNativeModules.json FIRST this time). Design: password signs in
   once (NextAuth cookie persists), Face ID/fingerprint then LOCKS the
   restored session on every cold start (BiometricLock in App.tsx,
   auto-prompts, "Use password instead" signs out to the password door).
   Enable offer appears right after a successful password sign-in. The
   password is NEVER stored on the device — it is the backup, not a cache.
2. NOTIFICATIONS WITH CHIMES (app plumbing built): expo-notifications@
   0.32.17; "Ring on this phone" door on the Bell page — asks permission,
   registers the Expo push token with the site (/api/push/register),
   Android opening-bell channel configured with bell.m4a. HONEST LIMIT,
   told to the user in-UI: remote delivery + custom chime activate with
   the STORE BUILD (Expo Go cannot receive remote push since SDK 53; iOS
   custom sounds ship in the binary). Server-side senders hook up at
   launch events.
3. PASSWORD RESET BY EMAIL (app side built): "Forgot your password?" on
   the sign-in screen posts /api/auth/forgot — one-hour emailed link, no
   user enumeration. Backend routes/pages land on main (same session).
