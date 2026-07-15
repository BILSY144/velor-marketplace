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
