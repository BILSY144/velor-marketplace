export interface SubCategory {
  name: string;
  slug: string;
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  subcategories: SubCategory[];
}

export const CATEGORIES: Category[] = [
  {
    name: 'Home Decor',
    slug: 'home-decor',
    description: 'Elevate every room with curated decorative pieces',
    subcategories: [
      { name: 'Wall Art & Prints', slug: 'wall-art-prints' },
      { name: 'Candles & Fragrance', slug: 'candles-fragrance' },
      { name: 'Vases & Botanicals', slug: 'vases-botanicals' },
      { name: 'Mirrors & Clocks', slug: 'mirrors-clocks' },
      { name: 'Sculptures & Ornaments', slug: 'sculptures-ornaments' },
      { name: 'Cushions & Throws', slug: 'cushions-throws' },
      { name: 'Picture Frames', slug: 'picture-frames' },
    ],
  },
  {
    name: 'Kitchen & Dining',
    slug: 'kitchen-dining',
    description: 'Refined pieces for your kitchen and table',
    subcategories: [
      { name: 'Glassware & Barware', slug: 'glassware-barware' },
      { name: 'Serveware & Platters', slug: 'serveware-platters' },
      { name: 'Coffee & Tea', slug: 'coffee-tea' },
      { name: 'Kitchen Accessories', slug: 'kitchen-accessories' },
      { name: 'Table Linen', slug: 'table-linen' },
      { name: 'Cutlery & Utensils', slug: 'cutlery-utensils' },
      { name: 'Storage & Jars', slug: 'storage-jars' },
    ],
  },
  {
    name: 'Bathroom & Wellness',
    slug: 'bathroom-wellness',
    description: 'Spa-worthy essentials for your sanctuary',
    subcategories: [
      { name: 'Bath Accessories', slug: 'bath-accessories' },
      { name: 'Spa & Self-Care', slug: 'spa-self-care' },
      { name: 'Skincare Tools', slug: 'skincare-tools' },
      { name: 'Aromatherapy', slug: 'aromatherapy' },
      { name: 'Soap & Dispensers', slug: 'soap-dispensers' },
      { name: 'Towels & Robes', slug: 'towels-robes' },
    ],
  },
  {
    name: 'Jewellery & Accessories',
    slug: 'jewellery-accessories',
    description: 'Statement pieces and everyday luxury',
    subcategories: [
      { name: 'Necklaces & Pendants', slug: 'necklaces-pendants' },
      { name: 'Earrings', slug: 'earrings' },
      { name: 'Rings & Bracelets', slug: 'rings-bracelets' },
      { name: 'Hair Accessories', slug: 'hair-accessories' },
      { name: 'Bags & Wallets', slug: 'bags-wallets' },
      { name: 'Sunglasses', slug: 'sunglasses' },
      { name: 'Scarves & Wraps', slug: 'scarves-wraps' },
      { name: 'Watches', slug: 'watches' },
    ],
  },
  {
    name: 'Stationery & Office',
    slug: 'stationery-office',
    description: 'Beautiful tools for a productive life',
    subcategories: [
      { name: 'Notebooks & Journals', slug: 'notebooks-journals' },
      { name: 'Desk Accessories', slug: 'desk-accessories' },
      { name: 'Planners & Calendars', slug: 'planners-calendars' },
      { name: 'Pens & Writing', slug: 'pens-writing' },
      { name: 'Gift Wrapping', slug: 'gift-wrapping' },
      { name: 'Cards & Prints', slug: 'cards-prints' },
    ],
  },
  {
    name: 'Art & Prints',
    slug: 'art-prints',
    description: 'Original artwork and fine art prints',
    subcategories: [
      { name: 'Original Art', slug: 'original-art' },
      { name: 'Photography', slug: 'photography' },
      { name: 'Illustrations', slug: 'illustrations' },
      { name: 'Abstract', slug: 'abstract' },
      { name: 'Botanical Prints', slug: 'botanical-prints' },
      { name: 'Typography', slug: 'typography' },
    ],
  },
  {
    name: 'Outdoor & Garden',
    slug: 'outdoor-garden',
    description: 'Luxury for your outdoor living spaces',
    subcategories: [
      { name: 'Plant Pots & Planters', slug: 'plant-pots-planters' },
      { name: 'Garden Decor', slug: 'garden-decor' },
      { name: 'Outdoor Accessories', slug: 'outdoor-accessories' },
      { name: 'Picnic & Al Fresco', slug: 'picnic-al-fresco' },
      { name: 'Lanterns & Lighting', slug: 'lanterns-lighting' },
    ],
  },
  {
    name: 'Gifts & Hampers',
    slug: 'gifts-hampers',
    description: 'Thoughtful luxury gifts for every occasion',
    subcategories: [
      { name: 'Gift Sets', slug: 'gift-sets' },
      { name: 'Personalised Gifts', slug: 'personalised-gifts' },
      { name: 'Hampers', slug: 'hampers' },
      { name: 'New Baby', slug: 'new-baby' },
      { name: 'Wedding & Anniversary', slug: 'wedding-anniversary' },
      { name: 'Birthday', slug: 'birthday' },
    ],
  },
  {
    name: 'Vintage & Antiques',
    slug: 'vintage-antiques',
    description: 'Timeless pieces with history and character',
    subcategories: [
      { name: 'Ceramics & Pottery', slug: 'ceramics-pottery' },
      { name: 'Vintage Glassware', slug: 'vintage-glassware' },
      { name: 'Collectibles', slug: 'collectibles' },
      { name: 'Vintage Prints', slug: 'vintage-prints' },
      { name: 'Antique Accessories', slug: 'antique-accessories' },
    ],
  },
  {
    name: 'Lighting',
    slug: 'lighting',
    description: 'Illuminate your home with style',
    subcategories: [
      { name: 'Table Lamps', slug: 'table-lamps' },
      { name: 'Pendant & Ceiling', slug: 'pendant-ceiling' },
      { name: 'Candle Holders', slug: 'candle-holders' },
      { name: 'Fairy Lights', slug: 'fairy-lights' },
      { name: 'Wax Melts & Diffusers', slug: 'wax-melts-diffusers' },
    ],
  },
  {
    name: 'Travel & Lifestyle',
    slug: 'travel-lifestyle',
    description: 'Elevate every journey and occasion',
    subcategories: [
      { name: 'Travel Accessories', slug: 'travel-accessories' },
      { name: 'Luggage Tags & Wallets', slug: 'luggage-tags-wallets' },
      { name: 'Travel Organisers', slug: 'travel-organisers' },
      { name: 'Picnicware', slug: 'picnicware' },
    ],
  },
  {
    name: 'Books & Media',
    slug: 'books-media',
    description: 'Coffee table books and curated media',
    subcategories: [
      { name: 'Coffee Table Books', slug: 'coffee-table-books' },
      { name: 'Illustrated Books', slug: 'illustrated-books' },
    ],
  },
  {
    name: 'Pets',
    slug: 'pets',
    description: 'Luxury for your four-legged companions',
    subcategories: [
      { name: 'Pet Accessories', slug: 'pet-accessories' },
      { name: 'Pet Beds & Blankets', slug: 'pet-beds-blankets' },
      { name: 'Pet Toys', slug: 'pet-toys' },
      { name: 'Pet Bowls & Feeding', slug: 'pet-bowls-feeding' },
    ],
  },
  {
    name: 'Baby & Nursery',
    slug: 'baby-nursery',
    description: 'Beautiful pieces for little ones',
    subcategories: [
      { name: 'Nursery Decor', slug: 'nursery-decor' },
      { name: 'Baby Accessories', slug: 'baby-accessories' },
      { name: 'Soft Toys', slug: 'soft-toys' },
    ],
  },
];

// Flat list of all top-level category names (for dropdowns, filters, scouts)
export const CATEGORY_NAMES: string[] = CATEGORIES.map(c => c.name);

// All subcategory names flat
export const ALL_SUBCATEGORY_NAMES: string[] = CATEGORIES.flatMap(c =>
  c.subcategories.map(s => s.name)
);

// Get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}

// Get subcategory by slug (searches all categories)
export function getSubcategoryBySlug(slug: string): SubCategory | undefined {
  for (const cat of CATEGORIES) {
    const sub = cat.subcategories.find(s => s.slug === slug);
    if (sub) return sub;
  }
  return undefined;
}
