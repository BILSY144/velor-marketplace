import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'

export const dynamic = 'force-dynamic'

// Public lattice summary — powers the homepage origins grid, the speciality
// wall, the founding counters, and (2026-07-26) the homepage culture-reel
// ordering. Everything here is COMPUTED from live APPROVED listings (the
// standing rule: country pages never promise what no seller offers). With a
// zero catalogue it returns honest zeros.
//
// `categories` (William, 2026-07-26, "as soon as a seller lists an item
// that category reel on homepage climbs to the top"): counts of APPROVED
// products per Product.category value. The homepage uses this to sort its
// CULTURE_REELS -- reels with a real listing move above the still
// stock-photo-only ones, same pattern already used for orderedCountries
// below. Keyed by the exact category string as stored on Product (matches
// lib/categories.ts CATEGORIES[].name); callers should compare
// case-insensitively since CULTURE_REELS titles use editorial casing.
//
// `categoryProducts` (William, same thread, "why can i not see my listing
// in the reel then" -- "at the very beginning of the reel"): the reel-level
// climb above only reordered which REEL comes first; it never put the
// seller's actual listing INTO the reel -- every tile inside was still the
// static example photography from CULTURE_REELS. This field carries the
// real listings themselves (id, title, price, currency, image, storeName,
// originCountry) so the homepage can render the seller's own product as a
// real tile at the front of their category's reel, ahead of the example
// seats. Capped at MAX_PRODUCTS_PER_CATEGORY per category, most recent
// first -- generous relative to a reel's ~20 seats today; revisit if a
// single category's catalogue grows past that.
//
// Response shape:
// {
//   totalCountries: 190,
//   trading: <countries with >=1 approved product>,
//   countries: [{ code, name, products, specialities: [term...] }],
//   specialities: { term: { countries, products } },
//   categories: { categoryName: productCount },
//   categoryProducts: { categoryName: [{ id, title, price, currency, image, storeName, originCountry }] }
// }

const MAX_PRODUCTS_PER_CATEGORY = 24

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
    select: {
      id: true,
      title: true,
      price: true,
      images: true,
      originCountry: true,
      specialities: true,
      category: true,
      createdAt: true,
      seller: { select: { storeName: true, currency: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const countries = new Map<string, { products: number; specialities: Set<string> }>()
  const specialities = new Map<string, { countries: Set<string>; products: number }>()
  const categories = new Map<string, number>()
  const categoryProducts = new Map<
    string,
    { id: string; title: string; price: number; currency: string; image: string | null; storeName: string; originCountry: string | null }[]
  >()

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
    if (p.category) {
      categories.set(p.category, (categories.get(p.category) ?? 0) + 1)
      const list = categoryProducts.get(p.category) ?? []
      if (list.length < MAX_PRODUCTS_PER_CATEGORY) {
        list.push({
          id: p.id,
          title: p.title,
          price: p.price,
          currency: p.seller?.currency ?? 'GBP',
          image: p.images?.[0] ?? null,
          storeName: p.seller?.storeName ?? 'Velor seller',
          originCountry: p.originCountry ?? null,
        })
      }
      categoryProducts.set(p.category, list)
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
    categories: Object.fromEntries(categories),
    categoryProducts: Object.fromEntries(categoryProducts),
  })
}
