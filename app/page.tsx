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
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'

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

// HD craft films for the one PREVIEW FILM seat on each 20-seat rail.
const vf = (path: string) => `https://videos.pexels.com/video-files/${path}`
// Poster frame for a film seat -- paints instantly; the film itself only
// plays (and downloads) when the IntersectionObserver scrolls it into view.
const vp = (path: string) => `https://images.pexels.com/videos/${path}?auto=compress&cs=tinysrgb&w=800`

// The culture reels — each tile is a real cultural item with its country.
// Stock photography stands in until real listings replace it, tile by tile.
const CULTURE_REELS: {
  title: string
  line: string
  tiles: { name: string; code: string; img: string; video?: string }[]
}[] = [
  {
    title: 'Ceramics & porcelain',
    line: 'Fired in the cities that invented firing.',
    tiles: [
      { name: 'Bone china of Stoke', code: 'GB', img: px(34344653) },
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
      { name: 'Onggi jars', code: 'KR', img: px(34416819) },
      { name: 'Bukhara ceramics', code: 'UZ', img: px(29475568) },
      { name: 'Barro negro', code: 'MX', img: px(33701615) },
    ],
  },
  {
    title: 'Rugs, cloth & thread',
    line: 'Patterns you can read like a language.',
    tiles: [
      { name: 'Tweed & wool', code: 'GB', img: px(6045246) },
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
      { name: 'Suzani embroidery', code: 'UZ', img: px(29475576) },
      { name: 'Otavalo textiles', code: 'EC', img: px(18425673) },
    ],
  },
  {
    title: "The world's kitchen",
    line: 'Tools that have cooked a thousand years of dinners.',
    tiles: [
      { name: 'Fondue pots', code: 'CH', img: px(37593661) },
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
      { name: 'Olive-wood boards', code: 'TN', img: px(38368132) },
      { name: 'Karahi cookware', code: 'PK', img: px(33617984) },
      { name: 'Dallah coffee pots', code: 'SA', img: px(38036783) },
    ],
  },
  {
    title: 'Adornment',
    line: "Amber, jade, beadwork — worn the way it's always been worn.",
    tiles: [
      { name: 'Cameo & gold', code: 'IT', img: px(6154083) },
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
      { name: 'Zulu beadwork', code: 'ZA', img: px(11712568) },
      { name: 'Mompox filigree', code: 'CO', img: px(15955332) },
      { name: 'Turquoise & silver', code: 'US', img: px(33737462) },
      { name: 'Komboloi beads', code: 'GR', img: px(11591685) },
    ],
  },
  {
    title: 'Tea, coffee & pantry',
    line: "The world's larder, from where it actually grows.",
    tiles: [
      { name: 'Rooibos', code: 'ZA', img: px(6087602) },
      { name: 'Matcha', code: 'JP', img: px(8330375) },
      { name: 'The coffee ceremony', code: 'ET', img: px(38519856) },
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
      { name: 'High-mountain oolong', code: 'TW', img: px(6545351) },
      { name: 'Colombian coffee', code: 'CO', img: px(33220155) },
      { name: 'Cacao ceremony', code: 'GT', img: px(23511143) },
    ],
  },
  {
    title: 'Light, scent & self',
    line: 'Lanterns, incense, and ten-step skincare.',
    tiles: [
      { name: 'Copal incense', code: 'MX', img: px(34470673) },
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
      { name: 'Beeswax candles', code: 'PL', img: px(18921271) },
      { name: 'Diya lamps', code: 'IN', img: px(34431714) },
      { name: 'Hanji lanterns', code: 'KR', img: px(34569756) },
    ],
  },
  {
    title: 'Leather goods',
    line: 'Tanned, cut and stitched the way it always has been.',
    tiles: [
      { name: 'Maasai sandals', code: 'KE', img: px(12315973) },
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
      { name: 'Huaraches', code: 'MX', img: px(17994477) },
      { name: 'Grand Bazaar leather', code: 'TR', img: px(32398231) },
      { name: 'Jutti slippers', code: 'IN', img: px(14940419) },
      { name: 'Saddlery', code: 'GB', img: px(36744643) },
      { name: 'Boot makers', code: 'BR', img: px(6316211) },
      { name: 'Lisbon glovers', code: 'PT', img: px(17721873) },
      { name: 'Handmade shoes', code: 'ES', img: px(37165708) },
      { name: 'Western bootmakers', code: 'US', img: px(19750710) },
      { name: 'Leather ateliers', code: 'JP', img: px(33102790) },
    ],
  },
  {
    title: 'Glass & marble',
    line: 'Blown, cut and carved by hand since before the wheel had spokes.',
    tiles: [
      { name: 'Glassblowing', code: 'SE', img: px(33616351) },
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
      { name: 'Stained glass', code: 'FR', img: px(5712135) },
      { name: 'Blown glass', code: 'MX', img: px(38037223) },
      { name: 'Marble inlay of Agra', code: 'IN', img: px(35961605) },
      { name: 'Venetian mirrors', code: 'IT', img: px(32156881) },
      { name: 'Onyx ware', code: 'PK', img: px(6207347) },
      { name: 'Krobo beads', code: 'GH', img: px(7585691) },
      { name: 'Cut crystal', code: 'IE', img: px(20531140) },
      { name: 'Crystal chandeliers', code: 'AT', img: px(12024171) },
      { name: 'Glass studios', code: 'JP', img: px(33013269) },
    ],
  },
  {
    title: 'Furniture & woodcraft',
    line: 'No nails, no glue, no gap.',
    tiles: [
      { name: 'Wood carving', code: 'ES', img: px(34129551) },
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
      { name: 'Norse woodcarving', code: 'SE', img: px(37258076) },
      { name: 'Rattan weave', code: 'PH', img: px(6594391) },
      { name: 'Teak carving', code: 'TH', img: px(36492217) },
      { name: 'Zanzibar doors', code: 'TZ', img: px(16520657) },
      { name: 'Alebrijes', code: 'MX', img: px(29243522) },
      { name: 'Walnut carving of Kashmir', code: 'IN', img: px(36971734) },
      { name: 'Oak workshops', code: 'GB', img: px(37358117) },
      { name: 'Thuya marquetry', code: 'MA', img: px(33395644) },
      { name: 'Porch rockers', code: 'US', img: px(20778163) },
    ],
  },
  {
    title: 'Metalware',
    line: 'Iron, steel and brass, worked by hand.',
    tiles: [
      { name: 'Bronze casting', code: 'VN', img: px(38536586) },
      { name: 'Village forge iron', code: 'IN', img: px(34495354) },
      { name: 'Anvil work', code: 'JP', img: px(31004832) },
      { name: 'Workshop ironwork', code: 'CN', img: px(34116083) },
      { name: 'Hand-forged blades', code: 'JP', img: px(27084601) },
      { name: 'Blade sharpening', code: 'DE', img: px(9593585) },
      { name: 'Hammered brass bowl', code: 'IN', img: px(19408700) },
      { name: 'Brass artistry', code: 'TR', img: px(18711727) },
      { name: 'Brass workshop', code: 'EG', img: px(34204855) },
      { name: 'Copper of Santa Clara', code: 'MX', img: px(9362579) },
      { name: 'Coppersmiths of Gaziantep', code: 'TR', img: px(34534188) },
      { name: 'Pewter', code: 'MY', img: px(34969871) },
      { name: 'Engraved brass', code: 'IN', img: px(35226350) },
      { name: 'Bronzeware', code: 'TH', img: px(7001922) },
      { name: 'Wrought iron', code: 'ES', img: px(32185454) },
      { name: 'The forge', code: 'GB', img: px(34503350) },
      { name: 'Axe & anvil', code: 'SE', img: px(33305598) },
      { name: 'Cowbells', code: 'CH', img: px(28615960) },
      { name: 'Singing bowls', code: 'NP', img: px(3544322) },
      { name: 'Silverwork', code: 'PE', img: px(33834689) },
    ],
  },
  {
    title: 'Paper & stationery',
    line: 'Notebooks and paper treated as a craft, not a surface.',
    tiles: [
      { name: 'Fountain pens', code: 'DE', img: px(261719) },
      { name: 'Handmade paper', code: 'NP', img: px(10373241) },
      { name: 'Cork oak forest', code: 'PT', img: px(36627495) },
      { name: 'Cork stoppers', code: 'PT', img: px(33054271) },
      { name: 'Red paper craft', code: 'CN', img: px(20541865) },
      { name: 'Leather journal', code: 'IT', img: px(35810927) },
      { name: 'Notebook binding', code: 'DE', img: px(30804551) },
      { name: 'Washi', code: 'JP', img: px(8280873) },
      { name: 'Papyrus', code: 'EG', img: px(15850552) },
      { name: 'Ebru marbling', code: 'TR', img: px(36849960) },
      { name: 'Florentine paper', code: 'IT', img: px(31624717) },
      { name: 'Letterpress', code: 'GB', img: px(4140908) },
      { name: 'Calligraphy brushes', code: 'CN', img: px(36171312) },
      { name: 'Printing blocks', code: 'IN', img: px(34112721) },
      { name: 'Quills & inks', code: 'FR', img: px(17280214) },
      { name: 'Wax seals', code: 'AT', img: px(36824939) },
      { name: 'Origami', code: 'JP', img: px(36324637) },
      { name: 'Wycinanki cutouts', code: 'PL', img: px(8879956) },
      { name: 'Papel picado', code: 'MX', img: px(29298480) },
      { name: 'Paper umbrellas', code: 'TH', img: px(28516216) },
    ],
  },
  {
    title: 'Spice & pantry staples',
    line: 'The souk, the terrace and the season, sold by the kilo.',
    tiles: [
      { name: 'Pimentón', code: 'ES', img: px(33440709) },
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
      { name: 'Ceylon cinnamon', code: 'LK', img: px(5475175) },
      { name: 'Kampot pepper', code: 'KH', img: px(36292680) },
      { name: 'Harissa', code: 'TN', img: px(37461272) },
      { name: "Za'atar", code: 'LB', img: px(35514632) },
      { name: 'Sichuan pepper', code: 'CN', img: px(4160104) },
      { name: 'Miso & soy barrels', code: 'JP', img: px(6711649) },
      { name: 'Turmeric', code: 'IN', img: px(6808985) },
      { name: 'Paprika', code: 'HU', img: px(5769805) },
      { name: 'Ras el hanout', code: 'MA', img: px(35659931) },
    ],
  },
  {
    title: 'Instruments & music',
    line: 'Built where the music comes from.',
    tiles: [
      { name: 'Flamenco', code: 'ES', img: px(32012065) },
      { name: 'Instrument workshop', code: 'IN', img: px(31508160) },
      { name: 'Drum making', code: 'ML', img: px(35488978) },
      { name: 'Violin craft', code: 'ES', img: px(3853198) },
      { name: 'Luthier studio', code: 'BR', img: px(19585038) },
      { name: 'Drum craftsman', code: 'IE', img: px(32357220) },
      { name: 'Guitar making', code: 'PT', img: px(3853207) },
      { name: 'Cremona violins', code: 'IT', img: px(15058936) },
      { name: 'Kora', code: 'SN', img: px(36150845) },
      { name: 'Taiko drums', code: 'JP', img: px(30642901) },
      { name: 'Bagpipes', code: 'GB', img: px(32511793) },
      { name: 'Oud making', code: 'TR', img: px(35259636) },
      { name: 'Steelpan', code: 'TT', img: px(8866164) },
      { name: 'Didgeridoo', code: 'AU', img: px(31597128) },
      { name: 'Andean panpipes', code: 'PE', img: px(31843111) },
      { name: 'Gamelan', code: 'ID', img: px(37076115) },
      { name: 'Mbira', code: 'ZW', img: px(6252130) },
      { name: 'Handpan', code: 'CH', img: px(7970276) },
      { name: 'Irish harps', code: 'IE', img: px(33605476) },
      { name: 'Accordions', code: 'DE', img: px(8520168) },
    ],
  },
  {
    title: 'Rituals & celebrations',
    line: 'What a culture wears and lights on its biggest days.',
    tiles: [
      { name: 'Lantern nights', code: 'TH', img: px(32753307) },
      { name: 'Wedding henna', code: 'IN', img: px(32315685) },
      { name: 'Wedding attire', code: 'NG', img: px(37939838) },
      { name: 'New year lanterns', code: 'CN', img: px(30569671) },
      { name: 'Lantern festival', code: 'CN', img: px(30704392) },
      { name: 'Tea by the glass', code: 'TR', img: px(31564199) },
      { name: 'Afternoon coffee', code: 'IT', img: px(36674526) },
      { name: 'Dia de Muertos', code: 'MX', img: px(18950636) },
      { name: 'Holi pigments', code: 'IN', img: px(36425051) },
      { name: 'Hanami', code: 'JP', img: px(12527586) },
      { name: 'Carnival', code: 'BR', img: px(36304748) },
      { name: 'Venetian masks', code: 'IT', img: px(30926717) },
      { name: 'Ramadan lanterns', code: 'EG', img: px(2233416) },
      { name: 'Midsummer wreaths', code: 'SE', img: px(17661191) },
      { name: 'Nowruz table', code: 'IR', img: px(7157630) },
      { name: 'Festivals of Cape Coast', code: 'GH', img: px(33798119) },
      { name: 'Wayang kulit', code: 'ID', img: px(37659947) },
      { name: 'Semana Santa', code: 'ES', img: px(31715522) },
      { name: 'Maori heritage', code: 'NZ', img: px(6492113) },
      { name: 'Oktoberfest', code: 'DE', img: px(34071574) },
    ],
  },
  {
    title: 'Precision craft',
    line: 'Ground, timed and cut to tolerances you cannot see.',
    tiles: [
      { name: 'Eyewear ateliers', code: 'IT', img: px(5202049) },
      { name: 'Watch repair', code: 'CH', img: px(8327524) },
      { name: 'Precision timing', code: 'DE', img: px(8327755) },
      { name: 'Lens grinding', code: 'JP', img: px(5715881) },
      { name: 'Optical craft', code: 'DE', img: px(5715905) },
      { name: 'Precision machining', code: 'DE', img: px(32845661) },
      { name: 'Circuit assembly', code: 'JP', img: px(37426135) },
      { name: 'Bespoke tailoring', code: 'IT', img: px(6764997) },
      { name: 'Savile Row fitting', code: 'GB', img: px(6766284) },
      { name: 'Globe makers', code: 'GB', img: px(36109366) },
      { name: 'Watch movements', code: 'CH', img: px(34182730) },
      { name: "Navigators' instruments", code: 'PT', img: px(19954149) },
      { name: 'Diamond cutters', code: 'BE', img: px(13648409) },
      { name: 'Piano tuners', code: 'AT', img: px(29039292) },
      { name: 'Kintsugi', code: 'JP', img: px(38045469) },
      { name: 'Couture ateliers', code: 'FR', img: px(18181981) },
      { name: '3D printing', code: 'US', img: px(30658383) },
      { name: 'Semiconductors', code: 'TW', img: px(37052613) },
      { name: 'Robotics', code: 'KR', img: px(36564994) },
      { name: 'Camera & lens craft', code: 'SE', img: px(29293968) },
    ],
  },
  {
    title: 'Home Craft & Décor',
    line: 'What a home is dressed in — woven, stitched and carried by hand.',
    tiles: [
      { name: 'Bamboo & rattan homeware', code: 'VN', img: px(27951089) },
      { name: 'Kalaga tapestry', code: 'MM', img: px(36874770) },
      { name: 'Nakshi kantha quilts', code: 'BD', img: px(38155158) },
      { name: 'Felt wool crafts', code: 'NP', img: px(35698172) },
      { name: 'Woven wall hangings', code: 'KZ', img: px(28213960) },
      { name: 'Shyrdak felt rugs', code: 'KG', img: px(34787523) },
      { name: 'Gold-thread embroidery', code: 'UZ', img: px(9850827) },
      { name: 'Hand-knotted Turkmen carpets', code: 'TM', img: px(20702125) },
      { name: 'Carpets & rugs', code: 'AM', img: px(38375347) },
      { name: 'Carpets & rugs', code: 'AZ', img: px(18443836) },
      { name: 'Wool carpets', code: 'GE', img: px(35964344) },
      { name: 'Hand-knotted carpets', code: 'AF', img: px(15042625) },
      { name: 'Leather goods & cushions', code: 'MR', img: px(35669659) },
      { name: 'Patchwork quilts', code: 'LR', img: px(37375678) },
      { name: 'Linen & table textiles', code: 'FR', img: px(34111879) },
      { name: 'Madeira embroidery', code: 'PT', img: px(27855363) },
      { name: 'Embroidery (St. Gallen)', code: 'CH', img: px(20189607) },
      { name: 'Petit-point embroidery', code: 'AT', img: px(11800065) },
      { name: 'Lace', code: 'BE', img: px(29265362) },
      { name: 'Nandutí lace', code: 'PY', img: px(12416646) },
    ],
  },
  {
    title: 'Outdoor & Field Craft',
    line: 'Built for the field, the ranch and the road, with a real place of origin.',
    tiles: [
      { name: 'Ger (yurt) textiles', code: 'MN', img: px(4321588) },
      { name: 'Wool blankets', code: 'IE', img: px(20155814) },
      { name: 'Wool blankets', code: 'SE', img: px(6633533) },
      { name: 'Sheepskin & wool goods', code: 'IS', img: px(18268599) },
      { name: 'Hammocks', code: 'MX', img: px(11291049) },
      { name: 'Wool blankets', code: 'GT', img: px(8536227) },
      { name: 'Hammocks', code: 'BR', img: px(36708156) },
      { name: 'Gaucho leather & saddlery', code: 'AR', img: px(29907116) },
      { name: 'Leather goods & saddlery', code: 'AR', img: px(16894035) },
      { name: 'Woven hammocks', code: 'PY', img: px(13154940) },
      { name: 'Sheepskin (ugg) goods', code: 'AU', img: px(28896473) },
      { name: 'Wool blankets & sheepskin', code: 'NZ', img: px(35964340) },
      { name: 'Coir rope craft', code: 'MV', img: px(33053216) },
      { name: 'Loden wool coats', code: 'AT', img: px(34476851) },
      { name: 'Wool mittens & socks', code: 'LT', img: px(35902225) },
    ],
  },
  {
    title: 'Basketry & Woven Goods',
    line: 'Rattan, bamboo and raffia, worked into something that holds its shape.',
    tiles: [
      { name: 'Woven baskets', code: 'ID', img: px(35824333) },
      { name: 'Rattan & wicker bags', code: 'TH', img: px(36006474) },
      { name: 'Rattan & mengkuang weaving', code: 'MY', img: px(32338533) },
      { name: 'Rattan & wicker furniture', code: 'PH', img: px(26793170) },
      { name: 'Woven baskets', code: 'PH', img: px(20383034) },
      { name: 'Woven baskets', code: 'KH', img: px(26796680) },
      { name: 'Rattan & bamboo craft', code: 'LA', img: px(26754375) },
      { name: 'Sadu weaving', code: 'SA', img: px(24415227) },
      { name: 'Sadu weaving', code: 'AE', img: px(15332112) },
      { name: 'Sadu Bedouin weaving', code: 'KW', img: px(31853353) },
      { name: 'Coiled raffia baskets', code: 'UG', img: px(17682680) },
      { name: 'Bolga baskets', code: 'GH', img: px(36537041) },
      { name: 'Basketry', code: 'BF', img: px(20312886) },
      { name: 'Raffia craft', code: 'SL', img: px(4441604) },
      { name: 'Woven Binga baskets', code: 'ZW', img: px(38483283) },
      { name: 'Raffia weaving & bags', code: 'MG', img: px(5760149) },
      { name: 'Willow basketry', code: 'BY', img: px(29613233) },
      { name: 'Tibisiri straw baskets', code: 'GY', img: px(34667143) },
      { name: 'Junco-palm weaving', code: 'HN', img: px(13719440) },
      { name: 'Voivoi mat & basket weaving', code: 'FJ', img: px(36319637) },
    ],
  },
  {
    title: 'Stone & Gem Carving',
    line: 'Cut, carved and polished — stone that outlasts the hand that shaped it.',
    tiles: [
      { name: 'Jade jewellery', code: 'MM', img: px(34675316) },
      { name: 'Blue sapphires & gems', code: 'LK', img: px(37702995) },
      { name: 'Gemstone jewellery', code: 'NP', img: px(5409535) },
      { name: 'Onyx & marble ware', code: 'PK', img: px(19825031) },
      { name: 'Khachkar stone motifs', code: 'AM', img: px(31837414) },
      { name: 'Soapstone (Kisii) carving', code: 'KE', img: px(11235398) },
      { name: 'Verdite & serpentine carving', code: 'ZW', img: px(9814103) },
      { name: 'Emerald jewellery', code: 'ZM', img: px(32988525) },
      { name: 'Semi-precious gemstones', code: 'NA', img: px(11215780) },
      { name: 'Mbigou stone carving', code: 'GA', img: px(8374424) },
      { name: 'Soapstone carving', code: 'LR', img: px(28263404) },
      { name: 'Gemstone jewellery', code: 'BR', img: px(34444069) },
      { name: 'Inuit soapstone carving', code: 'CA', img: px(5874078) },
      { name: 'Amethyst & jade', code: 'CA', img: px(4040611) },
      { name: 'Opal & pearl jewellery', code: 'AU', img: px(16461255) },
      { name: 'Lapis lazuli jewellery', code: 'AF', img: px(16512700) },
      { name: 'Turquoise jewellery', code: 'IR', img: px(4741611) },
      { name: 'Amethyst & agate jewellery', code: 'UY', img: px(7256626) },
      { name: 'Pearl jewellery', code: 'PH', img: px(9428788) },
      { name: 'Obsidian & silver jewellery', code: 'AM', img: px(38178510) },
    ],
  },
  {
    title: 'Folk Art, Painting & Calligraphy',
    line: 'Painted, brushed and inked — a culture\'s eye, on paper and wall.',
    tiles: [
      { name: 'Thangka painting', code: 'NP', img: px(37584993) },
      { name: 'Thangka painting', code: 'BT', img: px(11429488) },
      { name: 'Embroidered art', code: 'VN', img: px(36630562) },
      { name: 'Rickshaw art', code: 'BD', img: px(37529633) },
      { name: 'Ala-kiyiz felt art', code: 'KG', img: px(14917793) },
      { name: 'Miniature painting', code: 'UZ', img: px(35087824) },
      { name: 'Enamel art', code: 'GE', img: px(30359616) },
      { name: 'Mosaic art', code: 'JO', img: px(20859048) },
      { name: 'Papyrus art', code: 'EG', img: px(29822063) },
      { name: 'Tingatinga painting', code: 'TZ', img: px(5928186) },
      { name: 'Imigongo geometric art', code: 'RW', img: px(31377141) },
      { name: 'Adinkra stamped prints', code: 'GH', img: px(18789516) },
      { name: 'Byzantine icon art', code: 'GR', img: px(37844517) },
      { name: 'Rosemåling folk art', code: 'NO', img: px(37080635) },
      { name: 'Wycinanki papercut art', code: 'PL', img: px(7695298) },
      { name: 'Martenitsa craft', code: 'BG', img: px(36879819) },
      { name: 'Icon art', code: 'BG', img: px(35545009) },
      { name: 'Licitar heart craft', code: 'HR', img: px(15215473) },
      { name: 'Painted beehive panels', code: 'SI', img: px(31921189) },
      { name: 'Retablo folk art', code: 'PE', img: px(5503299) },
    ],
  },
  {
    title: 'Handcrafted Toys, Dolls & Puppets',
    line: 'Carved and sewn for play, the way it was before a factory could.',
    tiles: [
      { name: 'Kokeshi dolls', code: 'JP', img: px(31268099) },
      { name: 'Wayang puppets', code: 'ID', img: px(36660925) },
      { name: 'Wau kite craft', code: 'MY', img: px(38228345) },
      { name: 'Marionette puppets', code: 'MM', img: px(17246961) },
      { name: 'Glove puppetry crafts', code: 'TW', img: px(9114436) },
      { name: 'Marionette puppets', code: 'CZ', img: px(35052904) },
      { name: 'Marionettes & wooden toys', code: 'CZ', img: px(7511711) },
      { name: 'Corn-husk dolls', code: 'SK', img: px(5105650) },
      { name: 'Motanka dolls', code: 'UA', img: px(14364797) },
      { name: 'Matryoshka dolls', code: 'RU', img: px(19041395) },
      { name: 'Faceless Limé dolls', code: 'DO', img: px(38286862) },
      { name: 'Backgammon boards', code: 'TR', img: px(32549758) },
      { name: 'Backgammon (tavli)', code: 'GR', img: px(10129694) },
      { name: 'Nutcrackers', code: 'DE', img: px(29992262) },
      { name: 'Woodcraft nutcrackers', code: 'AT', img: px(13005858) },
    ],
  },
  {
    title: 'Garments',
    line: 'Worn the way it\'s always been worn, cut and sewn by hand.',
    tiles: [
      { name: 'Silk robes & qipao', code: 'CN', img: px(17038246) },
      { name: 'Hanbok accessories', code: 'KR', img: px(31743254) },
      { name: 'Ao dai silk', code: 'VN', img: px(36656437) },
      { name: 'Conical hats', code: 'VN', img: px(35263326) },
      { name: 'Kashmiri pashmina shawls', code: 'IN', img: px(37921733) },
      { name: 'Deel robes', code: 'MN', img: px(9466045) },
      { name: 'Telpek wool hats', code: 'TM', img: px(5129110) },
      { name: 'Bisht cloaks', code: 'SA', img: px(34171677) },
      { name: 'Batik & sarong craft', code: 'SG', img: px(37854210) },
      { name: 'Habesha woven dresses', code: 'ET', img: px(37733601) },
      { name: 'Mokorotlo woven hats', code: 'LS', img: px(11345982) },
      { name: 'Bespoke tailoring', code: 'GB', img: px(35598778) },
      { name: 'Dirndl & trachten', code: 'AT', img: px(34469158) },
      { name: 'Vyshyvanka embroidery', code: 'UA', img: px(12315946) },
      { name: 'Embroidered huipiles', code: 'MX', img: px(16654423) },
      { name: 'Backstrap-woven huipiles', code: 'GT', img: px(36525946) },
      { name: 'Chullo hats', code: 'PE', img: px(16963295) },
      { name: 'Montecristi Panama hats', code: 'EC', img: px(35874624) },
      { name: 'Sombrero vueltiao hats', code: 'CO', img: px(4718422) },
      { name: 'Guayabera shirts', code: 'CU', img: px(34047373) },
    ],
  },
  {
    title: 'Libations',
    line: 'Poured, brewed and distilled where the recipe was actually invented.',
    tiles: [
      { name: 'Qvevri wine & ware', code: 'GE', img: px(5272997) },
      { name: 'Barako coffee', code: 'PH', img: px(14346278) },
      { name: 'Grogue sugarcane spirit', code: 'CV', img: px(28575157) },
      { name: 'Wine & pantry', code: 'ZA', img: px(14661495) },
      { name: 'Rum & sugar pantry', code: 'MU', img: px(17541188) },
      { name: 'Wine & cheese pantry', code: 'FR', img: px(8350083) },
      { name: 'Whiskey & pantry', code: 'IE', img: px(36709071) },
      { name: 'Wine ware', code: 'LI', img: px(32795634) },
      { name: 'Beer & brewing ware', code: 'BE', img: px(10322549) },
      { name: 'Beer & pantry', code: 'CZ', img: px(15269349) },
      { name: 'Tokaji wine ware', code: 'HU', img: px(36796549) },
      { name: 'Rakija ware', code: 'RS', img: px(33878971) },
      { name: 'Raki & pantry', code: 'AL', img: px(16556212) },
      { name: 'Wine & pantry', code: 'AR', img: px(17313073) },
      { name: 'Wine & pantry', code: 'CL', img: px(34004184) },
      { name: 'Rum & pantry', code: 'VE', img: px(19793610) },
      { name: 'Rum & pantry', code: 'CU', img: px(16845305) },
      { name: 'Rum & pantry', code: 'JM', img: px(15101594) },
      { name: 'Ice-wine ware', code: 'CA', img: px(4641420) },
      { name: 'Wine & pantry', code: 'AU', img: px(32792880) },
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
  // The 15 HD craft films (William, 2026-07-17: "added to the velor live
  // reel at the top"). Craft-generic footage carries NO flag tag -- claiming
  // a country on it would be a fabricated origin (LAW #1).
  { src: vf('12681572/12681572-hd_1920_1080_24fps.mp4'), flag: '', t: 'Thrown on the wheel', s: 'Ceramics, live from the wheel' },
  { src: vf('32655899/13923463_1280_720_25fps.mp4'), flag: '', t: 'On the loom', s: 'Weaving, thread by thread' },
  { src: vf('34711974/14713477_720_1280_30fps.mp4'), flag: '', t: 'The wok, live', s: 'Street kitchens at full flame' },
  { src: vf('35822699/15189596_1280_720_25fps.mp4'), flag: '', t: "The goldsmith's bench", s: 'Jewellery, made by hand' },
  { src: vf('8507896/8507896-hd_1080_1920_25fps.mp4'), flag: '', t: 'The pour', s: 'Tea, poured properly' },
  { src: vf('6748677/6748677-hd_1920_1080_25fps.mp4'), flag: '', t: 'Candle making', s: 'Light, poured and set' },
  { src: vf('34740027/14727180_1280_720_30fps.mp4'), flag: '', t: 'Saddle stitch', s: 'Leather, sewn by hand' },
  { src: vf('7519297/7519297-hd_720_1366_25fps.mp4'), flag: '', t: 'Glass, blown', s: 'Shaped in fire' },
  { src: vf('37789666/16029515_1280_720_59fps.mp4'), flag: '', t: 'Carved by hand', s: 'Wood, worked in daylight' },
  { src: vf('31638148/13478949_1280_720_24fps.mp4'), flag: '', t: 'The forge, live', s: 'Iron, struck while hot' },
  { src: vf('7344854/7344854-hd_1080_1920_25fps.mp4'), flag: '', t: 'Ink & nib', s: 'Writing, the slow way' },
  { src: vf('36147273/15329473_1280_720_25fps.mp4'), flag: '', t: 'The spice souk', s: 'Sold by the kilo' },
  { src: vf('37864529/16064058_1366_720_50fps.mp4'), flag: '', t: 'The luthier', s: 'A violin takes shape' },
  { src: vf('28987854/12538074_1280_720_24fps.mp4'), flag: '', t: 'Lantern night', s: 'Festivals after dark' },
  { src: vf('8322334/8322334-hd_1366_720_25fps.mp4'), flag: '', t: 'The watchmaker', s: 'Seconds, by hand' },
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
.vh-ct{position:relative;flex:0 0 216px;border-radius:12px;overflow:hidden;border:1px solid var(--border);background:var(--surface);transition:transform .18s,border-color .18s;text-decoration:none;color:inherit}
.vh-ct:hover{transform:translateY(-3px);border-color:rgba(255,107,0,.5)}
.vh-ct .ph{position:relative;aspect-ratio:1;overflow:hidden;background:var(--surface-2)}
.vh-ct .ph img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
.vh-ct .ph video{width:100%;height:100%;object-fit:cover;display:block}
.vh-ct:hover .ph img{transform:scale(1.045)}
.vh-ct .ph .ribbon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);background:var(--accent);color:#160a00;font-size:11px;font-weight:800;letter-spacing:.06em;padding:6px 64px;white-space:nowrap}
.vh-ct .cap{padding:12px 14px}
.vh-ct .cap .k{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
.vh-ct .cap .t{font-family:var(--font-serif);font-size:14px;font-weight:600;line-height:1.3}
.vh-ct .cap .pr{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
.vh-ct .cap .p{font-size:15px;font-weight:700;font-family:Space Grotesk,sans-serif;color:var(--muted)}
.vh-ct .cap .s{font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
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
  const { symbol } = useCurrencyDisplay()
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
      // Deferred capture (2026-07-17, same permanent dead-tap fix as
      // CountryOriginStrip): capturing on pointerdown makes the browser
      // retarget the click away from the tile's link, so taps intermittently
      // opened nothing -- worst on touch, where finger wobble past the old
      // 6px threshold silently turned taps into drags. Capture only once a
      // real drag has started; a plain tap keeps its fully native click.
      const onDown = (e: PointerEvent) => { down = true; moved = 0; startX = e.clientX; startScroll = reel.scrollLeft }
      const onMove = (e: PointerEvent) => {
        if (!down) return
        const dx = e.clientX - startX
        const threshold = e.pointerType === 'mouse' ? 6 : 14
        if (moved === 0 && Math.abs(dx) <= threshold) return
        if (moved === 0) { reel.classList.add('dragging'); try { reel.setPointerCapture(e.pointerId) } catch {} }
        moved = Math.abs(dx)
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
    document.querySelectorAll('.vh-tile, .vh-film').forEach(el => io.observe(el))
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
                {r.flag ? <div className="vh-flagtag">{r.flag}</div> : null}
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
                <Link className={'vh-ct' + (t.video ? ' vh-film' : '')} href="/founding" key={t.name + t.code}>
                  {/* ID-card layout (William, 2026-07-17): same framed card as the
                      country-page seat grid -- image pane with the "Your goods
                      here" ribbon, then a caption block. These stay examples
                      until real sellers claim the seats. Each rail is exactly 20
                      seats (William, 2026-07-17) -- reserved for the top 20
                      performing sellers; the film seat is labelled PREVIEW FILM
                      with no country claim (footage is craft-generic, LAW #1). */}
                  <div className="ph">
                    {t.video ? (
                      <video src={t.video} poster={t.img} muted loop playsInline preload="none" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={t.img}
                        alt={t.name}
                        loading="lazy"
                        onError={(e) => { const el = (e.target as HTMLElement).closest('.vh-ct') as HTMLElement | null; if (el) el.style.display = 'none' }}
                      />
                    )}
                    <div className="ribbon">{t.video ? 'Preview' : 'Your goods here'}</div>
                  </div>
                  <div className="cap">
                    <div className="k">{t.video ? 'PREVIEW FILM' : <>{flagOf(t.code)} {WORLD_COUNTRIES.find(w => w.code === t.code)?.name ?? t.code}</>}</div>
                    <div className="t">{t.name}</div>
                    <div className="pr"><span className="p">{symbol}0.00</span><span className="s">Seller name</span></div>
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
              for life — every Pro benefit, permanently, including Velor Live broadcasting.
              Decision within 24 hours of your verification.</p>
            </div>
            <Link className="vh-btn" href="/apply">Apply to sell</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
