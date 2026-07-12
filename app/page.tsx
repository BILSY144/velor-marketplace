'use client'

// Homepage v2 — rebuilt 2026-07-09 to William's buyer-first brief:
// ~90% buyer, one slim seller band at the bottom. No hero manifesto — the
// page opens on VELOR LIVE (the live-shopping rail) and then swipeable
// culture reels: real cultural items, photographed, tagged with their
// country. Editorial showcase tiles, NOT product cards — no prices, no
// seller names, nothing that fakes a listing. Tiles swap to real product
// cards as sellers list (the lattice API already feeds live counts).
//
// Framing (William, 2026-07-08): Velor IS a shopping channel. Sections are
// numbered like channels (CH 01 the live network, CH 02+ the culture reels,
// countries are "190 channels"), and the seller band pitches both rails:
// sell live on the channel AND with always-on listings. Layout is full-bleed
// — no max-width, the page uses the whole viewport.
//
// Standing rules honoured: zero-state honest; Preview labels, never fake
// LIVE badges; culture not raw materials; opener language; buyer pages
// carry no payout detail. Pexels imagery hotlinked for now — self-host and
// confirm licence before heavy traffic (tracked in CLAUDE.md).

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SPECIALITIES, SPECIALITY_KINDS, buyerLabel } from '@/lib/specialities'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'
import { cultureHints } from '@/lib/cultureHints'

type LatticeSummary = {
  totalCountries: number
  trading: number
  countries: { code: string; name: string; products: number; specialities: string[] }[]
  specialities: Record<string, { countries: number; products: number }>
}

type LiveStream = {
  id: string
  title: string
  roomName: string
  status: string
  sellerName: string
  products: { id: string; title: string; price: number; images: string[] }[]
}

const px = (id: number, slug?: string) =>
  slug
    ? `https://images.pexels.com/photos/${id}/pexels-photo-${id}/${slug}.jpeg?auto=compress&cs=tinysrgb&w=800`
    : `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`

// The culture reels — each tile is a real cultural item with its country.
// Stock photography stands in until real listings replace it, tile by tile.
const CULTURE_REELS: {
  title: string
  line: string
  tiles: { name: string; code: string; img: string }[]
}[] = [
  {
    title: 'Ceramics & porcelain',
    line: 'Fired in the cities that invented firing.',
    tiles: [
      { name: 'Talavera pottery', code: 'MX', img: px(36103768, 'free-photo-of-colorful-mexican-talavera-pottery-display') },
      { name: 'Porcelain tea sets', code: 'CN', img: px(36253267, 'free-photo-of-elegant-tea-set-on-traditional-chinese-table') },
      { name: 'Souk ceramics', code: 'MA', img: px(37484909, 'free-photo-of-colorful-market-display-of-moroccan-ceramics') },
      { name: 'Tea bowls', code: 'JP', img: px(14705063) },
      { name: 'Azulejo tiles', code: 'PT', img: px(34930529, 'free-photo-of-azulejos-tile-mural-in-lisbon-portugal') },
      { name: 'Iznik blues', code: 'TR', img: px(27729719, 'free-photo-of-a-room-with-many-blue-and-white-plates-on-display') },
      { name: 'Delft blue', code: 'NL', img: px(30617002) },
      { name: 'Amalfi maiolica', code: 'IT', img: px(33839188) },
      { name: 'Tagine pots', code: 'MA', img: px(35509025) },
      { name: 'Sake sets', code: 'JP', img: px(18198515) },
      { name: 'Polish stoneware', code: 'PL', img: px(35057456) },
      { name: 'Island pottery', code: 'GR', img: px(33557541) },
      { name: 'Pottery villages', code: 'VN', img: px(31365719) },
      { name: 'Terracotta', code: 'IN', img: px(9412408) },
      { name: 'Andalusian tiles', code: 'ES', img: px(36342685) },
      { name: 'Blue-and-white vases', code: 'CN', img: px(33393570) },
    ],
  },
  {
    title: 'Rugs, cloth & thread',
    line: 'Patterns you can read like a language.',
    tiles: [
      { name: 'Kilim rugs', code: 'TR', img: px(33653647, 'free-photo-of-colorful-traditional-turkish-kilim-pattern') },
      { name: 'Kente cloth', code: 'GH', img: px(30929475, 'free-photo-of-portrait-of-a-man-in-traditional-ghanaian-kente-cloth') },
      { name: 'Andean weaving', code: 'PE', img: px(24645287, 'free-photo-of-elderly-person-holding-embroidered-blankets') },
      { name: 'Batik', code: 'ID', img: px(34465333, 'free-photo-of-intricate-batik-cloth-with-traditional-patterns') },
      { name: 'Block printing', code: 'IN', img: px(37619027, 'free-photo-of-hand-block-printing-on-yellow-fabric') },
      { name: 'Berber rugs', code: 'MA', img: px(33282224, 'free-photo-of-traditional-moroccan-rugs-in-marrakesh-market') },
      { name: 'Persian rugs', code: 'IR', img: px(13796199) },
      { name: 'Ikat', code: 'UZ', img: px(34191411) },
      { name: 'Mayan weaving', code: 'GT', img: px(2928381) },
      { name: 'Silk saris', code: 'IN', img: px(23964630) },
      { name: 'Tartan', code: 'GB', img: px(6764920) },
      { name: 'Thai silk', code: 'TH', img: px(37179770) },
      { name: 'Turkish towels', code: 'TR', img: px(30982437) },
      { name: 'Kimono', code: 'JP', img: px(8750728) },
      { name: 'Embroidered dresses', code: 'MX', img: px(35526860) },
      { name: 'Aran knitwear', code: 'IE', img: px(33865626) },
      { name: 'Alpaca of the Andes', code: 'PE', img: px(35729525) },
    ],
  },
  {
    title: "The world's kitchen",
    line: 'Tools that have cooked a thousand years of dinners.',
    tiles: [
      { name: 'Hand-forged knives', code: 'JP', img: px(23436813, 'free-photo-of-man-holding-a-japanese-knife') },
      { name: 'Copper cezves', code: 'TR', img: px(31330206, 'free-photo-of-traditional-turkish-coffee-prepared-outdoors') },
      { name: 'Cast-iron teapots', code: 'JP', img: px(14563207) },
      { name: 'Molcajetes', code: 'MX', img: px(37215000, 'free-photo-of-gourmet-seafood-and-avocado-molcajete-feast') },
      { name: 'Paella pans', code: 'ES', img: px(26587044, 'free-photo-of-seafood-with-lime-on-pan') },
      { name: 'Mate gourds', code: 'AR', img: px(25436250, 'free-photo-of-yerba-mate-in-bombilla') },
      { name: 'Woks', code: 'CN', img: px(175754) },
      { name: 'Bamboo steamers', code: 'CN', img: px(37137709) },
      { name: 'Moka pots', code: 'IT', img: px(12122684) },
      { name: 'Tulip tea glasses', code: 'TR', img: px(16228379) },
      { name: 'Ramen bowls', code: 'JP', img: px(31418932) },
      { name: 'Granite mortars', code: 'TH', img: px(8559685) },
      { name: 'Copper pans', code: 'FR', img: px(37533988) },
      { name: 'Tortilla presses', code: 'MX', img: px(5737823) },
      { name: 'Beer steins', code: 'DE', img: px(28702296) },
      { name: 'Clay chai cups', code: 'IN', img: px(10377676) },
    ],
  },
  {
    title: 'Adornment',
    line: "Amber, jade, beadwork — worn the way it's always been worn.",
    tiles: [
      { name: 'Amber rings', code: 'PL', img: px(28856507) },
      { name: 'Jade & stone', code: 'CN', img: px(10961447) },
      { name: 'Maasai beadwork', code: 'KE', img: px(29828564) },
      { name: 'Evil-eye charms', code: 'TR', img: px(36919208) },
      { name: 'Baltic amber beads', code: 'LT', img: px(18730034) },
      { name: 'Kundan sets', code: 'IN', img: px(33154729) },
      { name: 'Jhumka earrings', code: 'IN', img: px(37601639) },
      { name: 'Pearls', code: 'JP', img: px(7514818) },
      { name: 'Bridal mehndi', code: 'IN', img: px(38230058) },
      { name: 'Silver filigree', code: 'PT', img: px(33873052) },
      { name: 'Berber silver', code: 'MA', img: px(30327970) },
      { name: 'Opals', code: 'AU', img: px(13595294) },
      { name: 'Beadwork of Accra', code: 'GH', img: px(20618742) },
      { name: 'Thai gold', code: 'TH', img: px(16853521) },
      { name: 'Taxco silver', code: 'MX', img: px(14579309) },
    ],
  },
  {
    title: 'Tea, coffee & pantry',
    line: "The world's larder, from where it actually grows.",
    tiles: [
      { name: 'Matcha', code: 'JP', img: px(8330375) },
      { name: 'The coffee ceremony', code: 'ET', img: px(30937097) },
      { name: 'Turkish delight', code: 'TR', img: px(36207188) },
      { name: 'Spice markets', code: 'IN', img: px(17870116) },
      { name: 'Olive oil', code: 'GR', img: px(25745504) },
      { name: 'Gongfu tea ware', code: 'CN', img: px(30767475, 'free-photo-of-red-chinese-teapot-set-on-dark-wooden-table') },
      { name: 'Phin coffee', code: 'VN', img: px(14226658) },
      { name: 'Saffron', code: 'IR', img: px(10487658) },
      { name: 'Vanilla', code: 'MG', img: px(14381803) },
      { name: 'Masala chai', code: 'IN', img: px(34324342) },
      { name: 'Kimchi', code: 'KR', img: px(6823262) },
      { name: 'Maple syrup', code: 'CA', img: px(17052506) },
      { name: 'Cacao', code: 'ID', img: px(6420910) },
      { name: 'Deglet Nour dates', code: 'DZ', img: px(17877978) },
      { name: 'Ceylon tea', code: 'LK', img: px(30204867) },
      { name: 'Mint tea', code: 'MA', img: px(36157389) },
    ],
  },
  {
    title: 'Light, scent & self',
    line: 'Lanterns, incense, and ten-step skincare.',
    tiles: [
      { name: 'Moroccan lanterns', code: 'MA', img: px(30208535) },
      { name: 'Temple incense', code: 'IN', img: px(20599556) },
      { name: 'Paper lanterns', code: 'CN', img: px(2161693) },
      { name: 'Hammam textiles', code: 'TR', img: px(15528975) },
      { name: 'Woven baskets', code: 'RW', img: px(29604314) },
      { name: 'K-beauty', code: 'KR', img: px(34833637) },
      { name: 'Argan oil', code: 'MA', img: px(10110225) },
      { name: 'Shea butter', code: 'GH', img: px(11284698) },
      { name: 'Salt lamps', code: 'PK', img: px(31349632) },
      { name: 'Mosaic lamps', code: 'TR', img: px(4553630) },
      { name: 'Marseille soap', code: 'FR', img: px(35305097) },
      { name: 'Rattan light', code: 'ID', img: px(31875658) },
      { name: 'Sauna culture', code: 'FI', img: px(36420270) },
      { name: 'Murano chandeliers', code: 'IT', img: px(35687707) },
      { name: 'Oud & attar', code: 'AE', img: px(36389331) },
      { name: 'Rose oil', code: 'BG', img: px(18745781) },
    ],
  },
  {
    title: 'Leather goods',
    line: 'Tanned, cut and stitched the way it always has been.',
    tiles: [
      { name: 'Fez tanneries', code: 'MA', img: px(38112321) },
      { name: 'Leather bags of the souk', code: 'MA', img: px(21326994) },
      { name: 'Babouche slippers', code: 'MA', img: px(18767555) },
      { name: 'Chouara dye pits', code: 'MA', img: px(37357057) },
      { name: 'Madrid ateliers', code: 'ES', img: px(37076986) },
      { name: 'Italian loafers', code: 'IT', img: px(20763458) },
      { name: 'Florence belts', code: 'IT', img: px(31367060) },
      { name: 'Milan workshops', code: 'IT', img: px(33495913) },
      { name: 'Gaucho leatherwork', code: 'AR', img: px(28806552) },
      { name: 'Pampas saddlery', code: 'AR', img: px(29145580) },
    ],
  },
  {
    title: 'Glass & marble',
    line: 'Blown, cut and carved by hand since before the wheel had spokes.',
    tiles: [
      { name: 'Murano glassworks', code: 'IT', img: px(12954040) },
      { name: 'Murano ateliers', code: 'IT', img: px(29893067) },
      { name: 'Bohemian crystal', code: 'CZ', img: px(30132508) },
      { name: 'Crystal stemware', code: 'CZ', img: px(37304105) },
      { name: 'Carrara marble', code: 'IT', img: px(36499164) },
      { name: 'Marble ateliers', code: 'IT', img: px(6714322) },
      { name: 'Istanbul marble', code: 'TR', img: px(12130992) },
      { name: 'Grand Bazaar lamps', code: 'TR', img: px(37497154) },
      { name: 'Cairo glass lanterns', code: 'EG', img: px(11350804) },
      { name: 'Athens marble', code: 'GR', img: px(17311595) },
    ],
  },
  {
    title: 'Furniture & woodcraft',
    line: 'No nails, no glue, no gap.',
    tiles: [
      { name: 'Kyoto joinery', code: 'JP', img: px(18848781) },
      { name: 'Japanese hand planes', code: 'JP', img: px(30907889) },
      { name: 'Danish design', code: 'DK', img: px(32392318) },
      { name: 'Copenhagen interiors', code: 'DK', img: px(12277129) },
      { name: 'Javanese teak carving', code: 'ID', img: px(34167389) },
      { name: 'Bali woodcraft', code: 'ID', img: px(13268976) },
      { name: 'Damascus marquetry', code: 'SY', img: px(38132596) },
      { name: 'Aleppo inlay boxes', code: 'SY', img: px(37178485) },
      { name: 'Versailles marquetry', code: 'FR', img: px(7873602) },
      { name: 'German joinery', code: 'DE', img: px(5974413) },
    ],
  },
  {
    title: 'Metalware',
    line: 'Iron, steel and brass, worked by hand.',
    tiles: [
      { name: 'Village forge iron', code: 'IN', img: px(34495354) },
      { name: 'Anvil work', code: 'JP', img: px(31004832) },
      { name: 'Workshop ironwork', code: 'CN', img: px(34116083) },
      { name: 'Hand-forged blades', code: 'JP', img: px(27084601) },
      { name: 'Blade sharpening', code: 'DE', img: px(9593585) },
      { name: 'Hammered brass bowl', code: 'IN', img: px(19408700) },
      { name: 'Brass artistry', code: 'TR', img: px(18711727) },
      { name: 'Brass workshop', code: 'EG', img: px(34204855) },
    ],
  },
  {
    title: 'Paper & stationery',
    line: 'Notebooks and paper treated as a craft, not a surface.',
    tiles: [
      { name: 'Handmade paper', code: 'NP', img: px(10373241) },
      { name: 'Cork oak forest', code: 'PT', img: px(36627495) },
      { name: 'Cork stoppers', code: 'PT', img: px(33054271) },
      { name: 'Red paper craft', code: 'CN', img: px(20541865) },
      { name: 'Leather journal', code: 'IT', img: px(35810927) },
      { name: 'Notebook binding', code: 'DE', img: px(30804551) },
    ],
  },
  {
    title: 'Spice & pantry staples',
    line: 'The souk, the terrace and the season, sold by the kilo.',
    tiles: [
      { name: 'Dried chilli market', code: 'IN', img: px(30387987) },
      { name: 'Chilli stalls', code: 'MX', img: px(37829754) },
      { name: 'Salt harvest', code: 'FR', img: px(2132048) },
      { name: 'Salt flats', code: 'BO', img: px(27098315) },
      { name: 'Wild honeycomb', code: 'GR', img: px(36813203) },
      { name: 'Honey jars', code: 'TR', img: px(4921856) },
      { name: 'Olive harvest', code: 'IT', img: px(36597358) },
      { name: 'Rice terraces', code: 'TH', img: px(36388173) },
      { name: 'Fermented onggi', code: 'KR', img: px(37427960) },
      { name: 'Preserves & pickles', code: 'FR', img: px(28645473) },
    ],
  },
  {
    title: 'Instruments & music',
    line: 'Built where the music comes from.',
    tiles: [
      { name: 'Instrument workshop', code: 'IN', img: px(31508160) },
      { name: 'Drum making', code: 'ML', img: px(35488978) },
      { name: 'Violin craft', code: 'ES', img: px(3853198) },
      { name: 'Luthier studio', code: 'BR', img: px(19585038) },
      { name: 'Drum craftsman', code: 'IE', img: px(32357220) },
      { name: 'Guitar making', code: 'PT', img: px(3853207) },
    ],
  },
  {
    title: 'Rituals & celebrations',
    line: 'What a culture wears and lights on its biggest days.',
    tiles: [
      { name: 'Wedding henna', code: 'IN', img: px(32315685) },
      { name: 'Wedding attire', code: 'NG', img: px(37939838) },
      { name: 'New year lanterns', code: 'CN', img: px(30569671) },
      { name: 'Lantern festival', code: 'CN', img: px(30704392) },
      { name: 'Tea by the glass', code: 'TR', img: px(31564199) },
      { name: 'Afternoon coffee', code: 'IT', img: px(36674526) },
    ],
  },
  {
    title: 'Precision craft',
    line: 'Ground, timed and cut to tolerances you cannot see.',
    tiles: [
      { name: 'Watch repair', code: 'CH', img: px(8327524) },
      { name: 'Precision timing', code: 'DE', img: px(8327755) },
      { name: 'Lens grinding', code: 'JP', img: px(5715881) },
      { name: 'Optical craft', code: 'DE', img: px(5715905) },
      { name: 'Precision machining', code: 'DE', img: px(32845661) },
      { name: 'Circuit assembly', code: 'JP', img: px(37426135) },
      { name: 'Bespoke tailoring', code: 'IT', img: px(6764997) },
      { name: 'Savile Row fitting', code: 'GB', img: px(6766284) },
    ],
  },
]

// Film previews for the VELOR LIVE rail — replaced by real streams the
// moment /api/live returns them.
const LIVE_PREVIEWS = [
  { src: 'https://videos.pexels.com/video-files/9363591/9363591-sd_360_640_25fps.mp4', flag: 'CN', t: 'Throwing the tea set', s: 'Ceramics, live from the wheel' },
  { src: 'https://videos.pexels.com/video-files/34499603/14618073_360_640_30fps.mp4', flag: 'MA', t: 'The spice souk, Marrakech', s: 'Shop the stalls as they open' },
  { src: 'https://videos.pexels.com/video-files/33350906/14200976_360_640_24fps.mp4', flag: 'PE', t: 'Alpaca, on the loom', s: 'From the Andes, as it is woven' },
  { src: 'https://videos.pexels.com/video-files/7681482/7681482-sd_360_640_25fps.mp4', flag: 'TR', t: 'Coffee, brewed on sand', s: 'Watch it made, buy the set' },
  { src: 'https://videos.pexels.com/video-files/9733033/9733033-sd_360_640_24fps.mp4', flag: 'JP', t: 'Glaze, fire, finish', s: 'From the kiln to your basket' },
  { src: 'https://videos.pexels.com/video-files/35766889/15164187_360_640_30fps.mp4', flag: 'IN', t: 'Market day', s: 'The stalls of old Delhi' },
]

const REEL_FIRST = ['CN', 'JP', 'MA', 'TR', 'IN', 'PE', 'MX', 'IT', 'KR', 'GH', 'ET', 'UZ', 'NP', 'EC', 'PT', 'VN', 'GR', 'AR', 'TH', 'NG']

const KIND_LINES: Record<string, string> = {
  'Materials': 'The stuff itself — dug, grown, tanned and fired.',
  'Techniques': 'Ways of making that took centuries to learn.',
  'Consumables': 'Eaten, drunk, used up — from where it is actually from.',
  'Forms': 'The objects a place is famous for.',
  'Rituals': 'Bought for meaning, not function.',
  'Modern industry': 'Culture is not only old.',
}

function flagOf(code: string): string {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1))
}

const css = `
.vh{background:var(--bg);color:var(--text);font-family:var(--font-body)}
.vh-annbar{background:var(--accent);color:#0b0b0b;text-align:center;padding:10px 16px;font-family:var(--font-display);font-size:13px;font-weight:600;letter-spacing:.01em}
.vh-annbar b{font-weight:700}
.vh-sellertop{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:#0b0b0b;border:2px solid var(--accent);padding:14px 22px;animation:vhPulseGlow 2.2s ease-in-out infinite}
.vh-sellertop .txt{font-family:var(--font-display);font-size:15px;font-weight:600;color:#fff;letter-spacing:.01em;max-width:70ch;line-height:1.5}
.vh-sellertop .txt b{color:var(--accent)}
.vh-sellertop .cta{background:var(--accent);color:#0b0b0b;font-weight:700;padding:11px 22px;border-radius:8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;flex-shrink:0}
@keyframes vhPulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(255,107,0,.45)}50%{box-shadow:0 0 26px 6px rgba(255,107,0,.6)}}
.vh a{color:inherit;text-decoration:none}
.vh-wrap{width:100%;margin:0;padding:0 clamp(22px,2.6vw,48px)}
.vh h1,.vh h2,.vh h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.vh section{padding:52px 0}
.vh-shead{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:8px;gap:24px}
.vh-shead h2{font-size:27px}
.vh-shead .sub{font-size:14px;color:var(--muted);margin:7px 0 0;max-width:66ch;line-height:1.6}
.vh-slink{font-size:14px;color:var(--accent) !important;flex:0 0 auto;white-space:nowrap}
.vh-drag{display:flex;gap:14px;overflow-x:auto;scrollbar-width:none;cursor:grab;padding-bottom:6px}
.vh-drag::-webkit-scrollbar{display:none}
.vh-drag.dragging{cursor:grabbing}
.vh-drag.dragging *{pointer-events:none}
.vh-livesec{background:var(--surface);border-bottom:1px solid var(--border);padding:44px 0 40px}
.vh-livehead{display:flex;align-items:baseline;gap:18px;margin-bottom:8px;flex-wrap:wrap}
.vh-livehead h1{font-size:44px;font-weight:700;letter-spacing:.04em}
.vh-livehead h1 .o{color:var(--accent)}
.vh-livedot{display:inline-flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--accent);border:1px solid rgba(255,107,0,.4);border-radius:999px;padding:6px 12px}
.vh-livedot .d{width:7px;height:7px;border-radius:50%;background:var(--accent);animation:vhpulse 1.6s infinite}
@keyframes vhpulse{0%,100%{opacity:1}50%{opacity:.3}}
.vh-livestrap{font-size:14.5px;color:var(--muted);margin:0 0 26px;max-width:64ch;line-height:1.6}
.vh-tile{position:relative;flex:0 0 218px;aspect-ratio:9/16;border-radius:14px;overflow:hidden;border:1px solid var(--border);background:var(--surface-2)}
.vh-tile video{width:100%;height:100%;object-fit:cover;display:block;opacity:.85}
.vh-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 36%,rgba(0,0,0,.78) 100%)}
.vh-chip{position:absolute;top:12px;left:12px;font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.16);border-radius:5px;padding:4px 8px;color:#fff}
.vh-chip.islive{background:var(--accent);color:#160a00;border-color:var(--accent)}
.vh-flagtag{position:absolute;top:12px;right:12px;font-size:10px;font-weight:700;letter-spacing:.08em;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.16);border-radius:4px;padding:3px 7px;color:#fff}
.vh-tile .meta{position:absolute;left:14px;right:14px;bottom:14px}
.vh-tile .meta .t{font-size:13.5px;font-weight:500;line-height:1.3;margin-bottom:5px}
.vh-tile .meta .s{font-size:11.5px;color:#c6c6cf}
.vh-swipehint{font-size:12px;color:var(--muted);margin-top:12px}
.vh-ct{position:relative;flex:0 0 216px;aspect-ratio:3/4;border-radius:14px;overflow:hidden;border:1px solid var(--border);background:var(--surface-2);transition:transform .18s,border-color .18s}
.vh-ct:hover{transform:translateY(-3px);border-color:rgba(255,107,0,.5)}
.vh-ct img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
.vh-ct:hover img{transform:scale(1.045)}
.vh-ct .meta{position:absolute;left:14px;right:14px;bottom:13px}
.vh-ct .meta .t{font-size:14.5px;font-weight:500;line-height:1.3;text-shadow:0 1px 8px rgba(0,0,0,.6)}
.vh-ct .meta .c{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#d9d9df;margin-top:4px;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.vh-ccard{flex:0 0 272px;border:1px solid rgba(255,107,0,.32);border-radius:14px;padding:20px;background:var(--surface);min-height:198px;display:flex;flex-direction:column;transition:border-color .15s, transform .15s}
.vh-ccard:hover{border-color:var(--accent);transform:translateY(-2px)}
.vh-ccard.live{border-color:rgba(46,204,113,.32)}
.vh-ccard .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;gap:10px}
.vh-ccard h3{font-size:18px;line-height:1.2}
.vh-cflag{font-size:19px;line-height:1;flex:0 0 auto}
.vh-specs{display:flex;flex-wrap:wrap;gap:6px;flex:1;align-content:flex-start}
.vh-spec{font-size:11.5px;color:var(--muted);border:1px solid var(--border);border-radius:999px;padding:4px 10px}
.vh-ccard .foot{margin-top:15px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:600}
.vh-foot-on{color:var(--green)}.vh-foot-off{color:var(--muted)}
.vh-kind{margin-bottom:34px}
.vh-kind:last-child{margin-bottom:0}
.vh-kindhead{display:flex;align-items:baseline;gap:14px;margin-bottom:14px;flex-wrap:wrap}
.vh-kindlbl{font-family:var(--font-display);font-size:17px;font-weight:500;letter-spacing:-0.01em}
.vh-kinddesc{font-size:13px;color:var(--muted)}
.vh-kindline{flex:1;height:1px;background:var(--border);align-self:center;min-width:40px}
.vh-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:10px}
.vh-sp{border:1px solid var(--border);border-radius:12px;padding:13px 15px;font-size:14px;font-weight:500;background:var(--surface);display:flex;align-items:center;gap:10px;transition:transform .13s,border-color .13s}
.vh-sp:hover{border-color:var(--accent);transform:translateY(-2px)}
.vh-sp .dotst{width:7px;height:7px;border-radius:50%;background:var(--accent);opacity:.55;flex:0 0 auto}
.vh-sp.hot .dotst{background:var(--green);opacity:1}
.vh-sp .n{font-size:11px;color:var(--muted);margin-left:auto;font-weight:400;white-space:nowrap}
.vh-sp.hot{border-color:rgba(46,204,113,.4)}
.vh-walllegend{display:flex;gap:20px;font-size:12px;color:var(--muted);margin-bottom:24px}
.vh-walllegend i{font-style:normal;margin-right:6px}
.vh-escrow{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.vh-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.vh-step{border-left:2px solid var(--border);padding-left:20px}
.vh-step.active{border-left-color:var(--green)}
.vh-step .num{font-family:var(--font-display);font-size:12px;letter-spacing:.14em;color:var(--muted);margin-bottom:10px}
.vh-step h3{font-size:17px;margin-bottom:8px}
.vh-step p{font-size:14px;color:var(--muted);line-height:1.65;margin:0}
.vh-sellband{border:1px solid rgba(255,107,0,.32);border-radius:16px;padding:26px 30px;display:flex;align-items:center;justify-content:space-between;gap:26px;background:var(--surface);flex-wrap:wrap;margin:14px 0 56px}
.vh-sellband h2{font-size:20px;margin:0 0 6px}
.vh-sellband p{font-size:13.5px;color:var(--muted);line-height:1.55;margin:0;max-width:56ch}
.vh-btn{border-radius:10px;padding:13px 24px;font-size:14px;font-weight:600;display:inline-block;background:var(--accent);color:#160a00 !important;white-space:nowrap}
@media(max-width:960px){
.vh-livehead h1{font-size:32px}
.vh-tile{flex:0 0 168px}
.vh-ct{flex:0 0 172px}
.vh-steps{grid-template-columns:1fr}
}
`

export default function HomePage() {
  const [lattice, setLattice] = useState<LatticeSummary | null>(null)
  const [streams, setStreams] = useState<LiveStream[]>([])
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/lattice').then(r => (r.ok ? r.json() : null)).then(d => { if (d) setLattice(d) }).catch(() => {})
    fetch('/api/live').then(r => (r.ok ? r.json() : null)).then(d => { if (d?.streams) setStreams(d.streams) }).catch(() => {})
  }, [])

  // Pointer-drag scroll for every rail on the page.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const cleanups: (() => void)[] = []
    root.querySelectorAll<HTMLElement>('.vh-drag').forEach(reel => {
      let down = false, startX = 0, startScroll = 0, moved = 0
      const onDown = (e: PointerEvent) => { down = true; moved = 0; startX = e.clientX; startScroll = reel.scrollLeft; reel.setPointerCapture(e.pointerId) }
      const onMove = (e: PointerEvent) => {
        if (!down) return
        const dx = e.clientX - startX
        if (Math.abs(dx) > 6) { reel.classList.add('dragging'); moved = Math.abs(dx) }
        reel.scrollLeft = startScroll - dx
      }
      const onUp = (e: PointerEvent) => { if (!down) return; down = false; reel.classList.remove('dragging'); try { reel.releasePointerCapture(e.pointerId) } catch {} }
      const onClick = (e: MouseEvent) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0 } }
      reel.addEventListener('pointerdown', onDown)
      reel.addEventListener('pointermove', onMove)
      reel.addEventListener('pointerup', onUp)
      reel.addEventListener('pointercancel', onUp)
      reel.addEventListener('click', onClick, true)
      cleanups.push(() => {
        reel.removeEventListener('pointerdown', onDown)
        reel.removeEventListener('pointermove', onMove)
        reel.removeEventListener('pointerup', onUp)
        reel.removeEventListener('pointercancel', onUp)
        reel.removeEventListener('click', onClick, true)
      })
    })
    return () => cleanups.forEach(fn => fn())
  }, [streams.length])

  // Pause off-screen video.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.target.querySelector('video')
        if (!v) return
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      })
    }, { rootMargin: '120px' })
    document.querySelectorAll('.vh-tile').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [streams.length])

  const byCode = new Map((lattice?.countries ?? []).map(c => [c.code, c]))
  const specStats = lattice?.specialities ?? {}

  const orderedCountries = (() => {
    const seen = new Set<string>()
    const out: { code: string; name: string }[] = []
    const push = (code: string) => {
      if (seen.has(code)) return
      const c = WORLD_COUNTRIES.find(w => w.code === code)
      if (!c) return
      seen.add(code)
      out.push(c)
    }
    ;(lattice?.countries ?? []).slice().sort((a, b) => b.products - a.products).forEach(c => push(c.code))
    REEL_FIRST.forEach(push)
    WORLD_COUNTRIES.forEach(c => { if (cultureHints(c.code).length) push(c.code) })
    WORLD_COUNTRIES.forEach(c => push(c.code))
    return out
  })()

  const liveOnAir = streams.filter(s => s.status === 'LIVE')

  return (
    <div className="vh" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <Link href="/sell" className="vh-annbar" style={{ display: 'block' }}>List your items on Velor <b>for free</b> — apply now, before we open to buyers on 6th August.</Link>

      

      {/* ============ VELOR LIVE — the top of the page ============ */}
      <div className="vh-livesec">
        <div className="vh-wrap">
          <div className="vh-livehead">
            <h1>VEL<span className="o">O</span>R LIVE</h1>
            <span className="vh-livedot"><span className="d" />{liveOnAir.length > 0 ? `${liveOnAir.length} on air now` : 'Channels open with our founding sellers'}</span>
          </div>
          <p className="vh-livestrap">
            The world&apos;s shopping channel. Sellers broadcast from the workshop, the market stall,
            the kitchen — you watch it made, ask anything, and buy without leaving the stream. Their
            listings sit one tap below the broadcast, selling around the clock.
          </p>
          <div className="vh-drag">
            {liveOnAir.map(s => (
              <Link key={s.id} className="vh-tile" href={`/live/${s.roomName}`}>
                {s.products[0]?.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.products[0].images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                )}
                <div className="vh-scrim" />
                <div className="vh-chip islive">LIVE</div>
                <div className="meta"><div className="t">{s.title}</div><div className="s">{s.sellerName}</div></div>
              </Link>
            ))}
            {LIVE_PREVIEWS.map(r => (
              <Link className="vh-tile" href="/live" key={r.src}>
                <video src={r.src} autoPlay muted loop playsInline preload="metadata" />
                <div className="vh-scrim" />
                <div className="vh-chip">Preview</div>
                <div className="vh-flagtag">{r.flag}</div>
                <div className="meta"><div className="t">{r.t}</div><div className="s">{r.s}</div></div>
              </Link>
            ))}
          </div>
          <div className="vh-swipehint">Drag to browse &middot; <Link href="/live" style={{ color: 'var(--accent)' }}>Open Velor Live &rarr;</Link></div>
        </div>
      </div>

      {/* ============ CULTURE REELS — the shop windows ============ */}
      {CULTURE_REELS.map((reel, ri) => (
        <section key={reel.title} style={{ paddingTop: 6, paddingBottom: 0 }}>
          <div className="vh-wrap">
            <div className="vh-shead">
              <div>
                <h2>{reel.title}</h2>
                <p className="sub">{reel.line}</p>
              </div>
              <Link className="vh-slink" href="/founding">Where it&apos;s from &rarr;</Link>
            </div>
            <div className="vh-drag">
              {reel.tiles.map(t => (
                <Link className="vh-ct" href="/founding" key={t.name + t.code}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.img}
                    alt={t.name}
                    loading="lazy"
                    onError={(e) => { const el = (e.target as HTMLElement).closest('.vh-ct') as HTMLElement | null; if (el) el.style.display = 'none' }}
                  />
                  <div className="vh-scrim" />
                  <div className="meta">
                    <div className="t">{t.name}</div>
                    <div className="c">{flagOf(t.code)} {WORLD_COUNTRIES.find(w => w.code === t.code)?.name ?? t.code}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ============ COUNTRIES ============ */}
      <section id="origins">
        <div className="vh-wrap">
          <div className="vh-shead">
            <div>
              <h2>Start with a country</h2>
              <p className="sub">Every country on earth is a channel of its own — the things it makes
              better than anywhere else, sold live and by listing. Each one switches on the moment its
              first verified seller opens it.</p>
            </div>
            <Link className="vh-slink" href="/founding">All 190 &rarr;</Link>
          </div>
          <div className="vh-drag">
            {orderedCountries.map(c => {
              const live = byCode.get(c.code)
              const isLive = !!live && live.products > 0
              const hints = cultureHints(c.code)
              return (
                <Link key={c.code} className={'vh-ccard' + (isLive ? ' live' : '')} href={isLive ? `/shop?origin=${c.code}` : '/founding'}>
                  <div className="top"><h3>{c.name}</h3><span className="vh-cflag">{flagOf(c.code)}</span></div>
                  <div className="vh-specs">{hints.slice(0, 6).map(h => <span className="vh-spec" key={h}>{h}</span>)}</div>
                  <div className={'foot ' + (isLive ? 'vh-foot-on' : 'vh-foot-off')}>
                    {isLive ? `${live!.products} product${live!.products === 1 ? '' : 's'} · shop now` : 'Opening soon'}
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="vh-swipehint">Drag to browse all 190 countries</div>
        </div>
      </section>

      {/* ============ SPECIALITIES ============ */}
      <section id="specialities" style={{ paddingTop: 0 }}>
        <div className="vh-wrap">
          <div className="vh-shead">
            <div>
              <h2>Or start with a speciality</h2>
              <p className="sub">Not departments. The things a place has spent centuries getting right —
              and the things it is good at now.</p>
            </div>
          </div>
          <div className="vh-walllegend">
            <span><i style={{ color: 'var(--green)' }}>&#9679;</i>Open now &mdash; shop it today</span>
            <span><i style={{ color: 'var(--accent)', opacity: .7 }}>&#9679;</i>Opening soon &mdash; arriving with our first sellers</span>
          </div>
          {SPECIALITY_KINDS.map(kind => {
            const terms = SPECIALITIES.filter(s => s.kind === kind)
            const sorted = [...terms].sort((a, b) => (specStats[b.term]?.products ?? 0) - (specStats[a.term]?.products ?? 0))
            return (
              <div className="vh-kind" key={kind}>
                <div className="vh-kindhead">
                  <span className="vh-kindlbl">{kind}</span>
                  <span className="vh-kinddesc">{KIND_LINES[kind]}</span>
                  <span className="vh-kindline" />
                </div>
                <div className="vh-wall">
                  {sorted.map(s => {
                    const st = specStats[s.term]
                    const claimed = !!st && st.products > 0
                    return (
                      <Link key={s.term} className={'vh-sp' + (claimed ? ' hot' : '')} href={claimed ? `/shop?speciality=${encodeURIComponent(s.term)}` : '/founding'} title={s.line}>
                        <span className="dotst" />
                        {buyerLabel(s.term)}
                        {claimed && <span className="n">{st.countries} {st.countries === 1 ? 'country' : 'countries'}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ TRUST ============ */}
      <section className="vh-escrow" id="protect">
        <div className="vh-wrap">
          <div className="vh-shead">
            <div>
              <h2>How Velor protects your money</h2>
              <p className="sub">Buying from a country you have never bought from before only works if
              the money is safe. So it is.</p>
            </div>
          </div>
          <div className="vh-steps">
            <div className="vh-step active"><div className="num">STEP 01</div><h3>You pay Velor, not the seller</h3><p>Your card is charged at checkout through Stripe. The money sits in escrow, untouched.</p></div>
            <div className="vh-step"><div className="num">STEP 02</div><h3>The seller ships, you track</h3><p>Tracking is issued the moment the parcel is collected. You watch it the whole way.</p></div>
            <div className="vh-step"><div className="num">STEP 03</div><h3>Delivery is confirmed</h3><p>Your money stayed protected the whole way. Anything wrong &mdash; open a dispute and the funds freeze immediately.</p></div>
          </div>
        </div>
      </section>

      {/* ============ THE 10% — one seller band ============ */}
      <section style={{ paddingBottom: 0 }}>
        <div className="vh-wrap">
          <div className="vh-sellband">
            <div>
              <h2>Sell it live. List it always.</h2>
              <p>Velor is a shopping channel &mdash; and sellers are the broadcasters. The first
              verified seller from each country opens it &mdash; keeping the founding badge, Pro free
              for life, and live broadcasting for life, which no standard subscription includes.
              Decision within 24 hours of your verification.</p>
            </div>
            <Link className="vh-btn" href="/apply">Apply to sell</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
