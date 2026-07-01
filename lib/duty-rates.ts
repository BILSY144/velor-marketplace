// DDP duty + VAT calculation for Velor Marketplace
// Rates sourced from: UKGT, EU CCT, US HTS, and major trading partners

export interface LandedCostParams {
  hsCode?: string | null
  originCountry: string
  destinationCountry: string
  declaredValueGBP: number
  shippingCostGBP: number
}

export interface LandedCostResult {
  dutyRate: number
  vatRate: number
  dutyAmountGBP: number
  vatAmountGBP: number
  totalTaxGBP: number
  belowDeMinimis: boolean
  deMinimisGBP: number
  category: string
  isDomestic: boolean
}

// VAT / GST / Sales tax rates by destination country (as decimals)
const VAT_RATES: Record<string, number> = {
  // UK
  GB: 0.20,
  // EU
  AT: 0.20, BE: 0.21, BG: 0.20, CY: 0.19, CZ: 0.21,
  DE: 0.19, DK: 0.25, EE: 0.22, ES: 0.21, FI: 0.24,
  FR: 0.20, GR: 0.24, HR: 0.25, HU: 0.27, IE: 0.23,
  IT: 0.22, LT: 0.21, LU: 0.17, LV: 0.21, MT: 0.18,
  NL: 0.21, PL: 0.23, PT: 0.23, RO: 0.19, SE: 0.25,
  SI: 0.22, SK: 0.20,
  // Other Europe
  CH: 0.081, NO: 0.25, IS: 0.24,
  // Americas
  US: 0.00, CA: 0.05, MX: 0.16, BR: 0.12, AR: 0.21,
  // Asia-Pacific
  AU: 0.10, NZ: 0.15, JP: 0.10, SG: 0.09,
  MY: 0.06, TH: 0.07, KR: 0.10, TW: 0.05, IN: 0.18,
  // Middle East
  AE: 0.05, SA: 0.15, KW: 0.00, QA: 0.00, BH: 0.10,
  // Africa
  ZA: 0.15, NG: 0.075, KE: 0.16, GH: 0.15,
  // East Asia
  CN: 0.13, HK: 0.00,
}

// De minimis thresholds in GBP (below = duty free; VAT may still apply)
const DE_MINIMIS_GBP: Record<string, number> = {
  GB: 135,    // HMRC low value consignment
  US: 700,    // $800 informal entry threshold
  CA: 17,     // CAD 20
  AU: 750,    // AUD 1000
  NZ: 500,    // NZD 1000
  JP: 60,     // JPY 10000
  SG: 290,    // SGD 400
  CH: 62,     // CHF 65
  NO: 26,     // NOK 350
  KR: 130,    // USD 150 equiv
  // EU - EUR 150 threshold, approx GBP 130
  AT: 130, BE: 130, BG: 130, CY: 130, CZ: 130,
  DE: 130, DK: 130, EE: 130, ES: 130, FI: 130,
  FR: 130, GR: 130, HR: 130, HU: 130, IE: 130,
  IT: 130, LT: 130, LU: 130, LV: 130, MT: 130,
  NL: 130, PL: 130, PT: 130, RO: 130, SE: 130,
  SI: 130, SK: 130,
  // Gulf - relatively permissive
  AE: 250, SA: 250, KW: 175, QA: 175,
}

const EU = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI',
  'FR','GR','HR','HU','IE','IT','LT','LU','LV','MT',
  'NL','PL','PT','RO','SE','SI','SK',
])

// HS chapter (first 2 digits) to product category key
const CHAPTER_TO_CAT: Record<string, string> = {
  '39': 'plastics', '40': 'rubber',
  '42': 'leather-goods', '43': 'furskins',
  '50': 'textiles', '51': 'textiles', '52': 'textiles', '53': 'textiles',
  '54': 'textiles', '55': 'textiles', '56': 'textiles', '57': 'textiles',
  '58': 'textiles', '59': 'textiles', '60': 'textiles',
  '61': 'clothing', '62': 'clothing', '63': 'clothing',
  '64': 'footwear', '65': 'headgear',
  '70': 'glass', '71': 'jewellery',
  '82': 'tools', '83': 'tools',
  '84': 'machinery', '85': 'electronics',
  '90': 'optics', '91': 'clocks', '92': 'instruments',
  '94': 'furniture', '95': 'toys', '96': 'misc',
}

type Region = 'UK' | 'EU' | 'US' | 'AU' | 'CA' | 'default'
type RateMap = Record<Region, number>

// Duty rates by product category and destination region
const DUTY_RATES: Record<string, RateMap> = {
  electronics: { UK: 0.000, EU: 0.037, US: 0.000, AU: 0.000, CA: 0.000, default: 0.050 },
  machinery:   { UK: 0.000, EU: 0.017, US: 0.000, AU: 0.000, CA: 0.000, default: 0.040 },
  clothing:    { UK: 0.120, EU: 0.120, US: 0.180, AU: 0.100, CA: 0.180, default: 0.150 },
  footwear:    { UK: 0.169, EU: 0.170, US: 0.200, AU: 0.100, CA: 0.200, default: 0.170 },
  jewellery:   { UK: 0.025, EU: 0.025, US: 0.065, AU: 0.050, CA: 0.065, default: 0.050 },
  furniture:   { UK: 0.000, EU: 0.028, US: 0.000, AU: 0.050, CA: 0.000, default: 0.060 },
  toys:        { UK: 0.000, EU: 0.028, US: 0.000, AU: 0.000, CA: 0.000, default: 0.035 },
  plastics:    { UK: 0.065, EU: 0.065, US: 0.039, AU: 0.050, CA: 0.039, default: 0.065 },
  'leather-goods': { UK: 0.035, EU: 0.027, US: 0.035, AU: 0.050, CA: 0.035, default: 0.050 },
  textiles:    { UK: 0.120, EU: 0.080, US: 0.140, AU: 0.100, CA: 0.140, default: 0.120 },
  tools:       { UK: 0.000, EU: 0.027, US: 0.000, AU: 0.000, CA: 0.000, default: 0.040 },
  glass:       { UK: 0.000, EU: 0.060, US: 0.038, AU: 0.050, CA: 0.038, default: 0.060 },
  optics:      { UK: 0.000, EU: 0.027, US: 0.000, AU: 0.000, CA: 0.000, default: 0.035 },
  default:     { UK: 0.035, EU: 0.040, US: 0.032, AU: 0.050, CA: 0.032, default: 0.050 },
}

function getCategory(hsCode?: string | null): string {
  if (!hsCode || hsCode.length < 2) return 'default'
  const chapter = hsCode.slice(0, 2).padStart(2, '0')
  return CHAPTER_TO_CAT[chapter] ?? 'default'
}

function getRegion(country: string): Region {
  if (country === 'GB') return 'UK'
  if (EU.has(country)) return 'EU'
  if (country === 'US') return 'US'
  if (country === 'AU') return 'AU'
  if (country === 'CA') return 'CA'
  return 'default'
}

export function calculateLandedCost(params: LandedCostParams): LandedCostResult {
  const { hsCode, originCountry, destinationCountry, declaredValueGBP, shippingCostGBP } = params

  if (originCountry === destinationCountry) {
    return {
      dutyRate: 0, vatRate: 0,
      dutyAmountGBP: 0, vatAmountGBP: 0, totalTaxGBP: 0,
      belowDeMinimis: true, deMinimisGBP: 0, category: 'domestic',
      isDomestic: true,
    }
  }

  const deMinimis = DE_MINIMIS_GBP[destinationCountry] ?? 50
  const vatRate = VAT_RATES[destinationCountry] ?? 0
  const category = getCategory(hsCode)
  const region = getRegion(destinationCountry)
  const rateMap = DUTY_RATES[category] ?? DUTY_RATES['default']
  const dutyRate = rateMap[region]

  const belowDeMinimis = declaredValueGBP < deMinimis

  if (belowDeMinimis) {
    // Below de minimis: no customs duty, but collect VAT at source (DDP model)
    const vatAmount = parseFloat((declaredValueGBP * vatRate).toFixed(2))
    return {
      dutyRate: 0, vatRate,
      dutyAmountGBP: 0, vatAmountGBP: vatAmount, totalTaxGBP: vatAmount,
      belowDeMinimis: true, deMinimisGBP: deMinimis, category,
      isDomestic: false,
    }
  }

  // CIF value = declared value + insurance + freight (shipping cost)
  const cif = declaredValueGBP + shippingCostGBP
  const dutyAmount = parseFloat((cif * dutyRate).toFixed(2))
  const vatBase = cif + dutyAmount
  const vatAmount = parseFloat((vatBase * vatRate).toFixed(2))
  const total = parseFloat((dutyAmount + vatAmount).toFixed(2))

  return {
    dutyRate, vatRate,
    dutyAmountGBP: dutyAmount,
    vatAmountGBP: vatAmount,
    totalTaxGBP: total,
    belowDeMinimis: false, deMinimisGBP: deMinimis, category,
    isDomestic: false,
  }
}
