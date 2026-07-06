// Shared helper: turn whatever is stored in a seller's "country" field into a
// real flag image URL (flagcdn.com), instead of raw text or an emoji that many
// OSes/browsers render as plain letters.
//
// Two known storage formats exist in this codebase today:
//  - a real ISO-3166-1 alpha-2 code (e.g. "CN") -- used by at least one existing
//    seller record
//  - a full country name typed/selected via the apply form or dashboard
//    settings COUNTRIES dropdowns (e.g. "China", "United Kingdom") -- this is
//    what NEW sellers going through /apply or Dashboard > Settings will store
//
// This resolves both formats. If a country string doesn't match either format,
// it returns null so callers can skip rendering a flag rather than show a
// broken image.

const NAME_TO_ISO2: Record<string, string> = {
  'united kingdom': 'gb',
  'united states': 'us',
  'canada': 'ca',
  'australia': 'au',
  'germany': 'de',
  'france': 'fr',
  'italy': 'it',
  'spain': 'es',
  'netherlands': 'nl',
  'sweden': 'se',
  'norway': 'no',
  'denmark': 'dk',
  'switzerland': 'ch',
  'austria': 'at',
  'belgium': 'be',
  'portugal': 'pt',
  'ireland': 'ie',
  'new zealand': 'nz',
  'singapore': 'sg',
  'japan': 'jp',
  'south korea': 'kr',
  'hong kong': 'hk',
  'india': 'in',
  'brazil': 'br',
  'mexico': 'mx',
  'china': 'cn',
}

export function countryToISO2(country?: string | null): string | null {
  if (!country) return null
  const trimmed = country.trim()
  if (!trimmed || trimmed.toLowerCase() === 'other') return null
  if (/^[a-zA-Z]{2}$/.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  return NAME_TO_ISO2[trimmed.toLowerCase()] ?? null
}

export function countryFlagUrl(country?: string | null): string | null {
  const iso2 = countryToISO2(country)
  if (!iso2) return null
  return `https://flagcdn.com/${iso2}.svg`
}
