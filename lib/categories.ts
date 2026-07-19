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

export interface CategoryDef {
  name: string
  slug: string
  description: string
}

export const CATEGORIES: CategoryDef[] = [
  { name: 'Ceramics & Porcelain', slug: 'ceramics-porcelain', description: "Thrown, fired and glazed by hand -- pottery and porcelain from the world's kiln towns" },
  { name: 'Rugs, Cloth & Thread', slug: 'rugs-cloth-thread', description: 'Hand-knotted rugs, woven cloth and embroidered textiles -- wool, silk and thread worked the old way' },
  { name: "The World's Kitchen", slug: 'worlds-kitchen', description: 'Cookware, knives and kitchen craft -- the tools real cooking is done with, from the places that made them famous' },
  { name: 'Adornment', slug: 'adornment', description: 'Fine and handmade jewellery, watches and wearable craft -- silver, amber and filigree from the makers who work it' },
  { name: 'Tea, Coffee & Pantry', slug: 'tea-coffee-pantry', description: 'Tea, coffee and the rituals built around them -- leaves and beans from the growers, not a supermarket shelf' },
  { name: 'Light, Scent & Self', slug: 'light-scent-self', description: 'Skincare, perfumery and incense -- wellness and beauty traditions from where they began' },
  { name: 'Leather Goods', slug: 'leather-goods', description: 'Tanned, cut and stitched the slow way -- leather goods from tanneries with generations behind them' },
  { name: 'Glass & Marble', slug: 'glass-marble', description: 'Blown, cut and polished -- glass and marble from the furnaces and quarries that shaped them for centuries' },
  { name: 'Furniture & Woodcraft', slug: 'furniture-woodcraft', description: 'Joined, carved and finished by hand -- furniture and woodcraft built to be repaired, not replaced' },
  { name: 'Metalware', slug: 'metalware', description: 'Forged, hammered and cast -- ironware, copperware and brassware from working forges' },
  { name: 'Paper & Stationery', slug: 'paper-stationery', description: 'Notebooks, papers and writing craft that outlive the pen' },
  { name: 'Spice & Pantry Staples', slug: 'spice-pantry-staples', description: 'Spices, oils and pantry staples straight from the growers and mills -- shelf-stable, always with an origin' },
  { name: 'Instruments & Music', slug: 'instruments-music', description: 'Instruments built where the music comes from, traditional and modern' },
  { name: 'Rituals & Celebrations', slug: 'rituals-celebrations', description: 'Goods built around a ritual or celebration -- what a culture wears, burns, pours or gathers around on its biggest days' },
  { name: 'Precision Craft', slug: 'precision-craft', description: "Engineering, optics and electronics made to tolerances you can't see -- precision manufacturing with a home address" },
  { name: 'Home Craft & Décor', slug: 'home-craft-decor', description: 'Décor, rugs, ceramics, woodwork and outdoor living -- home goods made by hand, not stamped from a mould' },
  { name: 'Outdoor & Field Craft', slug: 'outdoor-field-craft', description: 'Gear and equipment for sport and the outdoors, made with real materials -- not mass-produced from the same factory as everyone else' },
  { name: 'Artisan Pet Goods', slug: 'artisan-pet-goods', description: 'Handmade collars, beds and goods for cats, dogs and other companions -- crafted, not stamped out' },
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
