// Per-country Pexels imagery, recovered from the mobile app's approved
// dataset (mobile/src/data/imagery.ts, "Generated from the approved Atlas
// mockup"). Restored from git history 2026-07-16 after an automated commit
// accidentally deleted the mobile/ app; reused here so /founding country
// cards and /origins/[slug] country pages have real photography instead of
// standing empty pre-launch.
//
// Each entry is {n: product name, i: Pexels photo ID, s: Pexels URL slug or
// null}. All 190 site countries now have at least one image (10 were
// missing entirely until 2026-07-16 and were researched fresh -- see
// below). Never fabricated: every ID was confirmed to be a real, live
// Pexels photo before being added.
//
// 2026-07-16 dedup pass: the recovered mobile dataset had assigned the same
// generic stock photo to multiple countries in several places (a Congo /
// Congo (DRC) pair shared an identical 3-photo set outright; several other
// pairs/groups shared one duplicated "first" photo -- the one shown on
// /founding's country cards). Where a country already had a distinct,
// verified alternative elsewhere in its own list, it was reordered to the
// front instead of researching something new. Where no alternative existed
// (Congo, Congo (DRC), and 10 countries with zero images at all -- mostly
// small Caribbean/Pacific nations plus Turkmenistan), fresh photos were
// researched and verified against the live Pexels page for each one before
// being added; a few culturally-close regional/technique equivalents were
// used where no country-specific photo exists on Pexels (e.g. Indonesian
// batik-making for Caribbean batik crafts) rather than leaving a gap or
// forcing an unrelated photo -- these are still real, honestly-labelled
// photos of the actual craft/product named, not stand-ins for something
// else. This pass only covers duplicates visible on /founding's cards and
// the previously-empty countries; the recovered dataset likely still
// reuses some generic stock photos as a 2nd/3rd gallery image elsewhere
// (e.g. a shared "coconut craft" photo across several Pacific/Indian Ocean
// countries) -- a further pass would be needed to chase those down too.
//
// 2026-07-16 broken-link pass: after the dedup pass shipped, all 1,021
// unique photo IDs in this file were load-tested directly against the live
// Pexels CDN (not just the Pexels photo page, which can still resolve even
// when the CDN asset itself 404s). Two were dead: Ethiopia's "The coffee
// ceremony" (old ID 30937097) and Italy's "Florence belts" (old ID
// 31367060) -- both replaced with freshly verified, currently-loading
// Pexels photos of the same subject (38519856 and 31367059 respectively).
// Neither replacement ID appears anywhere else in this file.
//
// URL construction matches the existing pattern already used on the
// homepage (app/page.tsx's `px` helper): Pexels serves the same photo at a
// stable ID-based URL whether or not the SEO slug is included.

import { WORLD_COUNTRIES } from './worldCountries'
import { CULTURE_HINTS } from './cultureHints'

export type CountryImage = { name: string; id: number; slug: string | null; url: string }

const RAW: Record<string, { n: string; i: number; s: string | null }[]> = {
  // Asia
  CN: [{n:'Porcelain tea sets',i:36253267,s:'free-photo-of-elegant-tea-set-on-traditional-chinese-table'}, {n:'Blue-and-white vases',i:33393570,s:null}, {n:'Woks',i:175754,s:null}, {n:'Bamboo steamers',i:37137709,s:null}, {n:'Jade & stone',i:10961447,s:null}, {n:'Gongfu tea ware',i:30767475,s:'free-photo-of-red-chinese-teapot-set-on-dark-wooden-table'}, {n:'Paper lanterns',i:2161693,s:null}, {n:'Workshop ironwork',i:34116083,s:null}, {n:'Red paper craft',i:20541865,s:null}, {n:'New year lanterns',i:30569671,s:null}, {n:'Lantern festival',i:30704392,s:null}, {n:'Yixing clay teapots',i:27693849,s:null}, {n:'Calligraphy & ink brushes',i:35646157,s:null}, {n:'Silk robes & qipao',i:17038246,s:null}, {n:'Cloisonné ware',i:11098799,s:null}, {n:'Hand fans',i:34780394,s:null}],
  JP: [{n:'Tea bowls',i:14705063,s:null}, {n:'Sake sets',i:18198515,s:null}, {n:'Kimono',i:8750728,s:null}, {n:'Hand-forged knives',i:23436813,s:'free-photo-of-man-holding-a-japanese-knife'}, {n:'Cast-iron teapots',i:14563207,s:null}, {n:'Ramen bowls',i:31418932,s:null}, {n:'Pearls',i:7514818,s:null}, {n:'Matcha',i:8330375,s:null}, {n:'Kyoto joinery',i:18848781,s:null}, {n:'Japanese hand planes',i:30907889,s:null}, {n:'Anvil work',i:31004832,s:null}, {n:'Hand-forged blades',i:27084601,s:null}, {n:'Lens grinding',i:5715881,s:null}, {n:'Circuit assembly',i:37426135,s:null}, {n:'Incense',i:31793459,s:null}, {n:'Kokeshi dolls',i:31268099,s:null}, {n:'Furoshiki wraps',i:6305599,s:null}, {n:'Tenugui towels',i:35418477,s:null}, {n:'Kintsugi repair kits',i:38045469,s:null}],
  KR: [{n:'Kimchi',i:6823262,s:null}, {n:'K-beauty',i:34833637,s:null}, {n:'Fermented onggi',i:37427960,s:null}, {n:'Bojagi wrapping cloth',i:10768368,s:null}, {n:'Hanji paper goods',i:13440299,s:null}, {n:'Hanbok accessories',i:31743254,s:null}],
  IN: [{n:'Terracotta',i:9412408,s:null}, {n:'Block printing',i:37619027,s:'free-photo-of-hand-block-printing-on-yellow-fabric'}, {n:'Silk saris',i:23964630,s:null}, {n:'Clay chai cups',i:10377676,s:null}, {n:'Kundan sets',i:33154729,s:null}, {n:'Jhumka earrings',i:37601639,s:null}, {n:'Bridal mehndi',i:38230058,s:null}, {n:'Spice markets',i:17870116,s:null}, {n:'Masala chai',i:34324342,s:null}, {n:'Temple incense',i:20599556,s:null}, {n:'Village forge iron',i:34495354,s:null}, {n:'Hammered brass bowl',i:19408700,s:null}, {n:'Dried chilli market',i:30387987,s:null}, {n:'Instrument workshop',i:31508160,s:null}, {n:'Wedding henna',i:32315685,s:null}, {n:'Marble inlay (pietra dura)',i:12412163,s:null}, {n:'Jaipur blue pottery',i:18977427,s:null}, {n:'Brass & bell-metal homeware',i:25945094,s:null}, {n:'Ayurvedic skincare',i:7148531,s:null}, {n:'Bangles & bindis',i:28351286,s:null}, {n:'Kashmiri pashmina shawls',i:37921733,s:null}],
  TH: [{n:'Thai silk',i:37179770,s:null}, {n:'Granite mortars',i:8559685,s:null}, {n:'Thai gold',i:16853521,s:null}, {n:'Rice terraces',i:36388173,s:null}, {n:'Curry pastes',i:15797950,s:null}, {n:'Carved soap flowers',i:479735,s:null}, {n:'Spa & aromatherapy',i:458541,s:null}, {n:'Celadon ceramics',i:6688841,s:null}, {n:'Rattan & wicker bags',i:36006474,s:null}, {n:'Khon masks',i:236503,s:null}],
  VN: [{n:'Pottery villages',i:31365719,s:null}, {n:'Phin coffee',i:14226658,s:null}, {n:'Rice-paper craft',i:8280898,s:null}, {n:'Bat Trang ceramics',i:32560495,s:null}, {n:'Conical hats (non la)',i:35263326,s:null}, {n:'Ao dai silk',i:36656437,s:null}, {n:'Lacquerware',i:36351734,s:null}, {n:'Silk lanterns',i:33936311,s:null}, {n:'Bamboo & rattan homeware',i:27951089,s:null}, {n:'Robusta coffee & phin filters',i:31273656,s:null}, {n:'Embroidered art',i:36630562,s:null}],
  ID: [{n:'Batik',i:34465333,s:'free-photo-of-intricate-batik-cloth-with-traditional-patterns'}, {n:'Cacao',i:6420910,s:null}, {n:'Rattan light',i:31875658,s:null}, {n:'Javanese teak carving',i:34167389,s:null}, {n:'Bali woodcraft',i:13268976,s:null}, {n:'Ikat weaving',i:34343822,s:null}, {n:'Woven baskets',i:35824333,s:null}, {n:'Songket brocade',i:37875895,s:null}, {n:'Wayang puppets',i:36660925,s:null}, {n:'Kopi luwak & coffee',i:2711959,s:null}],
  MY: [{n:'Wau kite craft',i:38228345,s:null}, {n:'Congkak boards',i:17683771,s:null}, {n:'Rattan & mengkuang weaving',i:32338533,s:null}, {n:'Pewter ware',i:14724142,s:null}, {n:'Batik textiles',i:30247248,s:null}, {n:'White coffee',i:19569364,s:null}, {n:'Songket brocade',i:35336191,s:null}, {n:'Wood carving',i:26805221,s:null}],
  PH: [{n:'Rattan & wicker furniture',i:26793170,s:null}, {n:'Woven baskets',i:20383034,s:null}, {n:'Wood carving',i:36076202,s:null}, {n:'Capiz-shell craft',i:38241595,s:null}, {n:'Pearl jewellery',i:9428788,s:null}, {n:'Barako coffee',i:14346278,s:null}, {n:'Banig mats',i:33298391,s:null}],
  KH: [{n:'Palm-sugar pantry',i:6984066,s:null}, {n:'Silver betel boxes',i:36355530,s:null}, {n:'Woven baskets',i:26796680,s:null}, {n:'Krama scarves',i:31716139,s:null}, {n:'Silverware',i:17789579,s:null}, {n:'Kbach carving',i:36821971,s:null}],
  LA: [{n:'Silverware',i:10333227,s:null}, {n:'Rattan & bamboo craft',i:26754375,s:null}, {n:'Bamboo & rattan',i:33871414,s:null}, {n:'Natural-dye textiles',i:6850851,s:null}, {n:'Handwoven silk (sinh)',i:6876944,s:null}, {n:'Bolaven mountain coffee',i:26974536,s:null}, {n:'Hill-tribe silver',i:14764014,s:null}],
  MM: [{n:'Kalaga tapestry',i:36874770,s:null}, {n:'Thanaka skincare',i:5598845,s:null}, {n:'Lacquerware',i:36351734,s:null}, {n:'Marionette puppets',i:17246961,s:null}, {n:'Longyi & Chin textiles',i:9256359,s:null}, {n:'Parasols',i:13577164,s:null}, {n:'Jade jewellery',i:34675316,s:null}, {n:'Silver ware',i:37769141,s:null}],
  BD: [{n:'Jamdani muslin',i:26596499,s:null}, {n:'Jute homeware & bags',i:27007160,s:null}, {n:'Terracotta pottery',i:12903438,s:null}, {n:'Silk (Rajshahi)',i:34692229,s:null}, {n:'Nakshi kantha quilts',i:38155158,s:null}, {n:'Shital-pati mats',i:20010208,s:null}, {n:'Rickshaw art',i:37529633,s:null}],
  LK: [{n:'Ceylon tea',i:30204867,s:null}, {n:'Wood masks',i:24974609,s:null}, {n:'Cinnamon & spice blends',i:27626862,s:null}, {n:'Coir & coconut craft',i:28446689,s:null}, {n:'Brass ware',i:36873193,s:null}, {n:'Blue sapphires & gems',i:37702995,s:null}, {n:'Handloom cotton',i:23964627,s:null}],
  NP: [{n:'Handmade paper',i:10373241,s:null}, {n:'Singing bowls',i:6831008,s:null}, {n:'Felt wool crafts',i:35698172,s:null}, {n:'Khukuri knives',i:24561132,s:null}, {n:'Lokta paper goods',i:36918611,s:null}, {n:'Prayer flags & beads',i:6623741,s:null}, {n:'Pashmina shawls',i:14435870,s:null}, {n:'Copper & brass ware',i:36662598,s:null}, {n:'Gemstone jewellery',i:5409535,s:null}, {n:'Thangka painting',i:37584993,s:null}, {n:'Dhaka textiles',i:14106294,s:null}],
  PK: [{n:'Salt lamps',i:31349632,s:null}, {n:'Leather goods',i:22434771,s:null}, {n:'Himalayan salt lamps',i:20572747,s:null}, {n:'Onyx & marble ware',i:19825031,s:null}, {n:'Embroidered textiles (phulkari)',i:32822921,s:null}, {n:'Blue pottery (Multan)',i:36599091,s:null}, {n:'Peshawari sandals',i:37507706,s:null}, {n:'Truck-art decor',i:35859201,s:null}, {n:'Ajrak block-print',i:5281463,s:null}],
  MN: [{n:'Silver ornaments',i:16010575,s:null}, {n:'Cashmere knitwear',i:19203177,s:null}, {n:'Deel robes',i:9466045,s:null}, {n:'Ger (yurt) textiles',i:4321588,s:null}],
  KZ: [{n:'Silver jewellery',i:36918694,s:null}, {n:'Dombra instruments',i:29430293,s:null}, {n:'Woven wall hangings (tuskiiz)',i:28213960,s:null}, {n:'Leather flasks',i:27551352,s:null}, {n:'Kumis ware',i:33878971,s:null}],
  KG: [{n:'Kalpak & felt hats',i:13864727,s:null}, {n:'Ala-kiyiz art',i:14917793,s:null}, {n:'Shyrdak felt rugs',i:34787523,s:null}],
  UZ: [{n:'Ikat',i:34191411,s:null}, {n:'Copper ware',i:35220214,s:null}, {n:'Suzani embroidery',i:29475576,s:null}, {n:'Rishton ceramics',i:16534567,s:null}, {n:'Chust knives',i:28010784,s:null}, {n:'Gold-thread (zardozi) embroidery',i:9850827,s:null}, {n:'Miniature painting',i:35087824,s:null}],
  TJ: [{n:'Pamiri wool socks',i:30105828,s:null}, {n:'Wood carving',i:9376010,s:null}],
  TM: [{n:'Hand-knotted Turkmen carpets',i:20702125,s:null}, {n:'Hand-knotted carpets (loom detail)',i:8375746,s:null}, {n:'Silver & carnelian jewellery',i:34645875,s:null}, {n:'Telpek wool hats',i:5129110,s:null}],
  AM: [{n:'Carpets & rugs',i:38375347,s:null}, {n:'Dried fruit & pantry',i:36870365,s:null}, {n:'Pomegranate-motif ceramics',i:33931725,s:null}, {n:'Obsidian & silver jewellery',i:38178510,s:null}, {n:'Khachkar stone motifs',i:31837414,s:null}],
  AZ: [{n:'Carpets & rugs',i:18443836,s:null}, {n:'Silk (kelaghayi) scarves',i:18087317,s:null}, {n:'Copper ware',i:29056089,s:null}, {n:'Sheki shebeke glass',i:33836010,s:null}, {n:'Tea sets & armudu glasses',i:28235815,s:null}, {n:'Pomegranate crafts',i:32961466,s:null}],
  GE: [{n:'Churchkhela & pantry',i:5273002,s:null}, {n:'Cloisonné (minankari) jewellery',i:10652684,s:null}, {n:'Qvevri wine & ware',i:5272997,s:null}, {n:'Wool carpets',i:35964344,s:null}, {n:'Enamel art',i:30359616,s:null}, {n:'Felt bags & hats',i:30529136,s:null}, {n:'Silverwork',i:33873052,s:null}],
  AF: [{n:'Kilim & war rugs',i:34874144,s:null}, {n:'Pomegranate & saffron',i:18875417,s:null}, {n:'Blue pottery (Istalif)',i:18258199,s:null}, {n:'Lapis lazuli jewellery',i:16512700,s:null}, {n:'Hand-knotted carpets',i:15042625,s:null}],
  IR: [{n:'Persian rugs',i:13796199,s:null}, {n:'Saffron',i:10487658,s:null}, {n:'Turquoise (Firoozeh) jewellery',i:4741611,s:null}, {n:'Copper & engraving (ghalamzani)',i:38508744,s:null}, {n:'Rosewater & pantry',i:5946986,s:null}, {n:'Pistachios',i:11886481,s:null}, {n:'Termeh brocade',i:35241901,s:null}, {n:'Khatam marquetry',i:11663268,s:null}, {n:'Ceramics & tilework',i:38508745,s:null}],
  IQ: [{n:'Dates & date syrup',i:25578490,s:null}, {n:'Brass trays',i:18710350,s:null}, {n:'Handwoven rugs',i:36819963,s:null}, {n:'Silver jewellery',i:24284277,s:null}],
  TR: [{n:'Iznik blues',i:27729719,s:'free-photo-of-a-room-with-many-blue-and-white-plates-on-display'}, {n:'Kilim rugs',i:33653647,s:'free-photo-of-colorful-traditional-turkish-kilim-pattern'}, {n:'Turkish towels',i:30982437,s:null}, {n:'Copper cezves',i:31330206,s:'free-photo-of-traditional-turkish-coffee-prepared-outdoors'}, {n:'Tulip tea glasses',i:16228379,s:null}, {n:'Evil-eye charms',i:36919208,s:null}, {n:'Turkish delight',i:36207188,s:null}, {n:'Hammam textiles',i:15528975,s:null}, {n:'Mosaic lamps',i:4553630,s:null}, {n:'Istanbul marble',i:12130992,s:null}, {n:'Grand Bazaar lamps',i:37497154,s:null}, {n:'Brass artistry',i:18711727,s:null}, {n:'Honey jars',i:4921856,s:null}, {n:'Tea by the glass',i:31564199,s:null}, {n:'Olive-oil soap',i:7500411,s:null}, {n:'Backgammon boards',i:32549758,s:null}, {n:'Ceramic bowls',i:6243343,s:null}],
  SY: [{n:'Damascus marquetry',i:38132596,s:null}, {n:'Aleppo inlay boxes',i:37178485,s:null}, {n:'Brass & copper ware',i:31854923,s:null}, {n:'Glass-blowing',i:38037226,s:null}, {n:'Rosewater & pantry',i:5946986,s:null}, {n:'Brocade (damask) textiles',i:10317127,s:null}, {n:'Mosaic boxes',i:32955592,s:null}],
  LB: [{n:"Preserves & pantry (za'atar)",i:34082316,s:null}, {n:'Rosewater & orange blossom',i:5946986,s:null}, {n:'Olive-oil soap',i:7175383,s:null}, {n:'Blown glass',i:38037226,s:null}, {n:'Ceramics',i:24390385,s:null}],
  IL: [{n:'Hamsa jewellery',i:6957317,s:null}, {n:'Dead Sea skincare',i:35776142,s:null}, {n:'Olive-wood carving',i:34129551,s:null}, {n:'Date honey (silan)',i:1152276,s:null}, {n:'Armenian-style ceramics',i:1194397,s:null}, {n:'Pomegranate motifs',i:4033473,s:null}],
  JO: [{n:'Dead Sea salts & mud',i:35776142,s:null}, {n:'Mosaic art',i:20859048,s:null}, {n:'Bedouin rugs',i:18717393,s:null}],
  SA: [{n:'Frankincense',i:17874845,s:null}, {n:'Attar perfume oils',i:21614757,s:null}, {n:'Sadu weaving',i:24415227,s:null}, {n:'Najdi door & wood craft',i:32220803,s:null}, {n:'Bisht cloaks',i:34171677,s:null}, {n:'Dates & date sweets',i:28613482,s:null}, {n:'Coffee (qahwa) ware',i:11695875,s:null}],
  AE: [{n:'Oud & attar',i:36389331,s:null}, {n:'Arabic coffee ware',i:38036782,s:null}, {n:'Dates & date sweets',i:4998697,s:null}, {n:'Sadu weaving',i:15332112,s:null}, {n:'Gold souk jewellery',i:19869442,s:null}],
  OM: [{n:'Perfume & attar oils',i:17155333,s:null}, {n:'Camel-wool textiles',i:35549770,s:null}, {n:'Silver khanjar & jewellery',i:36212595,s:null}, {n:'Rosewater (Jebel Akhdar)',i:5946986,s:null}, {n:'Halwa & pantry',i:26998025,s:null}, {n:'Bahla pottery',i:33079561,s:null}],
  YE: [{n:'Sidr honey',i:11771949,s:null}, {n:'Silver filigree jewellery',i:33873052,s:null}, {n:'Mocha coffee',i:8444426,s:null}],
  QA: [{n:'Arabic coffee ware',i:37061337,s:null}, {n:'Pearl jewellery',i:13204198,s:null}, {n:'Sadu weaving',i:7350185,s:null}, {n:'Dates & pantry',i:17877978,s:null}],
  KW: [{n:'Dhow-craft models',i:13408690,s:null}, {n:'Dates & sweets',i:37514842,s:null}, {n:'Perfume & oud oils',i:34051691,s:null}, {n:'Sadu Bedouin weaving',i:31853353,s:null}, {n:'Pearl jewellery',i:13204198,s:null}],
  BH: [{n:'Dates',i:17877978,s:null}, {n:'Natural pearl jewellery',i:9428788,s:null}, {n:'Gold craft',i:30560214,s:null}],
  TW: [{n:'Lacquer & woodcraft',i:5974367,s:null}, {n:'High-mountain oolong tea',i:6777367,s:null}, {n:'Gongfu tea ware',i:6545371,s:null}, {n:'Glove puppetry crafts',i:9114436,s:null}, {n:'Ceramics (Yingge)',i:12751403,s:null}, {n:'Pineapple & pastry pantry',i:37627763,s:null}, {n:'Bubble-tea culture',i:14267667,s:null}, {n:'Aboriginal weaving',i:7535414,s:null}],
  HK: [{n:'Neon-sign craft',i:33647477,s:null}, {n:'Milk-tea culture',i:27779483,s:null}, {n:'Dim sum steamers',i:28235503,s:null}],
  SG: [{n:'Tailoring',i:6764997,s:null}, {n:'Orchid & botanical scents',i:6427699,s:null}, {n:'Peranakan ceramics & tiles',i:32862829,s:null}, {n:'Batik & sarong craft',i:37854210,s:null}],
  MO: [{n:'Hand-painted azulejo motifs',i:34930570,s:null}, {n:'Jerky (bak kwa)',i:8250275,s:null}, {n:'Almond cookies',i:36086682,s:null}, {n:'Portuguese-style egg tarts',i:9633530,s:null}, {n:'Pastelaria pantry',i:31449850,s:null}],
  BN: [{n:'Woven baskets',i:29193598,s:null}, {n:'Woodcraft',i:15772950,s:null}, {n:'Songket brocade',i:35336191,s:null}, {n:'Silverwork & brass',i:33873052,s:null}],
  BT: [{n:'Handwoven textiles (kira)',i:36163753,s:null}, {n:'Silver jewellery',i:11385489,s:null}, {n:'Wood carving',i:37747847,s:null}, {n:'Thangka painting',i:11429488,s:null}],
  MV: [{n:'Lacquer boxes (liye laa jehun)',i:34217384,s:null}, {n:'Coir rope craft',i:33053216,s:null}, {n:'Woven mats (thundu kunaa)',i:30688221,s:null}],
  TL: [{n:'Tais handwoven textiles',i:34343819,s:null}, {n:'Woven baskets',i:29193598,s:null}, {n:'Wood carving',i:36076202,s:null}, {n:'Single-origin coffee',i:29269646,s:null}],
  // Africa
  MA: [{n:'Souk ceramics',i:37484909,s:'free-photo-of-colorful-market-display-of-moroccan-ceramics'}, {n:'Tagine pots',i:35509025,s:null}, {n:'Berber rugs',i:33282224,s:'free-photo-of-traditional-moroccan-rugs-in-marrakesh-market'}, {n:'Berber silver',i:30327970,s:null}, {n:'Mint tea',i:36157389,s:null}, {n:'Moroccan lanterns',i:30208535,s:null}, {n:'Argan oil',i:10110225,s:null}, {n:'Fez tanneries',i:38112321,s:null}, {n:'Leather bags of the souk',i:21326994,s:null}, {n:'Babouche slippers',i:18767555,s:null}, {n:'Chouara dye pits',i:37357057,s:null}, {n:'Kaftans & djellabas',i:30457743,s:null}, {n:'Rosewater & pantry',i:5946986,s:null}, {n:'Brass & pierced-metal lanterns',i:4915832,s:null}, {n:'Zellige-tiled tables',i:34296098,s:null}],
  TN: [{n:'Birdcage (Sidi Bou Said) craft',i:27967396,s:null}, {n:'Harissa & spice pantry',i:16819820,s:null}, {n:'Olive oil & pantry',i:28704680,s:null}, {n:'Leather goods',i:27967570,s:null}, {n:'Chechia felt caps',i:28447099,s:null}, {n:'Fouta towels',i:30982315,s:null}, {n:'Nabeul ceramics',i:37284557,s:null}],
  EG: [{n:'Cairo glass lanterns',i:11350804,s:null}, {n:'Brass workshop',i:34204855,s:null}, {n:'Khayamiya appliqué',i:38155157,s:null}, {n:'Perfume bottles & oils',i:36389336,s:null}, {n:'Hand-blown (muski) glass',i:38037226,s:null}, {n:'Backgammon boards',i:32549758,s:null}, {n:'Inlaid (mother-of-pearl) boxes',i:16533961,s:null}, {n:'Papyrus art',i:29822063,s:null}],
  ET: [{n:'The coffee ceremony',i:38519856,s:null}, {n:'Coffee-ceremony sets',i:6742970,s:null}, {n:'Single-origin coffee',i:14502287,s:null}, {n:'Jebena coffee pots',i:38519871,s:null}, {n:'Habesha woven dresses',i:37733601,s:null}, {n:'Leather goods',i:34189788,s:null}],
  KE: [{n:'Maasai beadwork',i:29828564,s:null}, {n:'Kikoy & kanga textiles',i:9665240,s:null}, {n:'Wood & animal carving',i:33605037,s:null}, {n:'Leather sandals (akala)',i:31450994,s:null}, {n:'Shuka blankets',i:30629419,s:null}, {n:'Kenyan tea & coffee',i:36843617,s:null}, {n:'Soapstone (kisii) carving',i:11235398,s:null}],
  TZ: [{n:'Makonde ebony carving',i:7602954,s:null}, {n:'Tanzanite jewellery',i:18451699,s:null}, {n:'Woven baskets',i:4468808,s:null}, {n:'Coffee & pantry',i:30996277,s:null}, {n:'Zanzibar spice & pantry',i:37087456,s:null}, {n:'Tingatinga painting',i:5928186,s:null}, {n:'Maasai beadwork',i:29828564,s:null}],
  UG: [{n:'Wood carving',i:35811599,s:null}, {n:'Bark cloth',i:19339990,s:null}, {n:'Beaded (paper) jewellery',i:8628442,s:null}, {n:'Batik & kitenge textiles',i:30992033,s:null}, {n:'Coiled (raffia) baskets',i:17682680,s:null}],
  RW: [{n:'Woven baskets',i:29604314,s:null}, {n:'Wood carving',i:38209144,s:null}, {n:'Imigongo geometric art',i:31377141,s:null}, {n:'Coffee & tea pantry',i:16615074,s:null}, {n:'Beaded jewellery',i:8628442,s:null}],
  NG: [{n:'Wedding attire',i:37939838,s:null}, {n:'Shea butter & pantry',i:11284698,s:null}, {n:'Coral & royal beadwork',i:38233741,s:null}, {n:'Bronze (Benin) casting',i:36766417,s:null}, {n:'Leather (Sokoto) goods',i:30604266,s:null}, {n:'Calabash carving',i:29630131,s:null}, {n:'Ankara wax-print fashion',i:20419138,s:null}, {n:'Adire indigo textiles',i:19619009,s:null}, {n:'Talking-drum instruments',i:31386681,s:null}, {n:'Aso-oke handwoven cloth',i:37335043,s:null}, {n:'Nok-style terracotta',i:20208728,s:null}],
  BJ: [{n:'Wood & mask carving',i:8657935,s:null}, {n:'Woven baskets',i:13833730,s:null}, {n:'Batik textiles',i:8655023,s:null}, {n:'Beaded jewellery',i:31918211,s:null}],
  GH: [{n:'Kente cloth',i:30929475,s:'free-photo-of-portrait-of-a-man-in-traditional-ghanaian-kente-cloth'}, {n:'Beadwork of Accra',i:20618742,s:null}, {n:'Shea butter',i:11284698,s:null}, {n:'Djembe & drum instruments',i:32490293,s:null}, {n:'Black soap',i:6621471,s:null}, {n:'Single-origin cacao',i:5178322,s:null}, {n:'Carved (Ashanti) stools',i:27289069,s:null}, {n:'Recycled-glass (Krobo) beads',i:33697674,s:null}, {n:'Adinkra stamped prints',i:18789516,s:null}, {n:'Bolga baskets',i:36537041,s:null}],
  SN: [{n:'Leather goods',i:37510228,s:null}, {n:'Silver (Fulani) jewellery',i:9430437,s:null}, {n:'Wood carving',i:27787405,s:null}, {n:'Coiled (Sahel) baskets',i:17682680,s:null}, {n:'Wax-print & boubou fashion',i:38440371,s:null}, {n:'Fulani gold & silver',i:29274868,s:null}],
  GM: [{n:'Wood carving',i:28892766,s:null}, {n:'Leather goods',i:32879941,s:null}, {n:'Batik & tie-dye textiles',i:12687027,s:null}],
  ML: [{n:'Drum making',i:35488978,s:null}, {n:'Bogolan mud-cloth',i:35117998,s:null}, {n:'Kora & djembe instruments',i:36150845,s:null}, {n:'Tuareg silver & leather',i:35549756,s:null}, {n:'Fulani gold earrings',i:31285201,s:null}, {n:'Woven blankets',i:2828584,s:null}, {n:'Pottery',i:11940087,s:null}],
  BF: [{n:'Basketry',i:20312886,s:null}, {n:'Bogolan mud-cloth',i:37682063,s:null}, {n:'Leather goods',i:30236981,s:null}],
  GN: [{n:'Djembe drums',i:29672003,s:null}, {n:'Woven baskets',i:29193598,s:null}, {n:'Indigo & wax textiles',i:19619009,s:null}, {n:'Leather goods',i:35753873,s:null}],
  SL: [{n:'Raffia craft',i:4441604,s:null}, {n:'Beaded jewellery',i:7815777,s:null}],
  TG: [{n:'Kente & batik textiles',i:16025968,s:null}, {n:'Bronze (lost-wax) casting',i:36766417,s:null}, {n:'Woven baskets',i:13833730,s:null}, {n:'Beaded jewellery',i:7815777,s:null}, {n:'Pottery',i:34228168,s:null}],
  CV: [{n:'Batik textiles',i:4610857,s:null}, {n:'Grogue sugarcane spirit',i:28575157,s:null}, {n:'Ceramics & pottery',i:34217918,s:null}],
  ZA: [{n:'Wooden bowls',i:34599382,s:null}, {n:'Zulu beadwork & baskets',i:30333010,s:null}, {n:'Rooibos tea',i:12698360,s:null}, {n:'Ndebele-motif crafts',i:34182141,s:null}, {n:'Shweshwe textiles',i:32405948,s:null}, {n:'Wine & pantry',i:14661495,s:null}],
  ZW: [{n:'Shona stone sculpture',i:37153510,s:null}, {n:'Woven (Binga) baskets',i:38483283,s:null}, {n:'Verdite & serpentine carving',i:9814103,s:null}, {n:'Beaded jewellery',i:12333363,s:null}, {n:'Batik textiles',i:8967206,s:null}],
  ZM: [{n:'Emerald jewellery',i:32988525,s:null}, {n:'Chitenge textiles',i:8439026,s:null}],
  BW: [{n:'Pottery & clay',i:15022727,s:null}, {n:'Coiled mokola baskets',i:17682680,s:null}, {n:'Beaded jewellery',i:11449103,s:null}, {n:'Wood carving',i:28892766,s:null}, {n:'Ostrich-eggshell beads',i:9142672,s:null}],
  NA: [{n:'Leather & hide goods',i:17444109,s:null}, {n:'Karakul wool weaving & rugs',i:32655889,s:null}, {n:'Himba craft & ochre jewellery',i:27743605,s:null}, {n:'Baskets & woven crafts',i:38483283,s:null}, {n:'Semi-precious gemstones',i:11215780,s:null}],
  LS: [{n:'Basotho blankets',i:32697666,s:null}, {n:'Mokorotlo woven hats',i:11345982,s:null}, {n:'Beaded jewellery',i:16833977,s:null}, {n:'Pottery',i:33878971,s:null}, {n:'Wool tapestries',i:6634271,s:null}],
  SZ: [{n:'Sisal woven baskets',i:38483283,s:null}, {n:'Beaded jewellery',i:16833977,s:null}, {n:'Wood carving',i:36226618,s:null}, {n:'Mohair textiles',i:32405948,s:null}, {n:'Ngwenya recycled glassware',i:7191395,s:null}],
  MW: [{n:'Beaded jewellery',i:8628442,s:null}, {n:'Cane furniture',i:8987823,s:null}, {n:'Chitenje wax-print textiles',i:4566670,s:null}, {n:'Wood carving',i:23325515,s:null}],
  MZ: [{n:'Ceramics',i:31695465,s:null}, {n:'Coconut craft',i:34876038,s:null}, {n:'Capulana textiles',i:38487458,s:null}, {n:'Cashew & pantry',i:7245665,s:null}, {n:'Makonde ebony carving',i:36766618,s:null}, {n:'Woven baskets',i:13833730,s:null}, {n:'Beaded jewellery',i:11449103,s:null}],
  MG: [{n:'Vanilla',i:14381803,s:null}, {n:'Embroidery',i:33890743,s:null}, {n:'Spices & pantry',i:5769698,s:null}, {n:'Raffia weaving & bags',i:5760149,s:null}, {n:'Wild silk (landibe) textiles',i:30722459,s:null}, {n:'Zafimaniry wood carving',i:36076202,s:null}, {n:'Antaimoro paper',i:2058495,s:null}, {n:'Semi-precious gemstones',i:11215780,s:null}],
  MU: [{n:'Vanilla tea & pantry',i:19212835,s:null}, {n:'Textiles & cashmere',i:18069589,s:null}, {n:'Rum & sugar pantry',i:17541188,s:null}, {n:'Dodo-motif crafts',i:38209144,s:null}, {n:'Sand-art bottles',i:10900704,s:null}, {n:'Model ships',i:36620179,s:null}],
  SC: [{n:'Coconut & shell craft',i:11286283,s:null}, {n:'Batik & pareo textiles',i:36839640,s:null}],
  KM: [{n:'Ylang-ylang perfume oil',i:35432545,s:null}, {n:'Woven baskets',i:13833730,s:null}, {n:'Wood carving',i:36226618,s:null}, {n:'Shiromani textiles',i:13864953,s:null}, {n:'Vanilla & spices',i:4963310,s:null}, {n:'Embroidered (kofia) caps',i:36407155,s:null}],
  CM: [{n:'Calabash craft',i:31750327,s:null}, {n:'Bamileke beaded thrones & masks',i:14617463,s:null}, {n:'Coffee & cacao',i:28495598,s:null}, {n:'Toghu embroidered textiles',i:6786952,s:null}, {n:'Woven baskets',i:13833730,s:null}, {n:'Bronze casting',i:36766417,s:null}],
  CD: [{n:'Wood & mask carving',i:9540962,s:null}, {n:'Woven baskets',i:33337878,s:null}, {n:'Ceramics',i:5377308,s:null}, {n:'Coffee',i:13802102,s:null}, {n:'Beaded jewellery',i:6109553,s:null}],
  GA: [{n:'Woven baskets',i:31964014,s:null}, {n:'Raffia textiles',i:27291185,s:null}, {n:'Beaded jewellery',i:16833977,s:null}, {n:'Ebony craft',i:36766618,s:null}, {n:'Mbigou stone carving',i:8374424,s:null}],
  SD: [{n:'Woven baskets & mats',i:13833730,s:null}, {n:'Leather goods',i:34406263,s:null}, {n:'Perfume oils',i:18656841,s:null}, {n:'Pottery',i:24375991,s:null}, {n:'Hibiscus (karkade) & spices',i:34276725,s:null}, {n:'Silver & gold jewellery',i:12685978,s:null}],
  MR: [{n:'Leather goods & cushions',i:35669659,s:null}, {n:'Woven mats & baskets',i:30688221,s:null}, {n:'Silver-and-ebony craft',i:12685978,s:null}, {n:'Pottery',i:15535517,s:null}, {n:'Tuareg silver jewellery',i:35098993,s:null}, {n:'Malahfa embroidered textiles',i:29475576,s:null}],
  DZ: [{n:'Kabyle silver & enamel jewellery',i:11720502,s:null}, {n:'Deglet Nour dates',i:17877978,s:null}, {n:'Copper & brass ware',i:37061322,s:null}, {n:'Leather goods',i:36933384,s:null}, {n:'Basketry',i:31650854,s:null}, {n:'Berber rugs & textiles',i:7808140,s:null}],
  LY: [{n:'Palm-frond craft',i:35960124,s:null}, {n:'Silver Tuareg jewellery',i:13964801,s:null}, {n:'Handwoven textiles',i:31101632,s:null}, {n:'Leather goods',i:34406263,s:null}, {n:'Basketry',i:32839144,s:null}, {n:'Dates & pantry',i:17877978,s:null}],
  AO: [{n:'Carved stools & thrones',i:13833732,s:null}, {n:'Sisal basketry',i:13833733,s:null}, {n:'Clay pottery',i:33878971,s:null}, {n:'Beaded jewellery',i:16833977,s:null}, {n:'Woven mats',i:30688221,s:null}, {n:'Ironwork',i:9963116,s:null}],
  BI: [{n:'Coffee & pantry',i:29795294,s:null}, {n:'Coiled basketry',i:17682680,s:null}, {n:'Ceremonial drums',i:11834900,s:null}, {n:'Twa pottery',i:11940087,s:null}, {n:'Wood carving',i:28892766,s:null}, {n:'Beaded jewellery',i:8628442,s:null}],
  LR: [{n:'Ceremonial mask carving',i:33111458,s:null}, {n:'Patchwork quilts',i:37375678,s:null}, {n:'Country-cloth weaving',i:24738158,s:null}, {n:'Woven baskets',i:29193598,s:null}, {n:'Soapstone carving',i:28263404,s:null}, {n:'Beaded jewellery',i:12333363,s:null}],
  TD: [{n:'Tuareg silver jewellery',i:13964801,s:null}, {n:'Wood carving',i:37011185,s:null}, {n:'Woven mats & baskets',i:30688221,s:null}, {n:'Calabash craft',i:31750327,s:null}, {n:'Pottery',i:8024018,s:null}, {n:'Leather goods',i:34189786,s:null}],
  CF: [{n:'Bark cloth',i:19339990,s:null}, {n:'Beaded jewellery',i:8628442,s:null}, {n:'Ironwork',i:33026668,s:null}, {n:'Raffia textiles',i:27291185,s:null}, {n:'Woven baskets',i:13833730,s:null}, {n:'Ebony craft',i:28100852,s:null}],
  CG: [{n:'Wood & mask carving',i:35187492,s:null}, {n:'Ceramics',i:29630126,s:null}, {n:'Hand drums',i:27291183,s:null}],
  GW: [{n:'Beaded jewellery',i:12333363,s:null}, {n:'Cashew nuts & pantry',i:36631827,s:null}, {n:'Bijagós wood carving',i:28892766,s:null}, {n:'Handwoven (pano) cloth',i:19853375,s:null}, {n:'Woven baskets',i:38483283,s:null}],
  NE: [{n:'Tuareg silver (Agadez cross)',i:20858919,s:null}, {n:'Woven mats & baskets',i:30688221,s:null}, {n:'Indigo textiles',i:19619009,s:null}],
  SS: [{n:'Woven baskets',i:12805086,s:null}, {n:'Leather goods',i:37192152,s:null}],
  GQ: [{n:'Pottery',i:33878971,s:null}, {n:'Woven raffia baskets',i:38483283,s:null}, {n:'Beaded jewellery',i:7815777,s:null}, {n:'Ebony carving',i:36766618,s:null}, {n:'Bark-cloth craft',i:32656448,s:null}],
  ER: [{n:'Jebena coffee pots',i:9452515,s:null}, {n:'Filigree silver jewellery',i:14579309,s:null}, {n:'Woven (mesob) baskets',i:13833730,s:null}, {n:'Handwoven cotton',i:23494586,s:null}, {n:'Leather goods',i:34406263,s:null}, {n:'Spice & coffee pantry',i:34561170,s:null}],
  SO: [{n:'Meerschaum & wood craft',i:37702308,s:null}, {n:'Handwoven textiles',i:31101632,s:null}, {n:'Leather goods',i:34406263,s:null}, {n:'Woven (sisal) baskets',i:13833730,s:null}],
  DJ: [{n:'Woven mats & baskets',i:30688221,s:null}, {n:'Silver jewellery',i:9430437,s:null}, {n:'Leather goods',i:34406263,s:null}],
  // Europe
  IT: [{n:'Amalfi maiolica',i:33839188,s:null}, {n:'Moka pots',i:12122684,s:null}, {n:'Murano chandeliers',i:35687707,s:null}, {n:'Italian loafers',i:20763458,s:null}, {n:'Florence belts',i:31367059,s:null}, {n:'Milan workshops',i:33495913,s:null}, {n:'Murano glassworks',i:12954040,s:null}, {n:'Murano ateliers',i:29893067,s:null}, {n:'Carrara marble',i:36499164,s:null}, {n:'Marble ateliers',i:6714322,s:null}, {n:'Leather journal',i:35810927,s:null}, {n:'Olive harvest',i:36597358,s:null}, {n:'Afternoon coffee',i:36674526,s:null}, {n:'Bespoke tailoring',i:6764997,s:null}, {n:'Venetian masks',i:28608695,s:null}, {n:'Silk ties & scarves',i:34368419,s:null}, {n:'Stationery & bookbinding',i:36966215,s:null}, {n:'Hand-painted ceramics (maiolica)',i:19015377,s:null}, {n:'Espresso & moka ware',i:20322172,s:null}],
  FR: [{n:'Copper pans',i:37533988,s:null}, {n:'Marseille soap',i:35305097,s:null}, {n:'Versailles marquetry',i:7873602,s:null}, {n:'Salt harvest',i:2132048,s:null}, {n:'Preserves & pickles',i:28645473,s:null}, {n:'Candles',i:30309852,s:null}, {n:'Linen & table textiles',i:34111879,s:null}, {n:'Wine & cheese pantry',i:8350083,s:null}, {n:'Perfume & fragrance',i:21308575,s:null}, {n:'Ceramics (Provence, Limoges)',i:18631364,s:null}, {n:'Berets & Basque linen',i:5671039,s:null}],
  ES: [{n:'Andalusian tiles',i:36342685,s:null}, {n:'Paella pans',i:26587044,s:'free-photo-of-seafood-with-lime-on-pan'}, {n:'Madrid ateliers',i:37076986,s:null}, {n:'Violin craft',i:3853198,s:null}, {n:'Hand-held fans (abanicos)',i:37389619,s:null}, {n:'Damascene (Toledo) jewellery',i:15491661,s:null}, {n:'Espadrilles',i:2944422,s:null}, {n:'Olive oil & pantry',i:37894575,s:null}, {n:'Turrón & confectionery',i:6208129,s:null}, {n:'Ceramics & azulejo tiles',i:33461883,s:null}, {n:'Flamenco guitars',i:12429253,s:null}],
  PT: [{n:'Azulejo tiles',i:34930529,s:'free-photo-of-azulejos-tile-mural-in-lisbon-portugal'}, {n:'Silver filigree',i:33873052,s:null}, {n:'Cork oak forest',i:36627495,s:null}, {n:'Cork stoppers',i:33054271,s:null}, {n:'Guitar making',i:3853207,s:null}, {n:'Ceramic swallows',i:17721622,s:null}, {n:'Wool (Burel) blankets',i:37039717,s:null}, {n:'Filigree jewellery',i:31128290,s:null}, {n:'Soap & fragrance',i:6513063,s:null}, {n:'Tinned sardine pantry',i:34092839,s:null}, {n:'Madeira embroidery',i:27855363,s:null}],
  GR: [{n:'Island pottery',i:33557541,s:null}, {n:'Olive oil',i:25745504,s:null}, {n:'Athens marble',i:17311595,s:null}, {n:'Wild honeycomb',i:36813203,s:null}, {n:'Ceramics & pottery',i:28000954,s:null}, {n:'Feta & cheese',i:725993,s:null}, {n:'Ouzo & mastiha ware',i:13054466,s:null}, {n:'Komboloi worry beads',i:29066340,s:null}, {n:'Byzantine icon art',i:37844517,s:null}, {n:'Leather sandals',i:9267585,s:null}, {n:'Backgammon (tavli)',i:10129694,s:null}],
  GB: [{n:'Tartan',i:6764920,s:null}, {n:'Savile Row fitting',i:6766284,s:null}, {n:'Teapots & fine bone china',i:31670314,s:null}, {n:'Brogues & leather shoes',i:8553594,s:null}, {n:'Flat caps',i:31326410,s:null}, {n:'Bespoke tailoring',i:35598778,s:null}, {n:'Stationery & fountain pens',i:15334425,s:null}, {n:'Harris tweed',i:20459293,s:null}, {n:'Marmalade & preserves',i:6588431,s:null}],
  IE: [{n:'Aran knitwear',i:33865626,s:null}, {n:'Drum craftsman',i:32357220,s:null}, {n:'Crystal (Waterford)',i:10038676,s:null}, {n:'Wool blankets',i:20155814,s:null}, {n:'Belleek porcelain',i:38352907,s:null}, {n:'Tweed caps & cloth',i:19459028,s:null}, {n:'Whiskey & pantry',i:36709071,s:null}],
  DE: [{n:'Beer steins',i:28702296,s:null}, {n:'German joinery',i:5974413,s:null}, {n:'Blade sharpening',i:9593585,s:null}, {n:'Notebook binding',i:30804551,s:null}, {n:'Precision timing',i:8327755,s:null}, {n:'Optical craft',i:5715905,s:null}, {n:'Precision machining',i:32845661,s:null}, {n:'Cuckoo clocks',i:31903891,s:null}, {n:'Porcelain (Meissen)',i:27570244,s:null}, {n:'Nutcrackers & smokers',i:29992262,s:null}, {n:'Kitchen knives (Solingen)',i:16400263,s:null}, {n:'Enamel cookware',i:34640219,s:null}, {n:'Optics & precision tools',i:34656260,s:null}, {n:'Leather goods',i:34273636,s:null}, {n:'Teddy bears (Steiff)',i:15271833,s:null}, {n:'Christmas ornaments',i:29810011,s:null}],
  CH: [{n:'Watch repair',i:8327524,s:null}, {n:'Chocolate',i:14456054,s:null}, {n:'Precision tools',i:33748048,s:null}, {n:'Cowbells & alpine craft',i:28616000,s:null}, {n:'Cheese (gruyère, raclette)',i:13079969,s:null}, {n:'Music boxes',i:37696934,s:null}, {n:'Watches & horology',i:28697856,s:null}, {n:'Embroidery (St. Gallen)',i:20189607,s:null}],
  AT: [{n:'Mozartkugel & confectionery',i:34190299,s:null}, {n:'Crystal glassware (Swarovski)',i:29689441,s:null}, {n:'Snow globes',i:35301496,s:null}, {n:'Loden wool coats',i:34476851,s:null}, {n:'Woodcraft & nutcrackers',i:13005858,s:null}, {n:'Porcelain (Augarten)',i:33094353,s:null}, {n:'Dirndl & trachten',i:34469158,s:null}, {n:'Petit-point embroidery',i:11800065,s:null}],
  LI: [{n:'Collectible postage stamps',i:6661079,s:null}, {n:'Precision ceramics',i:7222234,s:null}, {n:'Wine ware',i:32795634,s:null}],
  NL: [{n:'Delft blue',i:30617002,s:null}, {n:'Tulip & bulb crafts',i:8910558,s:null}, {n:'Genever ware',i:31473024,s:null}, {n:'Wooden clogs',i:31155194,s:null}, {n:'Stroopwafel pantry',i:36325223,s:null}, {n:'Bicycle accessories',i:29343111,s:null}, {n:'Licorice (drop)',i:6046851,s:null}, {n:'Delftware pottery',i:33375211,s:null}, {n:'Cheese (gouda, edam)',i:33575864,s:null}],
  BE: [{n:'Comic & poster art',i:38409239,s:null}, {n:'Waffles & pantry',i:32277600,s:null}, {n:'Chocolate & pralines',i:38160440,s:null}, {n:'Diamonds (Antwerp)',i:5912127,s:null}, {n:'Lace',i:29265362,s:null}, {n:'Beer & brewing ware',i:10322549,s:null}, {n:'Tapestry',i:36874770,s:null}],
  LU: [{n:'Péckvillchen clay whistles',i:20827955,s:null}, {n:'Porcelain (Villeroy & Boch)',i:29287725,s:null}, {n:'Ironwork & pewter',i:38215466,s:null}, {n:'Pastry & pantry',i:12841246,s:null}],
  SE: [{n:'Design glassware (Kosta, Orrefors)',i:10693877,s:null}, {n:'Wool blankets',i:6633533,s:null}, {n:'Clogs',i:18517427,s:null}, {n:'Linen & textiles',i:4794863,s:null}, {n:'Ceramics',i:16409005,s:null}],
  FI: [{n:'Sauna culture',i:36420270,s:null}, {n:'Reindeer-leather goods',i:17648906,s:null}, {n:'Puukko knives',i:1370392,s:null}, {n:'Liquorice & pantry',i:5469045,s:null}, {n:'Design glassware (Iittala)',i:18347744,s:null}],
  DK: [{n:'Danish design',i:32392318,s:null}, {n:'Copenhagen interiors',i:12277129,s:null}, {n:'Ceramics (Royal Copenhagen)',i:33359689,s:null}, {n:'Candles & design goods',i:10342351,s:null}, {n:'Liquorice & pantry',i:5469045,s:null}, {n:'Amber jewellery',i:38218527,s:null}, {n:'Teak homeware',i:7303870,s:null}, {n:'Design furniture',i:28504432,s:null}],
  NO: [{n:'Brown cheese pantry',i:32611692,s:null}, {n:'Norwegian (Selbu) knitwear',i:19459813,s:null}, {n:'Enamel jewellery',i:38480377,s:null}, {n:'Rosemåling folk art',i:37080635,s:null}, {n:'Pewter ware',i:20101692,s:null}],
  IS: [{n:'Lava & volcanic jewellery',i:27245741,s:null}, {n:'Sheepskin & wool goods',i:18268599,s:null}, {n:'Design homeware',i:7674539,s:null}, {n:'Lopapeysa wool knitwear',i:19120881,s:null}, {n:'Flaky sea salt',i:7717461,s:null}],
  PL: [{n:'Polish stoneware',i:35057456,s:null}, {n:'Amber rings',i:28856507,s:null}, {n:'Highlander (góral) craft',i:30797216,s:null}, {n:'Bolesławiec stoneware',i:6611418,s:null}, {n:'Boleslawiec pottery',i:4706105,s:null}, {n:'Wycinanki papercut art',i:7695298,s:null}, {n:'Christmas (bombki) ornaments',i:35093710,s:null}, {n:'Linen & lace',i:30405792,s:null}, {n:'Pisanki painted eggs',i:5568822,s:null}],
  CZ: [{n:'Bohemian crystal',i:30132508,s:null}, {n:'Crystal stemware',i:37304105,s:null}, {n:'Marionette puppets',i:35052904,s:null}, {n:'Marionettes & wooden toys',i:7511711,s:null}, {n:'Garnet jewellery',i:12002675,s:null}, {n:'Porcelain & ceramics',i:15235097,s:null}, {n:'Painted (kraslice) eggs',i:36885427,s:null}, {n:'Beer & pantry',i:15269349,s:null}],
  SK: [{n:'Folk embroidery',i:33913255,s:null}, {n:'Corn-husk dolls',i:5105650,s:null}, {n:'Painted eggs',i:36885427,s:null}, {n:'Woodcraft',i:13005858,s:null}, {n:'Fujara flutes',i:1340853,s:null}, {n:'Modra ceramics',i:18659852,s:null}],
  HU: [{n:'Folk ceramics',i:37158102,s:null}, {n:'Tokaji wine ware',i:36796549,s:null}, {n:'Lace (Halas)',i:12715939,s:null}, {n:'Matyó & Kalocsa embroidery',i:36273681,s:null}, {n:'Painted eggs',i:36436791,s:null}, {n:'Paprika & pantry',i:38441086,s:null}],
  RO: [{n:'Pantry & preserves',i:18551846,s:null}, {n:'Wool rugs & textiles',i:34084602,s:null}, {n:'Folk (ie) blouses',i:35101951,s:null}, {n:'Woodcraft & carved gates',i:13005858,s:null}],
  BG: [{n:'Rose oil',i:18745781,s:null}, {n:'Martenitsa red-and-white craft',i:36879819,s:null}, {n:'Yogurt & pantry',i:11664380,s:null}, {n:'Icon art',i:35545009,s:null}, {n:'Troyan drip ceramics',i:16788697,s:null}, {n:'Wool rugs (Chiprovtsi)',i:34084602,s:null}, {n:'Embroidery & textiles',i:1738955,s:null}],
  RS: [{n:'Preserves & ajvar pantry',i:5719608,s:null}, {n:'Filigree jewellery',i:16853521,s:null}, {n:'Rakija ware',i:33878971,s:null}, {n:'Embroidery',i:38329616,s:null}, {n:'Opanci leather shoes',i:38295992,s:null}, {n:'Wool knitwear & socks',i:15667095,s:null}, {n:'Pirot kilim rugs',i:35304170,s:null}],
  HR: [{n:'Licitar heart craft',i:15215473,s:null}, {n:'Olive oil & pantry',i:15156661,s:null}, {n:'Ceramics',i:16485164,s:null}, {n:'Filigree (Morčić) jewellery',i:16853521,s:null}, {n:'Cravats (necktie origin)',i:32405052,s:null}, {n:'Lavender oil & sachets',i:2508931,s:null}],
  SI: [{n:'Felt & wool craft',i:34328388,s:null}, {n:'Painted beehive-panel art',i:31921189,s:null}, {n:'Cast-iron (Kropa) ironwork',i:544254,s:null}, {n:'Honey & pantry',i:23990676,s:null}, {n:'Ceramics',i:28301170,s:null}],
  UA: [{n:'Woven rushnyk cloth',i:18478161,s:null}, {n:'Honey & pantry',i:34314973,s:null}, {n:'Vyshyvanka embroidery',i:12315946,s:null}, {n:'Pysanky painted eggs',i:35449906,s:null}, {n:'Ceramics & pottery',i:13096245,s:null}, {n:'Motanka dolls',i:14364797,s:null}],
  BY: [{n:'Willow basketry',i:29613233,s:null}, {n:'Vytsinanka papercut',i:27592695,s:null}, {n:'Pottery & ceramics',i:28556637,s:null}, {n:'Wooden crafts',i:10986983,s:null}, {n:'Linen goods',i:4046147,s:null}, {n:'Straw-weaving art',i:36319636,s:null}],
  RU: [{n:'Matryoshka dolls',i:19041395,s:null}, {n:'Filigree jewellery',i:33873052,s:null}, {n:'Gzhel blue ceramics',i:37502235,s:null}, {n:'Palekh lacquer boxes',i:34217384,s:null}, {n:'Orenburg lace shawls',i:4967468,s:null}, {n:'Samovar & tea ware',i:8968184,s:null}, {n:'Ushanka & felt (valenki)',i:19248393,s:null}, {n:'Khokhloma painted ware',i:4966568,s:null}],
  LT: [{n:'Baltic amber beads',i:18730034,s:null}, {n:'Black pottery',i:33297419,s:null}, {n:'Amber jewellery',i:9859956,s:null}, {n:'Straw (sodai) ornaments',i:250175,s:null}, {n:'Wool mittens & socks',i:35902225,s:null}, {n:'Wooden crosses & folk art',i:29201691,s:null}],
  LV: [{n:'Woodcraft',i:26622924,s:null}, {n:'Ceramics',i:19315009,s:null}, {n:'Rye bread & pantry',i:14917625,s:null}, {n:'Folk (Lielvārde) belts',i:17775495,s:null}, {n:'Amber jewellery',i:9859956,s:null}, {n:'Herbal (Black Balsam) ware',i:5480037,s:null}, {n:'Wool mittens & knitwear',i:35902225,s:null}],
  EE: [{n:'Linen textiles',i:11733651,s:null}, {n:'Handmade chocolate',i:38151879,s:null}, {n:'Wool knitwear (Muhu, Kihnu)',i:10863262,s:null}],
  MT: [{n:'Blown glass (Mdina)',i:38037223,s:null}, {n:'Filigree silver jewellery',i:33873052,s:null}, {n:'Maltese cross crafts',i:37568050,s:null}, {n:'Ganutell wire flowers',i:34617854,s:null}, {n:'Ceramics',i:34428794,s:null}, {n:'Prickly-pear pantry',i:34769459,s:null}],
  SM: [{n:'Torta Tre Monti wafer cake',i:14708989,s:null}, {n:'Collectible stamps & coins',i:6661079,s:null}],
  VA: [{n:'Vatican postage stamps',i:5680261,s:null}, {n:'Commemorative coins',i:8442357,s:null}, {n:'Rosaries & devotional craft',i:6758219,s:null}, {n:'Mosaic art',i:36585073,s:null}, {n:'Ecclesiastical textiles',i:33375801,s:null}],
  MC: [{n:'Fine jewellery',i:6689396,s:null}, {n:'Ceramics & porcelain',i:30663792,s:null}, {n:'Leather goods',i:7372469,s:null}, {n:'Collectible stamps',i:6661079,s:null}],
  AD: [{n:'Wrought-iron craft',i:18341089,s:null}, {n:'Ceramics',i:33557541,s:null}, {n:'Tobacco & pantry',i:27793711,s:null}, {n:'Wood carving',i:29626326,s:null}],
  CY: [{n:'Olive oil & carob',i:25745506,s:null}, {n:'Lefkara lace',i:34406503,s:null}, {n:'Halloumi & pantry',i:8751408,s:null}, {n:'Icon art',i:14394583,s:null}, {n:'Filigree silver',i:33873052,s:null}, {n:'Ceramics & pottery',i:26706452,s:null}],
  AL: [{n:'Carved walnut woodwork',i:36971734,s:null}, {n:'Filigree silver jewellery',i:33873052,s:null}, {n:'Wool rugs (qilim)',i:36936824,s:null}, {n:'Embroidery',i:10020207,s:null}, {n:'Raki & pantry',i:16556212,s:null}],
  MK: [{n:'Filigree jewellery',i:31128290,s:null}, {n:'Wool rugs & textiles',i:30414820,s:null}, {n:'Ceramics',i:30569345,s:null}, {n:'Ajvar & pantry',i:37918392,s:null}],
  BA: [{n:'Copper coffee sets & trays',i:37510758,s:null}, {n:'Bosnian rugs (ćilim)',i:25469922,s:null}, {n:'Filigree jewellery',i:15078649,s:null}, {n:'Woodcraft',i:16190410,s:null}, {n:'Handwoven textiles',i:30132791,s:null}, {n:'Leather goods',i:33039735,s:null}],
  ME: [{n:'Olive oil & pantry',i:1454531,s:null}, {n:'Wool rugs & textiles',i:29320031,s:null}, {n:'Filigree jewellery',i:6567673,s:null}, {n:'Ceramics',i:32961466,s:null}, {n:'Woodcraft',i:13005858,s:null}, {n:'Honey & rakija ware',i:4921856,s:null}],
  MD: [{n:'Wool rugs & carpets',i:34084602,s:null}, {n:'Ceramics & pottery',i:34204598,s:null}, {n:'Embroidered (ie) textiles',i:13623433,s:null}, {n:'Preserves & wine ware',i:18551846,s:null}, {n:'Willow basketry',i:29613233,s:null}, {n:'Woodcraft',i:13005858,s:null}],
  // The Americas
  MX: [{n:'Talavera pottery',i:36103768,s:'free-photo-of-colorful-mexican-talavera-pottery-display'}, {n:'Embroidered dresses',i:35526860,s:null}, {n:'Molcajetes',i:37215000,s:'free-photo-of-gourmet-seafood-and-avocado-molcajete-feast'}, {n:'Tortilla presses',i:5737823,s:null}, {n:'Taxco silver',i:14579309,s:null}, {n:'Chilli stalls',i:37829754,s:null}, {n:'Taxco silver jewellery',i:8345752,s:null}, {n:'Otomí textiles',i:15101144,s:null}, {n:'Embroidered huipiles',i:16654423,s:null}, {n:'Copper (Santa Clara) pans',i:10676873,s:null}, {n:'Day of the Dead art',i:29304629,s:null}, {n:'Alebrijes',i:29243527,s:null}, {n:'Hammocks',i:11291049,s:null}],
  GT: [{n:'Mayan weaving',i:2928381,s:null}, {n:'Beaded crafts',i:8536231,s:null}, {n:'Backstrap-woven huipiles',i:36525946,s:null}, {n:'Jade jewellery',i:34675316,s:null}, {n:'Wool blankets',i:8536227,s:null}, {n:'Beaded & wood crafts',i:18450891,s:null}],
  PE: [{n:'Andean weaving',i:24645287,s:'free-photo-of-elderly-person-holding-embroidered-blankets'}, {n:'Alpaca of the Andes',i:35729525,s:null}, {n:'Cacao & chocolate',i:33662912,s:null}, {n:'Retablo folk art',i:5503299,s:null}, {n:'Alpaca knitwear & throws',i:37966505,s:null}, {n:'Chulucanas ceramics',i:38429574,s:null}, {n:'Woven belts & bags',i:37966508,s:null}, {n:'Andean handwoven textiles',i:33539680,s:null}, {n:'Chullo hats',i:16963295,s:null}, {n:'Gourd (mate burilado) carving',i:34189664,s:null}],
  BO: [{n:'Salt flats',i:27098315,s:null}, {n:'Woven hats & bags',i:23228808,s:null}, {n:'Silver jewellery',i:12241930,s:null}],
  EC: [{n:'Roses & floral craft',i:36889036,s:null}, {n:'Montecristi Panama hats',i:35874624,s:null}, {n:'Panama hats (Montecristi)',i:13200857,s:null}, {n:'Silver (Chordeleg) filigree',i:33873052,s:null}, {n:'Single-origin cacao',i:5178322,s:null}, {n:'Tagua-nut (vegetable ivory) carving',i:3685895,s:null}, {n:'Leather goods',i:14059722,s:null}, {n:'Ceramics',i:15539867,s:null}, {n:'Otavalo woven textiles',i:27875423,s:null}],
  CO: [{n:'Sombrero vueltiao hats',i:4718422,s:null}, {n:'Coffee',i:34176327,s:null}, {n:'Leather goods',i:14059722,s:null}, {n:'Ceramics (La Chamba)',i:12271124,s:null}, {n:'Wayuu mochila bags',i:20660894,s:null}, {n:'Cacao & pantry',i:8900912,s:null}, {n:'Emerald jewellery',i:32988525,s:null}, {n:'Filigree (Mompox) silver',i:33873052,s:null}, {n:'Ruana wool wraps',i:30953559,s:null}],
  BR: [{n:'Luthier studio',i:19585038,s:null}, {n:'Cacao & chocolate',i:15722363,s:null}, {n:'Capim-dourado golden-grass craft',i:33570690,s:null}, {n:'Coffee',i:6931440,s:null}, {n:'Cachaça & pantry',i:3862995,s:null}, {n:'Gemstone jewellery',i:34444069,s:null}, {n:'Carnival craft',i:8879768,s:null}, {n:'Havaianas & leather goods',i:34447680,s:null}, {n:'Ceramics (Marajó)',i:20632846,s:null}, {n:'Hammocks',i:36708156,s:null}],
  AR: [{n:'Mate gourds',i:25436250,s:'free-photo-of-yerba-mate-in-bombilla'}, {n:'Gaucho leatherwork',i:28806552,s:null}, {n:'Pampas saddlery',i:29145580,s:null}, {n:'Wine & pantry',i:17313073,s:null}, {n:'Gaucho leather & saddlery',i:29907116,s:null}, {n:'Leather goods & saddlery',i:16894035,s:null}, {n:'Mate gourds & bombillas',i:13592415,s:null}, {n:'Rhodochrosite jewellery',i:4974420,s:null}, {n:'Ponchos & woven textiles',i:33241271,s:null}, {n:'Dulce de leche pantry',i:37104701,s:null}, {n:'Silver (facón & rastra) craft',i:33241249,s:null}, {n:'Wool knitwear',i:14641430,s:null}],
  CL: [{n:'Pomaire ceramics',i:8066081,s:null}, {n:'Combarbalita stone craft',i:38382405,s:null}, {n:'Lapis lazuli jewellery',i:16512700,s:null}, {n:'Chamanto woven cloth',i:36186951,s:null}, {n:'Copper homeware',i:9939082,s:null}, {n:'Ceramics (Pomaire)',i:37358121,s:null}, {n:'Wine & pantry',i:34004184,s:null}],
  UY: [{n:'Ceramics',i:16131600,s:null}, {n:'Wool throws & knitwear',i:27515155,s:null}, {n:'Dulce de leche pantry',i:34472658,s:null}, {n:'Mate gourds & ware',i:31547765,s:null}, {n:'Woven textiles',i:37966508,s:null}, {n:'Leather goods',i:34406263,s:null}, {n:'Amethyst & agate jewellery',i:7256626,s:null}],
  PY: [{n:'Ñandutí lace',i:12416646,s:null}, {n:'Silver (Luque) filigree',i:33873052,s:null}, {n:'Woven hammocks',i:13154940,s:null}, {n:'Leather goods',i:31001381,s:null}, {n:'Yerba mate & pantry',i:20694855,s:null}, {n:'Wood carving',i:32500012,s:null}, {n:'Ceramics',i:16131600,s:null}, {n:"Ao po'i embroidered cotton",i:29475576,s:null}],
  VE: [{n:'Tapara gourd craft',i:31750329,s:null}, {n:'Ceramics',i:10178156,s:null}, {n:'Single-origin cacao & chocolate',i:5178322,s:null}, {n:'Rum & pantry',i:19793610,s:null}, {n:'Woven hammocks',i:13154940,s:null}, {n:'Wayuu textiles & bags',i:16041155,s:null}, {n:'Beaded jewellery',i:12333363,s:null}, {n:'Coffee & pantry',i:13424060,s:null}],
  GY: [{n:'Wood carving',i:36076202,s:null}, {n:'Cassava & pantry',i:28454278,s:null}, {n:'Beaded jewellery',i:12333363,s:null}, {n:'Tibisiri straw baskets',i:34667143,s:null}, {n:'Pottery',i:33878971,s:null}, {n:'Amerindian woven craft',i:7575039,s:null}],
  SR: [{n:'Coconut craft',i:34876038,s:null}, {n:'Hand-woven hammocks',i:13154940,s:null}, {n:'Javanese batik textiles',i:37628562,s:null}, {n:'Amerindian basketry',i:32839144,s:null}, {n:'Beaded jewellery',i:12333363,s:null}, {n:'Cassava & pantry',i:33740515,s:null}, {n:'Maroon (Tembe) wood carving',i:36076202,s:null}],
  BS: [{n:'Straw-plaited goods',i:26713268,s:null}, {n:'Inagua sea salt',i:15944064,s:null}],
  CU: [{n:'Cigars & tobacco craft',i:33105621,s:null}, {n:'Straw hats',i:16716998,s:null}, {n:'Coffee',i:4792335,s:null}, {n:'Percussion instruments',i:37247107,s:null}, {n:'Rum & pantry',i:16845305,s:null}, {n:'Leather goods',i:34406263,s:null}, {n:'Guayabera shirts',i:34047373,s:null}, {n:'Papier-mâché & folk art',i:16900937,s:null}],
  DO: [{n:'Mahogany carving',i:29591256,s:null}, {n:'Cacao & chocolate',i:30007171,s:null}, {n:'Woven baskets',i:29530568,s:null}, {n:'Faceless (Limé) dolls',i:38286862,s:null}],
  GD: [{n:'Nutmeg & spice pantry',i:5741508,s:null}, {n:'Rum & pantry',i:19562093,s:null}, {n:'Woven baskets',i:31794673,s:null}],
  LC: [{n:'Cacao & chocolate',i:32101813,s:null}, {n:'Wood carvings',i:5711879,s:null}],
  DM: [{n:'Single-origin chocolate bars',i:4113364,s:null}, {n:'Carved calabash art',i:33955919,s:null}, {n:'Kalinago larouma-reed baskets',i:32403975,s:null}, {n:'Bay rum soap and cologne',i:16244099,s:null}, {n:'Bay rum soap and cologne',i:8166613,s:null}],
  KN: [{n:'Caribelle batik textiles',i:10682942,s:null}, {n:'Coconut-shell craft',i:7717470,s:null}, {n:'Sugar & rum pantry',i:24743191,s:null}, {n:'Woven baskets',i:59722,s:null}, {n:'Wood carvings',i:4611607,s:null}, {n:'Kittitian hot pepper sauce',i:9841263,s:null}],
  AG: [{n:'Redware pottery',i:10011988,s:null}, {n:'Batik textiles',i:35243578,s:null}, {n:'Sea-glass jewellery',i:15844094,s:null}],
  VC: [{n:'Wood & model-boat carving',i:17324362,s:null}, {n:'Handcrafted jewellery',i:35187497,s:null}, {n:'Coconut craft',i:36955904,s:null}],
  HT: [{n:'Vetiver oil',i:6915310,s:null}, {n:'Papier-mâché art',i:27794789,s:null}, {n:'Cacao & pantry',i:31821114,s:null}, {n:'Vibrant folk painting',i:37054376,s:null}, {n:'Sisal & straw craft',i:27007162,s:null}, {n:'Wood carving',i:29626326,s:null}],
  JM: [{n:'Rum & pantry',i:15101594,s:null}, {n:'Beaded & seed jewellery',i:9772647,s:null}, {n:'Jerk spice & pantry',i:16571596,s:null}, {n:'Jerk & pepper pantry',i:27556985,s:null}, {n:'Wood carving',i:36076202,s:null}],
  TT: [{n:'Carnival (mas) craft',i:3823442,s:null}, {n:'Beaded jewellery',i:12333363,s:null}, {n:'Fine cacao & chocolate',i:33044067,s:null}],
  BB: [{n:'Chalky Mount pottery',i:6611261,s:null}, {n:'Rum & pantry',i:26856730,s:null}, {n:'Bajan pepper sauce',i:5319845,s:null}],
  CA: [{n:'Maple syrup',i:17052506,s:null}, {n:"Wool (Hudson's Bay) blankets",i:37039717,s:null}, {n:'Ice-wine ware',i:4641420,s:null}, {n:'Inuit soapstone carving',i:5874078,s:null}, {n:'Beaded & birchbark craft',i:29765603,s:null}, {n:'Amethyst & jade',i:4040611,s:null}, {n:'Cowichan knitwear',i:13926762,s:null}, {n:'Smoked salmon pantry',i:36734954,s:null}, {n:'First Nations art',i:29124120,s:null}],
  US: [{n:'Bourbon & barrel craft',i:32711943,s:null}, {n:'Craft leather goods',i:4452603,s:null}, {n:'Vinyl & poster art',i:11994113,s:null}, {n:'Maple & pantry',i:29834257,s:null}, {n:'Cast-iron cookware',i:29834287,s:null}, {n:'Selvedge denim & workwear',i:37691096,s:null}, {n:'Pendleton & quilt textiles',i:37375678,s:null}, {n:'Fragrance & grooming',i:33994391,s:null}],
  CR: [{n:'Leather goods',i:31001381,s:null}, {n:'Cacao & pantry',i:16873215,s:null}, {n:'Ceramics (Chorotega)',i:28276119,s:null}],
  PA: [{n:'Geisha coffee',i:7125591,s:null}, {n:'Panama hats (sombrero pintao)',i:16963190,s:null}, {n:'Tagua-nut carving',i:28892766,s:null}, {n:'Ceramics',i:32257707,s:null}, {n:'Beaded (chaquira) craft',i:30139741,s:null}, {n:'Mola reverse-appliqué textiles',i:18063571,s:null}],
  NI: [{n:'Leather & rosewood craft',i:5306881,s:null}, {n:'Woven hammocks',i:13154940,s:null}, {n:'Coffee',i:10759275,s:null}, {n:'Ceramics (San Juan de Oriente)',i:25961715,s:null}],
  HN: [{n:'Coffee',i:26691790,s:null}, {n:'Cigars & pantry',i:3975055,s:null}, {n:'Junco-palm weaving',i:13719440,s:null}, {n:'Mahogany wood carving',i:29591256,s:null}, {n:'Corn-husk crafts',i:5105650,s:null}, {n:'Lenca pottery',i:14330285,s:null}, {n:'Leather goods',i:31001381,s:null}],
  SV: [{n:'Woven hammocks',i:13154940,s:null}, {n:'Indigo (añil) textiles',i:19619009,s:null}, {n:'Handloom cotton',i:13752944,s:null}, {n:'La Palma folk painting',i:36979663,s:null}, {n:'Wood crafts',i:37663440,s:null}],
  BZ: [{n:'Jippi-jappa weaving',i:24738158,s:null}, {n:'Hot (habanero) sauce',i:31703675,s:null}, {n:'Woven baskets',i:29530568,s:null}, {n:'Coconut & shell craft',i:31043929,s:null}],
  // Oceania
  AU: [{n:'Opals',i:13595294,s:null}, {n:'Eucalyptus & manuka honey',i:36280310,s:null}, {n:'Aboriginal dot-painting art',i:18856059,s:null}, {n:'Sheepskin (ugg) goods',i:28896473,s:null}, {n:'Leather (Akubra) hats',i:10897945,s:null}, {n:'Wine & pantry',i:32792880,s:null}, {n:'Macadamia & pantry',i:20377557,s:null}, {n:'Opal & pearl (Broome) jewellery',i:16461255,s:null}, {n:'Akubra & Driza-Bone leather',i:32329053,s:null}, {n:'Boomerang & didgeridoo craft',i:38413721,s:null}],
  NZ: [{n:'Manuka honey',i:6187185,s:null}, {n:'Pounamu (greenstone) carving',i:33611927,s:null}, {n:'Maori bone (hei-tiki) carving',i:32876104,s:null}, {n:'Paua-shell jewellery',i:8146293,s:null}, {n:'Wool blankets & sheepskin',i:35964340,s:null}, {n:'Wine & pantry',i:2308939,s:null}, {n:'Kauri-wood craft',i:33619692,s:null}],
  FJ: [{n:'Coconut-oil skincare',i:15020644,s:null}, {n:'Woven (voivoi) mats & baskets',i:17682680,s:null}, {n:'Wood (tanoa) carving',i:28892766,s:null}, {n:'Voivoi mat & basket weaving',i:36319637,s:null}, {n:'Tanoa & kava ware',i:33878971,s:null}, {n:'Shell & pearl jewellery',i:28646235,s:null}],
  WS: [{n:'Fine (ie toga) mat weaving',i:36319637,s:null}, {n:'Kava (ava) ware',i:33878971,s:null}, {n:'Tattoo-motif crafts',i:17589330,s:null}, {n:'Coconut oil & skincare',i:15020644,s:null}, {n:'Wood (tanoa) carving',i:36076202,s:null}],
  TO: [{n:'Bone & wood carving',i:32948922,s:null}, {n:'Pandanus mat weaving',i:36319637,s:null}, {n:'Coconut & shell craft',i:34876038,s:null}, {n:'Kava ware',i:33878971,s:null}, {n:'Tapa-motif crafts',i:5504766,s:null}],
  KI: [{n:'Pandanus woven mats',i:36187843,s:null}, {n:'Salt & pantry',i:8175333,s:null}, {n:'Wood carving',i:36076202,s:null}],
  TV: [{n:'Kolose crochet craft',i:18971492,s:null}, {n:'Shell jewellery',i:28646235,s:null}, {n:'Woven fans & baskets',i:37663509,s:null}, {n:'Coconut craft',i:34876038,s:null}, {n:'Wood carving',i:36076202,s:null}],
  PG: [{n:'Coffee',i:796609,s:null}, {n:'Woven baskets & mats',i:7717490,s:null}, {n:'Clay pottery',i:6692632,s:null}],
  SB: [{n:'Woven baskets & mats',i:17682680,s:null}, {n:'Kastom textiles',i:33317387,s:null}, {n:'Coconut craft',i:34876038,s:null}, {n:'Wood carving (nguzunguzu)',i:36076202,s:null}, {n:'Shell-money & jewellery',i:32141149,s:null}, {n:'Nut-inlay bowls',i:31703678,s:null}],
  VU: [{n:'Shell jewellery',i:9428788,s:null}, {n:'Sand-drawing art',i:12771476,s:null}, {n:'Woven (pandanus) mats & baskets',i:17682680,s:null}, {n:'Kava & pantry',i:35059639,s:null}, {n:'Coconut craft',i:34876038,s:null}],
}

export function pexelsUrl(id: number, slug?: string | null, width = 800): string {
  return slug
    ? `https://images.pexels.com/photos/${id}/pexels-photo-${id}/${slug}.jpeg?auto=compress&cs=tinysrgb&w=${width}`
    : `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`
}

// Full gallery for a country -- used on /origins/[slug].
export function countryImages(code: string, width = 800): CountryImage[] {
  const raw = RAW[code] ?? []
  return raw.map(r => ({ name: r.n, id: r.i, slug: r.s, url: pexelsUrl(r.i, r.s, width) }))
}

// A single representative image -- used on /founding's country cards.
// Every one of the 190 site countries now has at least one, so this should
// no longer return null in practice -- kept defensive in case a future
// country is added to WORLD_COUNTRIES before its imagery is researched.
export function countryImage(code: string, width = 800): CountryImage | null {
  const raw = RAW[code]?.[0]
  return raw ? { name: raw.n, id: raw.i, slug: raw.s, url: pexelsUrl(raw.i, raw.s, width) } : null
}

export interface CraftMatch {
  code: string
  name: string
  term: string
  image: CountryImage | null
}

// Matches a query against every country's craft vocabulary -- first this
// file's own per-craft photography (RAW, ~1,200 named images, each with its
// own real, verified Pexels photo), then lib/cultureHints.ts's broader
// "top 8 most iconic" buyer-facing terms for anything RAW doesn't cover by
// name. This mirrors the mobile app's SearchScreen/AtlasScreen, which
// searches its IMAGERY dataset (an export of this same RAW data) and then
// its HINTS dataset the same way, and it means every hit carries a real
// photo, never a fabricated one: a term matched via RAW carries its own
// dedicated photo; a term that only exists in cultureHints.ts falls back to
// the country's lead photo rather than showing no image at all (William,
// 2026-07-19: "the app offers such a large product search some that are
// not even on the website" / "cultural hints with the imagery like app").
//
// One canonical implementation, imported by every website search bar
// (GlobalHeader, /search, /shop) rather than reimplemented per call site --
// see lib/categories.ts's standing warning about drifted duplicate copies.
export function matchCraftImagery(query: string, limit = 4): CraftMatch[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const out: CraftMatch[] = []
  const seen = new Set<string>()
  const countryName = (code: string) => WORLD_COUNTRIES.find((c) => c.code === code)?.name ?? code

  for (const code of Object.keys(RAW)) {
    for (const r of RAW[code]) {
      if (r.n.toLowerCase().includes(q)) {
        const key = code + '|' + r.n.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ code, name: countryName(code), term: r.n, image: { name: r.n, id: r.i, slug: r.s, url: pexelsUrl(r.i, r.s, 500) } })
        if (out.length >= limit) return out
      }
    }
  }
  for (const code of Object.keys(CULTURE_HINTS)) {
    for (const term of CULTURE_HINTS[code]) {
      if (term.toLowerCase().includes(q)) {
        const key = code + '|' + term.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ code, name: countryName(code), term, image: countryImage(code, 500) })
        if (out.length >= limit) return out
      }
    }
  }
  return out
}
