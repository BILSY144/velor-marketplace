// Zone system for the platform-default international shipping estimate
// (2026-07-27). Real per-country live carrier quotes only exist for the
// handful of origins Velor holds a live Shippo carrier account for (see
// DEFAULT_LIVE_ORIGINS in app/api/admin/shipping-rate-survey/route.ts).
// For every other seller origin -- the vast majority, including China --
// there is no live quote available at all. Rather than pretend otherwise,
// this groups destinations into a small number of zones (the same way real
// carriers structure their own rate cards) so a manageable, real,
// live-quote-calibrated table can stand in for a full per-country-pair
// matrix, which would require carrier access Velor doesn't have.
//
// Zone meaning (relative to a given ORIGIN country):
//   DOMESTIC      buyer and seller in the same country
//   REGIONAL      same continent / immediate neighbouring region
//   INTERNATIONAL most cross-continent shipping
//   REMOTE        small islands / thinly-served territories -- genuinely
//                 more expensive and less served by any carrier, priced
//                 accordingly rather than lumped in with INTERNATIONAL
export type ShippingZone = 'DOMESTIC' | 'REGIONAL' | 'INTERNATIONAL' | 'REMOTE'

// ISO2 -> continent code. NA = North America (includes Central America and
// the Caribbean, which typically share carrier networks/regional pricing
// with North America rather than South America).
const CONTINENT: Record<string, string> = {
  // Africa
  AO: 'AF', BF: 'AF', BI: 'AF', BJ: 'AF', BW: 'AF', CD: 'AF', CF: 'AF', CG: 'AF',
  CI: 'AF', CM: 'AF', CV: 'AF', DJ: 'AF', DZ: 'AF', EG: 'AF', EH: 'AF', ER: 'AF',
  ET: 'AF', GA: 'AF', GH: 'AF', GM: 'AF', GN: 'AF', GQ: 'AF', GW: 'AF', KE: 'AF',
  KM: 'AF', LR: 'AF', LS: 'AF', LY: 'AF', MA: 'AF', MG: 'AF', ML: 'AF', MR: 'AF',
  MU: 'AF', MW: 'AF', MZ: 'AF', NA: 'AF', NE: 'AF', NG: 'AF', RW: 'AF', SC: 'AF',
  SD: 'AF', SL: 'AF', SN: 'AF', SO: 'AF', SS: 'AF', ST: 'AF', SZ: 'AF', TD: 'AF',
  TG: 'AF', TN: 'AF', TZ: 'AF', UG: 'AF', YT: 'AF', ZA: 'AF', ZM: 'AF', ZW: 'AF',
  // Asia
  AE: 'AS', AF: 'AS', AM: 'AS', AZ: 'AS', BD: 'AS', BH: 'AS', BN: 'AS', BT: 'AS',
  CN: 'AS', GE: 'AS', HK: 'AS', ID: 'AS', IL: 'AS', IN: 'AS', IQ: 'AS', IR: 'AS',
  JO: 'AS', JP: 'AS', KG: 'AS', KH: 'AS', KP: 'AS', KR: 'AS', KW: 'AS', KZ: 'AS',
  LA: 'AS', LB: 'AS', LK: 'AS', MM: 'AS', MN: 'AS', MO: 'AS', MV: 'AS', MY: 'AS',
  NP: 'AS', OM: 'AS', PH: 'AS', PK: 'AS', PS: 'AS', QA: 'AS', SA: 'AS', SG: 'AS',
  SY: 'AS', TH: 'AS', TJ: 'AS', TL: 'AS', TM: 'AS', TW: 'AS', UZ: 'AS', VN: 'AS',
  YE: 'AS',
  // Europe
  AD: 'EU', AL: 'EU', AT: 'EU', AX: 'EU', BA: 'EU', BE: 'EU', BG: 'EU', BY: 'EU',
  CH: 'EU', CY: 'EU', CZ: 'EU', DE: 'EU', DK: 'EU', EE: 'EU', ES: 'EU', FI: 'EU',
  FO: 'EU', FR: 'EU', GB: 'EU', GG: 'EU', GI: 'EU', GR: 'EU', HR: 'EU', HU: 'EU',
  IE: 'EU', IM: 'EU', IS: 'EU', IT: 'EU', JE: 'EU', LI: 'EU', LT: 'EU', LU: 'EU',
  LV: 'EU', MC: 'EU', MD: 'EU', ME: 'EU', MK: 'EU', MT: 'EU', NL: 'EU', NO: 'EU',
  PL: 'EU', PT: 'EU', RO: 'EU', RS: 'EU', RU: 'EU', SE: 'EU', SI: 'EU', SJ: 'EU',
  SK: 'EU', SM: 'EU', TR: 'EU', UA: 'EU', VA: 'EU', XK: 'EU',
  // North America (incl. Central America + Caribbean)
  AG: 'NA', AI: 'NA', AW: 'NA', BB: 'NA', BL: 'NA', BM: 'NA', BQ: 'NA', BS: 'NA',
  BZ: 'NA', CA: 'NA', CR: 'NA', CU: 'NA', CW: 'NA', DM: 'NA', DO: 'NA', GD: 'NA',
  GL: 'NA', GP: 'NA', GT: 'NA', HN: 'NA', HT: 'NA', JM: 'NA', KN: 'NA', KY: 'NA',
  LC: 'NA', MF: 'NA', MQ: 'NA', MS: 'NA', MX: 'NA', NI: 'NA', PA: 'NA', PM: 'NA',
  PR: 'NA', SV: 'NA', SX: 'NA', TC: 'NA', TT: 'NA', US: 'NA', VC: 'NA', VG: 'NA',
  VI: 'NA',
  // South America
  AR: 'SA', BO: 'SA', BR: 'SA', CL: 'SA', CO: 'SA', EC: 'SA', FK: 'SA', GF: 'SA',
  GY: 'SA', PE: 'SA', PY: 'SA', SR: 'SA', UY: 'SA', VE: 'SA',
  // Oceania
  AS: 'OC', AU: 'OC', CC: 'OC', CK: 'OC', CX: 'OC', FJ: 'OC', FM: 'OC', GU: 'OC',
  KI: 'OC', MH: 'OC', MP: 'OC', NC: 'OC', NF: 'OC', NR: 'OC', NU: 'OC', NZ: 'OC',
  PF: 'OC', PG: 'OC', PN: 'OC', PW: 'OC', SB: 'OC', TK: 'OC', TO: 'OC', TV: 'OC',
  UM: 'OC', VU: 'OC', WF: 'OC', WS: 'OC',
  // Uninhabited / negligible-volume -- lumped with nearest continent for
  // completeness, always REMOTE in practice (see REMOTE_TERRITORIES).
  BV: 'AF', GS: 'SA', HM: 'OC', IO: 'AS', TF: 'AF',
}

// Small islands / thinly-served territories that are genuinely more
// expensive and less reliably served by any carrier, regardless of which
// continent they're geographically grouped with -- priced as REMOTE rather
// than folded into REGIONAL/INTERNATIONAL. Curated starting list; refine
// over time as real survey/fulfilment data comes in (see
// ShippingRateBenchmark).
const REMOTE_TERRITORIES = new Set([
  'AI', 'AS', 'AX', 'BL', 'BM', 'BQ', 'BV', 'CC', 'CK', 'CX', 'FK', 'FM', 'FO',
  'GG', 'GL', 'GS', 'HM', 'IM', 'IO', 'JE', 'KI', 'MF', 'MH', 'MP', 'MS', 'NC',
  'NF', 'NR', 'NU', 'PF', 'PM', 'PN', 'PW', 'SB', 'SH', 'SJ', 'SX', 'TC', 'TF',
  'TK', 'TO', 'TV', 'UM', 'VC', 'VG', 'VI', 'VU', 'WF', 'WS', 'XK', 'YT',
])

export function continentOf(countryCode: string): string | undefined {
  return CONTINENT[countryCode?.toUpperCase()]
}

export function computeZone(originCountry: string, destinationCountry: string): ShippingZone {
  const origin = (originCountry || '').toUpperCase()
  const destination = (destinationCountry || '').toUpperCase()

  if (origin === destination) return 'DOMESTIC'
  if (REMOTE_TERRITORIES.has(destination)) return 'REMOTE'

  const originContinent = continentOf(origin)
  const destinationContinent = continentOf(destination)
  if (originContinent && originContinent === destinationContinent) return 'REGIONAL'

  return 'INTERNATIONAL'
}

// Weight bands used for both the survey and the operative rate table.
// Upper band is open-ended (dimensional weight handles genuinely large
// parcels via buildParcelFromItems in lib/shippo.ts before this is reached).
export const WEIGHT_BANDS: Array<{ minGrams: number; maxGrams: number; sampleGrams: number }> = [
  { minGrams: 0, maxGrams: 250, sampleGrams: 150 },
  { minGrams: 250, maxGrams: 500, sampleGrams: 375 },
  { minGrams: 500, maxGrams: 1000, sampleGrams: 750 },
  { minGrams: 1000, maxGrams: 2000, sampleGrams: 1500 },
  { minGrams: 2000, maxGrams: 5000, sampleGrams: 3500 },
  { minGrams: 5000, maxGrams: 999999999, sampleGrams: 7000 },
]

export function weightBandFor(weightGrams: number) {
  const g = Math.max(0, weightGrams || 0)
  return (
    WEIGHT_BANDS.find(b => g >= b.minGrams && g < b.maxGrams) ??
    WEIGHT_BANDS[WEIGHT_BANDS.length - 1]
  )
}

export const ALL_ZONES: ShippingZone[] = ['DOMESTIC', 'REGIONAL', 'INTERNATIONAL', 'REMOTE']
