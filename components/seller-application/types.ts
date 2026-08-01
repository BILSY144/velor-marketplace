// Shared types for the seller-application wizard. Field names match
// app/api/seller/apply/route.ts exactly (businessName, contactName,
// contactEmail, password, sellerType, storeDescription, productCategories,
// shippingCountry, shippingName, shippingCompany, shippingStreet1/2,
// shippingCity, shippingState, shippingZip, shippingPhone, prospectId) --
// this form posts straight to the real, already-working endpoint, not a
// stub. See FormState below.

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
  shippingCountry: string;
  shippingName: string;
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
  shippingCountry: '',
  shippingName: '',
  shippingPhone: '',
  shippingStreet1: '',
  shippingStreet2: '',
  shippingCity: '',
  shippingState: '',
  shippingZip: '',
};

export const MAX_CATEGORIES = 3;

export const STEPS = [
  { n: 1, label: 'About You', hint: 'Tell us who you are' },
  { n: 2, label: 'Your Store', hint: 'Tell the world your story' },
  { n: 3, label: 'Shipping', hint: 'Where your parcels begin' },
  { n: 4, label: 'Finish', hint: 'Review & launch' },
] as const;
