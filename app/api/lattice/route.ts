import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'

export const dynamic = 'force-dynamic'

// Public lattice summary — powers the homepage origins grid, the speciality
// wall, and the founding counters. Everything here is COMPUTED from live
// APPROVED listings (the standing rule: country pages never promise what no
// seller offers). With a zero catalogue it returns honest zeros.
//
// Response shape:
// {
//   totalCountries: 190,
//   trading: <countries with >=1 approved product>,
//   countries: [{ code, name, products, specialities: [term...] }],
//   specialities: { term: { countries, products } }
// }

const nameToCode = new Map(WORLD_COUNTRIES.map((c) => [c.name.toLowerCase(), c.code]))
const codeSet = new Set(WORLD_COUNTRIES.map((c) => c.code))
const codeToName = new Map(WORLD_COUNTRIES.map((c) => [c.code, c.name]))

function toCode(origin: string | null): string | null {
  if (!origin) return null
  const v = origin.trim()
  if (v.length === 2 && codeSet.has(v.toUpperCase())) return v.toUpperCase()
  return nameToCode.get(v.toLowerCase()) ?? null
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { status: 'APPROVED' },
    select: { originCountry: true, specialities: true },
  })

  const countries = new Map<string, { products: number; specialities: Set<string> }>()
  const specialities = new Map<string, { countries: Set<string>; products: number }>()

  for (const p of products) {
    const code = toCode(p.originCountry)
    if (code) {
      const c = countries.get(code) ?? { products: 0, specialities: new Set<string>() }
      c.products += 1
      for (const term of p.specialities ?? []) c.specialities.add(term)
      countries.set(code, c)
    }
    for (const term of p.specialities ?? []) {
      const s = specialities.get(term) ?? { countries: new Set<string>(), products: 0 }
      s.products += 1
      if (code) s.countries.add(code)
      specialities.set(term, s)
    }
  }

  return NextResponse.json({
    totalCountries: WORLD_COUNTRIES.length,
    trading: countries.size,
    countries: Array.from(countries.entries()).map(([code, c]) => ({
      code,
      name: codeToName.get(code) ?? code,
      products: c.products,
      specialities: Array.from(c.specialities),
    })),
    specialities: Object.fromEntries(
      Array.from(specialities.entries()).map(([term, s]) => [term, { countries: s.countries.size, products: s.products }])
    ),
  })
}
