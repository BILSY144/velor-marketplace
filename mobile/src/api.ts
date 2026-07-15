// Live client for the real production API (velorcommerce.store). Shapes below
// were read from the actual route handlers, not guessed:
//   /api/lattice            -> { totalCountries, trading, countries:[{code,name,products,specialities}], specialities }
//   /api/shop/products      -> { products:[...], total, pages, pagination }
//   /api/assistant/chat POST { messages, audience:'buyer' } -> { reply, escalated }
// No fabricated data: empty results render as honest zero states.
const BASE = 'https://velorcommerce.store'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json() as Promise<T>
}

export type LatticeCountry = {
  code: string
  name: string
  products: number
  specialities: string[]
}

export type Lattice = {
  totalCountries: number
  trading: number
  countries: LatticeCountry[]
  specialities: Record<string, { countries: number; products: number }>
}

export function fetchLattice(): Promise<Lattice> {
  return get<Lattice>('/api/lattice')
}

export type ShopProduct = {
  id: string
  name?: string
  title?: string
  price: number
  images?: string[]
  originCountry?: string
  sellerName?: string
  discountedPrice?: number | null
  percentOff?: number | null
  rating?: number | null
  reviewCount?: number
}

export async function fetchProductsByOrigin(cc: string, limit = 12): Promise<ShopProduct[]> {
  const data = await get<{ products: ShopProduct[] }>(
    `/api/shop/products?origin=${encodeURIComponent(cc)}&limit=${limit}`
  )
  return Array.isArray(data?.products) ? data.products : []
}

export type AssistMessage = { role: 'user' | 'assistant'; content: string }

/** Ask Velor — the exact same brain as the website chat (buyer persona). */
export async function askVelor(messages: AssistMessage[]): Promise<string> {
  const res = await fetch(`${BASE}/api/assistant/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages, audience: 'buyer' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `assistant -> ${res.status}`)
  return data.reply ?? ''
}
