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
