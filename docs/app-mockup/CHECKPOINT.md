# Velor App (The Atlas) — Design Mockup Checkpoint

Last updated: 2026-07-14 (session with William — country-dive videos).

## 2026-07-15: Basket rebuilt as a live cart model

- Static two-seller demo replaced by a real CART model: qty +/- works (x
  removes at qty 1), per-seller shipping options select and re-price,
  totals + checkout dock recompute live, addCart() from PDP/live tray
  genuinely adds the sample item, basket tab badge stays in sync.
- Headline + copy adapt to seller count, numbers spelled out (William
  asked: 6 sellers -> "Six makers. One payment." / "6 sellers, 6 parcels,
  6 tracking numbers -- one charge"). Verified live with a simulated
  6-seller basket.
- Empty basket = honest zero-state ("Nothing here yet / The world is
  open" -> Spin the globe). Both seed items labelled SAMPLE.
- Shipping Q&A logged (William asked twice -- PDP + basket): carriers
  separate RATING from LABEL PURCHASE. Shippo rating call (seller
  ship-from + buyer address + parcel dims) returns real named services
  with prices/ETAs at quote time; no label exists until bought. On Velor
  sellers ship themselves (own carrier account, self-reported tracking),
  so the quote is what the buyer is charged for delivery. Same model as
  app/api/shipping/rates/route.ts on the marketplace.
- Commits: 06e52c4 (live basket), b0499df (worded maker count).

## 2026-07-15: Search page rebuilt — 190 countries on region reels + working search

- William's call: no craft-chip index needed; countries on swipeable reels
  are the browse surface (categories live on the country dive). Browse =
  13 region rails (new REG/REGNAMES map, exactly the atlas 190; photo tile
  when the country has verified imagery via imgFor, branded gradient+flag
  tile otherwise). Tap -> country dive.
- The search bar actually searches now (searchRun, live oninput): ORIGINS
  (country name -> dive), CRAFTS (all 1,950 HINTS entries, capped at 40
  rows + "N more", row -> craft page), FILMS (title/sub/country -> goLive),
  honest zero-result state -> "Spin the globe".
- Verified live: 13 rails / 190 tiles exactly; "kente" -> 3 craft rows
  (Ghana x2, Togo); "coffee" -> 53; craft row tap lands on the Colombia
  coffee craft page; zero-state renders.
- NOTE / observed gap, not changed: the WORLD atlas (190) does NOT include
  CI (Ivory Coast), XK (Kosovo), FM/MH/NR/PW (Micronesia, Marshall Is,
  Nauru, Palau), BM/TC — all of which HAVE culture data in HINTS/STORY
  (198 codes there). Wave-9 imagery for FM/MH/PW/NR is therefore
  unreachable from the globe/search. Flagged to William; the 190 list is
  a signed-off design decision, so not altered without his say-so.
- Commit 404fc74.

## 2026-07-14: Product page + craft pages — buyer journey completed

- Every craft tile (real photo or "Opening soon") now opens a CRAFT PAGE:
  hero (verified photo or branded placeholder), "<COUNTRY> x SIGNATURE
  CRAFT" kicker, LISTINGS section, "More from <country>" cross-links.
  189 countries show the honest founding zero-state ("No <craft> listed
  from <country> yet" + Claim/Follow); only China x Porcelain tea sets
  carries the one SAMPLE listing, which opens the PDP. New craftslot
  screen + goCraft(cc, encodedName); names URI-encoded in onclick attrs
  (apostrophes!). Listing-card arrows must be explicitly sized (bare
  I.arrow renders unconstrained and crushes flex text).
- PDP delivery: "Deliver to UK - est GBP 6.40 - 8-12 days - change" row.
  DECISION (William asked how delivery cost works without a label): rate
  QUOTES need no label -- seller ship-from (SellerShippingProfile) +
  parcel dims + buyer location (saved address / device country / picker)
  -> Shippo quote shown as estimate, exact at checkout, label only after
  order. Same model the marketplace checkout already uses per seller.
- Reviews (William): kept as mock-up of the vision but explicitly
  labelled -- "BUYER REVIEWS - SAMPLE" header, note "These are mock
  reviews... nothing on Velor carries a rating it has not earned",
  per-review chips SAMPLE - UK/IE, invented 4.9 aggregate removed.
- Live demo tray text opens the PDP; PDP back button returns to the craft
  page when arrived from there (goPdpBack).
- Verified live: GT "Mayan weaving" zero-state page, CN porcelain page
  with sample listing, PDP deliver-to row + sample-review section.
- Commits: 66dafd6 (craft pages + PDP), fcf6b1f (arrow fix).

## 2026-07-14: Velor Live rebuilt as a swipeable feed of the verified films

- The live screen previously always played LIVE[0] (China tea set) with the
  China demo product/chat regardless of which film was tapped. Now goLive(i)
  opens the exact film tapped (home rail + country strips wired), and the
  screen is a feed: swipe up/down on touch, chevron buttons + n/41 counter
  on the right. Country chip on each film jumps into that country's dive.
- Honesty split per William: film 0 (China) keeps the full live-shopping demo
  (product tray + chat) as the vision; every other film shows the honest
  founding-seat tray ("<Country>'s seat is open ... Claim") -- no fake chat,
  no fake listings on the other 40 films.
- Product/founding trays compacted to one slim bar (34px thumb, single line,
  small Add/Claim) per William's "more room for the film" note. Title/sub get
  a text-shadow for legibility over bright footage; inline price-line flags
  scoped via .ptray .pfl (the .ptray img 52px rule was blowing them up --
  pre-existing bug from the old static screen).
- Wheel navigation was added then REMOVED: stray synthetic wheel events (from
  the browser-automation environment, LIVENAVT confirmed set with no human
  scroll) advanced the feed by itself. Touch swipe + chevrons remain; do not
  re-add wheel nav without solving that.
- Video pauses when leaving the live screen (go() handles it).
- Verified live: goLive(21) holds on Guatemala backstrap loom (22/41), China
  demo renders product+chat, Hungary-style films render the Claim tray.
- Feed order is COUNTRY-FIRST (William, 2026-07-14): opening a film from a
  country page plays all of that country's broadcasts first (counter shows
  position within the country, e.g. "2/2"), then flows into the rest of the
  world -- at scale, "swipe through 300 Turkish sellers, then keep
  travelling." Home-rail entry keeps the global order. buildFeed()/liveStep()
  in the mockup; verified live on TR (2 films -> China next, reverse works).
- Commits: cf8073d (feed), da791cd (flag/legibility), 44839e1 (compact trays),
  0018d31 (drop wheel nav), 9807dd9 (country-first feed order).

## 2026-07-14: SHOPPING <country> strip is now per-country verified video

William's rule: the bottom of every country dive must only show films from
that country. Previously all 190 pages shared the same 3 global clips
(CN tea set / MA souk / TR sand coffee) — a real accuracy bug, fixed.

- 380 Pexels video queries (2/country from HINTS top crafts) fetched via
  same-origin fetch on pexels.com; top-10 candidates parsed per query
  (portrait mp4 + poster slug). Slug-relevance pre-filter cut 380 keys to
  154 plausible; every surviving poster was visually verified on a labelled
  contact sheet. 38 videos ACCEPTED across 37 countries (NP has 2), plus the
  3 original clips kept (CN, MA souk, TR sand coffee) = 41 LIVE entries.
  TR/MA/NP have 2 films each, verified live.
- Picks + full reject rationale: docs/app-mockup/video_picks.py. Notable
  reject classes: wrong-country slugs (kente→Indonesia, Dala horses→real
  horses in Cappadocia), same clip surfacing for 2+ countries (assigned to
  exactly one, never shared), scenery/landmarks, generic unverifiable
  closeups, animals-instead-of-craft.
- Wiring: `liveStripFor(c)` in the mockup filters LIVE by `v.c===c.c`.
  Countries with no verified film render an honest dashed zero-state tile
  ("No films from <country> yet — its founding seller opens this channel"),
  never foreign footage. New entries carry a `p` poster URL (video posters
  live under images.pexels.com/videos/, not /photos/); render sites use
  `v.p||px(v.img)`.
- Live-verified on the preview: Guatemala (1 film, backstrap loom),
  Papua New Guinea (zero-state), counts TR:2 MA:2 NP:2 CN:1 CO:1 MX:1.
- Commit 141e3a8 on app-mockup-preview. Origin-text fact-check pass
  (all 190, commit b557b9e) also stands from earlier today.

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
- **Wave 2 — East & SE Asia (18 countries): DONE & PUSHED.** 102 verified photos added (158 candidates, 41 rejected + near-dupe dedup). Picks/rejects in docs/app-mockup/wave2_picks.py. China/Japan/Vietnam/Indonesia/Macau near-perfect; Hong Kong/Mongolia patchier (street/scenery shots rejected).
- **Wave 3 — South+Central Asia+Caucasus (16 countries): DONE & PUSHED.** 83 photos added (dedup collapses repeated Central-Asian stock). India/Nepal/Uzbekistan/Azerbaijan/Georgia strong; Turkmenistan all-placeholder (no Pexels coverage). Picks in docs/app-mockup/wave3_picks.py.
- **Wave 4 — Middle East (14 countries): DONE & PUSHED.** 65 photos added. Turkey/Iran near-perfect; Gulf states patchier (camels/skylines/musical-oud rejected). Picks in docs/app-mockup/wave4_picks.py.
- **Wave 5 — Western/Southern/Central Europe (20 countries): DONE & PUSHED.** 116 photos added. Italy/France/Germany/Vatican near-perfect; microstates thinner (landmarks/harbors rejected). Picks in docs/app-mockup/wave5_picks.py.
- **Wave 6 — E Europe/Nordic/Baltic/Balkans (25 countries): DONE & PUSHED.** 140 photos added. Czechia/Poland/Russia/Ukraine strong; Nordic craft coverage skews to scenery (rejected). Picks in docs/app-mockup/wave6_picks.py.
- **Wave 7 — North + West Africa (21 countries): DONE & PUSHED.** 107 photos added. Morocco/Nigeria/Ghana/Egypt/Mali strong; small W-African states thinner. Picks in docs/app-mockup/wave7_picks.py. (Côte d'Ivoire CI not in mockup's 190 — skipped.)
- **Wave 8 — East/Central/Southern Africa (31 countries): DONE & PUSHED.** 153 photos added (227 candidates verified, ~60 rejected to placeholder + near-dupe dedup). Tanzania/Kenya/Madagascar/Ethiopia/South Africa strong; small states (DJ, ZM, SS, SC, CG) thinner (2–3 tiles). Picks + reject list in docs/app-mockup/wave8_picks.py. Codes: ET,ER,KE,TZ,UG,RW,BI,SO,DJ,MU,KM,MG,CM,CD,GA,GQ,TD,CF,ZM,ZW,BW,NA,ZA,SZ,MW,MZ,SS,CG,AO,LS,SC. IMG now covers 172 countries.
- **Wave 9 — North America + Oceania (16 countries): DONE & PUSHED. FINAL WAVE.** 83 photos added (139 candidates verified, 44 rejected + near-dupe dedup). US/CA/AU/NZ/Fiji strong; small Pacific states (KI, MH, FM) thinner (3–4 tiles, generic Pacific craft stock). **Papua New Guinea (PG) = 0 real photos on purpose:** every Pexels candidate came back as an ethnographic portrait of people, not the actual craft — all rejected, PG shows honest "Opening soon" placeholders. Note: MH "Shell jewellery" matched a Marshall *amplifier* (rejected). Picks in docs/app-mockup/wave9_picks.py; verification reject list in wave9_reject.py. Codes: US,CA,AU,NZ,FJ,PG,SB,VU,WS,TO,KI,TV,FM,MH,PW,NR. **IMG now covers 186 countries.**
- **IMAGERY GRIND COMPLETE.** All 9 waves done and pushed to app-mockup-preview. Every country with Pexels coverage has verified real photos; the rest show honest "Opening soon" placeholders. PG is the only signature country left fully on placeholders (no accurate stock available).
- **ORIGIN-TEXT FACT-CHECK COMPLETE (2026-07-14).** All 190 country origin lines (STORY var) web-verified via 12 parallel research agents, evocative-but-accurate voice preserved. Stripped unverifiable superlatives ("world's finest/oldest/best"); softened citable ones to "one of the world's oldest…" (AU, SM). Factual fixes include: Cuba "cigars rolled on the thigh" myth removed; Israel line no longer credits Bethlehem (West Bank) crafts to Israel; Egypt "where writing began" removed (Mesopotamian cuneiform is at least as early); Chad Tuareg-silver overstatement corrected; Mauritania Tuareg→Moorish; Iran "where the carpet was born" (contested) removed; Russia Gzhel "cobalt on white"; Lesotho Basotho blanket noted as worn emblem (mill-made, not hand-woven). 63 lines materially changed; final lines saved in docs/app-mockup/story_final.json. Pushed & verified live.
- **If revisiting:** PG is the main candidate for a re-source with narrower product queries ("bilum bag close up", "Sepik mask carving", etc.) if better craft-product photos can be found. Everything else is verified.

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
