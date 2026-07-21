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

// Matches app/api/dashboard/orders EXACTLY (reshaped 2026-07-21, commit
// a4bd2fe + sellerEarnings added same day). The old shape (productName/
// totalRevenue/totalPayout) no longer exists -- reading it crashed the
// app's seller screens to black and rendered NaN under EARNED (the
// "abnormal symbols" William reported).
export type SellerOrder = {
  id: string
  buyerName: string
  status: string
  createdAt: string
  total: number
  sellerEarnings: number
  currency: string
  items: { id: string; productId: string; quantity: number; price: number; product: { name: string; images: string[] } }[]
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

// ---------------------------------------------------------------------------
// Live Shopping (2026-07-20) — same backend as the website's /live pages and
// the seller dashboard's Go Live screen. Real LiveKit rooms: a broadcaster
// token for the seller, a viewer token for everyone else, plus scheduling, a
// live-only discount, and "notify me" for a scheduled stream.
// ---------------------------------------------------------------------------

async function authedPost<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data?.error || `${path} -> ${res.status}`), { status: res.status, data })
  return data as T
}

export type LiveStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'

export type LiveStreamListItem = {
  id: string
  title: string
  roomName: string
  status: LiveStatus
  startedAt: string | null
  scheduledFor: string | null
  sellerName: string
  currency: string
  products: { id: string; title: string; price: number; images: string[] }[]
}

/** Public discovery feed — every live and scheduled stream, best sellers first. */
export const fetchLiveStreams = () => get<{ streams: LiveStreamListItem[] }>('/api/live').then((d) => d.streams ?? [])

export type LiveRoomProduct = { id: string; title: string; price: number; images: string[]; stock: number }
export type LiveOffer = { percent: number; productIds: string[] }
export type LiveRoomData = {
  stream: {
    id: string
    title: string
    description: string | null
    roomName: string
    status: LiveStatus
    scheduledFor: string | null
    startedAt: string | null
    // storeLogo added 2026-07-20 alongside the website's TikTok-style live
    // redesign (app/api/live/[room]/route.ts now selects it) -- same shared
    // /api/live/[room] endpoint this screen already calls, so this was
    // already coming back in the response; the type just didn't list it and
    // the UI didn't use it yet. Real data when a seller has set a logo,
    // null otherwise -- never a placeholder image.
    seller: { id: string; storeName: string; currency: string; storeLogo: string | null }
  }
  products: LiveRoomProduct[]
  liveOffer: LiveOffer | null
}

/** One stream's public detail — status, featured products, active live-only offer. */
export const fetchLiveRoom = (room: string) => get<LiveRoomData>(`/api/live/${encodeURIComponent(room)}`)

export async function fetchLiveViewerToken(room: string): Promise<{ token: string; wsUrl: string }> {
  return authedPost(`/api/live/${encodeURIComponent(room)}/token`)
}

/** "Notify me" for a scheduled stream — session cookie if signed in, else an Expo push token. */
export async function notifyMeForLive(room: string, pushToken?: string): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const res = await fetch(`${BASE}/api/live/${encodeURIComponent(room)}/notify`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pushToken ? { pushToken } : {}),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok ? { ok: true } : { ok: false, error: data?.error, status: res.status }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

export async function reportLiveStream(room: string): Promise<{ ended: boolean; reportCount: number } | { error: string }> {
  try {
    return await authedPost(`/api/live/${encodeURIComponent(room)}/report`)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Could not report this stream.' }
  }
}

export type SellerLiveStream = {
  id: string
  title: string
  description: string | null
  roomName: string
  status: LiveStatus
  productIds: string[]
  scheduledFor: string | null
  createdAt: string
}

export type SellerLiveStatus = {
  tier: string
  canGoLive: boolean
  liveKitReady: boolean
  streams: SellerLiveStream[]
  storeName: string
}

export const fetchSellerLive = () => authedGet<SellerLiveStatus>('/api/dashboard/live')

export type CreateLiveStreamBody = {
  title: string
  description?: string
  productIds?: string[]
  scheduledFor?: string | null
  liveOfferPercent?: number | null
}

export type CreateLiveStreamResult = { stream: SellerLiveStream; token?: string; wsUrl?: string }

export async function createLiveStream(body: CreateLiveStreamBody): Promise<CreateLiveStreamResult> {
  return authedPost('/api/dashboard/live', body)
}

export async function startScheduledLiveStream(id: string): Promise<CreateLiveStreamResult> {
  return authedPost(`/api/dashboard/live/${encodeURIComponent(id)}/start`)
}

export async function endLiveStream(id: string): Promise<{ stream: SellerLiveStream }> {
  return authedPost(`/api/dashboard/live/${encodeURIComponent(id)}/end`)
}
