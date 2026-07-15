// Editorial "what buyers actually shop for" hints, per country — the finished
// cultural products, never the raw materials (William, 2026-07-08: "me as a
// buyer, if I'm looking to shop in China I'm gonna look for things that are
// oriental, culture"). Raw materials stay in lib/specialities.ts as the
// internal lattice taxonomy; THESE strings are what renders on country cards.
//
// Rules for this list:
// - Product-level and culture-first: "Porcelain tea sets", not "Clay".
// - Recruitment copy only — NEVER rendered as a claim that sellers exist.
//   Live status always comes from /api/lattice.
// - No protected geographical indications used loosely, no weapons, no
//   restricted-material products (ivory, coral, shell) as hints.
// - Countries without a confident entry simply show name + flag + status.

export const CULTURE_HINTS: Record<string, string[]> = {
  // Asia
  CN: ['Porcelain tea sets', 'Silk robes', 'Calligraphy sets', 'Paper lanterns', 'Jade jewellery', 'Cloisonné ware', 'Yixing teapots', 'Hand fans', 'Mahjong sets', 'Ink & brush art', 'Chopstick sets', 'Qipao dresses'],
  JP: ['Hand-forged kitchen knives', 'Matcha bowls', 'Washi stationery', 'Incense', 'Kokeshi dolls', 'Sake sets', 'Cast-iron teapots', 'Furoshiki wraps', 'Tenugui towels', 'Kintsugi kits', 'Bonsai tools', 'Origami paper'],
  KR: ['Skincare', 'Celadon ceramics', 'Fermented pantry', 'Hanji paper goods', 'Najeon lacquerware', 'Tea ware', 'Moon jars', 'Bojagi wraps', 'Sheet masks', 'Gochujang pantry', 'Hanbok accessories'],
  IN: ['Block-printed bedding', 'Brass homeware', 'Spice boxes', 'Silk scarves', 'Kashmiri shawls', 'Marble inlay', 'Jaipur ceramics', 'Ayurvedic skincare', 'Chai blends', 'Bangles', 'Carved wood screens', 'Leather juttis'],
  TH: ['Thai silk', 'Celadon ware', 'Curry pastes', 'Benjarong porcelain', 'Bronzeware', 'Thai spa products', 'Rattan bags', 'Khon masks', 'Soap flowers'],
  VN: ['Lacquer bowls', 'Silk lanterns', 'Robusta coffee', 'Conical hats', 'Bamboo homeware', 'Ao dai fabrics', 'Phin coffee filters', 'Embroidered art', 'Rice paper crafts'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Indonesia had only 3
  // items (SEO_LOG.md backlog: content depth on /origins/[country] pages is
  // still short of the "15+ researched items" standing target for every
  // country; this is one incremental step, not a claim of completion).
  // Five product-level additions, each multi-source verified this run, no
  // single-source or AI-content-farm result carried forward: Songket
  // (gold/silver-thread ceremonial weaving, historically centred on
  // Palembang, Sumatra) is documented on Wikipedia, Google Arts & Culture's
  // "Woven Tales of Indonesia: Songket Palembang" feature, and the National
  // Gallery of Australia's Indonesian Textiles collection notes. Ikat
  // weaving (tenun ikat) -- a distinct resist-dye weaving tradition from
  // Indonesia's own regions, not the same product as Uzbekistan's ikat
  // silks already listed under UZ below -- is corroborated by the same
  // National Gallery of Australia collection notes and by the Natural Dye
  // Store's dedicated piece on Indonesian weaving styles and techniques.
  // Silver filigree jewellery from Kotagede, Yogyakarta has its own
  // Wikipedia entry (Kotagede) plus independent tourism/craft coverage
  // (Java Heritage Tour, Jogjalanjalan, YogyakartaTour.com, ANTARA Foto
  // photo-story) all describing it as a still-active, centuries-old local
  // craft, not a historical curiosity. Wayang kulit shadow puppets are
  // UNESCO-inscribed Intangible Cultural Heritage ("Wayang puppet theatre,"
  // ich.unesco.org) with their own Wikipedia article. Angklung (bamboo
  // musical instrument) is separately UNESCO-inscribed, documented on
  // UNESCO's own Silk Roads Programme site. No shell/ivory/coral/bone
  // material in any of the five; wayang kulit puppets are traditionally
  // buffalo/goat leather, the same accepted leather-goods category already
  // used elsewhere in this file (e.g. IN's 'Leather juttis').
  ID: ['Batik sarongs', 'Rattan homeware', 'Teak carvings', 'Songket weaving', 'Ikat weaving', 'Silver filigree jewellery', 'Wayang kulit puppets', 'Angklung instruments'],
  MY: ['Batik', 'Pewter ware'],
  PH: ['Handwoven textiles', 'Barako coffee'],
  KH: ['Silk kramas', 'Silverware'],
  LA: ['Handwoven silk', 'Mountain coffee'],
  MM: ['Lacquerware', 'Longyi textiles'],
  BD: ['Jamdani muslin', 'Jute homeware'],
  LK: ['Ceylon tea', 'Spice blends', 'Batik'],
  NP: ['Singing bowls', 'Lokta paper', 'Pashmina shawls', 'Copperware'],
  PK: ['Salt lamps', 'Onyx ware', 'Embroidered textiles'],
  MN: ['Cashmere knitwear', 'Felt boots'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Kazakhstan was one of
  // the 20 countries sitting at the 1-item content-depth floor flagged in
  // SEO_LOG.md backlog item 25. Five product-level additions, each
  // corroborated across at least two independent sources, no single-source
  // or AI-content-farm result carried forward. Dombra instruments (a
  // two-stringed lute) and tekemet/syrmak felt carpets are both documented
  // on advantour.com's "Crafts of Kazakhstan" page and independently on
  // central-asia.guide's "Kazakh national crafts" page. Nomadic silver
  // jewellery (rings, bracelets, earrings, pendants, historically forged
  // and stamped) is corroborated by the same two sources plus
  // central-asia.guide's "What to buy in Kazakhstan" souvenir-shopping
  // page. Tuzkiiz embroidered wall hangings (silk- or wool-yarn embroidery
  // on felt) are documented on central-asia.guide's crafts page. Kalpak
  // felt hats are documented on central-asia.guide's souvenir-shopping
  // page. Deliberately not added: kamcha (a decorated riding whip -- too
  // weapon-adjacent per this file's own "no weapons" rule) and any bone-
  // carved item (advantour documents Kazakh bone carving, but this file's
  // own established practice, e.g. Indonesia/Monaco/Andorra entries above,
  // treats bone the same as the explicitly restricted shell/ivory/coral
  // materials, so it is excluded here for consistency even though the
  // written rule only names shell/ivory/coral).
  KZ: ['Felt & leather goods', 'Dombra instruments', 'Tekemet & syrmak felt carpets', 'Nomadic silver jewellery', 'Tuzkiiz embroidered wall hangings', 'Kalpak felt hats'],
  // Expanded by the standing SEO agent, 2026-07-15 -- backlog item 25
  // (content-depth). KG had only 1 item (Shyrdak felt rugs). Five
  // product-level additions, each corroborated across at least two
  // independent, real sources (central-asia.guide's "Kyrgyz craft" page,
  // central-asia.guide's "What to buy in Kyrgyzstan" page,
  // visitkyrgyzstan.org's souvenirs guide, and triptokyrgyzstan.com's
  // arts-and-crafts page): Ala-kiyiz felt tapestries (a distinct wet-felted
  // technique from shyrdak's cut-and-pieced method, confirmed by all four
  // sources); Tush kiyiz embroidered wall hangings (traditional wedding
  // gifts, confirmed by three sources); Kalpak felt hats (Kyrgyzstan's
  // national symbol, the four panels representing the four cardinal
  // directions, confirmed by central-asia.guide and visitkyrgyzstan.org);
  // Komuz instruments (the three-stringed fretless lute, Kyrgyzstan's
  // national instrument -- has its own dedicated Wikipedia and Britannica
  // entries plus visitkyrgyzstan.org's souvenir guide, the same
  // UNESCO/encyclopedia corroboration bar already used for Indonesia's
  // wayang kulit/angklung); Silver jewellery with turquoise (three sources
  // name silver jewellery set with turquoise; deliberately named without
  // "coral", which two of the four sources also mention as a stone used,
  // since coral is a restricted material under this file's own header
  // rule). Deliberately not added: leatherwork (too generic/undifferentiated
  // across the region's other entries), woodwork, and stone/bone-carved
  // items (bone excluded for the same restricted-material-consistency
  // reason already applied to Kazakhstan above).
  KG: ['Shyrdak felt rugs', 'Ala-kiyiz felt tapestries', 'Tush kiyiz embroidered wall hangings', 'Kalpak felt hats', 'Komuz instruments', 'Silver jewellery with turquoise'],
  UZ: ['Ikat silks', 'Suzani embroidery', 'Ceramics'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Tajikistan was at the
  // 1-item floor (backlog item 25's priority list). Five product-level
  // additions, each corroborated across at least two independent sources,
  // no invented content: Chakan embroidery (floral/symbolic needlework on
  // cotton or silk) is a UNESCO Intangible Cultural Heritage element in its
  // own right ("Chakan, embroidery art in the Republic of Tajikistan",
  // inscribed 2018, ich.unesco.org) and is separately covered by
  // central-asia.guide's "Tajik Handicrafts" page and Kalpak Travel's
  // Tajikistan souvenirs guide -- it replaces the prior generic
  // "Embroidered textiles" label with the real, specific craft name. Suzani
  // wall hangings (embroidered dowry cloths) and Zardozi/Zarduzi gold- and
  // silver-thread embroidery are both documented independently by
  // central-asia.guide and advantour.com's "Traditional Crafts in
  // Tajikistan" page (the latter using the transliteration "Suzane" and
  // "Zarduzi"). Ikat-dyed adras/atlas silk textiles (resist-dye patterning
  // before weaving) are corroborated by Kalpak Travel's souvenir guide and
  // advantour.com's description of "Abrbandy" ("the most ancient kind of
  // national craft of Tajiks"). Istaravshan Kord knives (curved blades,
  // horn/bone/wood handles, hand-engraved) are documented by Kalpak
  // Travel's souvenir guide, the Encyclopedia of Crafts in the WCC-Asia
  // Pacific Region's dedicated "Kord (knives)" entry, and Eurasia.travel's
  // page on Istaravshan craftsmanship. Hand-carved rubab & dutar
  // instruments (mulberry/apricot wood, motif-carved) are covered by
  // Kalpak Travel and advantour.com's note on decorative carving of
  // "musical instruments" -- and the rubab specifically had its
  // craftsmanship and playing traditions added to UNESCO's Intangible
  // Cultural Heritage list in 2024, jointly with Afghanistan, Iran, and
  // Uzbekistan (World Music Central).
  TJ: ['Chakan embroidery', 'Suzani wall hangings', 'Zardozi gold & silver thread embroidery', 'Ikat-dyed adras silk textiles', 'Istaravshan Kord knives', 'Hand-carved rubab & dutar instruments'],
  // Expanded by the standing SEO agent, 2026-07-15 (backlog item 25's
  // content-depth floor list) -- Turkmenistan had only 1 item. Five
  // product-level additions, each multi-source verified this run.
  // Hand-knotted Turkmen carpets (kept, existing entry) are themselves
  // UNESCO Intangible Cultural Heritage-inscribed as "Traditional Turkmen
  // carpet making art in Turkmenistan" (ich.unesco.org), corroborated by
  // Kalpak Travel's and central-asia.guide's souvenir guides calling
  // carpets the country's most iconic craft. Turkmen-style needlework
  // embroidery is separately UNESCO-inscribed ("Turkmen-style needlework
  // art," ich.unesco.org) -- silk-thread loop-stitch embroidery on
  // garments and accessories, corroborated by central-asia.guide's
  // "keteni embroidery" and Kalpak Travel's embroidered-textiles entries.
  // Keteni silk fabric -- a distinct product from the embroidery applied
  // to it: a homespun, hand-loomed, naturally-dyed silk cloth with its
  // own dedicated page in the Encyclopedia of Crafts in the WCC-Asia
  // Pacific Region, plus independent coverage from Turkmenistan's own
  // government heritage press (turkmenistan.gov.tm, orient.tm) describing
  // it as a still-practised women's craft, not a historical curiosity.
  // Silver jewellery with carnelian & turquoise is documented by the
  // Metropolitan Museum of Art's own "Turkmen Jewelry" essay and
  // collection, corroborated by Kalpak Travel and central-asia.guide's
  // souvenir guides. Telpek sheepskin hats have their own Wikipedia
  // article and are corroborated as an actively-made, actively-sold craft
  // by central-asia.guide's souvenir guide and live Etsy listings, not
  // just a museum piece. Camel wool textiles (weaving of desert-camel
  // hair into bags, scarves, runners and pillows) are documented by two
  // independent Smithsonian Institution sources -- the Smithsonian
  // Center for Folklife and Cultural Heritage's "Camel Craft" feature on
  // a Turkmen mother-daughter weaving enterprise, and the Smithsonian's
  // National Museum of Asian Art's own "Turkmen textiles" collection
  // notes -- not a single-source claim. No shell/ivory/coral/bone
  // material in any of the six.
  TM: ['Hand-knotted Turkmen carpets', 'Turkmen-style needlework embroidery', 'Keteni silk fabric', 'Silver jewellery with carnelian & turquoise', 'Telpek sheepskin hats', 'Camel wool textiles'],
  AM: ['Carpets', 'Pomegranate ceramics'],
  AZ: ['Carpets', 'Tea sets'],
  GE: ['Cloisonné jewellery', 'Fermented pantry'],
  AF: ['Kilim rugs', 'Lapis jewellery'],
  IR: ['Persian rugs', 'Saffron', 'Enamelware'],
  IQ: ['Dates', 'Copperware'],
  TR: ['Copper cezves', 'Kilim rugs', 'Hammam towels', 'Iznik ceramics', 'Evil-eye glasswork', 'Turkish delight', 'Peshtemal robes', 'Mosaic lamps', 'Olive oil soap', 'Backgammon boards', 'Coffee sets', 'Ceramic bowls'],
  SY: ['Aleppo soap', 'Marquetry boxes'],
  LB: ['Olive oil soap', 'Preserves'],
  IL: ['Dead Sea skincare', 'Olive wood carving'],
  JO: ['Dead Sea salts', 'Mosaic art'],
  SA: ['Dates', 'Oud perfume'],
  AE: ['Oud perfume', 'Dates'],
  OM: ['Frankincense', 'Perfume oils'],
  YE: ['Mocha coffee', 'Sidr honey'],
  // Expanded by the standing SEO agent, 2026-07-15 -- backlog item 25's
  // content-depth project, Qatar picked next from the floor-of-1 list.
  // Five product-level additions, each multi-source verified, none
  // invented; existing 'Oud & bakhoor' kept unchanged. Bisht (men's woven
  // cloak with real gold-thread trim) is UNESCO-inscribed 2025 as "Bisht
  // (men's Abaa): skills and practices" (ich.unesco.org via visitqatar.com's
  // own crafts page), independently corroborated by The Peninsula Qatar's
  // "Age-old tradition of Bisht-making thrives at Souq Waqif" (named
  // craftsman, week-to-ten-day process, handmade bishts selling QR1,800-
  // 9,000 today) and Qatar Tribune's coverage of Katara's "Bisht House"
  // showcase -- a currently-made, currently-sold product, not a museum
  // piece. Al-Sadu woven textiles (geometric red/black/white weaving from
  // sheep wool, camel and goat hair, traditionally done by women) is
  // UNESCO-inscribed 2025 as "Traditional weaving of Al Sadu", corroborated
  // by Qatar Museums' own Al Sadu page, Qatar's Ministry of Culture
  // inventory entry, Marhaba Qatar's "Sadu Weaving in Qatar" piece, and
  // Wikipedia's Al Sadu article -- kept distinct from the bisht cloak it is
  // sometimes woven into trim for. Gold & silver-thread naqdah embroidery
  // (an-naqdah technique applied to garments and wedding hijabs) is
  // documented on visitqatar.com's official crafts page and independently
  // corroborated by ILoveQatar.net's traditional-arts guide, which notes
  // the technique is still in active use today, including by contemporary
  // Qatari brands. Gypsum-carved decor (patterned incense burners, window
  // frames and small ornamental objects, adapted from Qatari architectural
  // motifs) is documented on visitqatar.com's official crafts page.
  // Pottery & ceramics (handmade bowls, coffee mugs, vases sold at Souq
  // Waqif) is listed as a Qatari craft category on visitqatar.com and
  // independently corroborated as a currently-operating, currently-selling
  // craft by Gulf Times' "Souq Waqif potter keeps handmade tradition alive"
  // -- noted for accuracy: that specific Souq Waqif workshop is run by an
  // Egyptian-born potter blending Qatari and Egyptian motifs, so the
  // category (pottery as a real, sold Qatari souq craft) is verified even
  // though this one example artisan is not himself Qatari by origin. No
  // shell/ivory/coral/bone material in any of the five.
  QA: ['Oud & bakhoor', 'Hand-woven bisht cloaks', 'Al-Sadu woven textiles', 'Gold & silver-thread naqdah embroidery', 'Gypsum-carved decor', 'Pottery & ceramics'],
  KW: ['Dates', 'Perfume oils'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Bahrain had only 1 item
  // (SEO_LOG.md backlog item 25, content-depth floor list). Five product-
  // level additions, each corroborated across at least two independent,
  // Bahrain-specific sources (not single-source, not AI-content-farm
  // results): A'ali hand-thrown pottery (clay pots hand-molded on
  // foot-operated wheels, A'ali village, archaeological pottery finds
  // there dating back to c. 2000 BC, an annual A'ali Pottery Festival) is
  // documented by Outlook Traveller's "Discover The Traditional Crafts Of
  // Bahrain", bahrainguide.org's "Traditional skills still alive in
  // Bahrain", and Eastern Chronicles' "Bahrain's Traditional Crafts and
  // Artisans". Al-Sadu woven textiles (Bedouin geometric weaving from wool
  // and camel/goat hair) is corroborated by the same three sources as
  // still practiced in Bahrain today (revived via Bahrain National Museum
  // workshops per Eastern Chronicles) -- noted for accuracy, per LAW #1:
  // unlike Qatar/Kuwait/Saudi Arabia/UAE, Bahrain is NOT itself a party
  // state to any UNESCO "Al Sadu" inscription (verified directly against
  // the UNESCO ICH register and Al Sadu's own Wikipedia inscription
  // history), so this entry is included on craft-practice evidence only,
  // not on UNESCO status. Palm-frond basketware (dining mats, storage
  // baskets woven from local date-palm fronds, historically passed mother
  // to daughter) is documented by Outlook Traveller (the House of Basket
  // Weaving training programme at Qala'at al Bahrain) and bahrainguide.org,
  // both naming the same three villages (Karbabad, Jasra, Budaiya).
  // Al-Naqda gold & silver-thread embroidery (hand embroidery for garments
  // and, per the Kurar sub-technique, decorative ribbons) is documented by
  // Outlook Traveller (Kurar House in Muharraq, a three-generation family
  // craft) and bahrainguide.org (Al Naqda project, "modernized for
  // contemporary appeal"). Hand-built model dhows (scaled wooden replicas
  // of traditional pearling/fishing boats, built with the same techniques
  // and teak as full-size dhows) is documented by Outlook Traveller
  // (Muharraq/Naeem/Ras Ruman shipyards) and bahrainguide.org, which notes
  // full-size dhow-yard work has declined while "model dhow production has
  // increased" -- i.e. this is the currently-active, currently-sold form
  // of the craft, not a historical curiosity. No shell/ivory/coral/bone
  // material in any of the five; existing 'Pearl jewellery' entry kept
  // as-is (pearls are not a restricted material under this file's rules).
  BH: ['Pearl jewellery', "A'ali hand-thrown pottery", 'Al-Sadu woven textiles', 'Palm-frond basketware', 'Al-Naqda gold & silver-thread embroidery', 'Hand-built model dhows'],
  TW: ['High-mountain oolong', 'Ceramics'],
  // Expanded by the standing SEO agent, 2026-07-15 -- backlog item 25's
  // content-depth project, floor-of-1 list, next entry after Bahrain.
  // Hong Kong had only 1 item ('Tea ware', kept as-is). Five product-level
  // additions, each corroborated across at least two independent,
  // Hong-Kong-specific sources: Hand-carved mahjong tiles (144-tile sets,
  // cut/sanded/carved/hand-painted by artisans; officially inscribed on
  // Hong Kong's own Intangible Cultural Heritage list in 2014 per Cathay
  // Pacific's ICH feature) are documented by Time Out HK ("Disappearing
  // trades and crafts", Biu Kee Mahjong in Jordan), Wanderlust magazine's
  // "Handmade Hong Kong" feature, and Cathay Pacific's ICH article, which
  // also confirms modern tiles are carved from acrylic resin, not
  // bone/ivory -- historic material deliberately not used in this entry
  // per this file's own restricted-material rule. Handwoven bamboo
  // birdcages (bamboo soaked, shaved, bent and moulded by hand, then
  // nailed together, a process that can take months) are documented by
  // Time Out HK, China Daily, Xinhua, and SCMP, all covering Chan Lok-choi
  // of Choi Kee, described as Hong Kong's last remaining birdcage maker --
  // four independent outlets covering the same living craft. Hand-painted
  // Cantonese porcelain (Guangcai ware -- overglaze enamel painting of
  // birds, flowers and figures onto white porcelain blanks, then kiln-
  // fired) is documented by SCMP (multiple features, including on Yuet
  // Tung China Works, described as Hong Kong's last hand-painted porcelain
  // factory), VOA News, and Xinhua, and the technique itself is on Hong
  // Kong's official Intangible Cultural Heritage Inventory as "Guangcai
  // (Canton Famille Rose Porcelain) Making Technique" per icho.hk, the
  // government's own ICH register -- the strongest sourcing tier used in
  // this file. Embroidered silk slippers (dragon, phoenix and floral
  // motifs, hand-stitched, historically taking months per pair) are
  // documented by SCMP (multiple features on Sindart, a Jordan-district
  // shop founded 1958, now run by third-generation owner Miru Wong) and
  // Wanderlust magazine's "Handmade Hong Kong" feature -- kept as silk
  // embroidery, a permitted material under this file's rules. Jade
  // carvings & jewellery (centred on the Jade Market / Jade Street in Yau
  // Ma Tei, a dedicated jade-trading market distinct from mainland China's
  // own jade trade already reflected in the CN entry above) is documented
  // by the Hong Kong Tourism Board's own Jade Market listing plus
  // independent travel-guide coverage (Hong Kong Traveller, Next Stop Hong
  // Kong). No shell/ivory/coral/bone material in any of the five.
  HK: ['Tea ware', 'Hand-carved mahjong tiles', 'Handwoven bamboo birdcages', 'Hand-painted Cantonese porcelain', 'Embroidered silk slippers', 'Jade carvings & jewellery'],
  SG: ['Kaya & pantry', 'Peranakan ceramics'],
  MO: ['Macau almond cookies', 'Portuguese-style egg tarts'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Brunei had only 1 item
  // (SEO_LOG.md backlog item 25's content-depth floor list). Three
  // product-level additions, each multi-source verified this run, existing
  // 'Woven songket' entry left untouched (not re-verified or renamed).
  // Silver jewellery & ceremonial silverware is documented by
  // BruneiResources.com's dedicated silverwork page (Kampong Pandai Mas/
  // Goldsmiths' Village origin, the 'Bunga Air Mulih' floral motif, the
  // still-operating Brunei Arts and Handicrafts Training Centre formalising
  // instruction since 1975) and corroborated by FactsAndDetails' and
  // TravelDojo's independent Brunei craft overviews, which both separately
  // list silverwork among the country's living traditions. Handwoven
  // rattan & bamboo basketry (anyaman), specifically the Tudung Dulang
  // woven dish cover, is documented by BruneiResources.com's dedicated
  // anyaman page (materials/technique: split bamboo strips plus rattan
  // rim-and-securing-strip construction, village-level production in
  // Kampong Ayer, Sengkurong and Tanjung Nangka) and independently by the
  // Brunei Arts Centre's (Pusat Kesenian Brunei) own social page describing
  // Tudung Dulang as pandan-leaf-and-rattan woven dish covers -- a
  // government cultural body, not a travel blog. Songkok caps (velvet,
  // hand-sewn over a stiffened frame) are documented by BruneiResources.com's
  // dedicated songkok page (13th-century arrival with Islam, the shift from
  // round kopiah to Brunei's oblong shape, BAHTC's formal songkok course
  // running since 1978 with 30+ graduates) and independently corroborated
  // as a still-practiced regional Malay craft by Singapore's National
  // Heritage Board (roots.gov.sg, "Making and Wearing of Songkok"). No
  // shell/ivory/coral/bone material in any of the three; kris daggers and
  // other weaponry mentioned in the same source material were deliberately
  // excluded per this file's own no-weapons rule.
  BN: ['Woven songket', 'Silver jewellery & ceremonial silverware', 'Handwoven rattan dish covers (Tudung Dulang)', 'Songkok caps'],
  BT: ['Woven textiles', 'Incense'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Maldives had only 1
  // item (SEO_LOG.md backlog item 25's content-depth floor list). Three
  // product-level additions, each multi-source verified this run, existing
  // 'Lacquer boxes' entry left untouched (not re-verified or renamed; note
  // 'Liyelaa Jehun' turned out to be the Dhivehi name for this same lacquer
  // craft per encyclocraftsapr.com and ichcourier.ichcap.org, so it was not
  // added as a separate item -- same duplicate-name check already applied
  // to Brunei's songket/Jong Sarat). Woven reed mats (Thundu Kunaa) are
  // documented by the Maldives government's own Expo 2020 pavilion page
  // (expo2020maldives.gov.mv, material: dried/dyed reed, not coconut leaf --
  // see caveat below) and independently corroborated by
  // encyclocraftsapr.com (World Crafts Council Asia-Pacific's craft
  // encyclopedia, material: local reed called 'haa'/'khau', finest from
  // Fiori island) and maldives-magazine.com (material: screw-pine leaves,
  // same reed family), all naming Gadhdhoo island, Gaafu Dhaalu Atoll as the
  // craft's home; a fourth source (thearrival.mv) described the material as
  // coconut palm leaves instead of reed -- a real discrepancy caught by
  // cross-checking, not silently resolved, and the reed material was used
  // since three independent sources (incl. the official government page)
  // agree against thearrival.mv's one. Coir rope (Roanu Veshun) is
  // documented by maldives.com's dedicated craft feature (coconut-husk
  // fibre, hand-spun, 'Kaashi Hehun'/'Bo'nbi Faakurun'/'Roanu Veshun'
  // process stages) and independently corroborated by maldivestimes.com's
  // Raa Atoll feature (same process and Dhivehi terms) and
  // maldives-magazine.com (naming Haa Alif Atoll's 'aiyvaa roanu' as a
  // renowned fine-quality variant). Miniature dhoni boat models (wood) are
  // documented by encyclocraftsapr.com's wood-craft page (kissaru vadaan
  // boat-building tradition, hubs in Alifushi/Raa Atoll and
  // Velidhoo/Noonu Atoll) and independently corroborated by
  // maldives-magazine.com describing dhoni miniatures as a distinct,
  // currently-sold souvenir craft. Coconut-shell items (e.g. 'Raa Bandhi'
  // containers), also turned up in the same source material, were
  // deliberately excluded per this file's own no-shell rule even though
  // the shell here is botanical (coconut), not animal, to stay unambiguous
  // with the rule as written. No weapons; no ivory/coral/animal-shell/bone
  // material in any of the three.
  MV: ['Lacquer boxes', 'Woven reed mats (Thundu Kunaa)', 'Coir rope (Roanu Veshun)', 'Miniature dhoni boat models'],
  TL: ['Tais weaving', 'Coffee'],
  // Africa
  MA: ['Leather babouches', 'Brass lanterns', 'Argan oil', 'Zellige tables', 'Tagines', 'Berber rugs', 'Leather poufs', 'Mint tea sets', 'Kaftans', 'Rose water', 'Thuya wood boxes', 'Hammam scrubs'],
  TN: ['Olive oil', 'Fouta towels', 'Ceramic bowls'],
  EG: ['Hand-blown glass', 'Brass trays', 'Cotton linens', 'Papyrus art', 'Alabaster ware', 'Khayamiya appliqué', 'Perfume bottles', 'Backgammon boards', 'Dukkah & spices', 'Copper trays'],
  ET: ['Coffee ceremony sets', 'Single-origin coffee', 'Jebena coffee pots', 'Habesha dresses', 'Mesob baskets', 'Berbere spice', 'Teff & pantry', 'Cross jewellery'],
  KE: ['Kenyan tea', 'Beaded jewellery', 'Soapstone carvings'],
  TZ: ['Coffee', 'Maasai beadwork', 'Tingatinga art'],
  UG: ['Coffee', 'Bark cloth', 'Baskets'],
  RW: ['Agaseke peace baskets', 'Coffee'],
  NG: ['Adire indigo cloth', 'Beadwork'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Benin was next on
  // SEO_LOG.md backlog item 25's content-depth floor list. Existing
  // 'Abomey appliqué tapestries' entry left untouched (not re-verified or
  // renamed). Two product-level additions, each multi-source verified this
  // run. Bocio wood-carved Vodun figures (Ouidah) are documented by
  // Wikipedia's "Vodun art" article (bocio described as wood carvings, the
  // primary Vodun sculptural form) naming still-working 20th/21st-century
  // Beninese artists (Cyprien Tokoudagba, Calixte Dakpogan, Theodore
  // Dakpogan and others) and the 1993 International Festival of Vodun Arts
  // and Cultures in Ouidah, independently corroborated by a travel guide
  // (takeyourbackpack.com) describing hand-carved Vodun wood sculptures
  // and masks currently sold at Cotonou's Artisanal Center. Hand-dyed
  // indigo cotton textiles (Parakou) are documented by an Oko Farms
  // profile of Isidore Kouton, founder of CEPROMET (Centre de Promotion
  // des Métiers du textile) in Parakou, northern Benin, which the source
  // states has trained roughly 1,500 adults and nearly 2,000 students in
  // organic indigo dyeing and hand-weaving over ten years and "still
  // actively practiced and taught" -- not a historical curiosity.
  // Deliberately NOT added, two considered and rejected: (1) récade --
  // multiple sources (Abomey's own tourism-office director, quoted via
  // 100pour100culture.com, confirming local artisans still make them; a
  // Le Havre museum page; an MIT Press African Arts article) confirm this
  // Fon royal-sceptre craft is a real, still-made tradition, but it is
  // also documented (Oriental Arms militaria dealer; Le Havre museum's own
  // description of a "metal blade" example "employed as a weapon for
  // executioners") as a functional ceremonial axe/blade historically used
  // for executions -- too weapon-adjacent for this file's own no-weapons
  // rule, the same reasoning already applied to Kazakhstan's kamcha whip.
  // (2) asen (Fon iron memorial-altar staffs) -- extremely well documented
  // as a genuine historical Fon/Dahomey art form (Met Museum x3, Art
  // Institute of Chicago, Smithsonian National Museum of African Art,
  // Cornell, Barbier-Mueller Museum) but every source describes 19th- and
  // early-20th-century production; none confirms asen are still forged
  // today, and one Wikipedia page that might have clarified this
  // ("Benin ancestral altars") turned out on inspection to be about the
  // unrelated Edo people/Kingdom of Benin in Nigeria, not the Fon/Republic
  // of Benin -- the same Benin-Bronzes/Nigeria-vs-Benin-country naming
  // trap this run was careful to avoid throughout (a bronze-casting search
  // for this country returned only Nigerian Edo results and was discarded
  // entirely for that reason). Not added without a clear "still practiced
  // today" source, per this log's own honesty standard.
  BJ: ['Abomey appliqué tapestries', 'Bocio wood-carved Vodun figures (Ouidah)', 'Hand-dyed indigo cotton textiles (Parakou)'],
  GH: ['Kente cloth', 'Single-origin cacao', 'Recycled-glass beads', 'Adinkra prints', 'Shea butter', 'Bolga baskets', 'Krobo beads', 'Djembe drums', 'Black soap', 'Carved stools'],
  CI: ['Cacao', 'Wax-print fashion'],
  SN: ['Baskets', 'Wax-print accessories'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Gambia had only 1 item
  // (backlog item 25's content-depth floor list). Four product-level
  // additions, each corroborated across at least two independent,
  // Gambia-specific sources, none invented: Hand-thrown pottery is
  // documented both as an ongoing regional tradition (accessgambia.com:
  // Serahule women potters of Basse and Alohungari, clay pots made in the
  // Senegambia area "for over 6,000 years") and as a specific still-running
  // workshop (footstepsinthegambia.com: Saines Pottery in Brikama, founded
  // by Edrissa Saine over three decades ago, Mandinka-rooted, family-run,
  // currently producing glazed decorative and functional ware). Palm-leaf
  // basketware is corroborated by accessgambia.com (baskets, hand fans,
  // table mats, lampshades, fruit bowls woven from palm leaves) and
  // my-gambia.com's profile of weaver Ebrima Sorrie Camara in the
  // Senegambia tourist area (handbags, sling bags, small baskets, table
  // mats, hats, bottle holders). Hand-made silver jewellery is corroborated
  // by two independent artisan profiles: my-gambia.com on brothers Mamat
  // Ndure and Njaga Njie's family workshop in Serekunda (~30 years running,
  // learned from their grandfather, bangles/bracelets/chains/rings), and
  // footstepsinthegambia.com on master silversmith Bai Sering Secka of
  // Gunjur (necklaces, bracelets, rings, still using goat-skin bellows,
  // teaching his own children). Hand-carved wood items are corroborated by
  // accessgambia.com (masks, mortars and pestles, combs, djembe drums,
  // bowls, rooted in Mandinka/Fulani/Bambara tradition) and
  // footstepsinthegambia.com's profile of carver Malang Manneh of Gunjur
  // (tool handles, wildlife figures, trained by his father, a "master
  // carver"). No shell/ivory/coral/bone material, no weapons, no
  // raw-material-only entries. Pre-existing 'Serekunda batik textiles' kept
  // unchanged, not re-verified this run.
  GM: ['Serekunda batik textiles', 'Hand-thrown pottery (Brikama & Basse)', 'Palm-leaf basketware', 'Hand-made silver jewellery (Serekunda & Gunjur)', 'Hand-carved wood items (Gunjur)'],
  ML: ['Mudcloth (bogolan)', 'Instruments'],
  BF: ['Bronze casting', 'Woven cotton'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Guinea had only 1 item
  // (backlog item 25's content-depth floor list). Two product-level
  // additions, each corroborated across at least two independent sources,
  // none invented, no PGI name used loosely (this is the genuine, correctly
  // named product from its own protected region, not a borrowed term):
  // Leppi indigo-dyed cotton cloth is a real, hand-woven-then-indigo-dyed
  // textile from the Fouta-Djallon region, made by Peul artisans -- cotton
  // hand-woven on traditional looms, dyed with fermented indigofera-leaf
  // paste (brown tones from n'galama tree bark), worn at weddings and
  // religious ceremonies. It received an official Indication Geographique
  // Protegee (Protected Geographic Indication) from OAPI (African
  // Intellectual Property Organization) in March 2025 -- reported
  // independently by Pulse Cote d'Ivoire and corroborated by guzangs.com's
  // "Guinea: A Textile Civilization in Four Systems" (which separately names
  // it "Leppi (Moyenne-Guinee/Fouta-Djalon)", handwoven on narrow-strip
  // looms). Hand tie-dyed cotton textiles from Kindia are a distinct,
  // still-active craft: guzangs.com and africanvibes.com both independently
  // profile the Association of Women Tie-Dyers of Kindia (co-founded by
  // designer Mariama Camara and her sister Aissata M.B. Camara), whose work
  // was the subject of a documented 2008-2013 collaboration with Tory Burch
  // and the There Is No Limit Foundation reaching over 300 women tie-dyers
  // and retailers including Bloomingdale's and Galeries Lafayette Paris.
  // No shell/ivory/coral/bone material, no weapons, no raw-material-only
  // entries. Djembe drums (pre-existing) kept unchanged, not re-verified
  // this run.
  GN: ['Djembe drums', 'Leppi indigo-dyed cotton cloth (Fouta Djallon)', 'Hand tie-dyed cotton textiles (Kindia)'],
  // Expanded by the standing SEO agent, 2026-07-15 -- Sierra Leone, next on
  // backlog item 25's floor-of-1 priority list after Guinea. Four new
  // product-level items, each corroborated across at least two independent,
  // Sierra-Leone-specific sources; kept the existing Gara tie-dye textiles
  // entry unchanged (not re-verified or renamed this run). Hand-woven
  // country cloth (Kondi gula in Mende, sold locally as "Kontri Kloth") --
  // sierraleoneheritage.org (National Museum, describing the tripod-loom
  // strip-weaving technique) corroborated as still actively made today by
  // jillinsierraleone.blog's first-hand profile of weaver Bangalie of
  // Kabala and by the Sweet Salone/Aurora Foundation artisan directory's
  // profile of Mariatu of Grafton, who sells it in Freetown's Big Market;
  // independently confirmed as a currently-sold product by a TripAdvisor
  // review of the Tambakula Arts and Crafts Center cooperative in Freetown.
  // Hand-carved wood masks & figures -- visitsierraleone.org's profile of
  // carver Mohamed Kargbo at the Aberdeen Arts & Craft Center (tribal
  // masques, statues, chairs) corroborated by Wikipedia's "Art in Sierra
  // Leone" (wood carving "remains prominent" today, with distinct Mende/
  // Vai/Bullom vs. Temne/Limba/Loko regional styles) and by the same
  // Tambakula TripAdvisor review (wooden carvings, statues, masks). Hand-
  // woven baskets (Brama Town) -- the Sweet Salone/Aurora Foundation
  // artisan directory profiles a community of roughly 30 basket weavers in
  // Brama Town, corroborated independently by the Tambakula TripAdvisor
  // review listing woven bags among its cooperative's goods. Contemporary
  // studio pottery (Waterloo) -- the Lettie Stuart Pottery Centre (SLADEA/
  // Aurora Foundation) is independently corroborated by insightmag.news
  // (international export orders to Iceland and Los Angeles) and by a
  // first-hand visitor review at minabilkis.com describing an actively
  // operating pottery school and studio. No shell/ivory/coral/bone
  // material, no weapons, no raw-material-only entries, no PGI used
  // loosely.
  SL: ['Gara tie-dye textiles', 'Hand-woven country cloth (Kondi gula)', 'Hand-carved wood masks & figures', 'Hand-woven baskets (Brama Town)', 'Contemporary studio pottery (Waterloo)'],
  TG: ['Kente cloth', 'Batik textiles'],
  CV: ['Grogue sugarcane spirit', 'Handwoven baskets'],
  ZA: ['Zulu baskets', 'Rooibos tea', 'Beadwork'],
  ZW: ['Shona stone sculpture', 'Baskets'],
  ZM: ['Emerald jewellery', 'Tonga baskets'],
  // Expanded by the standing SEO agent, 2026-07-15 (backlog item 25, next
  // country on the floor-of-1 priority list after Sierra Leone). Kept the
  // existing 'Woven baskets' entry untouched (not re-verified or renamed
  // this run). Added two new product-level items, each corroborated across
  // at least two independent sources: Hand-thrown pottery (Thamaga & Gabane)
  // -- sokarilondon.co.uk names Thamaga, Gabane, Molepolole and Gaborone as
  // the country's pottery centres, kaolin-clay, oxide-painted, "old
  // knowledge in new hands"; independently corroborated by a Nircle feature
  // on Thamaga Pottery specifically (founded 1985, staffed by local women
  // "trained from scratch," a nationally recognised working studio with an
  // on-site shop, still operating today) and by botswana.co.za's country
  // guide naming Thamaga/Molepolole/Kanye/Gaborone as active commercial
  // pottery centres today. Hand-tanned leather goods (San & Tswana
  // leatherwork) -- botswanacraft.com's San Crafts page describes San
  // artisans making carrying bags, dancing skirts and loin aprons for sale
  // today ("increased production and sale... provides a crucial source of
  // cash income"); independently corroborated by Brighton & Hove Museums'
  // "Making Botswana: Leatherwork" (a living craft, named contemporary
  // leathersmith Edwin Keipedile, an annual leatherwork exhibition at the
  // National Museum of Botswana) and by botswana.co.za confirming Bushman
  // leather goods are sold at cooperative outlets countrywide. Deliberately
  // NOT added, researched and rejected: San ostrich-eggshell bead jewellery
  // -- well-corroborated as a real, currently-sold craft (botswanacraft.com,
  // botswana.co.za, womensworkbw.com) but excluded under this file's own
  // header rule against shell as a restricted material, applying the exact
  // same literal-reading precedent this file already used to exclude
  // Maldivian coconut-shell items even though that shell was botanical, not
  // animal (see the Maldives entry's own comment) -- staying unambiguous
  // with the rule as written rather than deciding eggshell is an exception.
  // Also not added: San hunting equipment (bows, spears, "love bows") and
  // quiver bags -- weapons/weapon-adjacent, excluded per this file's
  // no-weapons rule, the same call already applied to Kazakhstan's kamcha
  // and Benin's récade. No ivory/coral/bone material in either item added.
  BW: ['Woven baskets', 'Hand-thrown pottery (Thamaga & Gabane)', 'Hand-tanned leather goods (San & Tswana leatherwork)'],
  NA: ['Karakul wool weaving'],
  LS: ['Basotho blankets', 'Mokorotlo woven hats'],
  SZ: ['Ngwenya recycled glassware', 'Sisal woven baskets'],
  MW: ['Dedza pottery', 'Chitenje wax-print textiles', 'Carved wood figures'],
  MZ: ['Cashew & pantry', 'Capulana cloth'],
  MG: ['Vanilla', 'Raffia work'],
  MU: ['Vanilla tea', 'Model ships'],
  SC: ['Vanilla', 'Coco-de-mer motifs'],
  KM: ['Ylang-ylang perfume oil', 'Vanilla'],
  CM: ['Coffee', 'Beadwork'],
  CD: ['Coffee', 'Raffia textiles'],
  GA: ['Mbigou stone carvings'],
  SD: ['Hibiscus & spices'],
  MR: ['Tuareg silver jewellery', 'Malahfa embroidered textiles'],
  DZ: ['Berber rugs', 'Dates'],
  LY: ['Dates', 'Copperware'],
  AO: ['Chokwe wood-carved masks', 'Carved stools & thrones', 'Sisal basketry', 'Clay pottery'],
  BI: ['Coiled basketry', 'Twa pottery', 'Wood carvings'],
  LR: ['Ceremonial wood masks', 'Figurative wood carvings', 'Patchwork quilts'],
  TD: ['Leather goods', 'Tuareg silver jewellery', 'Hand-dyed textiles', 'Wood carvings'],
  CF: ['Woven baskets', 'Wood carvings'],
  CG: ['Wood carvings', 'Raffia textiles', 'Poto-Poto paintings'],
  GW: ['Cashew nuts', 'Bijagós wood carvings'],
  NE: ['Tuareg silver jewellery', 'Tuareg leather goods'],
  SS: ['Beaded jewellery', 'Woven baskets'],
  GQ: ['Fang wood masks', 'Woven raffia baskets', 'Beaded jewellery'],
  ER: ['Jebena coffee pots', 'Woven baskets', 'Filigree silver jewellery'],
  SO: ['Woven sisal baskets', 'Frankincense'],
  // Added by the standing SEO agent, 2026-07-14 -- previously researched and
  // deliberately skipped in 3+ prior runs (only a single, non-authoritative
  // basket-weaving source found each time). This run found a second,
  // independent, higher-authority source corroborating woven grass/palm
  // baskets: blogs.worldbank.org's "Women in Djibouti make money weaving
  // grass and pearls into baskets, belts" (a World Bank livelihoods
  // programme article naming baskets and belts specifically), plus
  // harbingerstandard.com's "Handmade Crafts Anchor Djibouti's Cultural
  // Heritage" (independently describing "tightly coiled palm-fiber" basket
  // construction). Two independent sources meets the bar this file's own
  // header sets that prior runs' single-source finds did not. Deliberately
  // excluded the embroidered "Gadha" shawl and pottery mentioned only in the
  // Harbinger Standard article -- single-sourced, not carried forward this
  // run per the same no-stretch-to-fill-a-quota rule applied to Andorra/
  // Monaco below. No shell/ivory/coral/bone material involved in either
  // product per both sources.
  DJ: ['Woven grass baskets', 'Woven palm-fiber belts'],
  // Europe
  IT: ['Leather bags', 'Murano glass', 'Olive oil', 'Tailoring', 'Hand-painted ceramics', 'Espresso ware', 'Venetian masks', 'Silk ties', 'Marble boards', 'Stationery', 'Gold jewellery', 'Pantry & preserves'],
  FR: ['Perfume', 'Copper cookware', 'Linen', 'Preserves', 'Marseille soap', 'Lavender oils', 'Table linen', 'Ceramics', 'Berets', 'Mustards & pantry', 'Candles', 'Basque linens'],
  ES: ['Espadrilles', 'Olive oil', 'Ceramics', 'Saffron', 'Hand fans', 'Damascene jewellery', 'Paella pans', 'Turrón & pantry', 'Leather bags', 'Guitars', 'Azulejos'],
  PT: ['Cork goods', 'Azulejo tiles', 'Filigree jewellery', 'Sardine pantry', 'Barcelos roosters', 'Madeira embroidery', 'Ceramic swallows', 'Woollen blankets', 'Soap & fragrance'],
  GR: ['Olive oil', 'Honey', 'Ceramics', 'Komboloi beads', 'Icon art', 'Leather sandals', 'Herbs & oregano', 'Backgammon (tavli)', 'Cheese pantry'],
  GB: ['Tailoring', 'Wool knitwear', 'Marmalade & preserves', 'Teapots & tea ware', 'Brogues', 'Flat caps', 'Wax jackets', 'Stationery', 'Grooming goods', 'Cheese pantry'],
  IE: ['Aran knitwear', 'Irish linen', 'Celtic jewellery'],
  DE: ['Kitchen knives', 'Optics', 'Christmas ornaments', 'Cuckoo clocks', 'Beer steins', 'Nutcrackers', 'Enamel cookware', 'Leather goods', 'Precision tools', 'Teddy bears'],
  CH: ['Watches', 'Chocolate'],
  AT: ['Crystal glassware', 'Loden wool'],
  LI: ['Collectible postage stamps'],
  NL: ['Delftware pottery', 'Cheese'],
  BE: ['Chocolate', 'Lace'],
  LU: ['Péckvillercher clay bird whistles'],
  SE: ['Glassware', 'Dala horses', 'Outdoor knives'],
  FI: ['Puukko knives', 'Design glassware'],
  DK: ['Design furniture', 'Ceramics'],
  NO: ['Norwegian knitwear'],
  IS: ['Lopapeysa knitwear', 'Flaky sea salt'],
  PL: ['Amber jewellery', 'Bolesławiec pottery'],
  CZ: ['Bohemian crystal', 'Marionettes'],
  SK: ['Wire art', 'Sheep cheese pantry'],
  HU: ['Embroidered linens', 'Paprika', 'Porcelain'],
  RO: ['Painted ceramics', 'Wool rugs'],
  BG: ['Rose oil', 'Ceramics'],
  RS: ['Wool knits', 'Preserves'],
  HR: ['Lavender & oils', 'Cravats'],
  SI: ['Beehive art', 'Salt pans'],
  UA: ['Vyshyvanka embroidery', 'Ceramics'],
  BY: ['Linen goods'],
  RU: ['Matryoshka dolls', 'Khokhloma ware'],
  LT: ['Amber jewellery', 'Linen'],
  LV: ['Amber jewellery', 'Wool mittens'],
  EE: ['Knitwear', 'Juniper ware'],
  MT: ['Filigree jewellery', 'Blown glass'],
  SM: ['Collectible stamps & coins', 'Torta Tre Monti wafer cake'],
  VA: ['Vatican postage stamps', 'Vatican commemorative coins'],
  // Added by the standing SEO agent, 2026-07-15 -- Monaco was the last of
  // the original 190 WORLD_COUNTRIES entries with no CULTURE_HINTS entry at
  // all (backlog item 22). Every prior run's attempt (English-language
  // "artisanat monégalois"/generic searches) turned up only souvenir
  // listicles and the Fragonard perfumery, which fact-checking found is
  // actually in Eze/Grasse, France, not Monaco -- correctly never added.
  // This run tried a different angle: following this file's own
  // already-established precedent for other small European states with a
  // philatelic/numismatic tradition (LI's 'Collectible postage stamps', SM's
  // 'Collectible stamps & coins', VA's 'Vatican postage stamps'/'Vatican
  // commemorative coins' immediately above) and searching for Monaco's
  // equivalent directly. Found strong, multi-source corroboration: Monaco
  // has its own dedicated Wikipedia article ("Postage stamps and postal
  // history of Monaco") and a government-recognised "Musée des Timbres et
  // des Monnaies" (Museum of Stamps and Coins) with its own English
  // Wikipedia page, an official government tourism listing
  // (visitmonaco.com), the official Monaco culture-ministry site
  // (culture.mc), and independent local press (Monaco Tribune, Monaco Life)
  // covering new stamp issues as ongoing news -- i.e. still actively
  // produced today, the same "actively issued" bar this file used for
  // Liechtenstein, not a defunct historical curiosity. Second, separate
  // product found: hand-made leather goods from Atelier Grinda ("Grinda
  // Monaco"), a real Monaco-based leather workshop -- independently
  // corroborated by Monaco Tribune (a genuine local news outlet, not a
  // marketing blog) reporting Prince Albert II personally received an
  // Atelier Grinda briefcase for his 20th reign anniversary, plus the
  // workshop's own active Etsy/Facebook/LinkedIn presence. Named as generic
  // product categories, not brand names, matching this file's existing
  // convention (e.g. CH's 'Chocolate', not a named chocolatier). No
  // shell/ivory/coral/bone material in either product. This brings
  // CULTURE_HINTS coverage to 190/190 (100%) of real WORLD_COUNTRIES
  // entries -- the separate orphaned CI (Cote d'Ivoire) key noted elsewhere
  // in this file is unaffected and still not a WORLD_COUNTRIES match
  // (backlog item 23, a different, still-open question).
  MC: ['Collectible postage stamps & coins', 'Hand-made leather goods'],
  // Added by the standing SEO agent, 2026-07-14 -- Andorra was one of the
  // two remaining CULTURE_HINTS holdouts (backlog item 22; the other,
  // Monaco, was still unresolved as of this 2026-07-14 entry -- see the
  // 2026-07-15 comment on the MC entry above for how it was later resolved
  // -- this 2026-07-14 run re-searched it too and again
  // found only generic souvenir listicles and the Fragonard perfumery,
  // which is actually in Eze/Grasse, France, not Monaco itself, so nothing
  // new to add there). Prior Andorra attempts were rejected for being a
  // single non-authoritative source (a suspected AI-content-farm domain) or
  // generic wood-flooring product results. This run found two distinct,
  // multi-source-verifiable Andorran producers: FORA Gin, described by
  // Andorra's own Ordino parish tourism site (visitordino.com) and by
  // Andorran news outlet alto.ad as a real working distillery in Ordino,
  // and independently covered by UK packaging trade press (Label and
  // Narrow Web, Packaging News) as "FORA gin captures the spirit of
  // Andorra" -- three independent sources, not one. Xocland, an Andorran
  // chocolate maker, is listed directly on the official government
  // tourism site (visitandorra.com/es/compras/xocland) and independently
  // covered by multiple Andorran travel/lifestyle sites describing an
  // established "Ruta del Chocolate" (chocolate route) built around it
  // (esquiades.com, principado-de-andorra.com, hoyandorra.com,
  // hoteldeltarter.com). Named generically ("Craft gin", "Artisan
  // chocolate"), matching this file's existing convention of product
  // categories rather than brand names (e.g. CH's 'Chocolate', not a
  // specific Swiss chocolatier). Deliberately did NOT add Vital's
  // shepherd's wool cushions, Casa Raubert's sheep's-milk cheese, or
  // Ratafia liqueur, all found on the same official visitandorra.com local-
  // products page -- cushions and cheese are single-sourced (only that one
  // page), and Ratafia is a Catalan-region product with its own protected
  // geographical indication (IGP Ratafia catalana), so labelling it as
  // distinctly Andorran would risk this file's own "no protected
  // geographical indications used loosely" rule. No shell/ivory/coral/bone
  // material in either product added.
  AD: ['Craft gin', 'Artisan chocolate'],
  CY: ['Halloumi pantry', 'Lace'],
  AL: ['Filigree', 'Wool rugs'],
  MK: ['Filigree jewellery'],
  BA: ['Copper coffee sets'],
  ME: ['Olive oil'],
  MD: ['Ceramics', 'Preserves'],
  // The Americas
  MX: ['Talavera pottery', 'Barro negro', 'Embroidered huipiles', 'Copper pans', 'Alebrijes', 'Molcajetes', 'Silver earrings', 'Otomi textiles', 'Day of the Dead art', 'Hammocks', 'Sarapes', 'Palm weaving'],
  GT: ['Woven huipiles', 'Jade jewellery', 'Coffee'],
  PE: ['Alpaca knitwear', 'Silver jewellery', 'Andean textiles', 'Chullo hats', 'Retablos', 'Chulucanas ceramics', 'Pima cotton', 'Woven belts', 'Gourd carvings', 'Cacao & chocolate', 'Filigree jewellery'],
  BO: ['Alpaca throws', 'Aguayo weavings'],
  EC: ['Panama hats', 'Single-origin cacao'],
  CO: ['Coffee', 'Mochila bags', 'Emerald jewellery'],
  BR: ['Coffee', 'Gemstone jewellery', 'Hammocks'],
  AR: ['Leather goods', 'Mate gourds', 'Ponchos'],
  CL: ['Copper homeware', 'Lapis lazuli jewellery'],
  UY: ['Wool throws', 'Mate ware'],
  PY: ['Ñandutí lace'],
  VE: ['Single-origin cacao'],
  GY: ['Tibiseri straw baskets'],
  SR: ['Hand-woven hammocks', 'Amerindian woven baskets', 'Javanese batik textiles'],
  BS: ['Androsia hand-batiked textiles', 'Straw-woven goods'],
  CU: ['Guayabera shirts', 'Coffee'],
  DO: ['Larimar jewellery', 'Cacao'],
  GD: ['Nutmeg & spice pantry', 'Cacao & chocolate'],
  LC: ['Coal pot clay cookware', 'Woven straw baskets'],
  DM: ['Kalinago larouma-reed baskets', 'Carved calabash art'],
  KN: ['Caribelle batik textiles'],
  // Added by the standing SEO agent, 2026-07-14 -- previously researched and
  // deliberately skipped (2026-07-14 08:xx UTC run: the only lead found then,
  // Betty's Hope, is a historic plantation site, not a craft product). This
  // run found a genuinely new, product-level, two-source-corroborated
  // angle: visitantiguabarbuda.com (the official tourism board's own site,
  // "Arts, Crafts & Cuisine: A Taste of Authentic Antiguan & Barbudan Life")
  // names handwoven baskets/straw creations, pottery, and Barbuda sea-glass
  // jewellery-making; discoverantiguabarbuda.com's "Made in Antigua and
  // Barbuda" independently corroborates handwoven baskets and separately
  // names "handwoven Sea Island cotton products" (Sea Island cotton is a
  // real historic Antiguan crop/textile tradition, not a brand) and guava
  // cheese (a traditional preserve, also named on the tourism-board page).
  // Deliberately excluded from this entry: rum brand names (Cavalier,
  // English Harbour) and gallery-sold paintings/ceramics generally, both
  // too generic or too brand-specific to be a culture-first product hint
  // per this file's own header rule. Sea-glass is glass, not a restricted
  // shell/coral/ivory/bone material.
  AG: ['Handwoven straw baskets', 'Sea Island cotton textiles', 'Sea-glass jewellery', 'Guava cheese preserves'],
  VC: ['Woven baskets & mats', 'Wood carvings', 'Handcrafted jewellery'],
  HT: ['Steel-drum art', 'Vetiver oil'],
  JM: ['Blue Mountain coffee', 'Spices'],
  TT: ['Steelpan instruments', 'Cacao'],
  BB: ['Chalky Mount pottery', 'Rum cakes', 'Mahogany carvings'],
  CA: ['Maple syrup', 'Wool blankets'],
  US: ['Workwear denim', 'Craft leather', 'Hot sauce'],
  CR: ['Coffee', 'Oxcart-painted ware'],
  PA: ['Mola textiles', 'Geisha coffee'],
  NI: ['Coffee', 'Hammocks'],
  HN: ['Coffee', 'Lenca pottery'],
  SV: ['Coffee', 'Indigo textiles'],
  BZ: ['Cacao', 'Hot sauce'],
  // Oceania
  AU: ['Merino wool', 'Eucalyptus honey', 'Indigenous art'],
  NZ: ['Mānuka honey', 'Merino knitwear', 'Wood carving'],
  FJ: ['Masi bark cloth', 'Coconut skincare'],
  WS: ['Siapo cloth', 'Coconut oil'],
  TO: ['Ngatu bark cloth'],
  KI: ['Pandanus-leaf woven mats'],
  TV: ['Pandanus & coconut-leaf weaving', 'Kolose crochet'],
  PG: ['Bilum bags', 'Coffee'],
  SB: ['Wood carving'],
  VU: ['Wood carving'],
}

export function cultureHints(code: string): string[] {
  return CULTURE_HINTS[code] ?? []
}
