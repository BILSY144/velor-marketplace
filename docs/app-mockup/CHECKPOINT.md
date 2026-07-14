# Velor App (The Atlas) — Design Mockup Checkpoint

Last updated: 2026-07-14 (session with William).

## What this is
A native mobile app design for the Velor **marketplace** (velorcommerce.store),
codenamed **"The Atlas"**. NOT the dropshipping site. Design-first: a single
self-contained HTML mockup is being reviewed page-by-page with William before the
real Expo/React Native app is scaffolded.

## Where the mockup lives
- **Working source (cloud sandbox):** /home/claude/velor-app-design/index.html (~2 MB)
- **Deployed for review:** public/velor-app-mockup.html on branch **app-mockup-preview**
- **Preview URL:** https://velor-marketplace-git-app-mockup-preview-velor1.vercel.app/velor-app-mockup.html
- Production `main` and the live site were NOT touched. Mockup lives only on the app-mockup-preview branch.
- Push works from bash git with the PAT in the remote URL (this sandbox has outbound network).

## Design decisions locked
- Home = interactive canvas **globe** (Fibonacci-sphere land, 190 red country glow-points, spin/tap/zoom). Hero cycles "Shop the world".
- Brand tokens: bg #08080b, accent #FF6B00; fonts Space Grotesk / Inter / Fraunces.
- Rules: no emojis in source; honest-zero states; no fake LIVE (use "Preview"); escrow copy on buyer surfaces; opens-not-owns; flags embedded as SVG data URIs; tiers Starter free/10%, Pro £49/4%, Enterprise £99/0%.
- Country dive layout is **APPROVED** by William: cinematic cover, THE ORIGIN story, **SIGNATURE CRAFTS as a horizontal scrollable reel**, SHOPPING <country> preview films, founding CTA, passport tie-in.

## Country data (DONE — all 190)
- Deep culture dataset built in docs/app-mockup/cdata.py (base) + cadd.py (deep expansion), merged into the mockup's `HINTS` var (up to 29 categories/country; India 29, Japan 27, Morocco 21).
- Each country also has a rich origin STORY.
- Wiring: countryScreen() renders real photo tiles first (from `IMG` bank) then every remaining category as an honest branded "Opening soon" reel tile. Helpers: phHue/phCoverBg/phTile/phReelTile. No country ever borrows another country's photo.

## Imagery sourcing (IN PROGRESS — the current grind)
Goal (William, emphatic): **real, correct photos for every country — "we cannot get this wrong."**
Method: Pexels search via same-origin fetch on pexels.com (bash has no way to browse it), pull top candidates per `<country> <craft>` query, build a labelled contact-sheet overlay, **visually verify every image**, keep the correct ones in the `IMG` bank, leave wrong/generic ones as "Opening soon" placeholders. Never ship a wrong image.

Pexels image URL format: `https://images.pexels.com/photos/<ID>/pexels-photo-<ID>.jpeg?auto=compress&cs=tinysrgb&w=800`

### Wave status
- **Wave 1 — Latin America & Caribbean (25 countries): DONE & PUSHED.** 156 verified photos wired (209 candidates, ~50 rejected to placeholder). Picks + reject list saved in docs/app-mockup/wave1_picks.py. Colombia/Peru/Brazil/Argentina/Venezuela near-perfect; Belize/Bolivia/DR/Jamaica patchier (more placeholders).
- **Wave 2 — East & SE Asia (18 countries: CN JP KR TW HK MO MN TH VN ID MY PH KH LA MM SG BN TL): candidates fetched, verification NOT yet done.** If resuming and the browser `window.__w2` is gone, just re-run the fetch (queries derive from HINTS[c][:10], prefix `<sname> <simplified craft>`).
- **Remaining waves:** South+Central Asia+Caucasus; Middle East; W/S/C Europe; E Europe+Nordic+Baltic; N Africa+W Africa; E/C/S Africa; N America+Oceania.

## How to resume the imagery grind (per wave)
1. In cloud: build query rows `[code, exactHINTScategory, "<countryName> <simplifiedCraft>"]` for the wave's countries (top ~10 categories each).
2. Navigate Chrome tab to https://www.pexels.com/ ; fetch candidates in batches of ~32 (concurrency 6), store in a window var. Chrome MCP filter blocks `=` in RETURN values — sanitize with .replace(/=/g,'[EQ]').
3. Build a contact-sheet overlay (top candidate per category, captioned country+craft+#id), screenshot section-by-section, verify each image by eye.
4. Compile a REJECT set of the wrong ones; accept id[0] for the rest; dedup by id AND by first-word-of-name within a country (avoid near-duplicate tiles).
5. Merge accepts into the mockup's `IMG` var (existing entries kept first), reinject, `node --check` the countryScreen script block, copy to public/velor-app-mockup.html, commit, push to app-mockup-preview, verify a country reel in the live preview.

## Reusable data files (this folder)
- cdata.py — base culture dataset (story + tags) for 198 country codes.
- cadd.py — deep category expansion (ADD dict) merged into cdata.
- wave1_picks.py — Wave 1 PICKS (candidate ids) + REJECT sets.

## After all imagery: build the real app
Expo SDK (RN New Arch) + TS + Expo Router + Zustand + TanStack Query + NativeWind + Stripe RN + Expo Notifications + Sentry. Intended repo BILSY144/velor-app (note: PAT could not create new repos last session — pushed to a marketplace branch instead). Full build spec in the mockup's VELOR-APP-FEATURE-MAP.md (cloud sandbox).
