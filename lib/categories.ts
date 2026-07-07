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
// existing rows in the database. Only rename entries with zero live listings
// unless a data migration is run at the same time. As of 2026-07-07 the six
// categories with real listings are: Electronics, Home & Garden,
// Beauty & Health, Sports & Outdoors, Jewellery & Watches, Pet Supplies --
// do not rename these without also migrating existing Product rows.

export interface CategoryDef {
  name: string
  slug: string
  description: string
}

export const CATEGORIES: CategoryDef[] = [
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets, audio and tech accessories from sellers worldwide' },
  { name: 'Fashion', slug: 'fashion', description: 'Accessories and wearables (clothing and footwear are prohibited sitewide -- see seller agreement)' },
  { name: 'Home & Garden', slug: 'home-garden', description: 'Decor, rugs, ceramics, woodwork and outdoor living' },
  { name: 'Beauty & Health', slug: 'beauty-health', description: 'Skincare, wellness and traditional beauty products' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Equipment and gear for sport and outdoor life' },
  { name: 'Jewellery & Watches', slug: 'jewellery-watches', description: 'Fine and handmade jewellery, watches and accessories' },
  { name: 'Toys & Games', slug: 'toys-games', description: 'Toys, games and playthings for all ages' },
  { name: 'Baby & Kids', slug: 'baby-kids', description: 'Products for babies and children' },
  { name: 'Pet Supplies', slug: 'pet-supplies', description: 'Everything for cats, dogs and other pets' },
  { name: 'Automotive', slug: 'automotive', description: 'Parts, accessories and care products for vehicles' },
  { name: 'Books & Education', slug: 'books-education', description: 'Books, learning materials and educational goods' },
  { name: 'Art, Crafts & Handmade', slug: 'art-crafts-handmade', description: 'Original art, handicrafts, pottery, carvings and artisan-made goods' },
  { name: 'Musical Instruments', slug: 'musical-instruments', description: 'Instruments and music gear, from traditional handmade to modern' },
  { name: 'Office & Stationery', slug: 'office-stationery', description: 'Stationery and office supplies' },
  { name: 'Travel & Luggage', slug: 'travel-luggage', description: 'Bags, luggage and travel accessories' },
  { name: 'Specialty & Gourmet Foods', slug: 'specialty-gourmet-foods', description: 'Shelf-stable spices, tea, coffee, confections and gourmet foods (ambient-shipping only, 6+ month shelf life)' },
  { name: 'Fitness & Gym', slug: 'fitness-gym', description: 'Fitness equipment and gym accessories' },
]

export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name)
