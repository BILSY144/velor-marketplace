import countriesJson from './countries'
import regionsJson from './regions'
import hintsJson from './hints'
import imageryJson from './imagery'
import filmsJson from './films'
import storiesJson from './stories'

export type Country = { c: string; n: string; la: number; lo: number }
export type Film = { poster: string; src: string; c: string; title: string; sub: string }
export type CountryImage = { n: string; i: number; s?: string }

export const COUNTRIES = countriesJson as unknown as Country[]
export const REGNAMES = (regionsJson as unknown as { regnames: string[] }).regnames
export const REG = (regionsJson as unknown as { reg: Record<string, number> }).reg
export const HINTS = hintsJson as unknown as Record<string, string[]>
export const IMAGERY = imageryJson as unknown as Record<string, CountryImage[]>
export const FILMS = filmsJson as unknown as Film[]
export const STORIES = storiesJson as unknown as Record<string, string>

const byCode = new Map(COUNTRIES.map((c) => [c.c, c]))
export const countryName = (cc: string) => byCode.get(cc)?.n ?? cc
export const getCountry = (cc: string) => byCode.get(cc)

export function countriesByRegion(): { title: string; data: Country[] }[] {
  const groups: Country[][] = REGNAMES.map(() => [])
  for (const c of COUNTRIES) {
    const r = REG[c.c]
    if (r !== undefined) groups[r].push(c)
  }
  return REGNAMES.map((title, i) => ({ title, data: groups[i] })).filter((g) => g.data.length)
}

export const filmsFor = (cc: string) => FILMS.filter((f) => f.c === cc)
