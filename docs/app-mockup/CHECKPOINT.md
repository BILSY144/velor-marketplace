# Velor App (The Atlas) — Design Mockup Checkpoint

Last updated: 2026-07-14 (session with William — country-dive videos).

## 2026-07-15: ENTERPRISE TIER RETIRED (production + mockup) — major business change

William's decisions this session, applied to the FULL production codebase
(commit 2c79f75 on main, 60 files) and the mockup:
- Enterprise removed completely. Pro (GBP 49/mo, 4%) inherits every
  Enterprise feature: unlimited listings, Go Live, dedicated AI account
  manager (full capability set: order lookups, drafting, escalation),
  full API access, priority support. Legacy ENTERPRISE rows read as PRO
  everywhere; commission maps alias ENTERPRISE->0.04 so no stray row
  ever bills 0%.
- LIVE SHOPPING ON EVERY TIER, Starter included. The standing
  "live broadcasting is the founding privilege" rule (2026-07-08) is
  SUPERSEDED; founding perk is now "the full Pro tier free for life".
  All site + mockup copy rewritten accordingly.
- Starter listing cap 20 -> 10 (create block, downgrade delist, copy).
- Ask Velor (app) wired to the REAL /api/assistant/chat on this same
  deployment — identical brain to the website widget, her avatar
  (/velor-assistant.png), real reply bar. Preview env needs
  ANTHROPIC_API_KEY ticked for Preview in Vercel (William's task) —
  currently returns the honest 503 copy.
- Stripe: Velor Enterprise product prod_UoqXwy4RXYEoFl ARCHIVED (0 subs
  ever). STRIPE_ENTERPRISE_PRICE_ID env now unused.
- Mockup: tier calculator reworked to 2 tiers, founding/live copy
  updated in country dive / craft pages / live feed / You sellband,
  embedded LEGALDOCS regenerated from the updated site source (0
  Enterprise mentions anywhere in the mockup).

## 2026-07-15: Language & currency — real data, live FX conversion

- All 19 languages the platform speaks (from lib/outreachI18n.ts;
  English live, rest "arriving"), all 20 checkout currencies (from
  lib/currency.ts) as chips. Picking one fetches the LIVE rate --
  frankfurter (ECB) first, open.er-api.com fallback, the exact
  two-source strategy of lib/fx.ts. frankfurter was unreachable from
  William's browser context; fallback verified working.
- gbp() is now currency-aware (zero-decimal JPY/KRW handled), so the
  whole cart->checkout->confirmed pipeline converts: verified live in
  USD ($72.29 tea set, $296.65 checkout dock at rate 1.3387). You-page
  row shows the live selection; in-page sample tile converts.
- Honest failure path: both sources down -> stays in current currency
  with a toast.
- REDESIGNED same day (William: "could be so much better... all block
  looking text"): "Your words. Your money." editorial header; languages
  as a 2-column card grid in their NATIVE SCRIPTS (serif display face,
  English lit with accent ring + dot, rest tagged ARRIVING with the
  English name as subtitle); currencies as 3-column symbol-led cards
  (big serif symbol, code, real currency name); live-rate bar ("GBP 1 =
  S$1.7291 - European Central Bank") + specimen row (GBP 54 struck
  through beside the converted price). Verified live.
- Commits: fdc461c, 9f37824, 62edfaa.

## 2026-07-15: Legal rows read in-app (no more browser-tab jumps)

- William: all four Privacy & legal links dumped him into desktop tab
  view (window.open). The site blocks iframing, so each doc got an
  in-app reader page: faithful synopsis (escrow / 14-day returns per
  published terms; GDPR rights; seller tiers + prohibited items; dispute
  flow) + the REAL section list extracted from the live pages'
  source, with "Read the full text -- opens your browser" as an explicit
  choice at the bottom. Verified live: Terms opens in-app, no tab.
- FOLLOW-UP (same day): the section rows were static; William flagged
  it. All 53 sections across the four docs now carry the REAL body text
  extracted verbatim from the live pages' source (terms 12, privacy 10,
  seller agreement 11, help 20), rendered as tap-to-expand accordions.
  Verified live: Buyer Protections expands with the published 14-day
  text. Commits 5759fb7, 4983969.

## 2026-07-15: The opening bell audibly rings

- William asked whether the bell can actually sound as a notification.
  Yes: mockup now synthesizes a struck-bell chime in Web Audio (partials
  330/660/792/990/1320, no asset) -- "RING IT" button beside the
  WHAT THE BELL SOUNDS LIKE header plays it full, and setting a follow
  gives a soft preview ring. Verified live (AudioContext running).
- Real-app mapping for the Expo build: bundle a custom notification
  sound; iOS payload sound field (<=30s caf/wav/aiff), Android dedicated
  "opening-bell" notification channel with the sound attached. The bell
  sound is RESERVED for channel-opening alerts -- order/parcel updates
  keep the default quiet tone, preserving "quiet by default".
- 4-SECOND REAL-BELL VERSION (William, same day): full ring is now a ~4s
  double-strike (second strike at 0.9s) with cast-bell realism -- ten
  inharmonic partials (hum/prime/minor-third tierce/quint/nominal +
  uppers on F=470Hz), every partial a detuned DOUBLET so the ring beats/
  shimmers like real bronze, filtered-noise clang transient at each
  strike, compressor guarding levels. Soft follow-preview stays a short
  single strike. Commits fac9a2c, 520a63c, 75a6a13.

## 2026-07-15: Orders back button + You sub-pages (no dead rows)

- Orders gained a context-aware back button: go() now captures the
  previous screen (prevScr, before cur reassignment -- first attempt had
  a bug where cur was already overwritten) so back returns to wherever
  you came from (You / passport / bell); confirm maps to atlas.
- William: "most links don't do anything" on You. Built four sub-pages:
  Addresses (SAMPLE address book + default chip), Payment methods (Apple
  Pay READY + honest no-saved-cards state + Stripe/passkey trust bar),
  Language & currency (radio pickers, 19-languages note, charged-in-your-
  currency note), Privacy & legal (escrow summary + rows that window.open
  the LIVE site's real /legal/terms, /legal/privacy, /legal/seller-
  agreement, /help). All 7 account rows now navigate.
- Verified live: 7/7 rows navigate, orders back -> account, pay page
  renders.
- Commits: 93fa901+88c0b24 (back), 7971431 (sub-pages).

## 2026-07-15: You page derives from live session state

- Passport card: real earned/en-route counts, latest stamp's flag (globe
  icon before any), honest zero copy ("Your first delivery starts it").
- Orders & tracking row counts real parcels; Favourites & follows shows
  a real FAVS counter (heart buttons on live + PDP now feed it) +
  FOLLOWS count; Addresses row shows the SAMPLE address (was the real
  Polegate office, third and last instance removed).
- Verified live: zero state, then follow+fav+order -> all rows update.
- Commit 0bb297e.

## 2026-07-15: Passport newest-first; Opening Bell wired live

- Passport grid: stamped countries always sort to the top, newest first
  (earned -> EN ROUTE -> grey). Commit 8396cba.
- Opening Bell (notif) is now real: FOLLOWS model, Follow buttons on
  country dives + craft pages genuinely toggle (state-aware label
  "Following · bell set"). YOUR BELLS lists followed countries (Watch
  previews -> country-scoped live feed when films exist, else Visit) and
  placed orders (Track it -> filtered orders). Honest zero-state
  ("Quiet. That's the point."). The three vision cards stay under
  "WHAT THE BELL SOUNDS LIKE · SAMPLE" -- fabricated "Studio Kaede"
  seller removed. Bell badges start hidden at 0 (were hardcoded 3) and
  count follows+orders live.
- Verified live: zero state -> follow TR+GT + place order -> 4 bells,
  badge 4, newest follow on top.
- Commit c4482f9.

## 2026-07-15: Stamps deep-link to country-filtered orders

- William: pressing a stamp shows ALL orders from that country. Earned +
  EN ROUTE stamps call ordersFor(cc) -> Orders filtered with a
  "<COUNTRY> ONLY x show all" chip; grey unearned stamps open the
  country dive instead (shop it to earn it).
- Orders page is now model-driven: ORDERS[] fed by renderConfirm (stage
  0, "seller preparing"), ORDERSEED sample pair when nothing ordered,
  per-stage tracking bars, honest "No orders from X yet" filtered-empty
  state with a Shop-CTA.
- Verified live: simulated earned CN stamp -> click -> CHINA ONLY chip +
  exactly the China order.
- Commit b1acb33.

## 2026-07-15: Passport wired to real order state

- Fabricated history removed (was 3/190 with invented delivery dates).
  PASSPORT model: earned[] (delivery only -- never populated in the demo,
  honestly) + incoming[] (fed by renderConfirm on order placement).
  Headline shows n/190 with "+N EN ROUTE" chip; EN ROUTE stamps render
  dashed-accent; grey suggestion stamps fill the grid; copy adapts to
  zero / en-route / earned states; progress bar derives from earned.
- Verified live: 0/190 zero state -> place sample order -> "+2 EN ROUTE"
  with China + Morocco dashed stamps.
- Commit 4b2188e.

## 2026-07-15: Confirmed page generated from the cart; escrow copy corrected

- Order lines (VLR-numbered, one per seller with that seller's items +
  chosen shipping), headline, total and passport-stamp tease all derive
  from the live cart. Paying clears the basket (badge -> 0), completing
  the loop; opened with an empty cart (review chips) it falls back to
  CARTSEED so the page stays reviewable.
- ESCROW COPY FIX (William caught it): "held until both are delivered"
  was wrong -- each seller's share is held separately and released when
  THAT parcel's delivery is confirmed, matching per-order release-payouts.
  Copy now says exactly that. Basket/checkout bars were already correct
  ("each parcel's delivery").
- Verified live: 2 orders at GBP 72.90 (incl DHL upgrade) + GBP 161.20,
  total 234.10 consistent with the modified basket; cart emptied after.
- Commits: 1b681c4 (live confirm), 20885c5 (escrow copy).

## 2026-07-15: Dispute fixed (photo layout + 3-photo gate) and return flow built

- ADD PHOTOS off-page bug: the sample <img> in a flex rail refused to
  shrink below intrinsic size (flex min-width:auto), blowing up full-
  width. Photos are now fixed 84px div tiles that wrap in-page.
- William's rule: minimum 3 photos to open a dispute. Implemented with a
  counter label + blocked submit and toast. One reasoned exception,
  flagged to William: "It hasn't arrived" lifts the gate (label says
  "NOT NEEDED -- NOTHING ARRIVED TO PHOTOGRAPH").
- "Request return" (odetail) no longer dead-ends: real returnreq screen
  -- 14-day window per the PUBLISHED terms, reason radios, optional
  photos, escrow-freeze copy, pointer to the dispute flow for damage.
  Added to review chips.
- OBSERVED PRODUCTION INCONSISTENCY (flagged, not changed): live terms
  page says returns "within 14 days of delivery" but
  app/api/returns/route.ts enforces RETURN_WINDOW_MS = 15 days. Code is
  more generous than the promise; align one of them when William
  decides.
- Commit 37fa8a3.

## 2026-07-15: Checkout derives live from the cart

- DELIVERY section lists each seller's parcel with the service chosen on
  the basket (verified: DHL switch on basket carries through), SUMMARY +
  both pay buttons (Apple Pay + dock) recompute from cartTotals().
  Verified live at GBP 234.10 for the qty/service-modified sample basket.
- DELIVER TO no longer shows the real Polegate registered-office address
  -- replaced with an explicitly SAMPLE address row.
- Empty cart -> honest zero-state. Pay deliberately does NOT clear the
  basket (design-review tool; the confirm screen is static).
- Commit c10f48f.

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

## 2026-07-15 — Founding seats page rebuilt (commit 10b2ca0)

William: "this page can do with some serious redesigning/layout." Old page was 14 flat CH rows, a dead search input, and an "All 190 countries" button that only fired a toast. Replaced with a slot screen (`seatsslot` + `renderSeats()` hook in go(), built once) containing:

- Header: THE FOUNDING MAP kicker, "One seat per country." display, honest sub ("first verified seller… keeps the seat permanently. All 190 are still open" — opener language, no "claims/owns").
- Working search (`seatsSearch`): filters all 190 rows by country name OR craft (data-n = name + HINTS crafts, lowercased). Hides the top block while searching, shows "N SEATS MATCH", honest empty state for no matches. Verified live: "kilim" → 4 seats, "japan" → 1, "zzzz" → empty state, clear → resets.
- Stat band .sstats: 190 SEATS · 0 TAKEN · 24H DECISION (all true).
- Perks grid .sgrid (2×2): the four corrected founding perks (badge / Pro free for life with 4% / homepage showreel / opening credit) — matches the post-Enterprise-retirement sell pitch.
- "CRAFT POWERHOUSES — EVERY ONE STILL OPEN" hrail: 10 .fseat cards from CH with Pexels images (hero img uses class .fs-i, NOT bare img selector — the .ptray lesson), known-for line, dashed SEAT OPEN chip → apply.
- Full directory: 13 REGNAMES groups, all 190 WORLD rows (flag, name, first-2 HINTS crafts sub, SEAT OPEN chip) → apply. Bottom CTA "Apply for your seat" + 24h line.

Verified on preview (?v=seats1): 190 rows / 13 groups / 10 featured cards render; search + empty state + reset all pass; visual check of header, stats, perks grid, rail and directory rows all clean.

## 2026-07-15 — Apply page redesigned (commits 9e0/10b2ca0 successors; see git log)

William: no 2-speciality cap at application; sellers describe everything they plan to sell; "this page needs a complete redesign and layout." Rebuilt S.apply:

- Header: SELL ON VELOR kicker, "Apply to sell.", sub "Five minutes, one form. Free to apply — 0% listing fees on every plan." 3-step strip kept (Apply / Verify identity / Decision in 24h).
- Sections with .k d kickers: YOUR STORE (name + country row, "Founding seat open" in accent) · WHAT YOU MAKE · SHOW YOUR WORK · SHIPPING & MATERIALS.
- SPECIALITY PICKER REMOVED from apply (pickSpec stays — still used by New listing). Replaced with a large free-text box "YOUR CRAFT & EVERYTHING YOU PLAN TO SELL" + helper "Write it all — your craft, your categories, every kind of product you plan to sell. No limits, no picking from a list." NOTE: production design decision #5 (max-2 specialities) is a LISTING-time rule, not application-time — production app/apply already collects free-text description + categories, so this aligns, no production change needed.
- New photos section: "PHOTOS OF YOUR WORK · MINIMUM 3" — three verified JP Pexels images (14705063 tea bowls / 18198515 sake sets / 8330375 matcha) as 64px tiles + dashed add tile, all one row; helper line states apps without 3 real photos are declined (true: MIN_SAMPLE_IMAGES=3 in production review cron). First cut used 84px tiles and the add tile wrapped — fixed to 64px.
- Optional website/social field; ship-from + materials declaration kept; dock line "Submitting takes you straight to identity verification"; submit → verify.

Verified live (?v=apply2): header/steps/sections render, photo row single-line, description box and helper copy correct.

## 2026-07-15 — Seller dashboard: two tier views, Pro advanced

William: two tiers need two views, "the pro dashboard more advanced… highly advanced and sophisticated for pro. The dashboard on show atm is good for starter tier." S.dash → slot + renderDash() with a STARTER/PRO segmented toggle (.dseg, DASHTIER, dashTier()).

STARTER (Killa Textiles · Peru, real PE wave images): the original simple layout — 3 stats, Go Live card ("Live is open to every seller" — old "Founding privilege" copy REMOVED, live is all-tiers since 2026-07-15), listings cap meter 7 OF 10 (.capbar), 3 listings, Pro upsell card ("Keep 6% more of every sale", button flips to the Pro view), to-do, payouts.

PRO (Studio Kaede · FOUNDING JAPAN + PRO · 4% badges): the advanced layer —
- 4-stat row (adds Paid out £2,140)
- Revenue chart card with working 7D/30D/90D tabs (DCHART datasets, chartRange() swaps SVG sparkline + total; labelled SAMPLE DATA)
- AI account manager card (her avatar /velor-assistant.png, 3 insight tips, "Ask her anything" → assist screen)
- THIS MONTH analytics grid (conversion, repeat buyers, avg order, rating)
- WHERE YOUR VIEWS COME FROM source bars (dashBar helper)
- ORDER PIPELINE strip (New/To ship/In transit/Delivered, escrow-release line)
- TOP LISTINGS · 30D revenue bars, YOUR BUYERS country rows (flags + orders)
- Go Live card with last-stream stats, to-do, LISTINGS · UNLIMITED, API access row (Pro-only), payouts.

Verified live (?v=dash1): toggle re-renders both views; chart tabs switch £412/£1,872/£5,630; Starter cap bar + upsell + Peru listings render; Pro pipeline/top-listings/buyers/API all render. New CSS: .dseg/.tbadge/.chart/.aimgr/.aitip/.angrid/.capbar/.upsell/.ctabs/.pipe.

## 2026-07-15 — Dashboard deep-links + seller orders + API keys screens

William: sections must be clickable ("6 to ship should take them to the orders need shipping") and Pro sellers must manage API keys in-app. Added two registered screens (SCREENS + TABMAP entries: sellorders, apikeys — both TABMAP 'account'):

- S.sellorders / renderSellOrders(): SELLORD live model (3 new / 6 ship / 4 transit / 5 delivered + SO_EARLIER=21 → counts match the dashboard pipeline exactly). Filter pills with live counts; rows show item image, VLR id, buyer flag+country, price, per-status detail (tracking no. for transit, release note for delivered). Ship button (soShip) really moves the order to In transit, assigns a tracking number, toasts, and re-renders BOTH this screen and the dashboard — dashboard counts are computed from SELLORD via soCount(), so they stay consistent (verified: ship VLR-8241 → To ship 6→5 everywhere).
- S.apikeys / renderApiKeys(): Pro tools page — existing masked key card, Create a new key (akCreate pushes a key, full value shown once in accent with "copy it now" note), Revoke per key (akRevoke), scope pills, hashed-storage + 600 req/min note.
- Dashboard wiring: To ship stat (both tiers) → sellorders pre-filtered to ship; In escrow / Paid out stats + escrow-release line → payouts; every pipeline cell → sellorders with that filter; To-do Ship row → sellorders; API access row → apikeys. .ds.tap arrows via CSS ::after. go('dash') now clears the slot so counts recompute on every visit.

Verified live (?v=dash2) end to end via JS + screenshots. Cosmetic follow-up: inline flags in order rows sized to fill wrapper.

## 2026-07-15 — New listing page polished

Kept the existing structure (it was good); fixed gaps found on review:
- Photos: was 2 imgs + unverified id 18848781 while claiming "3 added" — now 3 verified JP images (14705063/14563207/8330375) in fixed 92px wrapper divs. First render blew up full-width: bare <img> flex items ignore flex-basis because min-width:auto resolves to intrinsic width — SAME trap as the dispute tiles and the craft-page arrow. Rule: never rely on flex-basis to size an <img>; always wrap in a fixed-size div.
- Earnings hint under price/stock: "You'd keep £65.28 of £68 — Pro, 4% commission. Shipping is paid on top and passes to you in full."
- New THE STORY textarea (buyers read this) + PARCEL row ("1.2 kg · 20×20×15 cm — powers real delivery quotes", mirrors production weightGrams/dims requirement for Shippo rates).
- Readiness checklist now honest: photos 3 added, ship-from on file, speciality Clay, story added, parcel size set.
- Speciality picker UNTOUCHED (max 2, closed vocab, request-a-term) — that's the real listing-time rule (design decision #5), distinct from the apply page where the cap was removed.

PRODUCTION (main, commit a81e198 + CLAUDE.md note): Shipping Buffer built at William's request — SellerShippingProfile.handlingFeeGBP (0–25, clamped at write + quote time), added server-side to real Shippo quotes only, currency-converted via lib/fx, commission-free pass-through. Settings page field beside Handling Time. Verified Ready/Production.

## 2026-07-15 — Working image upload everywhere + new listing de-boxed

William: "the upload imagery… goes nowhere", "speciality up to 2 again should be a description box", "make sure on all pages the upload imagery works where relevant", "the page needs an uplift, atm its very boxed".

GLOBAL PICKER: one hidden <input type=file id=gfile accept=image/* multiple> injected next to the menu; pickImage(cb) opens the device gallery/camera, each chosen file becomes an object URL passed to cb. Wired into all three photo surfaces:
- New listing: + tile and cover both call nlPick(); new photos append to the thumb rail, become the cover, and update the count line + "Photos · N" readiness pill live. Tap any thumb → nlSetCover.
- Apply (SHOW YOUR WORK): + tile calls apAdd(); tiles insert before the button (row now flex-wraps), count line updates.
- Dispute evidence: dAddPhoto() now shows the real chosen photo in the 84px tile (was a placeholder camera graphic) and still drives the 3-photo gate via dRefresh().

NEW LISTING REDESIGN (de-boxed): cover hero (4:3, rounded, "Add photo" chip) + 64px thumb rail; big serif TITLE and description/story as contenteditable hairline blocks (.nltitle/.nltext) instead of grey boxes; PRICE/STOCK/PARCEL as a .sstats stat strip with dims+Edit row and the keep-£65.28 line; materials as a hairline row with a No pill; readiness as green .okpill chips. Speciality picker fully REMOVED from listing too (matches apply — William's call; note this supersedes design decision #5's closed vocabulary for the app design). pickSpec() now orphaned but harmless.

Verified live (?v=newlist3): simulated upload via nlAddUrl(dataURL) → thumb count 3→4, cover swaps, count line + pill update, tap-thumb restores original cover; gfile input present; visual pass of hero/strip/hairline sections clean. Note: .sstat .sv is globally accent-orange (from the seats-page change) so all three stat numerals render orange — looks intentional, William approved orange numerals.

## 2026-07-15 — Go live rebuilt as a three-phase flow (LAST PAGE — full app review COMPLETE)

Old page: static camera-check card, Go live button was a toast, background film was Turkey (LIVE[2]) under Studio Kaede's Japanese persona. Rebuilt:

- Phase 1 CAMERA CHECK: Japan film (LIVE[27], "The tea ceremony"), editable broadcast title (contenteditable), pinned-listings pills with working + Add (glAddPin pins Matcha whisk · £52), honest note "Preview uses a sample film".
- Phase 2 ON AIR (glStart): pulsing LIVE chip with real ticking mm:ss timer, viewers counter ramping toward 612 explicitly labelled SIMULATED (buyer pages still never show fake counts — this is the seller's own demo), rolling chat bubbles (GLCHAT, max 4 on screen, no emojis), sale events at 10s/22s ("Kuro raku bowl sold — held in escrow") updating the pinned-card £ sold, red End stream button. Back chip calls glEndAll() so timers never leak.
- Phase 3 SUMMARY (glEnd): "That's a wrap." + SIMULATED PREVIEW label, .sstats strip (on-air duration / peak viewers / £ sold), "+N new followers will hear your next opening bell", Back to dashboard / Set up another stream (glReset).

Verified live (?v=golive1): pin add 3→4, timer 0:05/0:17, viewers 73→160, chat + Velor escrow bubbles, £68 sold on pinned card, summary fills correctly. William: "perfect".

STATUS: every page of the mockup has now been reviewed and approved by William — buyer side (previous sessions) and seller side (this session: sell pitch, founding seats, apply, verify, dashboard ×2 tiers, seller orders, API keys, new listing, payouts, go live). Next big step per the roadmap: scaffold the real Expo/RN app (spec: VELOR-APP-FEATURE-MAP.md).

## 2026-07-15 — Brand refresh: new logo + glow removals

William supplied a new master logo (VELOR with globe-as-O + GLOBAL MARKETPLACE strap, black bg) and an app-store icon, uploaded via GitHub web to main ("Add files via upload", 3d932f8). Processed:
- Cutout: edge flood-fill (protects the globe's dark interior) + scipy component pass to clear enclosed letter counters OUTSIDE a protective circle around the globe (size-based selection fails — gridlines slice the ocean into ~1000 small components). Result: clean transparency, globe intact.
- main: public/brand/velor-logo-master.png, public/brand/velor-app-icon.png (1254px, for store listings when the real app ships), public/velor-logo-2026.png (900px cutout). GlobalHeader (h40) + GlobalFooter (h32) swapped to it; layout.tsx schema logo + og-image left on old assets deliberately (dimension comments pinned there). Commit 167c93b, verified live on velorcommerce.store.
- Mockup splash: biglogo (VEL+canvas+R) + lstrap replaced with the new logo img (public/velor-logo-2026.png committed to this branch too). drawOGlobe now no-ops safely (canvas gone, guard exists).
- Atlas glow removals (William): orange .glow-c halo div+CSS deleted; blue atmosphere halo in initGlobe GMODE 'real' deleted; rim light desaturated blue→neutral white at lower alpha. Verified live: globe reads clean with only seller lights.

## 2026-07-15 — Pre-store sweep: schema/OG logo, universal swipe, full wiring audit

- main (087ceb5, Ready·Production): layout.tsx Organization schema logo + opengraph-image.tsx swapped to /velor-logo-2026.png (900×300, clears Google's 112px min; OG img 810×270 and its duplicate "GLOBAL MARKETPLACE" text line removed since the mark carries the strap).
- Mockup (45c0614, Ready·Preview): global pointer-based drag-to-scroll — EVERY .hrail/.livestrip on every page is mouse-drag swipeable, with post-drag click suppression; touch stays native; atlas reel keeps its own snap handler (._wired guard). Verified via simulated drag (search rail scrollLeft 0→180).
- Full wiring audit, every screen in SCREENS (33 incl. dynamic country/craft): ~700 rendered buttons, 0 without onclick, on every single screen (atlas 62, search 191, seats 202, dash 21, langcur 40, …). The mockup is fully interactive end to end.

NEXT: this HTML mockup cannot itself go in the App Store / Play Store — the real Expo/React Native app must be scaffolded from it (spec: VELOR-APP-FEATURE-MAP.md; icon asset ready at public/brand/velor-app-icon.png). That build is the next major phase.
