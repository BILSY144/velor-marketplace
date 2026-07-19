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
  // Extra fields the live route already returns (it spreads the full Prisma
  // row): used by the product page. All optional — never assumed present.
  description?: string | null
  category?: string | null
  specialities?: string[]
  avgRating?: number | null
  sellerId?: string
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

// ---------------------------------------------------------------------------
// Seller sign-in — against the live site's NextAuth (credentials + JWT).
// React Native's fetch uses the platform cookie jar, so the session cookie
// NextAuth sets on sign-in rides along automatically on every later call
// with credentials:'include'. No backend changes needed.
// ---------------------------------------------------------------------------

export type SessionUser = {
  id: string
  email?: string | null
  name?: string | null
  role?: string | null
  sellerId?: string | null
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/session`, {
      credentials: 'include',
      headers: { accept: 'application/json' },
    })
    const data = await res.json().catch(() => null)
    return data?.user?.id ? (data.user as SessionUser) : null
  } catch {
    return null
  }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { credentials: 'include' })
  const { csrfToken } = await csrfRes.json()
  await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/`,
    }).toString(),
  })
  // The callback 302s regardless of outcome — the session endpoint is the
  // only honest success check.
  return getSession()
}

export async function signOutRemote(): Promise<void> {
  try {
    const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { credentials: 'include' })
    const { csrfToken } = await csrfRes.json()
    await fetch(`${BASE}/api/auth/signout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, callbackUrl: `${BASE}/` }).toString(),
    })
  } catch {}
}

async function authedGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json() as Promise<T>
}

export type SellerPayouts = {
  payoutRail: string
  stripeOnboarded: boolean
  payoneerConfigured: boolean
  payoneerLinked: boolean
  pendingEscrow: number
  pendingOrderCount: number
  lifetimePaidOut: number
  isTrusted: boolean
  holdLabel: string
  history: { id: string; amount: number; currency: string; status: string; method: string; date: string }[]
}

export const fetchSellerPayouts = () => authedGet<SellerPayouts>('/api/dashboard/payouts')

export type SellerOrder = {
  id: string
  buyerName: string
  status: string
  createdAt: string
  items: { id: string; productId: string; productName: string; productImage: string | null; quantity: number; unitPrice: number; commission: number; payout: number }[]
  totalRevenue: number
  totalPayout: number
}

export const fetchSellerOrders = async (): Promise<SellerOrder[]> =>
  (await authedGet<{ orders: SellerOrder[] }>('/api/dashboard/orders')).orders ?? []

export type SellerProduct = {
  id: string
  name: string
  title?: string
  price: number
  stock: number
  status: string
  images?: string[]
  sales?: number
  requiresCertificate?: boolean
}

export const fetchSellerProducts = async (): Promise<SellerProduct[]> =>
  (await authedGet<{ products: SellerProduct[] }>('/api/dashboard/products')).products ?? []

export type SellerSubscription = { tier: string; [k: string]: unknown }

export const fetchSubscription = () => authedGet<SellerSubscription>('/api/seller/subscription')

// Upgrade to Pro — asks the site for a Stripe Checkout session for the
// PRO subscription (POST /api/seller/subscription, action upgrade_to_pro).
// The returned URL is Stripe's own hosted page: the seller enters their
// payment details there, never in the app, and the existing Stripe webhook
// flips the tier to PRO on completion.
export async function startProUpgrade(): Promise<{ checkoutUrl?: string; error?: string }> {
  const res = await fetch(`${BASE}/api/seller/subscription`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'upgrade_to_pro' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { error: data?.error ?? `Upgrade failed (${res.status})` }
  return { checkoutUrl: data.checkoutUrl }
}

export async function createListing(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/dashboard/products`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return res.ok ? { ok: true } : { ok: false, error: data?.error ?? `Failed (${res.status})` }
}

// Password reset — the site emails a one-hour verified link (William's
// standing requirement: email verification for resets). Always resolves
// regardless of whether the account exists (no user enumeration).
export async function requestPasswordReset(email: string): Promise<void> {
  await fetch(`${BASE}/api/auth/forgot`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

// Push token registry — the server keeps Expo push tokens so launch-time
// events (opening bells, order updates) can notify this device with the
// bell chime. Remote delivery activates with the store build; Expo Go
// cannot receive remote push since SDK 53.
export async function registerPushToken(token: string, platform: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/push/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, platform }),
    })
    return res.ok
  } catch {
    return false
  }
}
