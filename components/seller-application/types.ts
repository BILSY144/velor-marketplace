// Shared types for the seller-application wizard. Field names match
// app/api/seller/apply/route.ts exactly. Do not rename these fields without
// changing the live endpoint and database mapping at the same time.

export type SellerType = 'individual' | 'business';

export type FormState = {
  prospectId: string;
  businessName: string;
  sellerType: SellerType | '';
  contactName: string;
  contactEmail: string;
  password: string;
  website: string;
  storeDescription: string;
  productCategories: string[];
  sampleImages: string[];
  shippingCountry: string;
  shippingName: string;
  shippingCompany: string;
  shippingPhone: string;
  shippingStreet1: string;
  shippingStreet2: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
};

export const initialForm: FormState = {
  prospectId: '',
  businessName: '',
  sellerType: 'individual',
  contactName: '',
  contactEmail: '',
  password: '',
  website: '',
  storeDescription: '',
  productCategories: [],
  sampleImages: [],
  shippingCountry: '',
  shippingName: '',
  shippingCompany: '',
  shippingPhone: '',
  shippingStreet1: '',
  shippingStreet2: '',
  shippingCity: '',
  shippingState: '',
  shippingZip: '',
};

export const MAX_CATEGORIES = 3;

export const PRODUCT_CATEGORY_OPTIONS = [
  'Ceramics & Pottery',
  'Rugs, Cloth & Thread',
  "The World's Kitchen",
  'Adornment & Jewellery',
  'Tea, Coffee & Pantry',
  'Light, Scent & Self',
  'Leather Goods',
  'Glass & Marble',
  'Furniture & Woodcraft',
  'Metalware',
  'Paper & Stationery',
  'Spice & Pantry Staples',
  'Instruments & Music',
  'Rituals & Celebrations',
  'Precision Craft',
  'Home Craft & Décor',
  'Outdoor & Field Craft',
  'Basketry & Woven Goods',
  'Stone & Gem Carving',
  'Folk Art, Painting & Calligraphy',
  'Handcrafted Toys, Dolls & Puppets',
  'Garments',
] as const;

export const COUNTRY_OPTIONS = [
  ['GB', 'United Kingdom'], ['US', 'United States'], ['CA', 'Canada'],
  ['AU', 'Australia'], ['NZ', 'New Zealand'], ['IE', 'Ireland'],
  ['FR', 'France'], ['DE', 'Germany'], ['IT', 'Italy'], ['ES', 'Spain'],
  ['PT', 'Portugal'], ['NL', 'Netherlands'], ['BE', 'Belgium'],
  ['AT', 'Austria'], ['CH', 'Switzerland'], ['SE', 'Sweden'],
  ['NO', 'Norway'], ['DK', 'Denmark'], ['FI', 'Finland'],
  ['PL', 'Poland'], ['CZ', 'Czechia'], ['GR', 'Greece'], ['TR', 'Türkiye'],
  ['MA', 'Morocco'], ['EG', 'Egypt'], ['ZA', 'South Africa'], ['NG', 'Nigeria'],
  ['KE', 'Kenya'], ['GH', 'Ghana'], ['IN', 'India'], ['PK', 'Pakistan'],
  ['BD', 'Bangladesh'], ['NP', 'Nepal'], ['LK', 'Sri Lanka'], ['CN', 'China'],
  ['JP', 'Japan'], ['KR', 'South Korea'], ['TH', 'Thailand'], ['VN', 'Vietnam'],
  ['ID', 'Indonesia'], ['PH', 'Philippines'], ['MX', 'Mexico'], ['BR', 'Brazil'],
  ['AR', 'Argentina'], ['CL', 'Chile'], ['CO', 'Colombia'], ['PE', 'Peru'],
] as const;

export const STEPS = [
  { n: 1, label: 'About You', hint: 'Tell us who you are' },
  { n: 2, label: 'Your Store', hint: 'Tell the world your story' },
  { n: 3, label: 'Shipping', hint: 'Where your parcels begin' },
  { n: 4, label: 'Finish', hint: 'Review & launch' },
] as const;
