// Single source of truth for Velor's product category taxonomy.
// Every part of the site (GlobalHeader nav, homepage links, /shop filter,
// /marketplace filter, the dashboard Add/Edit Product category dropdown, and
// the seller application form) must import from this file rather than
// keeping its own local copy. Before this file was made canonical, at least
// six separate hardcoded copies of this list had drifted apart -- most
// seriously, /marketplace's category buttons were built from an unrelated
// nested taxonomy (Home Decor, Kitchen & Dining, etc.) that never matched
// any real Product.category value, so every category click on /marketplace
// silently returned zero products. Do not reintroduce a second copy.
//
// category name strings here are stored verbatim in Product.category (a
// plain string column, no enum) -- renaming an entry here does NOT rename
// existing rows in the database by itself.
//
// 2026-07-19 (William): replaced the old generic e-commerce taxonomy
// (Electronics, Sports & Outdoors, Toys & Games, Fitness & Gym, etc.) with
// names drawn from the culture/craft vocabulary in lib/specialities.ts and
// the homepage's CULTURE_REELS -- Velor sells real culture, not the same
// mass-produced categories as every other marketplace. The categories below
// that had real listings under the old names are migrated automatically by
// scripts/migrate-categories.mjs (runs as part of every production build,
// see package.json) -- see LEGACY_CATEGORY_MIGRATION below for the map.
//
// 2026-07-19 (William, same day, "cover all bases culturally"): added four
// categories that were genuine gaps against world craft traditions --
// Basketry & Woven Goods, Stone & Gem Carving, Folk Art/Painting/
// Calligraphy and Handcrafted Toys/Dolls/Puppets -- and gave every category
// a representative `image`, reusing verified Pexels IDs already live in
// lib/countryImagery.ts (same dataset, same honesty rule: never a fabricated
// or unverified photo). Artisan Pet Goods has no natural craft-imagery
// equivalent in that dataset, so its image is left null rather than force a
// mismatched photo -- callers must handle a null image, same as
// lib/countryImagery.ts's countryImage() already requires.
//
// 2026-07-19 (William, same day, "add clothing, beverages... give them a
// cultural sounding name like garments"): added Garments and Libations.
// This knowingly reverses this file's own prior standing rule against
// clothing in the catalogue -- an explicit, live instruction from William,
// not a silent change (flagged to him at the time). Both given real,
// verified images from lib/countryImagery.ts under the same honesty rule.

export interface CategoryImage {
  id: number
  slug: string | null
}

export interface CategoryDef {
  name: string
  slug: string
  description: string
  image: CategoryImage | null
}

export const CATEGORIES: CategoryDef[] = [
  { name: 'Ceramics & Porcelain', slug: 'ceramics-porcelain', description: "Thrown, fired and glazed by hand -- pottery and porcelain from the world's kiln towns", image: { id: 36253267, slug: 'free-photo-of-elegant-tea-set-on-traditional-chinese-table' } },
  { name: 'Rugs, Cloth & Thread', slug: 'rugs-cloth-thread', description: 'Hand-knotted rugs, woven cloth and embroidered textiles -- wool, silk and thread worked the old way', image: { id: 34343822, slug: null } },
  { name: "The World's Kitchen", slug: 'worlds-kitchen', description: 'Cookware, knives and kitchen craft -- the tools real cooking is done with, from the places that made them famous', image: { id: 23436813, slug: 'free-photo-of-man-holding-a-japanese-knife' } },
  { name: 'Adornment', slug: 'adornment', description: 'Fine and handmade jewellery, watches and wearable craft -- silver, amber and filigree from the makers who work it', image: { id: 33154729, slug: null } },
  { name: 'Tea, Coffee & Pantry', slug: 'tea-coffee-pantry', description: 'Tea, coffee and the rituals built around them -- leaves and beans from the growers, not a supermarket shelf', image: { id: 30767475, slug: 'free-photo-of-red-chinese-teapot-set-on-dark-wooden-table' } },
  { name: 'Light, Scent & Self', slug: 'light-scent-self', description: 'Skincare, perfumery and incense -- wellness and beauty traditions from where they began', image: { id: 458541, slug: null } },
  { name: 'Leather Goods', slug: 'leather-goods', description: 'Tanned, cut and stitched the slow way -- leather goods from tanneries with generations behind them', image: { id: 22434771, slug: null } },
  { name: 'Glass & Marble', slug: 'glass-marble', description: 'Blown, cut and polished -- glass and marble from the furnaces and quarries that shaped them for centuries', image: { id: 12412163, slug: null } },
  { name: 'Furniture & Woodcraft', slug: 'furniture-woodcraft', description: 'Joined, carved and finished by hand -- furniture and woodcraft built to be repaired, not replaced', image: { id: 34167389, slug: null } },
  { name: 'Metalware', slug: 'metalware', description: 'Forged, hammered and cast -- ironware, copperware and brassware from working forges', image: { id: 34495354, slug: null } },
  { name: 'Paper & Stationery', slug: 'paper-stationery', description: 'Notebooks, papers and writing craft that outlive the pen', image: { id: 35646157, slug: null } },
  { name: 'Spice & Pantry Staples', slug: 'spice-pantry-staples', description: 'Spices, oils and pantry staples straight from the growers and mills -- shelf-stable, always with an origin', image: { id: 17870116, slug: null } },
  { name: 'Instruments & Music', slug: 'instruments-music', description: 'Instruments built where the music comes from, traditional and modern', image: { id: 32490293, slug: null } },
  { name: 'Rituals & Celebrations', slug: 'rituals-celebrations', description: 'Goods built around a ritual or celebration -- what a culture wears, burns, pours or gathers around on its biggest days', image: { id: 30704392, slug: null } },
  { name: 'Precision Craft', slug: 'precision-craft', description: "Engineering, optics and electronics made to tolerances you can't see -- precision manufacturing with a home address", image: { id: 5715881, slug: null } },
  { name: 'Home Craft & Décor', slug: 'home-craft-decor', description: 'Décor, rugs, ceramics, woodwork and outdoor living -- home goods made by hand, not stamped from a mould', image: { id: 27951089, slug: null } },
  { name: 'Outdoor & Field Craft', slug: 'outdoor-field-craft', description: 'Gear and equipment for sport and the outdoors, made with real materials -- not mass-produced from the same factory as everyone else', image: { id: 29145580, slug: null } },
  { name: 'Artisan Pet Goods', slug: 'artisan-pet-goods', description: 'Handmade collars, beds and goods for cats, dogs and other companions -- crafted, not stamped out', image: null },
  { name: 'Basketry & Woven Goods', slug: 'basketry-woven-goods', description: 'Rattan, bamboo, raffia and wicker worked by hand -- baskets and woven goods from a craft older than the wheel', image: { id: 35824333, slug: null } },
  { name: 'Stone & Gem Carving', slug: 'stone-gem-carving', description: 'Cut, carved and polished -- jade, soapstone, onyx and gemstone work from the hands that read the stone', image: { id: 34675316, slug: null } },
  { name: 'Folk Art, Painting & Calligraphy', slug: 'folk-art-painting-calligraphy', description: "Painted, brushed and inked by hand -- folk art, fine painting and calligraphy carrying a culture's eye and hand", image: { id: 37584993, slug: null } },
  { name: 'Handcrafted Toys, Dolls & Puppets', slug: 'handcrafted-toys-dolls-puppets', description: 'Carved, sewn and painted for play -- dolls, puppets and toys made the way they were before a factory could', image: { id: 31268099, slug: null } },
  { name: 'Garments', slug: 'garments', description: 'Cut, woven and embroidered by hand -- clothing carrying the weight of the place that made it', image: { id: 17038246, slug: null } },
  { name: 'Libations', slug: 'libations', description: 'Wine, beer and spirits from the growers, brewers and distillers who have always made them -- poured with an origin, not a label', image: { id: 5272997, slug: null } },
]

export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name)

// Old -> new category names, used by scripts/migrate-categories.mjs to
// rename existing Product.category and SellerApplication.productCategories
// values on deploy. Not used at runtime by the app itself.
export const LEGACY_CATEGORY_MIGRATION: Record<string, string> = {
  'Electronics': 'Precision Craft',
  'Home & Garden': 'Home Craft & Décor',
  'Beauty & Health': 'Light, Scent & Self',
  'Sports & Outdoors': 'Outdoor & Field Craft',
  'Jewellery & Watches': 'Adornment',
  'Pet Supplies': 'Artisan Pet Goods',
  'Musical Instruments': 'Instruments & Music',
  'Office & Stationery': 'Paper & Stationery',
  'Specialty & Gourmet Foods': 'Spice & Pantry Staples',
}
